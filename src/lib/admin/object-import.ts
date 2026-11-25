// Moves the objects of the old azpo.ru catalogue into the admin database, field by field, so that staff edit
// them in the admin from now on. Objects keep their AZPO ids (their pages keep their addresses) and their photos
// (links to the azpo.ru file server: copying ~24 000 photos is a job for the move to AZPO's own server).
// Run in small batches from the admin; an object that is already here, or was deleted here, is never touched.
import "server-only";
import { API_BASE, rowFromAzpo, unique, type AzpoObject } from "@/lib/azpo-feed";
import { db } from "@/lib/db";

const BATCH_MAX = 25;

async function getJson(url: string, timeout: number) {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(timeout) });
      if (!res.ok) throw new Error(`azpo.ru ответил ${res.status}`);
      return (await res.json()) as unknown;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

/** What is left to move: objects of the azpo.ru catalogue that the admin does not have and did not delete. */
export async function importPlan() {
  const json = (await getJson(`${API_BASE}/real-estates/ru?limit=2000`, 25_000)) as { realEstates?: { id: number }[] | null };
  const ids = (json.realEstates ?? []).map((p) => p.id).filter((id) => Number.isInteger(id) && id > 0);
  if (!ids.length) throw new Error("Каталог azpo.ru не вернул объектов");
  const sql = await db();
  const have = new Set((await sql<{ id: number }[]>`select id from objects union select id from objects_removed`).map((r) => r.id));
  const missing = ids.filter((id) => !have.has(id)).sort((a, b) => a - b);
  return { total: ids.length, missing };
}

/** Moves the given objects (a batch of at most 25), four at a time. Returns how many were added and which failed. */
export async function importObjects(ids: number[]) {
  const batch = unique(ids.filter((id) => Number.isInteger(id) && id > 0 && id < 900000)).slice(0, BATCH_MAX);
  const sql = await db();
  let imported = 0;
  const failed: number[] = [];
  let next = 0;
  async function worker() {
    while (next < batch.length) {
      const id = batch[next++];
      try {
        const [gone] = await sql`select 1 from objects_removed where id = ${id}`;
        if (gone) continue; // deleted in the admin: stays deleted
        const j = await getJson(`${API_BASE}/dashboard/properties/${id}/ru`, 20_000);
        const d = (Array.isArray(j) ? j[0] : j) as AzpoObject | undefined;
        if (!d || d.id !== id) throw new Error("no object");
        const row = rowFromAzpo(d);
        const res = await sql`insert into objects ${sql(row)} on conflict (id) do nothing`;
        imported += res.count;
      } catch (err) {
        console.error(`Object ${id} was not imported`, err);
        failed.push(id);
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  return { imported, failed };
}
