// A small Markdown subset for articles, rendered to React elements (no HTML from the database
// ever reaches the page). Supported: ## and ### headings, paragraphs, "- " and "1. " lists,
// "> " quotes, "![alt](url)" images on their own line, "| a | b |" tables, **bold**, *italic*, [links](url).
import Link from "next/link";
import type { ReactNode } from "react";
import { slugFromTitle } from "./blog";

export type Block =
  | { t: "h2" | "h3" | "p" | "quote"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "img"; alt: string; src: string }
  | { t: "table"; rows: string[][] };

const BULLET = /^[-*•]\s+/;
const NUMBER = /^\d+[.)]\s+/;
const IMAGE = /^!\[([^\]]*)\]\((\S+?)\)$/;

export function parseBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n?/g, "\n").split("\n").map((l) => l.trim());
  const out: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push({ t: "p", text: para.join("\n") });
    para = [];
  };
  /** Consecutive lines matching re, with the marker cut off. */
  const take = (i: number, re: RegExp, cut: RegExp) => {
    const items: string[] = [];
    while (i < lines.length && re.test(lines[i])) items.push(lines[i++].replace(cut, ""));
    return [items, i - 1] as const;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpExecArray | null;
    if (!line) { flush(); continue; }
    if ((m = /^(#{1,4})\s+(.+)$/.exec(line))) { flush(); out.push({ t: m[1].length <= 2 ? "h2" : "h3", text: m[2] }); continue; }
    if ((m = IMAGE.exec(line))) { flush(); out.push({ t: "img", alt: m[1], src: m[2] }); continue; }
    if (BULLET.test(line)) { flush(); const [items, j] = take(i, BULLET, BULLET); out.push({ t: "ul", items }); i = j; continue; }
    if (NUMBER.test(line)) { flush(); const [items, j] = take(i, NUMBER, NUMBER); out.push({ t: "ol", items }); i = j; continue; }
    if (line.startsWith(">")) { flush(); const [items, j] = take(i, /^>/, /^>\s?/); out.push({ t: "quote", text: items.join("\n") }); i = j; continue; }
    if (line.startsWith("|")) {
      flush();
      const [rows, j] = take(i, /^\|/, /^$/);
      const cells = rows.filter((r) => !/^\|?[\s:|-]+$/.test(r)).map((r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
      if (cells.length) out.push({ t: "table", rows: cells });
      i = j;
      continue;
    }
    para.push(line);
  }
  flush();
  return out;
}

/** Only web, mail and phone links, or paths on this site. */
export function safeHref(href: string) {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  return /^(https?:|mailto:|tel:)/i.test(href) ? href : null;
}

const INLINE = /(\*\*.+?\*\*|\[[^\]]+\]\(\S+?\)|\*[^*\s][^*]*?\*)/g;

function inline(text: string, key = ""): ReactNode[] {
  return text.split(INLINE).filter(Boolean).map((part, i) => {
    const k = `${key}${i}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={k} className="font-bold text-ink">{inline(part.slice(2, -2), k)}</strong>;
    const link = /^\[([^\]]+)\]\((\S+?)\)$/.exec(part);
    if (link) {
      const href = safeHref(link[2]);
      if (!href) return link[1];
      const cls = "font-bold text-brand-500 underline decoration-brand-500/30 underline-offset-4 transition-[text-decoration-color] duration-200 hover:decoration-brand-500";
      return href.startsWith("/")
        ? <Link key={k} href={href} className={cls}>{inline(link[1], k)}</Link>
        : <a key={k} href={href} className={cls} rel="noopener" target={href.startsWith("http") ? "_blank" : undefined}>{inline(link[1], k)}</a>;
    }
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) return <em key={k}>{inline(part.slice(1, -1), k)}</em>;
    return part;
  });
}

const withBreaks = (text: string, key: string) =>
  text.split("\n").flatMap((l, i) => (i ? [<br key={`${key}br${i}`} />, ...inline(l, `${key}${i}-`)] : inline(l, `${key}${i}-`)));

export const plainText = (s: string) =>
  s.replace(/!\[[^\]]*\]\(\S+?\)/g, "").replace(/\[([^\]]+)\]\(\S+?\)/g, "$1").replace(/\*\*|\*|^#+\s*|^>\s?|^[-•]\s+/gm, "").replace(/\|/g, " ");

export const headingId = (text: string) => slugFromTitle(plainText(text), 60) || "section";

/** Second-level headings, for the table of contents. */
export const outline = (blocks: Block[]) =>
  blocks.flatMap((b) => (b.t === "h2" ? [{ id: headingId(b.text), text: plainText(b.text) }] : []));

export function Markdown({ blocks }: { blocks: Block[] }) {
  return (
    <div className="text-pretty text-[17px] leading-[1.75] text-ink/85">
      {blocks.map((b, i) => {
        const k = String(i);
        switch (b.t) {
          case "h2":
            return <h2 key={k} id={headingId(b.text)} className="mb-4 mt-12 scroll-mt-24 text-balance text-2xl font-black leading-tight tracking-tight text-ink first:mt-0 sm:text-3xl">{inline(b.text, k)}</h2>;
          case "h3":
            return <h3 key={k} className="mb-3 mt-8 text-balance text-xl font-black leading-snug text-ink">{inline(b.text, k)}</h3>;
          case "p":
            return <p key={k} className="my-5">{withBreaks(b.text, k)}</p>;
          case "quote":
            return <blockquote key={k} className="my-7 rounded-[22px_6px_22px_6px] bg-sand px-6 py-5 font-bold text-ink">{withBreaks(b.text, k)}</blockquote>;
          case "ul":
            return <ul key={k} className="my-5 space-y-2 pl-1">{b.items.map((it, j) => (
              <li key={j} className="relative pl-6 before:absolute before:left-0 before:top-[0.7em] before:h-2 before:w-3 before:-skew-x-[20deg] before:bg-sky">{inline(it, `${k}-${j}`)}</li>
            ))}</ul>;
          case "ol":
            return <ol key={k} className="my-5 list-decimal space-y-2 pl-6 marker:font-black marker:text-brand-500">{b.items.map((it, j) => <li key={j} className="pl-1">{inline(it, `${k}-${j}`)}</li>)}</ol>;
          case "img":
            return safeHref(b.src) ? (
              <figure key={k} className="my-8">
                {/* Article images come in any size, so a plain lazy <img> keeps their own proportions. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.src} alt={b.alt} loading="lazy" decoding="async" className="w-full rounded-[28px_8px_28px_8px] bg-sand outline outline-1 -outline-offset-1 outline-black/5" />
                {b.alt && <figcaption className="mt-2 text-sm text-slate-500">{b.alt}</figcaption>}
              </figure>
            ) : null;
          case "table":
            return (
              <div key={k} className="my-7 overflow-x-auto rounded-[18px_6px_18px_6px] ring-1 ring-brand-500/15">
                <table className="w-full border-collapse bg-white text-left text-[15px]">
                  <tbody>{b.rows.map((r, j) => (
                    <tr key={j} className={j === 0 ? "bg-brand-500 text-white" : "border-t border-brand-500/10"}>
                      {r.map((c, n) => (j === 0 ? <th key={n} scope="col" className="px-4 py-3 font-bold">{inline(c, `${k}-${j}-${n}`)}</th> : <td key={n} className="px-4 py-3 align-top">{inline(c, `${k}-${j}-${n}`)}</td>))}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}
