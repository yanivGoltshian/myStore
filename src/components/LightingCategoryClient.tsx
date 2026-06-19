"use client";

import { useEffect, useMemo, useState } from "react";
import LightingCard from "@/components/LightingCard";
import type { LightingProduct } from "@/lib/lighting";

const PAGE_SIZE = 48;

export default function LightingCategoryClient({
  catId,
  total,
}: {
  catId: number;
  total: number;
}) {
  const [items, setItems] = useState<LightingProduct[] | null>(null);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    let alive = true;
    setItems(null);
    setError(false);
    setVisible(PAGE_SIZE);
    fetch(`/lighting/cat-${catId}.json`)
      .then((r) => {
        if (!r.ok) throw new Error("load");
        return r.json();
      })
      .then((data: LightingProduct[]) => {
        if (alive) setItems(data);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [catId]);

  const shown = useMemo(() => (items ? items.slice(0, visible) : []), [items, visible]);

  if (error) {
    return (
      <p className="container-x py-12 text-center text-sm text-muted">
        אירעה שגיאה בטעינת המוצרים. נסו לרענן את העמוד.
      </p>
    );
  }

  if (!items) {
    return (
      <div className="container-x grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-line sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse bg-white" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="container-x grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-line sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((p) => (
          <div key={p.id} className="bg-white">
            <LightingCard product={p} catId={catId} />
          </div>
        ))}
      </div>

      {visible < items.length && (
        <div className="container-x mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-md border-2 border-brand-red px-8 py-3 text-sm font-bold text-brand-red transition-colors hover:bg-brand-red hover:text-white"
          >
            הצגת מוצרים נוספים ({(items.length - visible).toLocaleString("he-IL")})
          </button>
        </div>
      )}

      <p className="container-x mt-6 text-center text-[0.72rem] text-muted">
        {Math.min(visible, items.length).toLocaleString("he-IL")} מתוך{" "}
        {total.toLocaleString("he-IL")} מוצרים
      </p>
    </>
  );
}
