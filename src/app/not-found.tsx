import Link from "next/link";
import { MarkShapes } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <MarkShapes className="mx-auto w-40" />
      <h1 className="mt-8 text-4xl font-black tracking-tight text-ink sm:text-5xl">Страница <span className="slant">не найдена</span></h1>
      <p className="mt-4 text-slate-600">Возможно, объект уже продан или ссылка устарела.</p>
      <Link href="/property-turkey" className="btn btn-primary mt-8">Перейти в каталог</Link>
    </div>
  );
}
