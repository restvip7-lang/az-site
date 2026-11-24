import Image from "next/image";
import Link from "next/link";

/** AZPO Estate logo exactly as in the brand book: the mark plus the stacked "AZPO / Estate" wordmark. */
export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 select-none" aria-label="AZPO Estate — на главную">
      <Image
        src={light ? "/brand/azpo-mark-white.png" : "/brand/azpo-mark.png"}
        alt=""
        width={40}
        height={30}
        priority
        className="h-[30px] w-[40px] object-contain"
      />
      <span className={`text-base leading-6 ${light ? "text-white" : "text-brand-500"}`}>
        <span className="font-bold">AZPO</span>
        <br />
        <span className="font-semibold">Estate</span>
      </span>
    </Link>
  );
}
