// Schema migrations, applied in order and recorded in schema_meta.version. Never edit a shipped step: add a new one.
// A step is SQL text, or a function for steps that insert data (it runs inside the same transaction).
import type { TransactionSql } from "postgres";
import guides from "@/content/area-guides.json";
import guideFixes from "@/content/area-guides-fixes.json";

export type Migration = string | ((tx: TransactionSql) => Promise<unknown>);

export const MIGRATIONS: Migration[] = [
  `
  create table staff (
    id serial primary key,
    email text not null unique,
    name text not null,
    password_hash text not null,
    role text not null default 'editor' check (role in ('owner', 'editor')),
    created_at timestamptz not null default now()
  );

  create table sessions (
    token_hash text primary key,
    staff_id int not null references staff(id) on delete cascade,
    expires_at timestamptz not null
  );

  -- Failed sign-ins, to slow down password guessing.
  create table login_failures (
    email text not null,
    at timestamptz not null default now()
  );
  create index login_failures_email_at on login_failures (email, at);

  -- Objects added in the admin. Ids start at 900001 so they never meet ids of the AZPO catalogue API.
  create sequence objects_id_seq start 900001;
  create table objects (
    id int primary key default nextval('objects_id_seq'),
    published boolean not null default false,
    is_project boolean not null default false,
    title text not null,
    developer text,
    city text not null,
    district text,
    type text not null,
    bed_min int not null default 0,
    bed_max int not null default 0,
    bathrooms int,
    area int,
    price numeric,
    price_max numeric,
    currency text not null default 'EUR' check (currency in ('EUR', 'USD')),
    tags text[] not null default '{}',
    description text,
    facts jsonb not null default '{}',
    photos text[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
  alter sequence objects_id_seq owned by objects.id;

  create table articles (
    id serial primary key,
    category text not null check (category in ('laws', 'area-guides', 'news')),
    slug text not null,
    title text not null,
    excerpt text,
    body text not null default '',
    cover text,
    author text,
    seo_title text,
    seo_description text,
    published boolean not null default false,
    published_at timestamptz,
    source_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (category, slug)
  );

  create table seo_pages (
    path text primary key,
    title text,
    description text,
    h1 text,
    intro text,
    noindex boolean not null default false,
    updated_at timestamptz not null default now()
  );

  create table redirects (
    from_path text primary key,
    to_path text not null,
    created_at timestamptz not null default now()
  );
  `,

  // Articles can name the district (or city) they are about: "alanya/mahmutlar".
  `alter table articles add column if not exists geo text;`,

  // District guides for Alanya, written for Kleo Homes and adapted for AZPO (src/content/area-guides.json).
  // Inserted once; after that they are ordinary articles, edited or deleted in the admin.
  async (tx) => {
    const now = Date.now();
    for (const [i, g] of guides.entries()) {
      // One minute apart, so the list keeps the order of the coast (west to east).
      const at = new Date(now - i * 60_000);
      await tx`
        insert into articles (category, slug, title, excerpt, body, cover, author, seo_title, seo_description, published, published_at, geo)
        values ('area-guides', ${g.slug}, ${g.title}, ${g.excerpt}, ${g.body}, ${g.cover}, 'AZPO Estate', ${g.seo_title}, ${g.seo_description}, true, ${at}, ${g.geo})
        on conflict (category, slug) do nothing`;
    }
  },

  // The guides rewritten in AZPO's own words (the first texts repeated the Kleo Homes site word for word).
  // Only guides nobody has edited in the admin yet: their updated_at still equals created_at.
  async (tx) => {
    for (const g of guides) {
      await tx`
        update articles set excerpt = ${g.excerpt}, body = ${g.body}, seo_description = ${g.seo_description}, updated_at = now()
        where category = 'area-guides' and slug = ${g.slug} and updated_at = created_at`;
    }
  },

  // Price statements in the guides brought in line with the AZPO catalogue. A plain text replace: a phrase
  // somebody has already rewritten in the admin is left alone, and a fix that is already there is skipped.
  async (tx) => {
    for (const f of guideFixes) {
      if (!["body", "excerpt", "seo_description"].includes(f.field)) throw new Error(`Unexpected field ${f.field}`);
      const col = tx(f.field);
      await tx`
        update articles set ${col} = replace(${col}, ${f.from}, ${f.to}), updated_at = now()
        where category = 'area-guides' and slug = ${f.slug} and position(${f.from} in ${col}) > 0 and position(${f.to} in ${col}) = 0`;
    }
  },

  // Objects get every field of the AZPO catalogue (so its objects can be moved into the admin and edited there):
  // several types, ranges, floor, distances with units, infrastructure, views, heating, layouts, map link.
  // The free-form "facts" move into their own columns. An empty bedroom count now means "unknown".
  // objects_removed remembers deleted catalogue objects, so neither the import nor the live catalogue brings them back.
  `
  alter table objects
    add column if not exists source text,
    add column if not exists types text[] not null default '{}',
    add column if not exists layouts text[] not null default '{}',
    add column if not exists bathrooms_max int,
    add column if not exists area_max int,
    add column if not exists floor int,
    add column if not exists floors int,
    add column if not exists year int,
    add column if not exists furnished boolean not null default false,
    add column if not exists installments text,
    add column if not exists dist_sea numeric,
    add column if not exists dist_sea_unit text not null default 'm' check (dist_sea_unit in ('m', 'km')),
    add column if not exists dist_airport numeric,
    add column if not exists dist_airport_unit text not null default 'km' check (dist_airport_unit in ('m', 'km')),
    add column if not exists dist_hospital numeric,
    add column if not exists dist_hospital_unit text not null default 'km' check (dist_hospital_unit in ('m', 'km')),
    add column if not exists dist_shopping numeric,
    add column if not exists dist_shopping_unit text not null default 'm' check (dist_shopping_unit in ('m', 'km')),
    add column if not exists features text[] not null default '{}',
    add column if not exists views text[] not null default '{}',
    add column if not exists heating text[] not null default '{}',
    add column if not exists map_url text;

  update objects set
    types = array[type],
    year = substring(facts->>'year' from '\\d{4}')::int,
    floors = substring(facts->>'floors' from '\\d+')::int,
    furnished = coalesce(facts->>'furniture', '') ~* '^\\s*с мебел',
    installments = nullif(trim(facts->>'installments'), ''),
    dist_sea = replace(substring(facts->>'sea' from '\\d+(?:[.,]\\d+)?'), ',', '.')::numeric,
    dist_sea_unit = case when facts->>'sea' ~* 'км' then 'km' else 'm' end,
    dist_airport = replace(substring(facts->>'airport' from '\\d+(?:[.,]\\d+)?'), ',', '.')::numeric,
    dist_airport_unit = case when facts->>'airport' ~* '(^|\\d|\\s)м\\s*$' then 'm' else 'km' end;

  alter table objects alter column bed_min drop not null, alter column bed_min drop default;
  alter table objects drop column type, drop column facts;
  create index if not exists objects_published on objects (published);

  create table if not exists objects_removed (
    id int primary key,
    removed_at timestamptz not null default now()
  );
  `,
  // 7: the "Просмотр" role (sees the admin, changes nothing).
  `
  alter table staff drop constraint if exists staff_role_check;
  alter table staff add constraint staff_role_check check (role in ('owner', 'editor', 'viewer'));
  `,
  // 8: requests from the site's forms ("заявки"), so a lead is never lost when WhatsApp doesn't open.
  `
  create table if not exists leads (
    id serial primary key,
    created_at timestamptz not null default now(),
    name text not null,
    phone text not null,
    message text,
    context text,
    page text,
    lang text,
    ip_hash text,
    status text not null default 'new' check (status in ('new', 'in_work', 'done', 'spam')),
    notified boolean not null default false
  );
  create index if not exists leads_created on leads (created_at desc);
  create index if not exists leads_ip_at on leads (ip_hash, created_at);
  `,
];
