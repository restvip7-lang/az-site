import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "../globals.css";
import "./admin.css";

// The admin is a separate root layout: no site header, footer, analytics or catalogue data.
const lato = localFont({
  src: [
    { path: "../../fonts/Lato-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/Lato-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../fonts/Lato-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-lato",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Arial"],
});

// Every admin screen depends on the signed-in user and the database: never prerendered or cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Админка AZPO", template: "%s · Админка AZPO" },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { themeColor: "#2e5a90", width: "device-width", initialScale: 1 };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${lato.variable} min-h-screen antialiased`}>{children}</body>
    </html>
  );
}
