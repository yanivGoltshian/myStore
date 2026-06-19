"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
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
            src={product.image || "/images/placeholder.svg"}
            alt={product.name}
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

          <div className="mt-6 flex gap-3">
            <AddToCartButton
              product={{
                id: LIGHTING_ID_OFFSET + product.id,
                name: product.name,
                model: product.model,
                price: product.price,
                image: product.image,
              }}
              phoneRaw={siteData.phoneRaw}
            />
            <a
              href={`tel:${siteData.phoneRaw}`}
              className="grid place-items-center rounded-md border-2 border-brand-red px-5 text-sm font-bold text-brand-red hover:bg-brand-red hover:text-white"
            >
              ☎ ייעוץ
            </a>
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
    </div>
  );
}
