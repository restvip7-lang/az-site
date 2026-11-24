// Shared by the admin forms (client) and the server actions: form state and field vocabularies.

export type FormState = { error?: string; ok?: string } | null;

/** Catalogue tags, spelled exactly as in the AZPO API, so that the site's landings pick the objects up. */
export const OBJECT_TAGS = ["Вид на море", "Первая линия", "Под Гражданство", "Под ВНЖ", "От застройщика", "Вторичное жилье", "Новостройка", "Элитное", "недорого", "Инвестиции"];

/** Fact keys shown on the object page, with labels and input hints. */
export const OBJECT_FACTS: [key: string, label: string, hint: string][] = [
  ["year", "Год сдачи", "2026 или «Сдан»"],
  ["floors", "Этажность", "12"],
  ["sea", "До моря", "350 м"],
  ["airport", "До аэропорта", "35 км"],
  ["furniture", "Мебель", "Без мебели"],
  ["installments", "Рассрочка", "До 24 месяцев, взнос 50%"],
];
