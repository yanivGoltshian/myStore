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

      {/* Desktop — side-by-side: still banner pinned right + animated ad pinned left */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#8d2724] via-[#7a1f1c] to-[#5c1714] lg:block">
        <div className="mx-auto flex max-w-7xl items-stretch">
          {/* Banner (renders on the right in RTL) — drives the row height at its natural ratio */}
          <Link
            href={href}
            aria-label={alt}
            className="relative block flex-1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={alt}
              className="block h-auto w-full"
              fetchPriority="high"
            />
          </Link>

          {/* Animated ad "screen" (renders on the left in RTL) — stretches to the banner height */}
          <div className="relative w-[300px] shrink-0 overflow-hidden ring-1 ring-white/10 xl:w-[340px]">
            <iframe
              src="/hero/electro-hankin-ad/"
              title={alt}
              loading="eager"
              scrolling="no"
              className="absolute inset-0 h-full w-full border-0"
            />
            {/* feather the inner edge into the crimson field + subtle vignette */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#5c1714] to-transparent" />
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_70px_rgba(0,0,0,0.35)]" />
          </div>
        </div>
      </section>
    </>
  );
}
