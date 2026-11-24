import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-bold text-brand-900">Страница не найдена</h1>
      <p className="mt-4 text-slate-600">Возможно, объект уже продан или ссылка устарела.</p>
      <Link href="/property-turkey" className="mt-8 inline-block rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white">Перейти в каталог</Link>
    </div>
  );
}
