import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="hatch flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Image src="/brand/azpo-mark.png" alt="" width={40} height={30} className="h-[30px] w-[40px] object-contain" priority />
          <span className="text-base leading-6 text-brand-500"><span className="font-bold">AZPO</span><br /><span className="font-semibold">Estate</span></span>
        </div>
        {children}
      </div>
    </div>
  );
}
