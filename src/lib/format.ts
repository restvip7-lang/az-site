// Formatting helpers safe for client components.

export function formatPrice(value: number | null, currency: "USD" | "EUR") {
  if (!value) return "Цена по запросу";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Russian plural: plural(21, ["объект", "объекта", "объектов"]) → "объект". */
export function plural(n: number, [one, few, many]: [string, string, string]) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
export const objects = (n: number) => `${n} ${plural(n, ["объект", "объекта", "объектов"])}`;
