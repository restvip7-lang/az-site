// Schema migrations, applied in order and recorded in schema_meta.version. Never edit a shipped step: add a new one.
// A step is SQL text, or a function for steps that insert data (it runs inside the same transaction).
import type { TransactionSql } from "postgres";
import guides from "@/content/area-guides.json";

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
];
