// Language versions. Each language has its own URL prefix (/ru/…), the language of a page is taken
// only from the URL. English is added to LANGS once its texts are translated: until then /en/ is a 404
// and no hreflang points to it (the spec forbids hreflang to pages that don't exist).
export const LANGS = ["ru"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "ru";
export const OG_LOCALE: Record<string, string> = { ru: "ru_RU", en: "en_US" };
export const isLang = (v: string): v is Lang => (LANGS as readonly string[]).includes(v);

/** hreflang set for a path that exists in every published language ("/turkey/alanya/"). */
export function languageAlternates(pathWithoutLang: string) {
  const langs = Object.fromEntries(LANGS.map((l) => [l, `/${l}${pathWithoutLang}`]));
  return { ...langs, "x-default": `/${DEFAULT_LANG}${pathWithoutLang}` };
}

/** Canonical + hreflang for metadata.alternates. */
export function alternates(path: string) {
  const rest = path.replace(/^\/[a-z]{2}(?=\/)/, "");
  return { canonical: path, languages: languageAlternates(rest) };
}
