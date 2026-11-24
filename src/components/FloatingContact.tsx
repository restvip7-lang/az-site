import Link from "next/link";
import { CONTACTS } from "@/lib/contacts";

const I = {
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  wa: "M21 11.5a8.4 8.4 0 0 1-12.5 7.3L3 21l2.2-5.4A8.4 8.4 0 1 1 21 11.5z",
  tg: "M21.5 4.5 2.7 11.8c-.8.3-.8 1.4 0 1.6l4.6 1.5 1.8 5.6c.2.7 1.1.9 1.6.3l2.6-2.6 4.7 3.5c.6.4 1.4.1 1.6-.6L23 5.6c.2-.8-.6-1.4-1.5-1.1zM9.5 14.5l9-7.5",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
};
const Icon = ({ d }: { d: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);

/** Desktop: round WhatsApp button. Mobile: a bottom bar with the main ways to get in touch. */
export default function FloatingContact() {
  const item = "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-bold text-brand-700";
  return (
    <>
      <nav aria-label="Быстрая связь" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <Link href="/ru/turkey/" className={item}><Icon d={I.grid} />Каталог</Link>
        <a href={CONTACTS.phoneHref} className={item}><Icon d={I.phone} />Позвонить</a>
        <a href={CONTACTS.whatsapp} target="_blank" rel="noopener" className={`${item} text-[#128c4a]`}><Icon d={I.wa} />WhatsApp</a>
        <a href={CONTACTS.telegram} target="_blank" rel="noopener" className={`${item} text-[#1a7fb0]`}><Icon d={I.tg} />Telegram</a>
      </nav>
      <a
        href={CONTACTS.whatsapp}
        target="_blank"
        rel="noopener"
        aria-label="Написать в WhatsApp"
        className="fixed bottom-6 right-6 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform duration-200 ease-out hover:scale-105 active:scale-95 md:flex"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/></svg>
      </a>
    </>
  );
}
