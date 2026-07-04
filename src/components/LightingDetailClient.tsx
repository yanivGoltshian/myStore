"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import StickyBuyBar from "@/components/StickyBuyBar";
import WishlistButton from "@/components/WishlistButton";
import ShareBar from "@/components/ShareBar";
import siteData from "@/data/site.json";
import {
  LIGHTING_TOP,
  LIGHTING_ID_OFFSET,
  getLightingSubcat,
  formatLightingPrice,
} from "@/lib/lighting";
import type { LightingProduct } from "@/lib/lighting";

type IndexFile = { primary: Record<string, number> };

export default function LightingDetailClient() {
  const sp = useSearchParams();
  const id = Number(sp.get("id"));
  const cParam = sp.get("c");

  const [product, setProduct] = useState<LightingProduct | null>(null);
  const [catId, setCatId] = useState<number | null>(cParam ? Number(cParam) : null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    let alive = true;
    if (!id) {
      setStatus("missing");
      return;
    }
    setStatus("loading");

    async function resolveCat(): Promise<number | null> {
      if (cParam) return Number(cParam);
      try {
        const r = await fetch("/lighting/index.json");
        if (!r.ok) return null;
        const idx: IndexFile = await r.json();
        const c = idx.primary?.[String(id)];
        return typeof c === "number" ? c : null;
      } catch {
        return null;
      }
    }

    (async () => {
      const c = await resolveCat();
      if (!alive) return;
      if (c == null) {
        setStatus("missing");
        return;
      }
      setCatId(c);
      try {
        const r = await fetch(`/lighting/cat-${c}.json`);
        if (!r.ok) throw new Error("load");
        const list: LightingProduct[] = await r.json();
        const found = list.find((p) => p.id === id) ?? null;
        if (!alive) return;
        if (!found) {
          setStatus("missing");
          return;
        }
        setProduct(found);
        setStatus("ok");
      } catch {
        if (alive) setStatus("missing");
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, cParam]);

  if (status === "loading") {
    return (
      <div className="container-x grid gap-8 pt-8 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-xl border bg-soft" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-soft" />
          <div className="h-6 w-1/3 animate-pulse rounded bg-soft" />
          <div className="h-12 w-full animate-pulse rounded bg-soft" />
        </div>
      </div>
    );
  }

  if (status === "missing" || !product) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-xl font-bold text-heading">המוצר לא נמצא</h1>
        <Link
          href={LIGHTING_TOP.href}
          className="mt-4 inline-block rounded-md bg-brand-red px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-red-dark"
        >
          חזרה לתאורה
        </Link>
      </div>
    );
  }

  const cat = catId != null ? getLightingSubcat(catId) : undefined;

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
          {cat && (
            <>
              <span className="px-1.5">/</span>
              <Link href={`/lighting/c/${cat.id}/`} className="hover:text-brand-red">
                {cat.name}
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
            id="ld-fly-origin"
            src={product.image || "/images/placeholder.svg"}
            alt={product.name}
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src.endsWith("/images/placeholder.svg")) return;
              img.src = "/images/placeholder.svg";
            }}
            className="mx-auto aspect-square w-full max-w-md object-contain"
          />
        </div>

        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold text-heading md:text-3xl">{product.name}</h1>
          {product.model && <p className="mt-1 text-sm text-muted">דגם: {product.model}</p>}

          <div className="mt-4 flex items-end gap-3">
            {product.price > 0 ? (
              <>
                <span className="text-3xl font-extrabold text-brand-red">
                  {formatLightingPrice(product.price)}
                </span>
                <span className="pb-1 text-[0.72rem] text-muted">מחיר מומלץ לצרכן</span>
              </>
            ) : (
              <span className="text-xl font-bold text-brand-red">צרו קשר לפרטי מחיר</span>
            )}
          </div>

          <div id="main-buy-row" className="mt-6 flex gap-3">
            <AddToCartButton
              product={{
                id: LIGHTING_ID_OFFSET + product.id,
                name: product.name,
                model: product.model,
                price: product.price,
                image: product.image,
              }}
              phoneRaw={siteData.phoneRaw}
              originId="ld-fly-origin"
            />
            <a
              href={`tel:${siteData.phoneRaw}`}
              className="grid place-items-center rounded-md border-2 border-brand-red px-5 text-sm font-bold text-brand-red hover:bg-brand-red hover:text-white"
            >
              ☎ ייעוץ
            </a>
            <a
              href={`https://wa.me/${siteData.whatsapp}?text=${encodeURIComponent(
                `שלום, אשמח לייעוץ לגבי המוצר: ${product.name}${product.model ? ` (דגם ${product.model})` : ""}\n${siteData.deployUrl}/lighting/p?c=${catId ?? ""}&id=${product.id}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ייעוץ בוואטסאפ"
              className="grid place-items-center gap-1.5 rounded-md border-2 border-brand-red px-4 text-sm font-bold text-brand-red hover:bg-brand-red hover:text-white [grid-auto-flow:column]"
            >
              <svg viewBox="0 0 32 32" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M16.001 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.59 4.46 1.71 6.4L3.2 28.8l6.56-1.72a12.74 12.74 0 0 0 6.24 1.62h.01c7.06 0 12.8-5.74 12.8-12.8s-5.75-12.8-12.81-12.8zm0 23.04h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.89 1.02 1.04-3.79-.25-.39a10.62 10.62 0 0 1-1.63-5.66c0-5.87 4.78-10.65 10.65-10.65 2.85 0 5.52 1.11 7.53 3.12a10.58 10.58 0 0 1 3.12 7.53c0 5.87-4.78 10.65-10.64 10.65zm5.84-7.98c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.54-.71-.55-.18-.01-.4-.01-.61-.01-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.64s1.14 3.06 1.3 3.27c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.89-.77 2.16-1.52.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37z" />
              </svg>
              ייעוץ
            </a>
          </div>

          <div className="mt-3">
            <WishlistButton
              variant="chip"
              product={{
                id: LIGHTING_ID_OFFSET + product.id,
                name: product.name,
                model: product.model,
                price: product.price,
                image: product.image,
              }}
              className="w-full py-2.5"
            />
          </div>

          <div className="mt-5 border-t pt-5">
            <ShareBar
              shareUrl={`${siteData.deployUrl}/lighting/p?c=${catId ?? ""}&id=${product.id}`}
              message={
                `😍 מצאתי משהו מושלם ב${siteData.name}!\n` +
                `${product.name}${product.model ? ` (דגם ${product.model})` : ""}` +
                `${product.price > 0 ? ` — ${formatLightingPrice(product.price)}` : ""}\n` +
                `שווה הצצה 👈\n${siteData.deployUrl}/lighting/p?c=${catId ?? ""}&id=${product.id}`
              }
              instagramUrl={siteData.instagram}
              shareTitle={`${product.name} | ${siteData.name}`}
              label="שתפו את המוצר"
            />
          </div>

          <ul className="mt-6 space-y-2 border-t pt-5 text-[0.82rem] text-muted">
            <li>{product.inStock ? "✓ במלאי" : "⏳ בהזמנה מראש"}</li>
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

      {cat && (
        <div className="container-x pt-12">
          <Link
            href={`/lighting/c/${cat.id}/`}
            className="inline-flex items-center gap-1 text-sm font-bold text-brand-red hover:underline"
          >
            ← עוד מ{cat.name}
          </Link>
        </div>
      )}

      <StickyBuyBar
        product={{
          id: LIGHTING_ID_OFFSET + product.id,
          name: product.name,
          model: product.model,
          price: product.price,
          image: product.image,
        }}
        phoneRaw={siteData.phoneRaw}
        originId="ld-fly-origin"
      />
    </div>
  );
}
