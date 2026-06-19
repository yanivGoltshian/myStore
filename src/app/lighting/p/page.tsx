import type { Metadata } from "next";
import { Suspense } from "react";
import LightingDetailClient from "@/components/LightingDetailClient";
import { site } from "@/lib/data";

export const metadata: Metadata = {
  title: "פרטי מוצר | תאורה",
  description: "פרטי גוף תאורה — מחיר מומלץ לצרכן, מפרט ותמונה.",
  alternates: { canonical: "/lighting/p/" },
  robots: { index: false, follow: true },
  openGraph: {
    title: `תאורה | ${site.name}`,
    type: "website",
    url: `${site.url}/lighting/p/`,
  },
};

export default function LightingDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="container-x py-20 text-center text-sm text-muted">טוען…</div>
      }
    >
      <LightingDetailClient />
    </Suspense>
  );
}
