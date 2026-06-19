import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCarousel from "@/components/ProductCarousel";
import AddToCartButton from "@/components/AddToCartButton";
import { products, site, getProduct, getCategory, getProductsByCategory, formatPrice } from "@/lib/data";

export function generateStaticParams() {
  return products.map((p) => ({ id: String(p.id) }));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = Number((await params).id);
  const product = getProduct(id);
  if (!product) return { title: "מוצר לא נמצא" };
  const desc =
    stripHtml(product.description).slice(0, 160) ||
    `${product.name}${product.model ? ` · דגם ${product.model}` : ""} — לרכישה ב${site.name}.`;
  return {
    title: product.name,
    description: desc,
    alternates: { canonical: `/product/${id}/` },
    openGraph: {
      title: `${product.name} | ${site.name}`,
      description: desc,
      type: "website",
      url: `${site.url}/product/${id}/`,
      images: [{ url: product.image, alt: product.name }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  const product = getProduct(id);
  if (!product) notFound();

  const primaryCat = product.categoryIds.map(getCategory).find(Boolean);
  const related = primaryCat
    ? getProductsByCategory(primaryCat.id).filter((p) => p.id !== product.id).slice(0, 12)
    : [];
  const showSale = product.onSale && product.regularPrice > product.price;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [`${site.url}${product.image}`],
    description: stripHtml(product.description).slice(0, 300) || product.name,
    sku: String(product.id),
    ...(product.model ? { mpn: product.model } : {}),
    ...(product.price > 0
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "ILS",
            price: product.price,
            availability: product.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            url: `${site.url}/product/${product.id}/`,
            seller: { "@type": "Organization", name: site.name },
          },
        }
      : {}),
  };

  return (
    <div className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <div className="bg-soft">
        <div className="container-x py-3 text-[0.72rem] text-muted">
          <Link href="/" className="hover:text-brand-red">דף הבית</Link>
          {primaryCat && (
            <>
              <span className="px-1.5">/</span>
              <Link href={`/category/${primaryCat.id}/`} className="hover:text-brand-red">
                {primaryCat.name}
              </Link>
            </>
          )}
          <span className="px-1.5">/</span>
          <span className="text-heading">{product.name}</span>
        </div>
      </div>

      <div className="container-x grid gap-8 pt-8 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image || "/images/placeholder.svg"}
            alt={product.name}
            className="mx-auto aspect-square w-full max-w-md object-contain"
          />
        </div>

        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold text-heading md:text-3xl">{product.name}</h1>
          {product.model && (
            <p className="mt-1 text-sm text-muted">דגם: {product.model}</p>
          )}

          <div className="mt-4 flex items-end gap-3">
            {product.price > 0 ? (
              <>
                <span className="text-3xl font-extrabold text-brand-red">{formatPrice(product.price)}</span>
                {showSale && (
                  <span className="pb-1 text-lg text-muted line-through">{formatPrice(product.regularPrice)}</span>
                )}
              </>
            ) : (
              <span className="text-xl font-bold text-brand-red">צרו קשר לפרטי מחיר</span>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                model: product.model,
                price: product.price,
                image: product.image,
              }}
              phoneRaw={site.phoneRaw}
            />
            <a
              href={`tel:${site.phoneRaw}`}
              className="grid place-items-center rounded-md border-2 border-brand-red px-5 text-sm font-bold text-brand-red hover:bg-brand-red hover:text-white"
            >
              ☎ ייעוץ
            </a>
          </div>

          <ul className="mt-6 space-y-2 border-t pt-5 text-[0.82rem] text-muted">
            <li>🛡️ אחריות יבואן רשמי</li>
          </ul>
        </div>
      </div>

      {product.description && (
        <div className="container-x pt-12">
          <div className="section-title mb-5">
            <h2 className="text-xl font-extrabold text-brand-red">תיאור המוצר</h2>
          </div>
          <div
            className="prose-rtl max-w-none text-[0.9rem] leading-relaxed text-ink"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      {related.length > 0 && (
        <ProductCarousel
          title="מוצרים נוספים"
          icon="🛍️"
          link={primaryCat ? `/category/${primaryCat.id}/` : "/"}
          products={related}
        />
      )}
    </div>
  );
}
