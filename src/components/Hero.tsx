import ReactDOM from "react-dom";
import Link from "next/link";
import { homepage } from "@/lib/data";

export default function Hero() {
  const { image, alt, href } = homepage.hero;
  // Preload the hero banner (the confirmed mobile LCP element) so its download
  // starts from the document head, before the <img> tag is parsed.
  ReactDOM.preload(image, { as: "image", fetchPriority: "high" });
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

      {/* Desktop — side-by-side: banner pinned right + animated ad pinned left, equal height, no gaps */}
      <section className="relative hidden overflow-hidden lg:block">
        <div className="flex w-full items-stretch">
          {/* Banner (renders on the right in RTL) — natural 3:1 ratio drives the row height */}
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

          {/* Animated ad (renders on the left in RTL) — fixed 248px, stretches to match the banner height */}
          <div className="relative w-[333px] shrink-0 overflow-hidden bg-[#862421]">
            <iframe
              src="/hero/electro-hankin-ad/"
              title={alt}
              loading="lazy"
              scrolling="no"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </div>
      </section>
    </>
  );
}
