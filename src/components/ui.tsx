import type { ReactNode } from "react";

/**
 * Section heading in the azpo.ru style: an index and kicker, a heavy Lato title,
 * and a rail (line with a ringed dot) that runs to the edge of the container.
 */
export function SectionHead({
  n,
  kicker,
  title,
  sub,
  light = false,
  align = "left",
  action,
}: {
  n?: string;
  kicker?: string;
  title: ReactNode;
  sub?: ReactNode;
  light?: boolean;
  align?: "left" | "right";
  action?: ReactNode;
}) {
  const rail = <span aria-hidden className={`rail ${align === "right" ? "rail-r" : ""} ${light ? "rail-light" : ""} mb-3 hidden min-w-12 flex-1 sm:block`} />;
  return (
    <div className="reveal mb-8 sm:mb-12">
      {(n || kicker) && (
        <p className={`eyebrow mb-3 flex items-center gap-3 ${light ? "text-sky" : "text-brand-500"} ${align === "right" ? "justify-end" : ""}`}>
          {n && <span className={`tabular-nums ${light ? "text-white/60" : "text-brand-500/60"}`}>{n}</span>}
          {kicker}
        </p>
      )}
      <div className={`flex items-end gap-6 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
        <h2 className={`max-w-3xl text-[2rem] font-black leading-[1.02] tracking-[-0.03em] sm:text-5xl ${light ? "text-white" : "text-ink"}`}>{title}</h2>
        {rail}
        {action && <div className="mb-1 hidden shrink-0 sm:block">{action}</div>}
      </div>
      {sub && <p className={`mt-4 max-w-2xl text-base sm:text-lg ${light ? "text-white/80" : "text-slate-600"} ${align === "right" ? "ml-auto text-right" : ""}`}>{sub}</p>}
      {action && <div className="mt-5 sm:hidden">{action}</div>}
    </div>
  );
}

/** Two slanted parallelograms in the proportions of the AZPO mark, used as a large decorative watermark. */
export function MarkShapes({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <svg viewBox="0 0 400 300" className={className} aria-hidden>
      <defs>
        <linearGradient id={light ? "mk-l" : "mk-d"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light ? "#ffffff" : "#bdcee1"} stopOpacity={light ? 0.35 : 1} />
          <stop offset="1" stopColor={light ? "#ffffff" : "#edf4fc"} stopOpacity={light ? 0.05 : 1} />
        </linearGradient>
      </defs>
      <path d="M150 20 Q160 0 182 0 H262 Q280 0 272 18 L150 282 Q142 300 120 300 H40 Q22 300 30 282 Z" fill={light ? "rgba(255,255,255,0.14)" : "#2e5a90"} />
      <path d="M250 150 H330 Q348 150 356 166 L400 282 Q406 300 386 300 H306 Q290 300 284 284 L240 166 Q234 150 250 150 Z" fill={`url(#${light ? "mk-l" : "mk-d"})`} />
    </svg>
  );
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12.5 10 17 19 7" />
    </svg>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
