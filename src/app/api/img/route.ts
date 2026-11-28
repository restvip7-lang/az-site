// Image resizer for next/image (see src/lib/image-loader.ts): fetches an allowed photo, resizes it with
// sharp and answers WebP with a year-long cache, so the CDN (Vercel) or nginx (own server) keeps the result
// and the photo is made once per size. Only listed hosts and our own image folders, only fixed sizes.
import sharp from "sharp";
import { NextResponse, type NextRequest } from "next/server";
import { IMG_QUALITIES, IMG_WIDTHS, allowedLocal, allowedSource } from "@/lib/image-sizes";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 20 * 1024 * 1024;
const FOREVER = "public, max-age=31536000, s-maxage=31536000, immutable";

const fail = (status: number, msg: string) =>
  new NextResponse(msg, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": status === 404 ? "public, max-age=3600" : "no-store" } });

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const src = sp.get("u") ?? "";
  const w = Number(sp.get("w"));
  const q = Number(sp.get("q") ?? 75);
  if (!(IMG_WIDTHS as readonly number[]).includes(w) || !(IMG_QUALITIES as readonly number[]).includes(q)) return fail(400, "bad size");

  let url: URL | null = null;
  if (src.startsWith("/")) url = allowedLocal(src) ? new URL(src, req.nextUrl.origin) : null;
  else url = allowedSource(src);
  if (!url) return fail(400, "source not allowed");

  let input: Buffer;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000), headers: { Accept: "image/*" } });
    if (res.status === 404) return fail(404, "not found");
    if (!res.ok) return fail(502, `upstream ${res.status}`);
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES) return fail(413, "too big");
    input = Buffer.from(await res.arrayBuffer());
    if (input.byteLength > MAX_BYTES) return fail(413, "too big");
  } catch (err) {
    console.error("Image fetch failed", url.href, err instanceof Error ? err.name : err);
    return fail(504, "upstream timeout");
  }

  try {
    const out = await sharp(input, { limitInputPixels: 80_000_000, failOn: "none" })
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: q })
      .toBuffer();
    return new NextResponse(new Uint8Array(out), { headers: { "Content-Type": "image/webp", "Cache-Control": FOREVER, "X-Content-Type-Options": "nosniff" } });
  } catch (err) {
    console.error("Image resize failed", url.href, err instanceof Error ? err.message : err);
    // Not an image sharp can read: hand over the original rather than a blank tile.
    const type = /\.(png)$/i.test(url.pathname) ? "image/png" : /\.(webp)$/i.test(url.pathname) ? "image/webp" : "image/jpeg";
    return new NextResponse(new Uint8Array(input), { headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400" } });
  }
}
