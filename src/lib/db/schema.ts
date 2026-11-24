// Schema migrations, applied in order and recorded in schema_meta.version. Never edit a shipped step: add a new one.
export const MIGRATIONS: string[] = [
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
];
