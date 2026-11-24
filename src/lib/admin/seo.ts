// SEO overrides per page (title, description, H1, intro text, noindex) and manual 301 redirects,
// both edited in the admin. Tables are small, so each is read whole and cached.
import "server-only";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { db, hasDb } from "@/lib/db";

export interface SeoRow {
  path: string;
  title: string | null;
  description: string | null;
  h1: string | null;
  intro: string | null;
  noindex: boolean;
  updated_at: Date;
}

export interface RedirectRow { from_path: string; to_path: string; created_at: Date }

/** "/ru/turkey/alanya" or a full URL → "/ru/turkey/alanya/" (the site's own URL form). */
export function normalisePath(input: string) {
  let p = input.trim();
  try {
    if (/^https?:\/\//i.test(p)) {
      const u = new URL(p);
      p = u.pathname;
    }
  } catch {}
  p = p.split(/[?#]/)[0];
  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/\/{2,}/g, "/");
  if (!/\.[a-z0-9]+$/i.test(p) && !p.endsWith("/")) p += "/";
  try {
    p = decodeURI(p);
  } catch {}
  return p.toLowerCase();
}

async function safeRows<T>(load: () => Promise<T[]>): Promise<T[]> {
  if (!hasDb()) return [];
  try {
    return await load();
  } catch (err) {
    console.error("Admin SEO data is not available", err);
    return [];
  }
}

const loadSeo = unstable_cache(
  () => safeRows(async () => {
    const sql = await db();
    return [...(await sql<SeoRow[]>`select * from seo_pages`)];
  }),
  ["seo-pages-v1"],
  { revalidate: 600, tags: ["seo"] },
);

const loadRedirects = unstable_cache(
  () => safeRows(async () => {
    const sql = await db();
    return [...(await sql<RedirectRow[]>`select * from redirects`)];
  }),
  ["redirects-v1"],
  { revalidate: 600, tags: ["redirects"] },
);

/** Override for one page path, or null. */
export async function seoFor(path: string): Promise<SeoRow | null> {
  const key = normalisePath(path);
  return (await loadSeo()).find((r) => r.path === key) ?? null;
}

/** Where an old URL should go, or null. */
export async function redirectFor(path: string): Promise<string | null> {
  const key = normalisePath(path);
  return (await loadRedirects()).find((r) => r.from_path === key)?.to_path ?? null;
}

export async function listSeo() {
  const sql = await db();
  return sql<SeoRow[]>`select * from seo_pages order by path`;
}

export async function listRedirects() {
  const sql = await db();
  return sql<RedirectRow[]>`select * from redirects order by created_at desc`;
}

/** Page metadata with the admin override on top (only the fields that were filled in). */
export function withSeo(meta: Metadata, seo: SeoRow | null): Metadata {
  if (!seo) return meta;
  return {
    ...meta,
    ...(seo.title ? { title: { absolute: seo.title } } : {}),
    ...(seo.description ? { description: seo.description } : {}),
    ...(seo.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: { ...meta.openGraph, ...(seo.title ? { title: seo.title } : {}), ...(seo.description ? { description: seo.description } : {}) },
  };
}
