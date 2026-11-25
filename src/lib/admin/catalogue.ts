// Rebuilding the site catalogue after a change in the admin.
import "server-only";
import { revalidateTag } from "next/cache";
import { moveComplete } from "@/lib/admin/objects";

/**
 * Rebuilds the catalogue now, but only once the move from azpo.ru is done. Before that the catalogue still
 * needs azpo.ru for the objects that are not moved, and a rebuild on demand waits for azpo.ru with nothing to
 * fall back on (a slow answer would break the catalogue pages); the catalogue then refreshes on its own
 * within 10 minutes, keeping the previous list whenever azpo.ru does not answer.
 */
export async function refreshCatalogue() {
  if (await moveComplete().catch(() => false)) revalidateTag("properties");
}
