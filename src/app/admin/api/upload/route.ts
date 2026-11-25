// Photo upload for the admin: one image per request (the browser shrinks it first, so it stays
// under the 4.5 MB request limit of Vercel functions). Re-encoded to WebP, which also drops EXIF data.
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { NextResponse, type NextRequest } from "next/server";
import { VIEW_ONLY, canEdit, currentStaff } from "@/lib/admin/auth";
import { storage } from "@/lib/admin/storage";

export const runtime = "nodejs";
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const FOLDERS = ["objects", "articles"];

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return NextResponse.json({ error: "Чужой источник запроса" }, { status: 403 });
  const me = await currentStaff();
  if (!me) return NextResponse.json({ error: "Войдите заново" }, { status: 401 });
  if (!canEdit(me)) return NextResponse.json({ error: VIEW_ONLY }, { status: 403 });
  const type = req.headers.get("content-type")?.split(";")[0] ?? "";
  if (!TYPES.includes(type)) return NextResponse.json({ error: "Нужен файл JPG, PNG или WebP" }, { status: 415 });
  const body = await req.arrayBuffer();
  if (body.byteLength > 4.4 * 1024 * 1024) return NextResponse.json({ error: "Файл больше 4 МБ" }, { status: 413 });
  const folder = FOLDERS.includes(req.nextUrl.searchParams.get("folder") ?? "") ? req.nextUrl.searchParams.get("folder") : "objects";
  try {
    const img = sharp(Buffer.from(body), { limitInputPixels: 80_000_000 }).rotate();
    const out = await img.resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
    const d = new Date();
    const path = `${folder}/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.webp`;
    const url = await storage().put(path, new Uint8Array(out.data).buffer, "image/webp");
    return NextResponse.json({ url, width: out.info.width, height: out.info.height });
  } catch (err) {
    console.error("Upload failed", err);
    const msg = err instanceof Error && /unsupported image|Input buffer/i.test(err.message) ? "Это не похоже на фотографию" : "Не удалось загрузить фото";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
