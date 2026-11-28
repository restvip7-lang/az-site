import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { listingPath, parseSegments, type GeoIndex } from "@/lib/catalog";
import { cardPath } from "@/lib/paths";

const req = (path: string) => new NextRequest(new URL(path, "https://azpo.ru"));
const location = (path: string) => middleware(req(path)).headers.get("location");

describe("middleware", () => {
  it("sends / to the Russian home in one hop", () => {
    const res = middleware(req("/"));
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://azpo.ru/ru/");
  });
  it("adds the trailing slash and keeps the query", () => {
    expect(location("/ru/turkey?rooms=2")).toBe("https://azpo.ru/ru/turkey/?rooms=2");
  });
  it("moves old azpo.ru pages with 301", () => {
    const res = middleware(req("/ru/citizenship"));
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://azpo.ru/ru/services/citizenship/");
    expect(location("/en/contact-us")).toBe("https://azpo.ru/ru/contacts/");
  });
  it("marks filtered catalogue pages noindex", () => {
    expect(middleware(req("/ru/turkey/alanya/?price_to=100000")).headers.get("x-robots-tag")).toBe("noindex, follow");
    expect(middleware(req("/ru/turkey/alanya/")).headers.get("x-robots-tag")).toBeNull();
  });
});

describe("catalogue URLs", () => {
  const geo = {
    cities: new Map([["alanya", { count: 2, districts: new Map([["mahmutlar", { count: 1, name: "Mahmutlar" }]]) }]]),
  } as unknown as GeoIndex;
  it("parses city, district, type and card URLs", () => {
    expect(parseSegments(["alanya", "mahmutlar"], geo)).toEqual({ kind: "listing", q: { page: 1, city: "alanya", district: "mahmutlar" } });
    expect(parseSegments(["alanya", "mahmutlar", "sale", "id1046"], geo)).toMatchObject({ kind: "card", id: 1046 });
    expect(parseSegments(["alanya", "page-1"], geo)).toEqual({ kind: "redirect", to: "/ru/turkey/alanya/" });
    expect(parseSegments(["nowhere"], geo)).toBeNull();
  });
  it("builds the same URLs back", () => {
    expect(listingPath({ city: "alanya", district: "mahmutlar" })).toBe("/ru/turkey/alanya/mahmutlar/");
    expect(listingPath({ city: "alanya", page: 3 })).toBe("/ru/turkey/alanya/page-3/");
    expect(cardPath({ id: 1046, city: "antalya", districtSlug: "konyaalti" })).toBe("/ru/turkey/antalya/konyaalti/sale/id1046/");
  });
});
