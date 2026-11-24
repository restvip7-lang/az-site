import { unstable_cache } from "next/cache";

// Objects are priced in USD or EUR. Landing pages like "до 100 000 €" and the price statistics
// compare them in euros, using the ECB reference rate (refreshed daily, with a fallback).
const FALLBACK_EUR_PER_USD = 0.86;

async function loadRate(): Promise<number> {
  try {
    const res = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", { signal: AbortSignal.timeout(5_000) });
    const xml = await res.text();
    const usd = Number(xml.match(/currency='USD' rate='([\d.]+)'/)?.[1]);
    return usd > 0 ? 1 / usd : FALLBACK_EUR_PER_USD;
  } catch {
    return FALLBACK_EUR_PER_USD;
  }
}

export const getEurPerUsd = unstable_cache(loadRate, ["eur-per-usd"], { revalidate: 86_400 });
