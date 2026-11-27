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

const isDateKey = (k: string) => /date|created|updated|_at$|time/i.test(k);

/**
 * How fresh the sources are (asked with ?dates): the newest posts of the azpo.ru blog, the newest objects
 * of the azpo.ru and azpo.com catalogues with any date fields they carry, and the latest changes in the admin.
 */
async function freshness() {
  const out: Record<string, unknown> = {};
  const blogApi = process.env.AZPO_BLOG_API ?? "https://azpo.ru/ru/blog/wp-json/wp/v2";
  try {
    const res = await fetch(`${blogApi}/posts?per_page=5&_fields=id,date,modified,link,title`, { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0 (compatible; AZPO site check)" }, signal: AbortSignal.timeout(15000) });
    const posts = (await res.json()) as { id: number; date: string; modified: string; link: string; title?: { rendered?: string } }[];
    out.blog = { total: Number(res.headers.get("x-wp-total") ?? 0), newest: posts.map((p) => ({ id: p.id, date: p.date, modified: p.modified, title: p.title?.rendered, link: p.link })) };
  } catch (err) {
    out.blog = { error: err instanceof Error ? err.name : "error" };
  }
  for (const [key, base] of [["azpo_ru", API_BASE], ["azpo_com", "https://api.azpo.com/api"]] as const) {
    try {
      const res = await fetch(`${base}/real-estates/ru?limit=2000`, { cache: "no-store", signal: AbortSignal.timeout(40000) });
      const list = ((await res.json()) as { realEstates?: Record<string, unknown>[] }).realEstates ?? [];
      const newest = [...list].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 5);
      const pickDates = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([k, v]) => isDateKey(k) && (typeof v === "string" || typeof v === "number")));
      const images = (o: Record<string, unknown>) => ((o.images as { file_name?: string }[] | null) ?? []).map((i) => i.file_name).slice(0, 2);
      let detail: Record<string, unknown> | undefined;
      if (newest[0]) {
        const d = await fetch(`${base}/dashboard/properties/${newest[0].id}/ru`, { cache: "no-store", signal: AbortSignal.timeout(20000) }).then((r) => r.json()).catch(() => null);
        const obj = (Array.isArray(d) ? d[0] : d) as Record<string, unknown> | null;
        if (obj) detail = { keys: Object.keys(obj), dates: pickDates(obj) };
      }
      out[key] = {
        total: list.length,
        keys: list[0] ? Object.keys(list[0]) : [],
        newest: newest.map((o) => ({ id: o.id, title: o.title, dates: pickDates(o), images: images(o) })),
        detail,
      };
    } catch (err) {
      out[key] = { error: err instanceof Error ? err.name : "error" };
    }
  }
  if (hasDb()) {
    try {
      const sql = await db();
      const [o] = await sql`select count(*)::int as n, max(updated_at) as last_change, max(updated_at) filter (where source is null) as last_own, count(*) filter (where source is null)::int as own from objects`;
      const [a] = await sql`select count(*)::int as n, max(published_at) as last_published, max(created_at) as last_created, max(updated_at) as last_change from articles`;
      out.admin = { objects: o, articles: a };
    } catch (err) {
      out.admin = { error: (err as { code?: string }).code ?? "error" };
    }
  }
  return out;
}

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.has("dates")) {
    return NextResponse.json(await freshness(), { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }
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
      // Database sessions busy right now: a stuck move or a held lock shows up here (no query text).
      out.activity = await Promise.race([
        (async () => {
          const [{ statement_timeout }] = await sql<{ statement_timeout: string }[]>`show statement_timeout`;
          const busy = await sql<{ state: string | null; wait: string | null; secs: number | null }[]>`
            select state, wait_event_type || ':' || wait_event as wait, extract(epoch from now() - coalesce(xact_start, query_start))::int as secs
            from pg_stat_activity
            where datname = current_database() and pid <> pg_backend_pid() and backend_type = 'client backend' and state is distinct from 'idle'
            order by secs desc nulls last limit 10`;
          return { statement_timeout, busy };
        })(),
        new Promise<string>((ok) => setTimeout(() => ok("timeout"), 5000)),
      ]).catch((err: { code?: string }) => `error ${err.code ?? ""}`);
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
