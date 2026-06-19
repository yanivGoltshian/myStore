import Link from "next/link";
import type { LightingProduct } from "@/lib/lighting";
import { formatLightingPrice } from "@/lib/lighting";

export default function LightingCard({
  product,
  catId,
}: {
  product: LightingProduct;
  catId: number;
}) {
  return (
    <Link
      href={`/lighting/p/?c=${catId}&id=${product.id}`}
      className="card-hover group flex h-full flex-col bg-white text-center"
    >
      <div className="relative overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image || "/images/placeholder.svg"}
          alt={product.name}
          loading="lazy"
          className="mx-auto aspect-square w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-2 pb-4 pt-2">
        <h3 className="clamp-2 min-h-[2.6em] text-[0.82rem] leading-snug text-muted group-hover:text-brand-red">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-center gap-2 pt-1">
          {product.price > 0 ? (
            <span className="text-lg font-extrabold text-brand-red">
              {formatLightingPrice(product.price)}
            </span>
          ) : (
            <span className="text-sm font-bold text-brand-red">לפרטים נוספים</span>
          )}
        </div>
      </div>
    </Link>
  );
}
