import Link from "next/link";
import Logo from "./Logo";
import { CONTACTS } from "@/lib/api";

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="space-y-4">
          <Logo light />
          <p className="text-sm leading-relaxed text-white/60">
            Ваш ключ к успешным инвестициям в турецкую недвижимость с полным сопровождением.
          </p>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Навигация</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/property-turkey?city=alanya" className="hover:text-white">Недвижимость в Алании</Link></li>
            <li><Link href="/property-turkey?city=antalya" className="hover:text-white">Недвижимость в Анталии</Link></li>
            <li><Link href="/property-turkey?city=istanbul" className="hover:text-white">Недвижимость в Стамбуле</Link></li>
            <li><Link href="/citizenship" className="hover:text-white">Гражданство и ВНЖ</Link></li>
            <li><Link href="/about" className="hover:text-white">О компании</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Офисы</h3>
          <ul className="space-y-3 text-sm">
            {CONTACTS.offices.map((o) => (
              <li key={o.city}><span className="font-semibold text-white">{o.city}.</span> {o.address}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Связаться</h3>
          <ul className="space-y-2 text-sm">
            <li><a href={CONTACTS.phoneHref} className="hover:text-white">{CONTACTS.phone}</a></li>
            <li><a href={`mailto:${CONTACTS.email}`} className="hover:text-white">{CONTACTS.email}</a></li>
            <li className="flex gap-4 pt-2">
              <a href={CONTACTS.whatsapp} target="_blank" rel="noopener" className="hover:text-white">WhatsApp</a>
              <a href={CONTACTS.telegram} target="_blank" rel="noopener" className="hover:text-white">Telegram</a>
              <a href={CONTACTS.instagram} target="_blank" rel="noopener" className="hover:text-white">Instagram</a>
              <a href={CONTACTS.youtube} target="_blank" rel="noopener" className="hover:text-white">YouTube</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">© 2003–{new Date().getFullYear()} AZPO Group</div>
    </footer>
  );
}
