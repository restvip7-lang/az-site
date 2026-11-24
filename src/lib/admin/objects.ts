// Objects added by AZPO staff in the admin: new-build projects of developers and resale listings
// that are not in the AZPO catalogue API. Published ones are merged into the site catalogue.
import "server-only";
import { db, hasDb } from "@/lib/db";

export interface ObjectRow {
  id: number;
  published: boolean;
  is_project: boolean;
  title: string;
  developer: string | null;
  city: string;
  district: string | null;
  type: string;
  bed_min: number;
  bed_max: number;
  bathrooms: number | null;
  area: number | null;
  price: string | null; // numeric comes back as a string
  price_max: string | null;
  currency: "EUR" | "USD";
  tags: string[];
  description: string | null;
  facts: Record<string, string>;
  photos: string[];
  updated_at: Date;
}

export { OBJECT_FACTS } from "./forms";

export const ADMIN_ID_MIN = 900000;
export const isAdminObjectId = (id: number) => id > ADMIN_ID_MIN;

export async function listObjects() {
  const sql = await db();
  return sql<ObjectRow[]>`select * from objects order by updated_at desc`;
}

export async function getObject(id: number) {
  const sql = await db();
  const [row] = await sql<ObjectRow[]>`select * from objects where id = ${id}`;
  return row ?? null;
}

/** Published objects for the catalogue; an unconfigured or unreachable database just adds nothing. */
export async function publishedObjects(): Promise<ObjectRow[]> {
  if (!hasDb()) return [];
  try {
    const sql = await db();
    return await sql<ObjectRow[]>`select * from objects where published order by id desc`;
  } catch (err) {
    console.error("Admin objects are not available", err);
    return [];
  }
}

export async function getPublishedObject(id: number) {
  if (!hasDb()) return null;
  try {
    const sql = await db();
    const [row] = await sql<ObjectRow[]>`select * from objects where id = ${id} and published`;
    return row ?? null;
  } catch {
    return null;
  }
}
