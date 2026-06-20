import Link from "next/link";
import { lightingSubcats } from "@/lib/lighting";
import type { LightingShowcase as LightingShowcaseConfig } from "@/lib/types";
import FallbackImage from "@/components/FallbackImage";

export default function LightingShowcase({
  config,
}: {
  config: LightingShowcaseConfig;
}) {
  if (!config.enabled) return null;

  const ids = config.subcatIds?.length
    ? config.subcatIds
    : lightingSubcats.slice(0, 8).map((c) => c.id);
  const featured = ids
    .map((id) => lightingSubcats.find((c) => c.id === id))
    .filter((c): c is (typeof lightingSubcats)[number] => Boolean(c));

  if (featured.length === 0) return null;

  const total = lightingSubcats.reduce((sum, c) => sum + c.count, 0);

  return (
    <section className="container-x mt-14">
      <div className="overflow-hidden rounded-3xl border border-brand-gold/50 bg-[#fffaf0] shadow-card">
        <div className="flex flex-col gap-3 border-b border-brand-gold/40 bg-gradient-to-l from-brand-red/10 via-white to-brand-blue/10 px-4 py-5 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-blue">
              Lighting
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-brand-red md:text-3xl">
              {config.title || "✦ מחלקת התאורה"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {config.subtitle ||
                `${total.toLocaleString("he-IL")} גופי תאורה במגוון סגנונות — בחרו קטגוריה והמשיכו למוצרים`}
            </p>
          </div>
          <Link
            href="/lighting/"
            className="inline-flex w-fit items-center justify-center rounded-full border-2 border-brand-red bg-white px-5 py-2 text-sm font-extrabold text-brand-red transition hover:bg-brand-red hover:text-white"
          >
            לכל מוצרי התאורה
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 sm:p-4 lg:grid-cols-4">
          {featured.map((c) => (
            <Link
              key={c.id}
              href={`/lighting/c/${c.id}/`}
              className="card-hover group flex h-full flex-col items-center rounded-2xl border border-brand-gold/30 bg-white p-3 text-center shadow-sm"
            >
              <span className="grid h-28 w-full place-items-center rounded-xl bg-soft">
                <FallbackImage
                  src={c.thumb || "/images/placeholder.svg"}
                  alt={c.name}
                  loading="lazy"
                  className="max-h-24 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                />
              </span>
              <span className="mt-3 flex min-h-[2.6em] items-center justify-center text-[0.92rem] font-extrabold leading-tight text-heading group-hover:text-brand-red">
                {c.name}
              </span>
              <span className="mt-1 text-[0.74rem] font-semibold text-brand-blue">
                {c.count.toLocaleString("he-IL")} מוצרים
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
