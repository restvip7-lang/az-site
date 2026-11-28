// Loader for every next/image on the site: photos are resized by our own route (/api/img/), not by the
// hosting's image service. Same URLs on Vercel and on our own server, and no per-image quota
// (Vercel's optimiser answered 402 once the free quota ran out and catalogue photos went blank).
import { IMG_QUALITIES, IMG_WIDTHS } from "./image-sizes";

export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // SVG and data URLs are served as they are.
  if (src.startsWith("data:") || /\.svg(\?|$)/i.test(src)) return src;
  const w = IMG_WIDTHS.find((x) => x >= width) ?? IMG_WIDTHS[IMG_WIDTHS.length - 1];
  const q = IMG_QUALITIES.reduce((best, x) => (Math.abs(x - (quality ?? 75)) < Math.abs(best - (quality ?? 75)) ? x : best));
  return `/api/img/?u=${encodeURIComponent(src)}&w=${w}&q=${q}`;
}
