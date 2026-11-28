import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../globals.css";
import { notFound } from "next/navigation";
import { LANGS, OG_LOCALE, isLang } from "@/lib/i18n";
import Header, { type MenuCity } from "@/components/Header";
import { getAllProperties } from "@/lib/api";
import { geoIndex, listingPath } from "@/lib/catalog";
import { cityName, districtName } from "@/lib/geo";
import Footer from "@/components/Footer";
import FloatingContact from "@/components/FloatingContact";
import Consent from "@/components/Consent";
import { R } from "@/lib/routes";
import { INDEXABLE, JsonLd, SITE_NAME, SITE_URL, organizationLd } from "@/lib/site";

// Lato is the brand typeface. These are the Lato 2.0 files from the azpo.ru source,
// subset to Latin, Turkish and Cyrillic, so Russian text is set in Lato too
// (Google Fonts' Lato has no Cyrillic, so azpo.ru falls back to a system font).
const lato = localFont({
  src: [
    { path: "../../fonts/Lato-Light.woff2", weight: "300", style: "normal" },
    { path: "../../fonts/Lato-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/Lato-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../fonts/Lato-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-lato",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Arial"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Недвижимость в Турции — купить квартиру или виллу у моря | AZPO Estate",
    template: "%s | AZPO Estate",
  },
  description:
    "Квартиры, виллы и новостройки в Алании, Анталии, Стамбуле и других городах Турции от застройщиков. Полное сопровождение сделки, ВНЖ и гражданство Турции.",
  applicationName: SITE_NAME,
  openGraph: { type: "website", locale: OG_LOCALE.ru, siteName: SITE_NAME },
  twitter: { card: "summary_large_image" },
  robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: true },
  formatDetection: { telephone: false },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
};

export const viewport: Viewport = { themeColor: "#2e5a90", width: "device-width", initialScale: 1 };

// Every language lives on its own URL prefix (/ru/…); unknown prefixes are a 404 (notFound below).
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const geo = geoIndex(await getAllProperties(lang));
  const menu: MenuCity[] = [...geo.cities]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([city, c]) => ({
      href: listingPath({ city }),
      label: cityName(city),
      count: c.count,
      districts: [...c.districts].sort((a, b) => b[1].count - a[1].count).slice(0, 5)
        .map(([d, v]) => ({ href: listingPath({ city, district: d }), label: districtName(d, v.name) })),
    }));
  return (
    <html lang={lang}>
      <body className={`${lato.variable} flex min-h-screen flex-col pb-16 antialiased md:pb-0`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2">
          Перейти к содержанию
        </a>
        <Header cities={menu} />
        <main id="main" className="flex-1">{children}</main>
        <Footer lang={lang} />
        <FloatingContact />
        <JsonLd data={organizationLd} />
        <Analytics />
        <SpeedInsights />
        <Consent privacyHref={R.privacy} />
      </body>
    </html>
  );
}
