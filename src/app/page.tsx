import Hero from "@/components/Hero";
import CategoryStrip from "@/components/CategoryStrip";
import PromoTiles from "@/components/PromoTiles";
import ValueProps from "@/components/ValueProps";
import ProductCarousel from "@/components/ProductCarousel";
import { homepage, getProductsByCategory, site } from "@/lib/data";

export default function Home() {
  return (
    <>
      <Hero />

      <CategoryStrip />
      <PromoTiles tiles={homepage.promoTiles} />
      <ValueProps />

      {homepage.sections.map((s) => {
        const products = getProductsByCategory(s.categoryId).slice(0, s.limit);
        if (products.length === 0) return null;
        return (
          <ProductCarousel
            key={s.id}
            title={s.title}
            icon={s.icon}
            link={`/category/${s.categoryId}/`}
            products={products}
          />
        );
      })}

      <section className="mt-14 stars-bg border-y-2 border-brand-gold text-white">
        <div className="container-x flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-5 text-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 shrink-0 text-brand-gold"
            aria-hidden
          >
            <path d="M12 3 5 5.6v4.9c0 4.1 2.9 7.5 7 8.9 4.1-1.4 7-4.8 7-8.9V5.6L12 3Z" />
            <path d="m9.2 11.6 1.9 1.9 3.6-3.8" />
          </svg>
          <p className="text-base font-extrabold tracking-wide md:text-lg">
            {site.name} – הבחירה החכמה לבית שלך
          </p>
          <span className="font-semibold text-brand-gold">מגוון · איכות · שירות</span>
        </div>
      </section>
    </>
  );
}
