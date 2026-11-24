import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingContact from "@/components/FloatingContact";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });
const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], variable: "--font-playfair" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "https://azpo.ru"),
  title: {
    default: "AZPO Estate — недвижимость в Турции от застройщиков и собственников",
    template: "%s | AZPO Estate",
  },
  description:
    "Квартиры, виллы и новостройки в Алании, Анталии, Стамбуле и других городах Турции. Полное сопровождение сделки, ВНЖ и гражданство.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} ${playfair.variable} min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <FloatingContact />
      </body>
    </html>
  );
}
