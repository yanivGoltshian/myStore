import type { Metadata } from "next";
import Link from "next/link";
import FaqSection from "@/components/FaqSection";
import { site } from "@/lib/data";

export const metadata: Metadata = {
  title: "שאלות נפוצות",
  description: `שאלות ותשובות נפוצות על ${site.name} — שעות פתיחה, אופן ההזמנה, אחריות יבואן, איסוף ומשלוח וייעוץ אישי לפני קנייה.`,
  alternates: { canonical: "/faq/" },
};

export default function FaqPage() {
  return (
    <div className="bg-soft pb-16">
      <div className="stars-bg text-white">
        <div className="container-x py-12 text-center">
          <h1 className="text-3xl font-extrabold md:text-4xl">שאלות נפוצות</h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/85">
            ריכזנו את התשובות לשאלות שאנחנו הכי נשאלים — לפני שמזמינים מ{site.name}.
          </p>
        </div>
      </div>

      <FaqSection />

      <div className="container-x mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-brand-red px-6 py-3 text-sm font-bold text-white hover:bg-brand-red-dark"
        >
          חזרה לחנות
        </Link>
        <Link
          href="/contact/"
          className="rounded-md border-2 border-brand-red px-6 py-3 text-sm font-bold text-brand-red hover:bg-brand-red hover:text-white"
        >
          צור קשר
        </Link>
      </div>
    </div>
  );
}
