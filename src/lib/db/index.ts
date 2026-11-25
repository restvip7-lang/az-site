// Database access for the admin (objects, articles, SEO overrides, redirects, staff).
// Plain Postgres through postgres.js: today the Supabase database connected in Vercel,
// later any Postgres on the VPS. Nothing here depends on Supabase itself.
import "server-only";
import postgres from "postgres";
import { MIGRATIONS } from "./schema";

/** First environment variable whose name matches, so a prefix chosen in the Vercel integration doesn't matter. */
export function envByName(...names: string[]): string | undefined {
  for (const n of names) if (process.env[n]) return process.env[n];
  for (const n of names) {
    const key = Object.keys(process.env).find((k) => k.endsWith(`_${n}`) && process.env[k]);
    if (key) return process.env[key];
  }
  return undefined;
}

const DB_URL = () => envByName("POSTGRES_URL", "DATABASE_URL", "POSTGRES_URL_NON_POOLING");

export const hasDb = () => Boolean(DB_URL());

type Sql = ReturnType<typeof postgres>;
let client: Sql | null = null;

export function sql(): Sql {
  if (client) return client;
  const raw = DB_URL();
  if (!raw) throw new Error("Database is not configured (POSTGRES_URL)");
  const u = new URL(raw);
  const local = ["localhost", "127.0.0.1", "::1"].includes(u.hostname);
  client = postgres({
    host: u.hostname,
    port: Number(u.port || 5432),
    database: decodeURIComponent(u.pathname.slice(1)) || "postgres",
    username: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: local ? false : "require",
    // The Supabase pooler runs in transaction mode: no prepared statements, few connections per instance.
    prepare: false,
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });
  return client;
}

let ready: Promise<void> | null = null;

/** Creates or upgrades the tables once per server instance. */
export function ensureSchema() {
  ready ??= (async () => {
    const db = sql();
    await db`create table if not exists schema_meta (key text primary key, value text not null)`;
    const [row] = await db`select value from schema_meta where key = 'version'`;
    let version = row ? Number(row.value) : 0;
    for (const [i, step] of MIGRATIONS.entries()) {
      if (i < version) continue;
      await db.begin(async (tx) => {
        if (typeof step === "string") await tx.unsafe(step);
        else await step(tx);
        await tx`insert into schema_meta (key, value) values ('version', ${String(i + 1)})
                 on conflict (key) do update set value = excluded.value`;
      });
      version = i + 1;
    }
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** sql() after the schema is in place. */
export async function db() {
  await ensureSchema();
  return sql();
}
