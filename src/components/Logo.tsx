import Link from "next/link";
import { site } from "@/lib/data";

const GOLD = "#d4af37";

export default function Logo({ height = 44, onLight = false }: { height?: number; onLight?: boolean }) {
  const mark = Math.round(height * 1.02);
  const titleColor = onLight ? "text-brand-red" : "text-white";
  const subColor = onLight ? "#a07d1c" : GOLD;
  return (
    <Link
      href="/"
      aria-label={`${site.name} — לדף הבית`}
      className="inline-flex shrink-0 items-center gap-2.5"
    >
      <svg
        width={mark}
        height={mark}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
        style={{ filter: "drop-shadow(0 0 2.5px rgba(212,175,55,0.55))", transform: "skewX(-10deg)" }}
      >
        <path
          d="M13.5 2 4 13.5h6L9 22l11-12.5h-6.5L13.5 2Z"
          fill="none"
          stroke={GOLD}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className={`font-black italic tracking-tight ${titleColor}`}
          style={{ fontSize: height * 0.46 }}
        >
          {site.name}
        </span>
        <span
          className="mt-1 font-semibold italic uppercase"
          style={{ fontSize: height * 0.18, letterSpacing: "0.22em", color: subColor }}
        >
          {site.nameEn}
        </span>
      </span>
    </Link>
  );
}
