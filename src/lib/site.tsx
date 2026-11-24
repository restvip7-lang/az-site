import { CONTACTS } from "./contacts";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "https://azpo-site.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "AZPO Estate";

/** Search engines should index only the real domain, not the demo. */
export const INDEXABLE = process.env.NEXT_PUBLIC_INDEXABLE === "1";

export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": `${SITE_URL}/#organization`,
  name: "AZPO Estate",
  alternateName: "AZPO Group",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/azpo-mark.png`,
  telephone: CONTACTS.phone.replace(/\s/g, ""),
  email: CONTACTS.email,
  areaServed: "TR",
  sameAs: [CONTACTS.instagram, CONTACTS.youtube, CONTACTS.telegram],
  address: CONTACTS.offices.map((o) => ({
    "@type": "PostalAddress",
    streetAddress: o.address,
    addressLocality: o.city,
    addressCountry: "TR",
  })),
};

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
