import { ImageResponse } from "next/og";
import { getAllProperties } from "@/lib/api";
import { priceOf } from "@/lib/catalog";
import { cityName, districtName } from "@/lib/geo";
import { OG_SIZE, OgMark, localPhotoDataUrl, ogFonts, photoDataUrl, toJpeg } from "@/lib/og";
import { DEST_IMG } from "@/components/CatalogHeader";
import { objectName } from "@/lib/paths";

// Open Graph image of an object card: /api/og/1046.jpg
export const revalidate = 86400;

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const id = Number((await params).file.match(/^(\d+)\.jpg$/)?.[1]);
  const p = id ? (await getAllProperties()).find((x) => x.id === id) : undefined;
  if (!p) return new Response("Not found", { status: 404 });

  const [fonts, own] = await Promise.all([ogFonts(), photoDataUrl(p.images[0], 660, 630)]);
  // Without its own photo the object gets the photo of its city, or of Turkey.
  const photo = own ?? (await localPhotoDataUrl(DEST_IMG[p.city] ?? "/img/dest/istanbul.webp", 660, 630));
  const where = `${p.districtSlug ? `${districtName(p.districtSlug, p.district)}, ` : ""}${cityName(p.city)}`;
  const png = await new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#2e5a90", fontFamily: "Lato", color: "white" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain <img> */}
        {photo && <img src={photo} width={660} height={630} style={{ position: "absolute", right: 0, top: 0, width: 660, height: 630, objectFit: "cover" }} alt="" />}
        <div style={{ position: "absolute", left: 430, top: -40, width: 200, height: 720, background: "#2e5a90", transform: "skewX(-14deg)" }} />
        <div style={{ position: "absolute", left: 560, bottom: 0, width: 26, height: 220, background: "#3FB9E7", transform: "skewX(-14deg)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: 600, height: "100%", padding: "56px 0 56px 64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <OgMark size={72} />
            <div style={{ display: "flex", flexDirection: "column", fontSize: 30, lineHeight: 1.05 }}>
              <span style={{ fontWeight: 900 }}>AZPO</span>
              <span>Estate</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", paddingRight: 40 }}>
            <div style={{ fontSize: 22, color: "#3FB9E7", fontWeight: 900, letterSpacing: 3, textTransform: "uppercase" }}>{where}</div>
            <div style={{ marginTop: 14, fontSize: 46, fontWeight: 900, lineHeight: 1.08 }}>{objectName(p, { where: false })}</div>
            <div style={{ marginTop: 26, display: "flex" }}>
              <span style={{ background: "white", color: "#2e5a90", borderRadius: 999, padding: "10px 26px", fontSize: 36, fontWeight: 900 }}>{priceOf(p)}</span>
            </div>
          </div>
          <div style={{ fontSize: 22, color: "#d6e4f4" }}>{`ID ${p.id} · azpo.ru`}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  ).arrayBuffer();

  return new Response(new Uint8Array(await toJpeg(png)), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
