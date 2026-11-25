// Objects of the catalogue kept in the admin database: the ones moved from azpo.ru (they keep their AZPO ids)
// and the ones added by AZPO staff (ids from 900001). Published ones are shown on the site.
import "server-only";
import { db, hasDb } from "@/lib/db";

export type Unit = "m" | "km";

export interface ObjectRow {
  id: number;
  source: string | null; // "azpo.ru" when moved from the old catalogue
  published: boolean;
  is_project: boolean;
  title: string;
  developer: string | null;
  city: string;
  district: string | null;
  types: string[];
  layouts: string[];
  bed_min: number | null; // null: not known
  bed_max: number;
  bathrooms: number | null;
  bathrooms_max: number | null;
  area: number | null;
  area_max: number | null;
  floor: number | null;
  floors: number | null;
  year: number | null;
  furnished: boolean;
  installments: string | null;
  price: string | number | null; // numeric comes back from the database as a string
  price_max: string | number | null;
  currency: "EUR" | "USD";
  tags: string[];
  features: string[];
  views: string[];
  heating: string[];
  dist_sea: string | number | null; dist_sea_unit: Unit;
  dist_airport: string | number | null; dist_airport_unit: Unit;
  dist_hospital: string | number | null; dist_hospital_unit: Unit;
  dist_shopping: string | number | null; dist_shopping_unit: Unit;
  map_url: string | null;
  description: string | null;
  photos: string[];
  updated_at: Date;
}

export { SOURCE_AZPO } from "@/lib/azpo-feed";
import { SOURCE_AZPO } from "@/lib/azpo-feed";
export const ADMIN_ID_MIN = 900000;

export interface ObjectFilter {
  q?: string;
  city?: string;
  status?: "published" | "draft";
  source?: "azpo" | "own";
  page?: number;
}
export const OBJECTS_PER_PAGE = 50;

/** One page of the admin list, newest changes first, with the number of matching objects. */
export async function listObjects(f: ObjectFilter = {}) {
  const sql = await db();
  const q = f.q?.trim();
  const id = q && /^\d+$/.test(q) ? Number(q) : null;
  const where = sql`
    where true
    ${q ? (id ? sql`and id = ${id}` : sql`and (title ilike ${"%" + q + "%"} or developer ilike ${"%" + q + "%"} or district ilike ${"%" + q + "%"})`) : sql``}
    ${f.city ? sql`and city = ${f.city}` : sql``}
    ${f.status === "published" ? sql`and published` : f.status === "draft" ? sql`and not published` : sql``}
    ${f.source === "azpo" ? sql`and source = ${SOURCE_AZPO}` : f.source === "own" ? sql`and source is null` : sql``}`;
  const page = Math.max(1, f.page ?? 1);
  const [rows, [{ n }]] = await Promise.all([
    sql<Pick<ObjectRow, "id" | "source" | "published" | "is_project" | "title" | "developer" | "city" | "district" | "types" | "price" | "currency" | "photos" | "updated_at">[]>`
      select id, source, published, is_project, title, developer, city, district, types, price, currency, photos[1:1] as photos, updated_at
      from objects ${where} order by updated_at desc, id desc
      limit ${OBJECTS_PER_PAGE} offset ${(page - 1) * OBJECTS_PER_PAGE}`,
    sql<{ n: number }[]>`select count(*)::int as n from objects ${where}`,
  ]);
  return { rows, total: n, page };
}

export async function objectStats() {
  const sql = await db();
  const [s] = await sql<{ total: number; published: number; azpo: number }[]>`
    select count(*)::int as total, count(*) filter (where published)::int as published, count(*) filter (where source = ${SOURCE_AZPO})::int as azpo from objects`;
  return s;
}

export async function getObject(id: number) {
  const sql = await db();
  const [row] = await sql<ObjectRow[]>`select * from objects where id = ${id}`;
  return row ?? null;
}

/** Columns the catalogue needs (no description: the list is cached and must stay small). */
export type CatalogueRow = Omit<ObjectRow, "description" | "installments" | "map_url" | "developer" | "updated_at"> & { photo_count?: number };

/**
 * Published objects for the catalogue, and the ids the database owns (any object in it, published or not,
 * and deleted catalogue objects): those are not taken from the old azpo.ru catalogue.
 * An unconfigured or unreachable database adds nothing and owns nothing.
 */
export async function catalogueObjects(): Promise<{ rows: CatalogueRow[]; owned: Set<number>; imported: number }> {
  if (!hasDb()) return { rows: [], owned: new Set(), imported: 0 };
  try {
    const sql = await db();
    const [rows, ids] = await Promise.all([
      sql<CatalogueRow[]>`
        select id, source, published, is_project, title, city, district, types, layouts, bed_min, bed_max, bathrooms, bathrooms_max,
          area, area_max, floor, floors, year, furnished, price, price_max, currency, tags, features, views, heating,
          dist_sea, dist_sea_unit, dist_airport, dist_airport_unit, dist_hospital, dist_hospital_unit, dist_shopping, dist_shopping_unit,
          photos[1:8] as photos, cardinality(photos) as photo_count, updated_at
        from objects where published order by id desc`,
      sql<{ id: number; azpo: boolean }[]>`
        select id, source = ${SOURCE_AZPO} as azpo from objects union all select id, true from objects_removed`,
    ]);
    return { rows, owned: new Set(ids.map((r) => r.id)), imported: ids.filter((r) => r.azpo).length };
  } catch (err) {
    console.error("Admin objects are not available", err);
    return { rows: [], owned: new Set(), imported: 0 };
  }
}

/**
 * The object for its page. "owned" says whether the database decides about this id: then a missing or
 * unpublished row means the page does not exist, otherwise the old azpo.ru catalogue is asked.
 */
export async function siteObject(id: number): Promise<{ owned: boolean; row: ObjectRow | null }> {
  if (!hasDb()) return { owned: id > ADMIN_ID_MIN, row: null };
  try {
    const sql = await db();
    const [row] = await sql<ObjectRow[]>`select * from objects where id = ${id}`;
    if (row) return { owned: true, row: row.published ? row : null };
    const [gone] = await sql`select 1 from objects_removed where id = ${id}`;
    return { owned: Boolean(gone) || id > ADMIN_ID_MIN, row: null };
  } catch {
    return { owned: id > ADMIN_ID_MIN, row: null };
  }
}
