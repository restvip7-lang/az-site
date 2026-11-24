import Link from "next/link";

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-baseline gap-1.5 select-none" aria-label="AZPO Estate — на главную">
      <span className={`font-display text-2xl font-bold tracking-wide ${light ? "text-white" : "text-brand-700"}`}>AZPO</span>
      <span className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${light ? "text-white/70" : "text-gold"}`}>Estate</span>
    </Link>
  );
}
