// Blog articles written or imported in the admin. Public pages read published ones through a cache
// tagged "articles", which every save in the admin revalidates.
import "server-only";
import { unstable_cache } from "next/cache";
import { db, hasDb } from "@/lib/db";

export interface ArticleRow {
  id: number;
  category: "laws" | "area-guides" | "news";
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover: string | null;
  author: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published: boolean;
  published_at: Date | null;
  source_url: string | null;
  /** What the article is about on the map: "alanya/mahmutlar" or "alanya". */
  geo: string | null;
  updated_at: Date;
}

export async function listArticles() {
  const sql = await db();
  return sql<ArticleRow[]>`select * from articles order by coalesce(published_at, updated_at) desc`;
}

export async function getArticle(id: number) {
  const sql = await db();
  const [row] = await sql<ArticleRow[]>`select * from articles where id = ${id}`;
  return row ?? null;
}

/** Dates come out of the cache as strings, so they are revived here. */
const revive = (a: ArticleRow): ArticleRow => ({
  ...a,
  published_at: a.published_at ? new Date(a.published_at) : null,
  updated_at: new Date(a.updated_at),
});

const loadPublished = unstable_cache(
  async (): Promise<ArticleRow[]> => {
    if (!hasDb()) return [];
    try {
      const sql = await db();
      return [...(await sql<ArticleRow[]>`
        select * from articles where published and published_at <= now() order by published_at desc`)];
    } catch (err) {
      console.error("Articles are not available", err);
      return [];
    }
  },
  ["published-articles-v2"],
  { revalidate: 600, tags: ["articles"] },
);

export async function publishedArticles() {
  return (await loadPublished()).map(revive);
}
