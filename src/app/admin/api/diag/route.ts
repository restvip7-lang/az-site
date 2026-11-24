// Health check of the admin back end: which settings are present (names only, never values),
// whether the database answers and which schema version it has, whether photo storage is set up.
import { NextResponse } from "next/server";
import { db, hasDb } from "@/lib/db";
import { storageHost } from "@/lib/admin/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = Object.keys(process.env).filter((k) => /POSTGRES|SUPABASE|DATABASE/.test(k)).sort();
  const out: Record<string, unknown> = { env, storage: Boolean(storageHost()), db: { configured: hasDb() } };
  if (hasDb()) {
    const started = Date.now();
    try {
      const sql = await db();
      const [{ value }] = await sql`select value from schema_meta where key = 'version'`;
      const [{ n }] = await sql`select count(*)::int as n from staff`;
      out.db = { configured: true, connected: true, schema: Number(value), staff: n > 0, ms: Date.now() - started };
    } catch (err) {
      const e = err as { code?: string; name?: string };
      out.db = { configured: true, connected: false, error: e.code ?? e.name ?? "error" };
    }
  }
  return NextResponse.json(out, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
