import Link from "next/link";
import { site } from "@/lib/data";

export default function Logo({ onLight = false }: { onLight?: boolean }) {
  void onLight;
  return (
    <Link
      href="/"
      aria-label={`${site.name} — לדף הבית`}
      className="inline-flex shrink-0 items-center"
    >
      <img
        src="/images/brand/logo.png"
        alt={site.name}
        style={{ width: "auto" }}
        className="block h-[34px] w-auto select-none sm:h-[44px]"
        draggable={false}
        loading="eager"
        decoding="async"
      />
    </Link>
  );
}
