import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";
import Logo from "@/components/Logo";
import { MarkShapes } from "@/components/ui";
import { R } from "@/lib/routes";

// Shown for URLs outside every layout, such as an unknown language prefix (/de/…). Answers with HTTP 404.
const lato = localFont({
  src: [
    { path: "../fonts/Lato-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Lato-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-lato",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Arial"],
});

export const metadata: Metadata = {
  title: "Страница не найдена | AZPO Estate",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <html lang="ru">
      <body className={`${lato.variable} flex min-h-screen flex-col items-center justify-center bg-sand px-4 py-16 text-center antialiased`}>
        <Logo />
        <MarkShapes className="mx-auto mt-12 w-32" />
        <p className="eyebrow mt-8 text-brand-500">Ошибка 404</p>
        <h1 className="mt-3 text-balance text-4xl font-black tracking-tight text-ink sm:text-5xl">Страница <span className="slant">не найдена</span></h1>
        <p className="mt-4 max-w-md text-pretty text-slate-600">Ссылка устарела или набрана с ошибкой.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={R.sale} className="btn btn-primary">Каталог недвижимости</Link>
          <Link href={R.home} className="btn btn-ghost">На главную</Link>
        </div>
      </body>
    </html>
  );
}
