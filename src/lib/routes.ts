import { LANG } from "./paths";

/** Static page URLs. All section URLs end with a slash (next.config trailingSlash). */
export const R = {
  home: `/${LANG}/`,
  catalog: `/${LANG}/turkey/`,
  sale: `/${LANG}/turkey/sale/`,
  complexes: `/${LANG}/turkey/sale/complexes/`,
  services: `/${LANG}/services/`,
  service: (slug: string) => `/${LANG}/services/${slug}/`,
  about: `/${LANG}/about/`,
  team: `/${LANG}/team/`,
  member: (slug: string) => `/${LANG}/team/${slug}/`,
  reviews: `/${LANG}/reviews/`,
  blog: `/${LANG}/blog/`,
  contacts: `/${LANG}/contacts/`,
  favorites: `/${LANG}/favorites/`,
  privacy: `/${LANG}/privacy/`,
  search: `/${LANG}/search/`,
};
