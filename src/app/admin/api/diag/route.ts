// Health check of the admin back end: which settings are present (names only, never values),
// whether the database answers and which schema version it has, whether photo storage is set up.
import { NextResponse } from "next/server";
import { db, hasDb } from "@/lib/db";
import { checkStorage } from "@/lib/admin/storage";
import { currentStaff } from "@/lib/admin/auth";
import { API_BASE } from "@/lib/azpo-feed";

export const dynamic = "force-dynamic";

/** Whether the azpo.ru blog API (source of the import) answers from here, and how many posts it has. */
async function checkBlog() {
  const api = process.env.AZPO_BLOG_API ?? "https://azpo.ru/ru/blog/wp-json/wp/v2";
  try {
    const res = await fetch(`${api}/posts?per_page=1&_fields=id`, { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0 (compatible; AZPO site import)" }, signal: AbortSignal.timeout(8000) });
    return { status: res.status, posts: Number(res.headers.get("x-wp-total") ?? 0) };
  } catch (err) {
    return { error: err instanceof Error ? err.name : "error" };
  }
}

export async function GET() {
  // Setting names only for signed-in staff; anyone else sees just whether things work.
  const staff = hasDb() ? await currentStaff().catch(() => null) : null;
  const env = staff ? Object.keys(process.env).filter((k) => /POSTGRES|SUPABASE|DATABASE/.test(k)).sort() : undefined;
  const out: Record<string, unknown> = { env, storage: await checkStorage(), blog: await checkBlog(), db: { configured: hasDb() } };
  if (hasDb()) {
    const started = Date.now();
    try {
      const sql = await db();
      const [{ value }] = await sql`select value from schema_meta where key = 'version'`;
      const [{ n }] = await sql`select count(*)::int as n from staff`;
      out.db = { configured: true, connected: true, schema: Number(value), staff: n > 0, ms: Date.now() - started };
      // The objects table on its own, with a time limit: a lock on it shows up here as "timeout".
      const t1 = Date.now();
      const objects = await Promise.race([
        sql`select count(*)::int as n from objects`.then(([r]) => r.n as number),
        new Promise<string>((ok) => setTimeout(() => ok("timeout"), 5000)),
      ]).catch((err: { code?: string }) => `error ${err.code ?? ""}`);
      out.objects = { count: objects, ms: Date.now() - t1 };
    } catch (err) {
      const e = err as { code?: string; name?: string };
      out.db = { configured: true, connected: false, error: e.code ?? e.name ?? "error" };
    }
  }
  // The old catalogue as the site reads it (size and time from this server).
  const t2 = Date.now();
  try {
    const res = await fetch(`${API_BASE}/real-estates/ru?limit=2000`, { cache: "no-store", signal: AbortSignal.timeout(20000) });
    const body = await res.text();
    out.feed = { status: res.status, bytes: body.length, ms: Date.now() - t2 };
  } catch (err) {
    out.feed = { error: err instanceof Error ? err.name : "error", ms: Date.now() - t2 };
  }
  return NextResponse.json(out, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
