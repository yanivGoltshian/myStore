import type { Metadata } from "next";
import Link from "next/link";
import { lightingSubcats, LIGHTING_TOP } from "@/lib/lighting";
import { site } from "@/lib/data";

export const metadata: Metadata = {
  title: "תאורה",
  description:
    "מבחר ענק של גופי תאורה — נברשות, צמודי תקרה, מנורות קיר, ספוטים, תאורת חוץ ועוד. מחירים מומלצים לצרכן.",
  alternates: { canonical: "/lighting/" },
  robots: { index: false, follow: true },
  openGraph: {
    title: `תאורה | ${site.name}`,
    description: "מבחר ענק של גופי תאורה לבית ולגינה — נברשות, צמודי תקרה, תאורת חוץ ועוד.",
    type: "website",
    url: `${site.url}/lighting/`,
  },
};

export default function LightingLandingPage() {
  const total = lightingSubcats.reduce((s, c) => s + c.count, 0);

  return (
    <div className="pb-16">
      <div className="bg-soft">
        <div className="container-x py-3 text-[0.72rem] text-muted">
          <Link href="/" className="hover:text-brand-red">
            דף הבית
          </Link>
          <span className="px-1.5">/</span>
          <span className="text-heading">{LIGHTING_TOP.name}</span>
        </div>
      </div>

      <div className="container-x pt-8">
        <div className="section-title mb-2">
          <h1 className="text-2xl font-extrabold text-heading md:text-3xl">תאורה</h1>
        </div>
        <p className="mb-4 text-sm text-muted">
          {total.toLocaleString("he-IL")} גופי תאורה במגוון סגנונות — בחרו קטגוריה
        </p>

        <div className="mb-8 rounded-xl border border-brand-red/25 bg-[#fbf4f3] p-4 shadow-card sm:p-5">
          <p className="text-base font-extrabold text-brand-red sm:text-lg">
            תאורה — הכל תחת קורת גג אחת!
          </p>
          <ul className="mt-3 space-y-1.5 text-sm font-bold text-brand-red sm:text-[0.95rem]">
            {["יועץ תאורה", "התאמת גופי תאורה לפי דרישות הלקוח", "הובלה והתקנה"].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden className="mt-[0.1rem] leading-none text-brand-red">▪</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {lightingSubcats.map((c) => (
            <Link
              key={c.id}
              href={`/lighting/c/${c.id}/`}
              className="card-hover group flex flex-col items-center rounded-xl border bg-white p-4 text-center shadow-card"
            >
              <span className="grid h-28 w-full place-items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.thumb || "/images/placeholder.svg"}
                  alt={c.name}
                  loading="lazy"
                  className="max-h-28 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                />
              </span>
              <span className="mt-3 flex min-h-[2.6em] items-center justify-center text-[0.92rem] font-bold leading-tight text-heading group-hover:text-brand-red">
                {c.name}
              </span>
              <span className="mt-1 text-[0.74rem] text-muted">
                {c.count.toLocaleString("he-IL")} מוצרים
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
