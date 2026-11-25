/** A 1–5 score as five slanted bars, in the style of the brand mark. */
export default function ScoreDots({ n, label }: { n: number; label?: string }) {
  return (
    <span role="img" aria-label={`${label ? `${label}: ` : ""}${n} из 5`} className="inline-flex items-center gap-[3px]">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} aria-hidden className={`h-3.5 w-[7px] -skew-x-[20deg] rounded-[1px] ${i <= n ? "bg-brand-500" : "bg-brand-500/15"}`} />
      ))}
    </span>
  );
}
