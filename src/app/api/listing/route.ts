import { NextResponse, type NextRequest } from "next/server";
import { getAllProperties, toCard } from "@/lib/api";
import { PAGE_SIZE, geoIndex, parseSegments, select } from "@/lib/catalog";
import { applyFilters, parseFilters } from "@/lib/listing";

// JSON for "show more" and for GET filters on a landing page. Reads the cached catalogue only,
// so user requests never hit the AZPO API directly.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const path = sp.get("path") ?? "";
  const m = path.match(/^\/ru\/turkey\/(.*)$/);
  if (!m) return NextResponse.json({ error: "bad path" }, { status: 400 });

  const all = await getAllProperties();
  const parsed = parseSegments(m[1].split("/").filter(Boolean), geoIndex(all));
  if (!parsed || parsed.kind !== "listing") return NextResponse.json({ error: "not a listing" }, { status: 404 });

  const items = applyFilters(select(all, parsed.q), parseFilters(sp));
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const slice = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p) => toCard(p, 1));
  return NextResponse.json(
    { items: slice, total: items.length, page, pages: Math.max(1, Math.ceil(items.length / PAGE_SIZE)) },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
