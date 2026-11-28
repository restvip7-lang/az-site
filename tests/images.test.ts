import { describe, expect, it } from "vitest";
import imageLoader from "@/lib/image-loader";
import { allowedLocal, allowedSource } from "@/lib/image-sizes";

describe("image loader", () => {
  it("sends photos through our own route with a fixed width and quality", () => {
    const url = imageLoader({ src: "https://api.azpo.ru/api/files/property-images/a b.webp", width: 700, quality: 72 });
    expect(url).toBe("/api/img/?u=https%3A%2F%2Fapi.azpo.ru%2Fapi%2Ffiles%2Fproperty-images%2Fa%20b.webp&w=828&q=70");
  });
  it("caps the width at the largest allowed size", () => {
    expect(imageLoader({ src: "/img/dest/alanya.webp", width: 4000 })).toContain("&w=1920&q=75");
  });
  it("leaves SVG and data URLs alone", () => {
    expect(imageLoader({ src: "/logo.svg", width: 96 })).toBe("/logo.svg");
    expect(imageLoader({ src: "data:image/png;base64,AA", width: 96 })).toBe("data:image/png;base64,AA");
  });
});

describe("image sources", () => {
  it("allows the AZPO photo hosts, Supabase storage and Unsplash", () => {
    expect(allowedSource("https://api.azpo.ru/api/files/property-images/x.webp")).not.toBeNull();
    expect(allowedSource("https://api.azpo.com/api/files/property-images/x.webp")).not.toBeNull();
    expect(allowedSource("https://abc.supabase.co/storage/v1/object/public/media/x.webp")).not.toBeNull();
    expect(allowedSource("https://images.unsplash.com/photo-1?w=1")).not.toBeNull();
  });
  it("refuses other hosts, paths, http and look-alike hosts (no open proxy)", () => {
    for (const u of [
      "http://api.azpo.ru/api/files/x.webp",
      "https://api.azpo.ru/api/dashboard/admin",
      "https://evil.com/api/files/x.webp",
      "https://api.azpo.ru.evil.com/api/files/x.webp",
      "https://supabase.co/storage/v1/object/public/x",
      "https://abc.supabase.co/storage/v1/object/sign/x",
      "https://user:pw@api.azpo.ru/api/files/x.webp",
      "https://api.azpo.ru:8443/api/files/x.webp",
      "not a url",
    ]) expect(allowedSource(u), u).toBeNull();
  });
  it("allows only our public image folders for local paths", () => {
    expect(allowedLocal("/img/dest/alanya.webp")).toBe(true);
    expect(allowedLocal("/brand/azpo-mark.png")).toBe(true);
    expect(allowedLocal("/img/../admin/x.png")).toBe(false);
    expect(allowedLocal("/admin/api/diag/")).toBe(false);
    expect(allowedLocal("/img/x.svg")).toBe(false);
  });
});
