"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

type IndexProduct = {
  id: number;
  name: string;
  model: string;
  price: number;
  regularPrice: number;
  salePrice: number;
  onSale: boolean;
  image: string;
  inStock: boolean;
  groupId: number;
  groupName: string;
  groupIcon: string;
};

type Area = { key: string; label: string; icon: string; cats: number[] };
type Budget = { key: string; label: string; icon: string; min: number; max: number };
type Pref = { key: string; label: string; icon: string };

const AREAS: Area[] = [
  { key: "kitchen", label: "מטבח ובישול", icon: "🍳", cats: [120, 754, 695, 377, 779] },
  { key: "summer", label: "קירור לקיץ", icon: "❄️", cats: [112] },
  { key: "winter", label: "חימום לחורף", icon: "🔥", cats: [15] },
  { key: "care", label: "טיפוח אישי", icon: "💆", cats: [140] },
  { key: "clean", label: "ניקיון הבית", icon: "🧹", cats: [136] },
  { key: "electric", label: "אביזרי חשמל", icon: "🔌", cats: [746] },
];

const BUDGETS: Budget[] = [
  { key: "u100", label: "עד ₪100", icon: "🪙", min: 0, max: 100 },
  { key: "m", label: "₪100–300", icon: "💵", min: 100, max: 300 },
  { key: "p300", label: "מעל ₪300", icon: "💳", min: 300, max: Infinity },
  { key: "any", label: "גמיש / הכל", icon: "🎯", min: 0, max: Infinity },
];

const PREFS: Pref[] = [
  { key: "deals", label: "הכי משתלם", icon: "💰" },
  { key: "new", label: "החדש ביותר", icon: "✨" },
  { key: "popular", label: "מבחר מומלץ", icon: "🔥" },
];

function toProduct(p: IndexProduct): Product {
  return {
    id: p.id,
    name: p.name,
    model: p.model,
    price: p.price,
    regularPrice: p.regularPrice ?? p.price,
    salePrice: p.salePrice ?? p.price,
    onSale: !!p.onSale,
    image: p.image,
    categoryIds: [p.groupId],
    inStock: p.inStock !== false,
    description: "",
  };
}

const RESULT_LIMIT = 12;

export default function FinderClient() {
  const [all, setAll] = useState<IndexProduct[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [step, setStep] = useState(0); // 0=area, 1=budget, 2=pref, 3=results
  const [area, setArea] = useState<Area | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [pref, setPref] = useState<Pref | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/search-index.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (alive) setAll(Array.isArray(data.products) ? data.products : []);
      })
      .catch(() => {
        if (alive) setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const result = useMemo(() => {
    if (!all || !area || !budget || !pref) return { list: [] as Product[], relaxed: false, total: 0 };
    const inArea = all.filter((p) => area.cats.includes(p.groupId) && p.price > 0);
    let scoped = inArea.filter((p) => p.price >= budget.min && p.price <= budget.max);
    let relaxed = false;
    if (scoped.length === 0) {
      scoped = inArea;
      relaxed = budget.key !== "any";
    }
    const sorted = [...scoped].sort((a, b) => {
      const stock = Number(b.inStock !== false) - Number(a.inStock !== false);
      if (stock !== 0) return stock;
      if (pref.key === "deals") {
        const sale = Number(b.onSale) - Number(a.onSale);
        if (sale !== 0) return sale;
        return a.price - b.price;
      }
      // new + popular → newest id first
      return b.id - a.id;
    });
    return { list: sorted.slice(0, RESULT_LIMIT).map(toProduct), relaxed, total: scoped.length };
  }, [all, area, budget, pref]);

  function restart() {
    setArea(null);
    setBudget(null);
    setPref(null);
    setStep(0);
  }

  const totalSteps = 3;

  return (
    <div className="container-x py-8">
      {/* header */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-3xl">🧭</span>
        <h1 className="mt-2 text-2xl font-extrabold text-heading md:text-3xl">
          מצאו את המוצר המושלם
        </h1>
        <p className="mt-2 text-sm text-muted md:text-base">
          כמה שאלות קצרות ונרכיב לכם המלצה אישית מתוך מאות מוצרים.
        </p>
      </div>

      {/* progress */}
      {step < 3 && (
        <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-brand-red" : "bg-black/10"
              }`}
            />
          ))}
        </div>
      )}

      <div className="mx-auto mt-8 max-w-3xl">
        {/* STEP 0 — area */}
        {step === 0 && (
          <Question title="מה מעניין אתכם עכשיו?">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {AREAS.map((a) => (
                <TileButton
                  key={a.key}
                  icon={a.icon}
                  label={a.label}
                  active={area?.key === a.key}
                  onClick={() => {
                    setArea(a);
                    setStep(1);
                  }}
                />
              ))}
            </div>
          </Question>
        )}

        {/* STEP 1 — budget */}
        {step === 1 && (
          <Question title="מה טווח התקציב?" onBack={() => setStep(0)}>
            <div className="grid grid-cols-2 gap-3">
              {BUDGETS.map((b) => (
                <TileButton
                  key={b.key}
                  icon={b.icon}
                  label={b.label}
                  active={budget?.key === b.key}
                  onClick={() => {
                    setBudget(b);
                    setStep(2);
                  }}
                />
              ))}
            </div>
          </Question>
        )}

        {/* STEP 2 — preference */}
        {step === 2 && (
          <Question title="מה הכי חשוב לכם?" onBack={() => setStep(1)}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PREFS.map((p) => (
                <TileButton
                  key={p.key}
                  icon={p.icon}
                  label={p.label}
                  active={pref?.key === p.key}
                  onClick={() => {
                    setPref(p);
                    setStep(3);
                  }}
                />
              ))}
            </div>
          </Question>
        )}

        {/* STEP 3 — results */}
        {step === 3 && (
          <div>
            {loadError ? (
              <p className="py-10 text-center text-sm text-muted">
                אירעה תקלה בטעינת המוצרים. נסו לרענן את העמוד.
              </p>
            ) : !all ? (
              <p className="py-10 text-center text-sm text-muted">טוען המלצות…</p>
            ) : result.list.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted">לא מצאנו התאמה מדויקת. ננסה שוב?</p>
                <button
                  onClick={restart}
                  className="mt-4 rounded-md bg-brand-red px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-red-dark"
                >
                  🔄 להתחיל מחדש
                </button>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-lg font-extrabold text-heading">
                    🎯 מצאנו {result.total} מוצרים בשבילכם
                  </p>
                  {result.relaxed && (
                    <p className="mt-1 text-xs text-muted">
                      הרחבנו מעט את טווח התקציב כדי להראות לכם את ההתאמות הקרובות ביותר.
                    </p>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {result.list.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  {area && (
                    <Link
                      href={`/category/${area.cats[0]}/`}
                      className="rounded-md border-2 border-brand-red px-5 py-2.5 text-sm font-bold text-brand-red hover:bg-brand-red hover:text-white"
                    >
                      לכל המוצרים ב{area.label} ←
                    </Link>
                  )}
                  <button
                    onClick={restart}
                    className="rounded-md bg-brand-red px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-red-dark"
                  >
                    🔄 התאמה חדשה
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Question({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="חזרה"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/10 text-muted hover:border-brand-red hover:text-brand-red"
          >
            →
          </button>
        )}
        <h2 className="text-center text-lg font-extrabold text-heading md:text-xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function TileButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[6rem] flex-col items-center justify-center gap-2 rounded-xl border bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-brand-red hover:shadow-md ${
        active ? "border-brand-red shadow-md ring-1 ring-brand-red" : "border-black/10"
      }`}
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-sm font-bold text-heading">{label}</span>
    </button>
  );
}
