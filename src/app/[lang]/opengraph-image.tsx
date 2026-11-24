import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { OG_SIZE, OgMark, ogFonts, toJpeg } from "@/lib/og";

// Default share image of the site (pages without their own): brand blue with a photo of Istanbul.
export const alt = "AZPO Estate — недвижимость в Турции";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

export default async function OG() {
  const [fonts, raw] = await Promise.all([ogFonts(), readFile(join(process.cwd(), "public/img/dest/istanbul.webp"))]);
  const photo = `data:image/jpeg;base64,${(await sharp(raw).resize(560, 630, { fit: "cover" }).jpeg({ quality: 78 }).toBuffer()).toString("base64")}`;
  const png = await new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#2e5a90", color: "white", fontFamily: "Lato" }}>
        <img src={photo} width={560} height={630} style={{ position: "absolute", right: 0, top: 0 }} alt="" />
        <div style={{ position: "absolute", left: 560, top: -40, width: 140, height: 720, background: "#2e5a90", transform: "skewX(-14deg)" }} />
        <div style={{ position: "absolute", left: 690, bottom: 0, width: 28, height: 230, background: "#3FB9E7", transform: "skewX(-14deg)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, width: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <OgMark size={96} />
            <div style={{ display: "flex", flexDirection: "column", fontSize: 40, lineHeight: 1.05 }}>
              <span style={{ fontWeight: 900 }}>AZPO</span>
              <span>Estate</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 70, fontWeight: 900, lineHeight: 1.02 }}>Недвижимость в Турции</div>
            <div style={{ fontSize: 30, marginTop: 20, color: "#d6e4f4" }}>Алания · Анталия · Стамбул · сопровождение до ключей</div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  ).arrayBuffer();
  return new Response(new Uint8Array(await toJpeg(png)), { headers: { "Content-Type": "image/jpeg" } });
}
