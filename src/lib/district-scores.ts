// Editorial comparison of Alanya districts: distance to the centre and to the sea, and 1–5 scores.
// The scores come from the district research done for the Kleo Homes project (Anuar's), the order is
// the coast from west to east. Prices and object counts are not here: they come from the live catalogue.

export type ScoreKey = "life" | "rent" | "beach" | "quiet";

export interface DistrictScore {
  slug: string;
  /** Kilometres to the centre of Alanya. */
  toCenter: number;
  /** Distance to the sea: label for the table and metres for sorting (0 = on the sea). */
  sea: { label: string; m: number };
  /** Districts without a beach of their own. */
  note?: string;
  scores: Record<ScoreKey, number>;
}

export const SCORE_LABELS: Record<ScoreKey, string> = {
  life: "Жизнь круглый год",
  rent: "Под аренду",
  beach: "Пляжи",
  quiet: "Тишина",
};

const ON_SEA = { label: "у моря", m: 0 };

export const ALANYA_SCORES: DistrictScore[] = [
  { slug: "avsallar", toCenter: 22, sea: ON_SEA, scores: { life: 2, rent: 4, beach: 5, quiet: 4 } },
  { slug: "turkler", toCenter: 17, sea: ON_SEA, scores: { life: 2, rent: 3, beach: 4, quiet: 5 } },
  { slug: "payallar", toCenter: 13, sea: ON_SEA, scores: { life: 2, rent: 3, beach: 4, quiet: 4 } },
  { slug: "konakli", toCenter: 10, sea: ON_SEA, scores: { life: 4, rent: 4, beach: 4, quiet: 3 } },
  { slug: "center", toCenter: 0, sea: ON_SEA, scores: { life: 5, rent: 5, beach: 5, quiet: 1 } },
  { slug: "tepe", toCenter: 4, sea: { label: "3–5 км", m: 3000 }, note: "в горах", scores: { life: 3, rent: 2, beach: 1, quiet: 5 } },
  { slug: "cikcili", toCenter: 3, sea: { label: "0,7–2,5 км", m: 700 }, note: "не у моря", scores: { life: 5, rent: 3, beach: 2, quiet: 3 } },
  { slug: "oba", toCenter: 2, sea: ON_SEA, scores: { life: 5, rent: 4, beach: 4, quiet: 3 } },
  { slug: "tosmur", toCenter: 5, sea: ON_SEA, scores: { life: 4, rent: 3, beach: 4, quiet: 4 } },
  { slug: "kestel", toCenter: 7, sea: ON_SEA, scores: { life: 4, rent: 4, beach: 4, quiet: 3 } },
  { slug: "mahmutlar", toCenter: 9.5, sea: ON_SEA, scores: { life: 5, rent: 4, beach: 4, quiet: 2 } },
  { slug: "kargicak", toCenter: 14, sea: ON_SEA, scores: { life: 3, rent: 3, beach: 3, quiet: 5 } },
  { slug: "demirtas", toCenter: 22, sea: ON_SEA, scores: { life: 2, rent: 3, beach: 4, quiet: 5 } },
  { slug: "gazipasa", toCenter: 43, sea: ON_SEA, scores: { life: 3, rent: 2, beach: 4, quiet: 5 } },
];

export const scoreFor = (slug: string) => ALANYA_SCORES.find((d) => d.slug === slug) ?? null;
