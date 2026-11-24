// One-off import of the azpo.ru WordPress blog (/ru/blog/) into the admin: text converted to the
// article Markdown subset, photos copied into our storage, and a 301 from each old URL to the new one.
// Runs in small batches (a few posts per click) to stay within the time limit of one request.
import "server-only";
import { randomUUID } from "node:crypto";
import { parse, type HTMLElement, type Node } from "node-html-parser";
import sharp from "sharp";
import { blogPath, slugFromTitle, type BlogCategory } from "@/lib/blog";
import { db } from "@/lib/db";
import { normalisePath } from "./seo";
import { storage } from "./storage";

const WP = process.env.AZPO_BLOG_API ?? "https://azpo.ru/ru/blog/wp-json/wp/v2";
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; AZPO site import)", Accept: "application/json" };

interface WpPost {
  id: number;
  date_gmt: string;
  slug: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  categories: number[];
  yoast_head_json?: { title?: string; description?: string };
  _embedded?: { "wp:featuredmedia"?: { source_url?: string }[] };
}

const text = (html: string) => parse(`<div>${html}</div>`).text.replace(/\s+/g, " ").trim();

async function getJson<T>(url: string) {
  const res = await fetch(url, { headers: HEADERS, cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`azpo.ru ответил ${res.status} на ${url.replace(WP, "")}`);
  return { data: (await res.json()) as T, total: Number(res.headers.get("x-wp-total") ?? 0), pages: Number(res.headers.get("x-wp-totalpages") ?? 1) };
}

const LAWS = /закон|налог|гражданств|внж|вид на жительств|документ|тапу|ипотек|оформлен|виз[аы]|юрид|прав[оа]|сделк|покупк|продаж/i;
const GUIDES = /район|гайд|город|алани|анталь|стамбул|фетхие|бодрум|мерсин|белек|махмутлар|(^|\s)оба(\s|$)|кестель|авсаллар|коньяалт|жизнь в|переезд|климат|пляж/i;

function categoryOf(title: string, wpCategories: string[]): BlogCategory["slug"] {
  const cats = wpCategories.join(" ");
  if (/новост/i.test(cats)) return "news";
  if (LAWS.test(cats) || LAWS.test(title)) return "laws";
  if (GUIDES.test(cats) || GUIDES.test(title)) return "area-guides";
  return "news";
}

/** Copies one image into our storage; on any failure the original URL stays. */
async function rehost(src: string, cache: Map<string, string>) {
  if (cache.has(src)) return cache.get(src)!;
  let url = src;
  try {
    const candidates = [src.replace(/-\d+x\d+(?=\.\w+(?:\?.*)?$)/, ""), src].filter((v, i, a) => a.indexOf(v) === i);
    for (const c of candidates) {
      const res = await fetch(c, { headers: { "User-Agent": HEADERS["User-Agent"] }, signal: AbortSignal.timeout(20_000) });
      if (!res.ok) continue;
      const out = await sharp(Buffer.from(await res.arrayBuffer())).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      const d = new Date();
      url = await storage().put(`articles/${d.getUTCFullYear()}/${randomUUID()}.webp`, new Uint8Array(out).buffer, "image/webp");
      break;
    }
  } catch (err) {
    console.error("Image was not copied", src, err);
  }
  cache.set(src, url);
  return url;
}

const BLOCK = "p,h1,h2,h3,h4,h5,h6,ul,ol,blockquote,table,figure,img,div,section,article";

/** WordPress HTML → article Markdown. Images are collected so that they can be copied afterwards. */
function toMarkdown(html: string, base: string, images: string[]) {
  const abs = (u: string) => {
    try {
      return new URL(u, base).toString();
    } catch {
      return "";
    }
  };
  const link = (href: string) => {
    const u = abs(href);
    if (!u) return "";
    const p = new URL(u);
    return /(^|\.)azpo\.(ru|com)$/.test(p.hostname) && !/\.(jpe?g|png|webp|gif|pdf)$/i.test(p.pathname) ? `${p.pathname}${p.search}` : u;
  };
  const imgSrc = (el: HTMLElement) => {
    const src = el.getAttribute("data-src") || el.getAttribute("data-lazy-src") || el.getAttribute("src") || "";
    return src.startsWith("data:") ? "" : abs(src);
  };
  const image = (el: HTMLElement, caption = "") => {
    const src = imgSrc(el);
    if (!src) return "";
    images.push(src);
    const alt = (caption || el.getAttribute("alt") || "").replace(/[[\]]/g, "").trim();
    return `![${alt}](${src})`;
  };

  const inline = (n: Node): string => {
    if (n.nodeType === 3) return n.text.replace(/\s+/g, " ");
    const el = n as HTMLElement;
    const tag = el.rawTagName?.toLowerCase();
    const inner = () => el.childNodes.map(inline).join("");
    switch (tag) {
      case "strong": case "b": { const t = inner().trim(); return t ? ` **${t}** ` : ""; }
      case "em": case "i": { const t = inner().trim(); return t ? ` *${t}* ` : ""; }
      case "a": { const t = inner().trim(); const h = link(el.getAttribute("href") ?? ""); return t && h ? `[${t.replace(/[[\]]/g, "")}](${h})` : t; }
      case "br": return "\n";
      case "img": case "script": case "style": case "noscript": case "iframe": case "svg": return "";
      default: return inner();
    }
  };
  const clean = (s: string) => s.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\*\* +([.,;:!?])/g, "**$1").trim();

  const out: string[] = [];
  const walk = (node: HTMLElement) => {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        const t = clean(child.text);
        if (t) out.push(t);
        continue;
      }
      const el = child as HTMLElement;
      const tag = el.rawTagName?.toLowerCase() ?? "";
      if (["script", "style", "noscript", "iframe", "form", "button", "svg"].includes(tag)) continue;
      if (/^h[1-6]$/.test(tag)) {
        const t = clean(inline(el)).replace(/\n/g, " ").replace(/\*\*/g, "");
        if (t) out.push(`${Number(tag[1]) <= 2 ? "##" : "###"} ${t}`);
      } else if (tag === "ul" || tag === "ol") {
        const items = el.childNodes.filter((c) => (c as HTMLElement).rawTagName?.toLowerCase() === "li");
        const lines = items.map((li, i) => `${tag === "ol" ? `${i + 1}.` : "-"} ${clean(inline(li)).replace(/\n+/g, " ")}`).filter((l) => l.length > 2);
        if (lines.length) out.push(lines.join("\n"));
      } else if (tag === "blockquote") {
        const t = clean(inline(el));
        if (t) out.push(t.split("\n").map((l) => `> ${l}`).join("\n"));
      } else if (tag === "img") {
        const md = image(el);
        if (md) out.push(md);
      } else if (tag === "figure") {
        const img = el.querySelector("img");
        const cap = el.querySelector("figcaption")?.text.trim() ?? "";
        if (img) {
          const md = image(img, cap);
          if (md) out.push(md);
        } else if (el.querySelector("table")) walk(el);
      } else if (tag === "table") {
        const rows = el.querySelectorAll("tr").map((tr) => tr.childNodes.filter((c) => /^t[hd]$/i.test((c as HTMLElement).rawTagName ?? "")).map((c) => clean(inline(c)).replace(/\n|\|/g, " ")));
        const good = rows.filter((r) => r.some(Boolean));
        if (good.length) out.push(good.map((r) => `| ${r.join(" | ")} |`).join("\n"));
      } else if (tag === "p" || !el.querySelector(BLOCK)) {
        for (const img of el.querySelectorAll("img")) {
          const md = image(img);
          if (md) out.push(md);
        }
        const t = clean(inline(el));
        if (t) out.push(t);
      } else {
        walk(el);
      }
    }
  };
  walk(parse(html));
  return out.join("\n\n").replace(/\n{3,}/g, "\n\n");
}

export interface ImportResult { imported: number; total: number; done: number; errors: string[] }

/** Imports up to `limit` posts that are not in the database yet. */
export async function importBlog(limit = 5): Promise<ImportResult> {
  const sql = await db();
  const known = new Set((await sql<{ source_url: string }[]>`select source_url from articles where source_url is not null`).map((r) => r.source_url));
  const cats = new Map<number, string>();
  try {
    const { data } = await getJson<{ id: number; name: string }[]>(`${WP}/categories?per_page=100&_fields=id,name`);
    for (const c of data) cats.set(c.id, text(c.name));
  } catch {}

  const fresh: WpPost[] = [];
  let total = 0;
  for (let page = 1; fresh.length < limit; page++) {
    const res = await getJson<WpPost[]>(`${WP}/posts?per_page=20&page=${page}&orderby=date&order=asc&_embed=wp:featuredmedia`);
    total = res.total;
    fresh.push(...res.data.filter((p) => !known.has(p.link)).slice(0, limit - fresh.length));
    if (page >= res.pages) break;
  }

  const errors: string[] = [];
  let imported = 0;
  for (const post of fresh) {
    try {
      const title = text(post.title.rendered);
      const images: string[] = [];
      let body = toMarkdown(post.content.rendered, post.link, images);
      const cache = new Map<string, string>();
      for (const src of images) body = body.split(`](${src})`).join(`](${await rehost(src, cache)})`);
      const coverSrc = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
      const cover = coverSrc ? await rehost(coverSrc, cache) : (body.match(/!\[[^\]]*\]\((\S+?)\)/)?.[1] ?? null);
      const category = categoryOf(title, post.categories.map((id) => cats.get(id) ?? ""));
      let decoded = post.slug;
      try {
        decoded = decodeURIComponent(post.slug);
      } catch {}
      const base = slugFromTitle(decoded) || slugFromTitle(title) || `post-${post.id}`;
      const [{ n }] = await sql`select count(*)::int as n from articles where category = ${category} and (slug = ${base} or slug like ${base + "-%"})`;
      const slug = n ? `${base}-${n + 1}` : base;
      const excerpt = text(post.excerpt.rendered).replace(/\s*(\[…\]|\[\.\.\.\]|…|Читать далее.*)$/i, "").slice(0, 320) || null;
      await sql.begin(async (tx) => {
        await tx`insert into articles (category, slug, title, excerpt, body, cover, author, seo_title, seo_description, published, published_at, source_url)
          values (${category}, ${slug}, ${title}, ${excerpt}, ${body}, ${cover}, ${"AZPO Estate"},
                  ${post.yoast_head_json?.title ? text(post.yoast_head_json.title) : null}, ${post.yoast_head_json?.description ?? null},
                  true, ${new Date(post.date_gmt + "Z")}, ${post.link})`;
        const from = normalisePath(post.link);
        const to = blogPath(category, slug);
        if (from !== to) await tx`insert into redirects (from_path, to_path) values (${from}, ${to}) on conflict (from_path) do update set to_path = excluded.to_path`;
      });
      imported++;
    } catch (err) {
      errors.push(`${text(post.title.rendered).slice(0, 60)}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return { imported, total, done: known.size + imported, errors };
}
