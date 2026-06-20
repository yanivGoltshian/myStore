"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Product, Category } from "@/lib/types";
import { apiGet, apiSend, uploadImage, formatPrice, type ProductList } from "./lib";
import { Field, TextArea, Toggle, Button } from "./ui";

type Draft = {
  id?: number;
  name: string;
  model: string;
  regularPrice: string;
  salePrice: string;
  onSale: boolean;
  inStock: boolean;
  categoryIds: number[];
  description: string;
  image: string;
};

function emptyDraft(): Draft {
  return {
    name: "",
    model: "",
    regularPrice: "",
    salePrice: "",
    onSale: false,
    inStock: true,
    categoryIds: [],
    description: "",
    image: "",
  };
}

function toDraft(p: Product): Draft {
  return {
    id: p.id,
    name: p.name,
    model: p.model,
    regularPrice: String(p.regularPrice || p.price || 0),
    salePrice: String(p.salePrice || p.price || 0),
    onSale: !!p.onSale,
    inStock: p.inStock !== false,
    categoryIds: Array.isArray(p.categoryIds) ? p.categoryIds : [],
    description: p.description || "",
    image: p.image || "",
  };
}

export default function ProductsTab({
  onToast,
}: {
  onToast: (msg: string, ok: boolean) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [catFilter, setCatFilter] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const list = await apiGet<ProductList>("/api/products");
      setProducts(list.products);
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    apiGet<Category[]>("/api/categories").then(setCats).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const catName = useMemo(() => {
    const m = new Map<number, string>();
    cats.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [cats]);

  // ----- main-site style autocomplete (grouped by category) -----
  const [open, setOpen] = useState(false);
  const [lineFilter, setLineFilter] = useState<{ id: number; name: string } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const catById = useMemo(() => new Map(cats.map((c) => [c.id, c])), [cats]);
  const childrenOf = useMemo(() => {
    const m = new Map<number, number[]>();
    cats.forEach((c) => {
      if (c.parent) {
        const a = m.get(c.parent) || [];
        a.push(c.id);
        m.set(c.parent, a);
      }
    });
    return m;
  }, [cats]);

  const descendantsOf = useCallback(
    (id: number): number[] => {
      const out = [id];
      const stack = [id];
      while (stack.length) {
        const cur = stack.pop() as number;
        for (const k of childrenOf.get(cur) || []) {
          out.push(k);
          stack.push(k);
        }
      }
      return out;
    },
    [childrenOf]
  );

  const topOf = useCallback(
    (id: number): Category | undefined => {
      let c = catById.get(id);
      let guard = 0;
      while (c && c.parent && guard++ < 20) c = catById.get(c.parent);
      return c;
    },
    [catById]
  );

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // category "lines" matching the query
  const suggestCats = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return cats.filter((c) => c.name.includes(q)).slice(0, 6);
  }, [cats, query]);

  // products matching the query, grouped by their top-level category
  const suggestGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as { id: number; name: string; icon: string; items: Product[] }[];
    const matched = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.model || "").toLowerCase().includes(q) ||
          String(p.id).includes(q)
      )
      .slice(0, 60);
    const groups = new Map<number, { id: number; name: string; icon: string; items: Product[] }>();
    for (const p of matched) {
      const top = topOf(p.categoryIds?.[0] ?? 0);
      const gid = top?.id ?? 0;
      let g = groups.get(gid);
      if (!g) {
        g = { id: gid, name: top?.name ?? "ללא קטגוריה", icon: top?.icon ?? "📦", items: [] };
        groups.set(gid, g);
      }
      if (g.items.length < 4) g.items.push(p);
    }
    let total = 0;
    const out: { id: number; name: string; icon: string; items: Product[] }[] = [];
    for (const g of groups.values()) {
      if (total >= 16) break;
      out.push(g);
      total += g.items.length;
    }
    return out;
  }, [products, query, topOf]);

  const hasSuggestions = suggestCats.length > 0 || suggestGroups.length > 0;

  function pickLine(c: Category) {
    setLineFilter({ id: c.id, name: c.name });
    setQuery("");
    setOpen(false);
  }

  const filtered = useMemo(() => {
    if (lineFilter) {
      const set = new Set(descendantsOf(lineFilter.id));
      return products.filter(
        (p) => Array.isArray(p.categoryIds) && p.categoryIds.some((c) => set.has(c))
      );
    }
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        String(p.model || "").toLowerCase().includes(q) ||
        String(p.id).includes(q)
    );
  }, [products, query, lineFilter, descendantsOf]);

  const shown = filtered.slice(0, 120);

  function openNew() {
    setDraft(emptyDraft());
    setFile(null);
    setPreview("");
  }
  function openEdit(p: Product) {
    setDraft(toDraft(p));
    setFile(null);
    setPreview("");
  }
  function close() {
    setDraft(null);
    setFile(null);
    setPreview("");
  }

  function pickFile(f: File | undefined) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function toggleCat(id: number) {
    setDraft((d) =>
      d
        ? {
            ...d,
            categoryIds: d.categoryIds.includes(id)
              ? d.categoryIds.filter((c) => c !== id)
              : [...d.categoryIds, id],
          }
        : d
    );
  }

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      onToast("יש להזין שם מוצר", false);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: draft.name,
        model: draft.model,
        regularPrice: Number(draft.regularPrice) || 0,
        salePrice: Number(draft.salePrice) || 0,
        onSale: draft.onSale,
        inStock: draft.inStock,
        categoryIds: draft.categoryIds,
        description: draft.description,
        image: draft.image,
      };

      let id = draft.id;
      if (!id) {
        const created = await apiSend<Product>("/api/products", "POST", payload);
        id = created.id;
      }
      // upload image now that we have an id
      if (file && id) {
        const path = await uploadImage("product", file, { id });
        payload.image = path;
      }
      await apiSend(`/api/products/${id}`, "PUT", { ...payload, id });

      onToast("המוצר נשמר — האתר יתעדכן בעוד דקה־שתיים", true);
      close();
      await load();
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Product) {
    if (!confirm(`למחוק את "${p.name}"? פעולה זו אינה הפיכה.`)) return;
    try {
      await apiSend(`/api/products/${p.id}`, "DELETE", {});
      onToast("המוצר נמחק", true);
      setProducts((list) => list.filter((x) => x.id !== p.id));
    } catch (e) {
      onToast((e as Error).message, false);
    }
  }

  const filteredCats = catFilter.trim()
    ? cats.filter((c) => c.name.includes(catFilter.trim()))
    : cats;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div ref={searchRef} className="relative">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                if (lineFilter) setLineFilter(null);
              }}
              onFocus={() => setOpen(true)}
              placeholder="חיפוש מוצר או קו מוצרים…"
              className="w-80 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-red-500"
            />
            {open && query.trim() && hasSuggestions ? (
              <div className="absolute z-50 mt-1 max-h-96 w-[26rem] overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-2xl">
                {suggestCats.length ? (
                  <div className="mb-1">
                    <p className="px-2 pb-1 pt-1 text-[0.7rem] font-bold text-gray-400">
                      קווי מוצרים
                    </p>
                    {suggestCats.map((c) => (
                      <button
                        key={`cat-${c.id}`}
                        onClick={() => pickLine(c)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-right text-sm hover:bg-red-50"
                      >
                        <span className="text-base">{c.icon || "📦"}</span>
                        <span className="font-semibold text-gray-700">{c.name}</span>
                        {c.count ? (
                          <span className="mr-auto text-xs text-gray-400">{c.count} מוצרים</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}
                {suggestGroups.map((g) => (
                  <div key={`grp-${g.id}`} className="mb-1">
                    <p className="flex items-center gap-1 px-2 pb-1 pt-1 text-[0.7rem] font-bold text-gray-400">
                      <span>{g.icon}</span>
                      {g.name}
                    </p>
                    {g.items.map((p) => (
                      <button
                        key={`p-${p.id}`}
                        onClick={() => {
                          openEdit(p);
                          setOpen(false);
                          setQuery("");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-right text-sm hover:bg-gray-50"
                      >
                        <span className="h-8 w-8 shrink-0 overflow-hidden rounded border border-gray-100 bg-gray-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt="" loading="lazy" className="h-full w-full object-contain" />
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-1 text-gray-800">{p.name}</span>
                          {p.model ? (
                            <span className="text-xs text-gray-400" dir="ltr">
                              {p.model}
                            </span>
                          ) : null}
                        </span>
                        <span className="mr-auto shrink-0 font-bold text-gray-700">
                          {formatPrice(p.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          {lineFilter ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">
              קו מוצרים: {lineFilter.name}
              <button
                onClick={() => setLineFilter(null)}
                className="text-red-400 hover:text-red-700"
                aria-label="ניקוי סינון"
              >
                ×
              </button>
            </span>
          ) : null}
          <span className="text-sm text-gray-500">
            {filtered.length} מתוך {products.length}
          </span>
        </div>
        <Button onClick={openNew}>+ מוצר חדש</Button>
      </div>

      {loading ? (
        <p className="p-8 text-gray-500">טוען מוצרים…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="p-3 font-semibold">תמונה</th>
                <th className="p-3 font-semibold">שם</th>
                <th className="p-3 font-semibold">דגם</th>
                <th className="p-3 font-semibold">מחיר</th>
                <th className="p-3 font-semibold">מלאי</th>
                <th className="p-3 font-semibold">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr
                  key={p.id}
                  className="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
                  onClick={() => openEdit(p)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openEdit(p);
                    }
                  }}
                  title="לחצו לעריכת המוצר"
                >
                  <td className="p-2">
                    <div className="h-12 w-12 overflow-hidden rounded border border-gray-200 bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt="" loading="lazy" className="h-full w-full object-contain" />
                    </div>
                  </td>
                  <td className="max-w-xs p-3">
                    <span className="line-clamp-2 font-semibold text-gray-800">{p.name}</span>
                    <span className="text-xs text-gray-400">#{p.id}</span>
                  </td>
                  <td className="p-3 text-gray-500" dir="ltr">{p.model || "—"}</td>
                  <td className="p-3">
                    <span className="font-bold text-gray-800">{formatPrice(p.price)}</span>
                    {p.onSale ? <span className="mr-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-700">מבצע</span> : null}
                  </td>
                  <td className="p-3">
                    {p.inStock ? (
                      <span className="text-emerald-600">במלאי</span>
                    ) : (
                      <span className="text-gray-400">אזל</span>
                    )}
                  </td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => openEdit(p)}>עריכה</Button>
                      <Button variant="danger" onClick={() => remove(p)}>מחיקה</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > shown.length ? (
            <p className="p-3 text-center text-xs text-gray-400">
              מציג {shown.length} ראשונים — צמצמו בחיפוש כדי לראות עוד
            </p>
          ) : null}
        </div>
      )}

      {draft ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-6 w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-extrabold text-gray-800">
              {draft.id ? `עריכת מוצר #${draft.id}` : "מוצר חדש"}
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  {preview || draft.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview || draft.image} alt="" className="h-full w-full object-contain" />
                  ) : null}
                </div>
                <div>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
                  <Button variant="ghost" onClick={() => fileRef.current?.click()}>בחירת תמונה</Button>
                  <p className="mt-1 text-xs text-gray-400">התמונה תועלה בעת השמירה</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="שם המוצר" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
                <Field label="דגם / מק״ט" value={draft.model} onChange={(v) => setDraft({ ...draft, model: v })} dir="ltr" />
                <Field label="מחיר רגיל (₪)" type="number" value={draft.regularPrice} onChange={(v) => setDraft({ ...draft, regularPrice: v })} />
                <div className="flex items-end gap-4">
                  <Toggle label="במבצע" checked={draft.onSale} onChange={(v) => setDraft({ ...draft, onSale: v })} />
                  <Toggle label="במלאי" checked={draft.inStock} onChange={(v) => setDraft({ ...draft, inStock: v })} />
                </div>
                {draft.onSale ? (
                  <Field label="מחיר מבצע (₪)" type="number" value={draft.salePrice} onChange={(v) => setDraft({ ...draft, salePrice: v })} />
                ) : null}
              </div>

              <div>
                <span className="mb-1 block text-sm font-semibold text-gray-700">קטגוריות</span>
                {draft.categoryIds.length ? (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {draft.categoryIds.map((id) => (
                      <span key={id} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                        {catName.get(id) || `#${id}`}
                        <button onClick={() => toggleCat(id)} className="text-red-400 hover:text-red-700">×</button>
                      </span>
                    ))}
                  </div>
                ) : null}
                <input
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                  placeholder="סינון קטגוריות…"
                  className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-red-500"
                />
                <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 p-2">
                  {filteredCats.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-gray-50">
                      <input type="checkbox" checked={draft.categoryIds.includes(c.id)} onChange={() => toggleCat(c.id)} className="accent-red-600" />
                      <span className="text-gray-700">{c.name}</span>
                      <span className="text-xs text-gray-300">#{c.id}</span>
                    </label>
                  ))}
                </div>
              </div>

              <TextArea label="תיאור" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} rows={4} />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={close}>ביטול</Button>
              <Button onClick={save} disabled={saving}>{saving ? "שומר…" : "שמירה"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
