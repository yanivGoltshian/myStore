import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LightingCategoryClient from "@/components/LightingCategoryClient";
import { lightingSubcats, getLightingSubcat, LIGHTING_TOP } from "@/lib/lighting";
import { site } from "@/lib/data";

export function generateStaticParams() {
  return lightingSubcats.map((c) => ({ cat: String(c.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cat: string }>;
}): Promise<Metadata> {
  const cat = getLightingSubcat(Number((await params).cat));
  if (!cat) return { title: "קטגוריה לא נמצאה" };
  const desc = `${cat.name} — ${cat.count.toLocaleString("he-IL")} גופי תאורה במחיר מומלץ לצרכן ב${site.name}.`;
  return {
    title: `${cat.name} | תאורה`,
    description: desc,
    alternates: { canonical: `/lighting/c/${cat.id}/` },
    openGraph: {
      title: `${cat.name} | תאורה | ${site.name}`,
      description: desc,
      type: "website",
      url: `${site.url}/lighting/c/${cat.id}/`,
      images: [{ url: cat.thumb, alt: cat.name }],
    },
  };
}

export default async function LightingCategoryPage({
  params,
}: {
  params: Promise<{ cat: string }>;
}) {
  const id = Number((await params).cat);
  const cat = getLightingSubcat(id);
  if (!cat) notFound();

  return (
    <div className="pb-16">
      <div className="bg-soft">
        <div className="container-x py-3 text-[0.72rem] text-muted">
          <Link href="/" className="hover:text-brand-red">
            דף הבית
          </Link>
          <span className="px-1.5">/</span>
          <Link href={LIGHTING_TOP.href} className="hover:text-brand-red">
            {LIGHTING_TOP.name}
          </Link>
          <span className="px-1.5">/</span>
          <span className="text-heading">{cat.name}</span>
        </div>
      </div>

      <div className="container-x pb-6 pt-8">
        <div className="section-title mb-2">
          <h1 className="text-2xl font-extrabold text-heading md:text-3xl">{cat.name}</h1>
        </div>
        <p className="text-sm text-muted">
          {cat.count.toLocaleString("he-IL")} מוצרים · מחיר מומלץ לצרכן
        </p>
      </div>

      <LightingCategoryClient catId={cat.id} total={cat.count} />

      <nav className="container-x mt-12 border-t pt-6">
        <h2 className="mb-3 text-sm font-bold text-heading">קטגוריות תאורה נוספות</h2>
        <div className="flex flex-wrap gap-2">
          {lightingSubcats
            .filter((c) => c.id !== cat.id)
            .map((c) => (
              <Link
                key={c.id}
                href={`/lighting/c/${c.id}/`}
                className="rounded-full border bg-white px-3 py-1.5 text-[0.78rem] text-muted hover:border-brand-red hover:text-brand-red"
              >
                {c.name}
              </Link>
            ))}
        </div>
      </nav>
    </div>
  );
}
