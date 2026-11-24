// Photo storage behind one small interface. Today: a public bucket in Supabase Storage
// (REST API, service key on the server only). On the VPS: swap in a disk adapter with the same methods.
import "server-only";
import { envByName } from "@/lib/db";

export interface Storage {
  put(path: string, body: ArrayBuffer, contentType: string): Promise<string>; // returns the public URL
  remove(urls: string[]): Promise<void>;
}

const BUCKET = "media";

function supabase(): Storage | null {
  const base = envByName("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL")?.replace(/\/$/, "");
  const key = envByName("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");
  if (!base || !key) return null;
  // New-style secret keys (sb_secret_…) go in "apikey" only; legacy service_role JWTs also as a bearer token.
  const headers: Record<string, string> = key.startsWith("sb_") ? { apikey: key } : { Authorization: `Bearer ${key}`, apikey: key };
  const publicPrefix = `${base}/storage/v1/object/public/${BUCKET}/`;
  let bucketReady: Promise<void> | null = null;
  const ensureBucket = () =>
    (bucketReady ??= fetch(`${base}/storage/v1/bucket`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: 10 * 1024 * 1024 }),
    }).then(() => undefined)); // "already exists" is fine too
  return {
    async put(path, body, contentType) {
      await ensureBucket();
      const res = await fetch(`${base}/storage/v1/object/${BUCKET}/${path}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": contentType, "x-upsert": "true", "Cache-Control": "max-age=31536000" },
        body,
      });
      if (!res.ok) throw new Error(`Storage upload failed: ${res.status} ${await res.text()}`);
      return publicPrefix + path;
    },
    async remove(urls) {
      const prefixes = urls.filter((u) => u.startsWith(publicPrefix)).map((u) => u.slice(publicPrefix.length));
      if (!prefixes.length) return;
      await fetch(`${base}/storage/v1/object/${BUCKET}`, { method: "DELETE", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes }) });
    },
  };
}

/** Whether the storage answers with these credentials: HTTP status of the bucket list and whether "media" exists. */
export async function checkStorage() {
  const base = envByName("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL")?.replace(/\/$/, "");
  const key = envByName("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");
  if (!base || !key) return { configured: false };
  try {
    const headers: Record<string, string> = key.startsWith("sb_") ? { apikey: key } : { Authorization: `Bearer ${key}`, apikey: key };
    const res = await fetch(`${base}/storage/v1/bucket`, { headers, cache: "no-store", signal: AbortSignal.timeout(8000) });
    const json: unknown = res.ok ? await res.json() : [];
    const list = Array.isArray(json) ? (json as { id: string; public: boolean }[]) : [];
    return { configured: true, status: res.status, bucket: list.find((b) => b.id === BUCKET)?.public ?? null };
  } catch (err) {
    return { configured: true, error: err instanceof Error ? err.name : "error" };
  }
}

export function storage(): Storage {
  const s = supabase();
  if (!s) throw new Error("Photo storage is not configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  return s;
}

export const storageHost = () => {
  const base = envByName("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  return base ? new URL(base).hostname : null;
};
