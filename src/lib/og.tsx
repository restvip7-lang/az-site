// Open Graph images: Lato for Cyrillic text (next/og needs TTF, not WOFF2) and JPEG output
// (spec: 1200×630, JPEG up to 300 KB).
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

export const OG_SIZE = { width: 1200, height: 630 };

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 900; style: "normal" }[]> | null = null;
export function ogFonts() {
  fonts ??= Promise.all(
    ([["Regular", 400], ["Black", 900]] as const).map(async ([file, weight]) => ({
      name: "Lato",
      data: await readFile(join(process.cwd(), "src/fonts/og", `Lato-${file}.ttf`)),
      weight,
      style: "normal" as const,
    })),
  );
  return fonts;
}

const asDataUrl = async (input: Buffer, width: number, height: number) =>
  `data:image/jpeg;base64,${(await sharp(input).resize(width, height, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer()).toString("base64")}`;

/** A remote photo as a JPEG data URL sized for the image, or null when it can't be loaded. */
export async function photoDataUrl(url: string | undefined, width: number, height: number) {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await asDataUrl(Buffer.from(await res.arrayBuffer()), width, height);
  } catch {
    return null;
  }
}

/** A photo from /public (e.g. "/img/dest/alanya.webp") as a JPEG data URL. */
export async function localPhotoDataUrl(publicPath: string, width: number, height: number) {
  try {
    return await asDataUrl(await readFile(join(process.cwd(), "public", publicPath)), width, height);
  } catch {
    return null;
  }
}

export async function toJpeg(png: ArrayBuffer) {
  return sharp(Buffer.from(png)).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
}

/** The AZPO mark, as in the brand book. */
export function OgMark({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 72) / 96} viewBox="0 0 1036 313">
      <path d="M729.982 311.172H620.775L731.576 56.6307C746.451 22.4607 776.668 0.908203 809.701 0.908203H905.411L788.533 269.41C777.385 295.019 754.739 311.172 729.982 311.172Z" fill="white" />
      <path d="M914.244 312.011H1035.63L986.733 195.341C981.516 183.795 971.21 176.562 959.978 176.562H829.469L874.907 283.607C882.289 300.998 897.541 312.011 914.244 312.011Z" fill="#3FB9E7" />
    </svg>
  );
}
