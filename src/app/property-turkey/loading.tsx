export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-busy="true" aria-live="polite">
      <div className="h-10 w-72 animate-pulse rounded-full bg-white" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-white">
            <div className="aspect-[4/3] animate-pulse bg-slate-200" />
            <div className="space-y-2 p-4"><div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" /><div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
