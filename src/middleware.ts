import { NextResponse, type NextRequest } from "next/server";

// URL hygiene from the SEO spec, all in one hop:
// - "/" → 308 "/ru/" (the site's main language; azpo.ru is a Russian-language domain);
// - URLs without a trailing slash → 308 to the slash form;
// - old azpo.ru and demo URLs → 301/308 to the new structure;
// - catalogue URLs with filter parameters → "X-Robots-Tag: noindex, follow" (their canonical is the clean URL).

const FILTER_PARAMS = ["price_from", "price_to", "rooms", "sort", "view", "q", "cur", "area_from", "area_to"];

const LEGACY_PAGES: Record<string, string> = {
  citizenship: "/ru/services/citizenship/",
  about: "/ru/about/",
  "contact-us": "/ru/contacts/",
  contacts: "/ru/contacts/",
  "azpo-tv": "/ru/about/",
};

// URLs are built from scratch: a clone of req.nextUrl keeps the slash style of the request,
// so "/ru" + "/" would come out as "/ru" again.
const target = (req: NextRequest, path: string) => new URL(`${path}${req.nextUrl.search}`, req.url);
const permanent = (req: NextRequest, path: string, status = 308) => NextResponse.redirect(target(req, path), status);

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (pathname === "/" || pathname === "/index.php" || pathname === "/index.html") return permanent(req, "/ru/");

  const parts = pathname.split("/").filter(Boolean);
  const hasLang = parts[0] === "ru" || parts[0] === "en";
  const rest = hasLang ? parts.slice(1) : parts;

  // Old static pages: /citizenship, /ru/about, /en/contact-us …
  const legacy = rest.length === 1 ? LEGACY_PAGES[rest[0]] : undefined;
  if (legacy && legacy !== pathname) return permanent(req, legacy, 301);
  // English isn't published yet: its home goes to the Russian home.
  if (parts[0] === "en" && rest.length === 0) return permanent(req, "/ru/");

  // Old catalogue URLs (/property-turkey/1044, /en/property-turkey/alanya …) are resolved by the
  // /ru/property-turkey/ handler, which knows the data and redirects straight to the final URL.
  if (rest[0] === "property-turkey" && parts[0] !== "ru") {
    return NextResponse.rewrite(target(req, `/ru/${rest.join("/")}/`));
  }

  if (!pathname.endsWith("/")) return permanent(req, `${pathname}/`);

  if (parts[0] === "ru" && parts[1] === "turkey" && FILTER_PARAMS.some((k) => searchParams.has(k))) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, follow");
    return res;
  }
  return NextResponse.next();
}

export const config = {
  // Everything except Next internals, API routes and files with an extension (images, robots.txt, sitemaps…).
  matcher: ["/((?!_next/|api/|admin/api/|.*opengraph-image|.*\\.[a-zA-Z0-9]+$).*)"],
};
