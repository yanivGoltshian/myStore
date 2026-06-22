import Link from "next/link";
import { homepage } from "@/lib/data";

export default function Hero() {
  const { image, alt, href } = homepage.hero;
  return (
    <>
      {/* Mobile / tablet — original full-width banner, unchanged */}
      <section className="lg:hidden">
        <Link href={href} className="block" aria-label={alt}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={alt}
            className="block h-auto w-full"
            fetchPriority="high"
          />
        </Link>
      </section>

      {/* Desktop — split hero: still banner on a crimson field + animated ad "screen" */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#8d2724] via-[#7a1f1c] to-[#5c1714] lg:block">
        <div className="mx-auto flex h-[440px] max-w-7xl items-stretch xl:h-[480px]">
          {/* Banner side (renders on the right in RTL) — its crimson edges blend into the field */}
          <Link
            href={href}
            aria-label={alt}
            className="group relative flex flex-1 flex-col items-center justify-center gap-6 px-8"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={alt}
              className="w-full max-w-[780px] object-contain"
              fetchPriority="high"
            />
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e7d29a] bg-white/10 px-9 py-3 text-lg font-extrabold text-white shadow-lg backdrop-blur-sm transition group-hover:bg-white/20">
              לכניסה לחנות
              <span aria-hidden>←</span>
            </span>
          </Link>

          {/* Animated ad "screen" (renders on the left in RTL) */}
          <div className="relative w-[300px] shrink-0 overflow-hidden ring-1 ring-white/10 xl:w-[340px]">
            <iframe
              src="/hero/electro-hankin-ad/"
              title={alt}
              loading="eager"
              scrolling="no"
              className="absolute inset-0 h-full w-full border-0"
            />
            {/* feather the inner edge into the crimson field + subtle vignette */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#5c1714] to-transparent" />
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_70px_rgba(0,0,0,0.35)]" />
          </div>
        </div>
      </section>
    </>
  );
}
