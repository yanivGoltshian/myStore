"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Product, Category } from "@/lib/types";
import {
  apiGet,
  apiSend,
  uploadImage,
  adminPreviewSrc,
  formatPrice,
  type ProductList,
  type LightingAdminProduct,
  type LightingList,
} from "./lib";
import { Field, RichTextArea, Toggle, Button, Card, SectionCard } from "./ui";
import FallbackImage from "@/components/FallbackImage";

const LIGHTING_TOP_ID = 9000;
const LIGHTING_CATEGORY_OFFSET = 9000;
const LIGHTING_PAGE_SIZE = 60;
const STORE_PAGE_SIZE = 120;

type ProductSource = "store" | "lighting";
type AdminCategory = Category;
type CatalogProduct = Product & { source: ProductSource; lightingSubId?: number };

type Draft = {
  id?: number;
  source: ProductSource;
  name: string;
  model: string;
  regularPrice: string;
  salePrice: string;
  onSale: boolean;
  inStock: boolean;
  categoryIds: number[];
  lightingSubId: number;
  description: string;
  image: string;
};

function isLightingCategory(c: AdminCategory | undefined): boolean {
  return !!c && (c.id === LIGHTING_TOP_ID || c.parent === LIGHTING_TOP_ID);
}

function lightingSubId(c: AdminCategory | undefined): number {
  if (!c || c.id === LIGHTING_TOP_ID) return 0;
  return Number(c.parent === LIGHTING_TOP_ID ? c.id - LIGHTING_CATEGORY_OFFSET : 0);
}

function emptyDraft(source: ProductSource, subId = 0): Draft {
  return {
    source,
    name: "",
    model: "",
    regularPrice: "",
    salePrice: "",
    onSale: false,
    inStock: true,
    categoryIds: [],
    lightingSubId: subId,
    description: "",
    image: "",
  };
}

function toCatalogProduct(p: Product): CatalogProduct {
  return { ...p, source: "store" };
}

function toLightingProduct(p: LightingAdminProduct): CatalogProduct {
  return {
    id: p.id,
    name: p.name || "",
    model: p.model || "",
    price: p.price || 0,
    regularPrice: p.price || 0,
    salePrice: p.price || 0,
    onSale: false,
    image: p.image || "",
    categoryIds: [LIGHTING_TOP_ID, p.subId ? LIGHTING_CATEGORY_OFFSET + p.subId : LIGHTING_TOP_ID],
    inStock: p.inStock !== false,
    description: p.description || "",
    source: "lighting",
    lightingSubId: Number(p.subId || 0),
  };
}

function toDraft(p: CatalogProduct): Draft {
  return {
    id: p.id,
    source: p.source,
    name: p.name,
    model: p.model,
    regularPrice: String(p.regularPrice || p.price || 0),
    salePrice: String(p.salePrice || p.price || 0),
    onSale: p.source === "store" && !!p.onSale,
    inStock: p.inStock !== false,
    categoryIds: Array.isArray(p.categoryIds) ? p.categoryIds : [],
    lightingSubId: Number(p.lightingSubId || 0),
    description: p.description || "",
    image: p.image || "",
  };
}

export default function ProductsTab({
  onToast,
}: {
  onToast: (msg: string, ok: boolean) => void;
}) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [catFilter, setCatFilter] = useState("");
  const [page, setPage] = useState(1);
  const [serverCount, setServerCount] = useState(0);
  const [storeLimit, setStoreLimit] = useState(STORE_PAGE_SIZE);
  const [open, setOpen] = useState(false);
  const [lineFilter, setLineFilter] = useState<{ id: number; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const modalPushedRef = useRef(false);

  const catById = useMemo(() => new Map(cats.map((c) => [c.id, c])), [cats]);
  const selectedCat = useMemo(
    () => (lineFilter ? catById.get(lineFilter.id) : undefined),
    [catById, lineFilter]
  );
  const lightingMode = isLightingCategory(selectedCat);
  const selectedLightingSub = lightingSubId(selectedCat);

  async function loadCategories() {
    try {
      setCats(await apiGet<AdminCategory[]>("/api/categories"));
    } catch {
      /* products can still be edited without category metadata */
    }
  }

  const loadStore = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const list = await apiGet<ProductList>("/api/products");
      setProducts(list.products.map(toCatalogProduct));
      setServerCount(list.count);
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [onToast]);

  const loadLighting = useCallback(
    async (subId: number, q: string, nextPage: number, silent = false) => {
      if (!silent) setLoading(true);
      try {
        const params = new URLSearchParams({
          sub: String(subId),
          q,
          page: String(nextPage),
          pageSize: String(LIGHTING_PAGE_SIZE),
        });
        const list = await apiGet<LightingList>(`/api/lighting/products?${params}`);
        setProducts(list.products.map(toLightingProduct));
        setServerCount(list.count);
      } catch (e) {
        onToast((e as Error).message, false);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [onToast]
  );

  useEffect(() => {
    loadCategories();
    loadStore();
  }, [loadStore]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
      setStoreLimit(STORE_PAGE_SIZE);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (lightingMode) void loadLighting(selectedLightingSub, debouncedQuery, page);
  }, [lightingMode, selectedLightingSub, debouncedQuery, page, loadLighting]);

  useEffect(() => {
    if (!lightingMode) void loadStore();
  }, [lightingMode, loadStore]);

  const catName = useMemo(() => {
    const m = new Map<number, string>();
    cats.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [cats]);

  // ----- main-site style autocomplete (grouped by category) -----
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
    (id: number): AdminCategory | undefined => {
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

  const suggestCats = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return cats.filter((c) => c.name.includes(q)).slice(0, 6);
  }, [cats, query]);

  const suggestGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as { id: number; name: string; icon: string; items: CatalogProduct[] }[];
    const matched = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.model || "").toLowerCase().includes(q) ||
          String(p.id).includes(q)
      )
      .slice(0, 60);
    const groups = new Map<number, { id: number; name: string; icon: string; items: CatalogProduct[] }>();
    for (const p of matched) {
      const top = p.source === "lighting" ? catById.get(LIGHTING_TOP_ID) : topOf(p.categoryIds?.[0] ?? 0);
      const gid = top?.id ?? 0;
      let g = groups.get(gid);
      if (!g) {
        g = { id: gid, name: top?.name ?? "ללא קטגוריה", icon: top?.icon ?? "📦", items: [] };
        groups.set(gid, g);
      }
      if (g.items.length < 4) g.items.push(p);
    }
    let total = 0;
    const out: { id: number; name: string; icon: string; items: CatalogProduct[] }[] = [];
    for (const g of groups.values()) {
      if (total >= 16) break;
      out.push(g);
      total += g.items.length;
    }
    return out;
  }, [products, query, topOf, catById]);

  const hasSuggestions = suggestCats.length > 0 || suggestGroups.length > 0;

  function pickLine(c: AdminCategory) {
    setLineFilter({ id: c.id, name: c.name });
    setQuery("");
    setOpen(false);
    setPage(1);
    setStoreLimit(STORE_PAGE_SIZE);
  }

  const filtered = useMemo(() => {
    if (lightingMode) return products;
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
  }, [products, query, lineFilter, descendantsOf, lightingMode]);

  const totalPages = lightingMode
    ? Math.max(1, Math.ceil(serverCount / LIGHTING_PAGE_SIZE))
    : 1;
  const shown = lightingMode ? filtered : filtered.slice(0, storeLimit);
  const hasMore = !lightingMode && storeLimit < filtered.length;

  // Infinite scroll for the store list. Every store product is already loaded in
  // memory, so as the sentinel below the grid nears the viewport we reveal the
  // next chunk. The generous rootMargin loads rows ahead of the user, so the
  // scroll stays smooth with no stops. `storeLimit` resets only on an explicit
  // filter or search change; a silent save/reload never touches it, so the
  // post-save scroll-preservation fix (commit 5d4d583) stays intact.
  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStoreLimit((n) => Math.min(n + STORE_PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "1000px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, filtered.length]);

  const tops = useMemo(
    () => cats.filter((c) => !c.parent).sort((a, b) => a.name.localeCompare(b.name, "he")),
    [cats]
  );
  const activeTop = lineFilter ? topOf(lineFilter.id) : null;
  const subsOfActive = useMemo(() => {
    if (!activeTop) return [] as AdminCategory[];
    return (childrenOf.get(activeTop.id) || [])
      .map((id) => catById.get(id))
      .filter((c): c is AdminCategory => !!c);
  }, [activeTop, childrenOf, catById]);

  const lightingSubcats = useMemo(
    () => cats.filter((c) => c.parent === LIGHTING_TOP_ID).sort((a, b) => a.name.localeCompare(b.name, "he")),
    [cats]
  );

  function currentSource(): ProductSource {
    return lightingMode ? "lighting" : "store";
  }

  function openNew() {
    setDraft(emptyDraft(currentSource(), lightingMode ? selectedLightingSub : 0));
    setFile(null);
    setPreview("");
  }
  function openEdit(p: CatalogProduct) {
    setDraft(toDraft(p));
    setFile(null);
    setPreview("");
  }
  function close() {
    setDraft(null);
    setFile(null);
    setPreview("");
    // If opening the editor pushed a history entry (so the phone/browser Back
    // button closes it instead of leaving /admin), consume that entry now.
    if (modalPushedRef.current) {
      modalPushedRef.current = false;
      window.history.back();
    }
  }

  // Mobile Back button (Android nav / browser back) should close the open
  // product editor, same as the ✕ / ביטול buttons, instead of exiting /admin.
  const editorOpen = draft !== null;
  useEffect(() => {
    if (!editorOpen) return;
    window.history.pushState({ adminModal: "product-editor" }, "");
    modalPushedRef.current = true;
    const onPop = () => {
      modalPushedRef.current = false;
      close();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // close is a stable function declaration; depend only on the open-state so
    // editor keystrokes (setDraft) never push a new history entry.
  }, [editorOpen]);

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

  async function reloadCurrent() {
    await loadCategories();
    if (lightingMode) await loadLighting(selectedLightingSub, debouncedQuery, page, true);
    else await loadStore(true);
  }

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      onToast("יש להזין שם מוצר", false);
      return;
    }
    if (draft.source === "lighting" && !draft.lightingSubId) {
      onToast("יש לבחור תת־קטגוריית תאורה", false);
      return;
    }
    setSaving(true);
    try {
      if (draft.source === "lighting") {
        const payload = {
          name: draft.name,
          model: draft.model,
          price: Number(draft.regularPrice) || 0,
          inStock: draft.inStock,
          description: draft.description,
          image: draft.image,
          subId: draft.lightingSubId,
        };
        let id = draft.id;
        if (!id) {
          const created = await apiSend<LightingAdminProduct>("/api/lighting/products", "POST", payload);
          id = created.id;
        }
        if (file && id) {
          payload.image = await uploadImage("lighting", file, { id });
        }
        await apiSend(`/api/lighting/products/${id}`, "PUT", { ...payload, id });
      } else {
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
        if (file && id) {
          payload.image = await uploadImage("product", file, { id });
        }
        await apiSend(`/api/products/${id}`, "PUT", { ...payload, id });
      }

      onToast("המוצר נשמר — האתר יתעדכן בעוד דקה־שתיים", true);
      close();
      await reloadCurrent();
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: CatalogProduct) {
    if (!confirm(`למחוק את "${p.name}"? פעולה זו אינה הפיכה.`)) return;
    try {
      const path = p.source === "lighting" ? `/api/lighting/products/${p.id}` : `/api/products/${p.id}`;
      await apiSend(path, "DELETE", {});
      onToast("המוצר נמחק", true);
      setProducts((list) => list.filter((x) => x.id !== p.id));
    } catch (e) {
      onToast((e as Error).message, false);
    }
  }

  const filteredCats = (catFilter.trim()
    ? cats.filter((c) => c.name.includes(catFilter.trim()))
    : cats
  ).filter((c) => !isLightingCategory(c));

  const countText = lightingMode
    ? `${serverCount.toLocaleString("he-IL")} מוצרים${selectedCat ? ` ב${selectedCat.name}` : ""}`
    : `${filtered.length} מתוך ${products.length} מוצרים`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-heading sm:text-lg">ניהול מוצרים</h2>
          <p className="text-xs text-muted">{countText}</p>
        </div>
        <Button onClick={openNew}>{lightingMode ? "+ פריט תאורה" : "+ מוצר חדש"}</Button>
      </div>

      <div ref={searchRef} className="relative">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (lineFilter && !lightingMode) setLineFilter(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder="🔍 חיפוש מוצר, דגם או קו מוצרים…"
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base shadow-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-red-100 sm:py-2.5 sm:text-sm"
        />
        {open && query.trim() && hasSuggestions ? (
          <div className="absolute z-50 mt-1 max-h-96 w-full overflow-y-auto rounded-xl border border-line bg-white p-2 shadow-pop">
            {suggestCats.length ? (
              <div className="mb-1">
                <p className="px-2 pb-1 pt-1 text-[0.7rem] font-bold text-muted">קווי מוצרים</p>
                {suggestCats.map((c) => (
                  <button
                    key={`cat-${c.id}`}
                    onClick={() => pickLine(c)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-right text-sm hover:bg-red-50"
                  >
                    <span className="text-base">{c.icon || "📦"}</span>
                    <span className="font-semibold text-heading">{c.name}</span>
                    {c.count ? <span className="mr-auto text-xs text-muted">{c.count} מוצרים</span> : null}
                  </button>
                ))}
              </div>
            ) : null}
            {suggestGroups.map((g) => (
              <div key={`grp-${g.id}`} className="mb-1">
                <p className="flex items-center gap-1 px-2 pb-1 pt-1 text-[0.7rem] font-bold text-muted">
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
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-right text-sm hover:bg-soft"
                  >
                    <span className="h-9 w-9 shrink-0 overflow-hidden rounded border border-line bg-soft">
                      <FallbackImage src={adminPreviewSrc(p.image)} alt="" loading="lazy" className="h-full w-full object-contain" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-heading">{p.name}</span>
                      {p.model ? <span className="block text-xs text-muted" dir="ltr">{p.model}</span> : null}
                    </span>
                    <span className="shrink-0 font-bold text-brand-red">{formatPrice(p.price)}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {tops.length ? (
        <SectionCard title="עיון לפי קטגוריה">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setLineFilter(null);
                setPage(1);
                setStoreLimit(STORE_PAGE_SIZE);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-bold transition ${
                !lineFilter ? "border-brand-red bg-brand-red text-white" : "border-line bg-white text-heading hover:border-brand-red/40"
              }`}
            >
              הכל
            </button>
            {tops.map((c) => {
              const active = activeTop?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => (active && lineFilter?.id === c.id ? setLineFilter(null) : pickLine(c))}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-bold transition ${
                    active ? "border-brand-red bg-brand-red text-white" : "border-line bg-white text-heading hover:border-brand-red/40"
                  }`}
                >
                  <span aria-hidden="true" className="text-base">{c.icon || "📦"}</span>
                  {c.name}
                  {c.count ? (
                    <span className={`rounded-full px-1.5 text-[0.65rem] font-bold ${active ? "bg-white/20 text-white" : "bg-soft text-muted"}`}>
                      {c.count.toLocaleString("he-IL")}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {activeTop && subsOfActive.length ? (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
              <button
                onClick={() => pickLine(activeTop)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  lineFilter?.id === activeTop.id ? "bg-brand-blue text-white" : "bg-soft text-heading hover:bg-line"
                }`}
              >
                הכל ב{activeTop.name}
              </button>
              {subsOfActive.map((s) => (
                <button
                  key={s.id}
                  onClick={() => pickLine(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    lineFilter?.id === s.id ? "bg-brand-blue text-white" : "bg-soft text-heading hover:bg-line"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {lineFilter ? (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-sm font-bold text-brand-red">
          סינון: {lineFilter.name}
          <button onClick={() => setLineFilter(null)} className="text-brand-red/60 hover:text-brand-red" aria-label="ניקוי סינון">×</button>
        </span>
      ) : null}

      {loading ? (
        <div className="grid place-items-center gap-3 py-16 text-muted">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand-red" />
          <span className="text-sm">טוען מוצרים…</span>
        </div>
      ) : shown.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-muted">לא נמצאו מוצרים. נסו חיפוש אחר או בחרו קטגוריה.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => (
              <article key={`${p.source}-${p.id}`} className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                <button onClick={() => openEdit(p)} className="flex flex-1 flex-col p-2.5 text-right" title="לחצו לעריכת המוצר">
                  <span className="relative mb-2 block aspect-square overflow-hidden rounded-xl bg-soft">
                    <FallbackImage src={adminPreviewSrc(p.image)} alt="" loading="lazy" className="h-full w-full object-contain" />
                    {p.onSale ? <span className="absolute right-1.5 top-1.5 rounded-full bg-brand-red px-2 py-0.5 text-[0.65rem] font-black text-white shadow-sm">מבצע</span> : null}
                    {!p.inStock ? <span className="absolute left-1.5 top-1.5 rounded-full bg-gray-800/80 px-2 py-0.5 text-[0.65rem] font-bold text-white">אזל</span> : null}
                  </span>
                  <span className="clamp-2 text-[0.8rem] font-bold leading-snug text-heading">{p.name}</span>
                  {p.model ? <span className="mt-0.5 text-[0.7rem] text-muted" dir="ltr">{p.model}</span> : null}
                  <span className="mt-auto flex items-baseline gap-1.5 pt-1.5">
                    <span className="text-sm font-black text-brand-red">{formatPrice(p.price)}</span>
                    {p.onSale && p.regularPrice && p.regularPrice > p.price ? <span className="text-[0.7rem] text-muted line-through" dir="ltr">{formatPrice(p.regularPrice)}</span> : null}
                  </span>
                </button>
                <div className="flex border-t border-line text-xs font-bold">
                  <button onClick={() => openEdit(p)} className="flex-1 py-2 text-brand-blue transition hover:bg-soft">✎ עריכה</button>
                  <span className="w-px bg-line" aria-hidden="true" />
                  <button onClick={() => remove(p)} className="flex-1 py-2 text-muted transition hover:bg-red-50 hover:text-brand-red">🗑 מחיקה</button>
                </div>
              </article>
            ))}
          </div>
          {lightingMode && totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-1">
              <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>← הקודם</Button>
              <span className="text-sm font-semibold text-muted">עמוד {page.toLocaleString("he-IL")} מתוך {totalPages.toLocaleString("he-IL")}</span>
              <Button variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>הבא →</Button>
            </div>
          ) : null}
          {!lightingMode ? (
            <>
              <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
              {filtered.length > 0 ? (
                <p className="mt-3 text-center text-xs text-muted">
                  {hasMore
                    ? `מוצגים ${shown.length.toLocaleString("he-IL")} מתוך ${filtered.length.toLocaleString("he-IL")} מוצרים`
                    : `סה"כ ${filtered.length.toLocaleString("he-IL")} מוצרים`}
                </p>
              ) : null}
            </>
          ) : null}
        </>
      )}

      {draft ? (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 sm:items-start sm:p-4" onClick={close}>
          <div className="flex max-h-screen w-full flex-col bg-white shadow-pop sm:my-2 sm:max-h-[calc(100vh-1rem)] sm:max-w-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3 sm:rounded-t-2xl">
              <h3 className="text-base font-extrabold text-heading">
                {draft.id ? `עריכת ${draft.source === "lighting" ? "פריט תאורה" : "מוצר"} #${draft.id}` : draft.source === "lighting" ? "פריט תאורה חדש" : "מוצר חדש"}
              </h3>
              <button onClick={close} aria-label="סגירה" className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-soft">✕</button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-line bg-soft">
                  {preview || draft.image ? <FallbackImage src={preview || adminPreviewSrc(draft.image)} alt="" className="h-full w-full object-contain" /> : <span className="grid h-full w-full place-items-center text-2xl text-line">{draft.source === "lighting" ? "💡" : "🖼️"}</span>}
                </div>
                <div>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
                  <Button variant="ghost" onClick={() => fileRef.current?.click()}>בחירת תמונה</Button>
                  <p className="mt-1 text-xs text-muted">התמונה תועלה בעת השמירה</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="שם המוצר" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
                <Field label="דגם / מק״ט" value={draft.model} onChange={(v) => setDraft({ ...draft, model: v })} dir="ltr" />
                <Field label={draft.source === "lighting" ? "מחיר (₪)" : "מחיר רגיל (₪)"} type="number" value={draft.regularPrice} onChange={(v) => setDraft({ ...draft, regularPrice: v })} />
                <div className="flex items-end gap-4">
                  {draft.source === "store" ? <Toggle label="במבצע" checked={draft.onSale} onChange={(v) => setDraft({ ...draft, onSale: v })} /> : null}
                  <Toggle label="במלאי" checked={draft.inStock} onChange={(v) => setDraft({ ...draft, inStock: v })} />
                </div>
                {draft.source === "store" && draft.onSale ? <Field label="מחיר מבצע (₪)" type="number" value={draft.salePrice} onChange={(v) => setDraft({ ...draft, salePrice: v })} /> : null}
              </div>

              {draft.source === "lighting" ? (
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-heading">קטגוריית תאורה</span>
                  <select
                    value={draft.lightingSubId || ""}
                    onChange={(e) => setDraft({ ...draft, lightingSubId: Number(e.target.value) })}
                    disabled={!!draft.id}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base outline-none focus:border-brand-red disabled:bg-soft disabled:text-muted sm:text-sm"
                  >
                    <option value="">בחרו קטגוריה…</option>
                    {lightingSubcats.map((s) => (
                      <option key={s.id} value={lightingSubId(s)}>{s.name}</option>
                    ))}
                  </select>
                  {draft.id ? <span className="mt-1 block text-xs text-muted">לא ניתן לשנות קטגוריה לפריט קיים</span> : null}
                </label>
              ) : (
                <div>
                  <span className="mb-1 block text-sm font-semibold text-heading">קטגוריות</span>
                  {draft.categoryIds.length ? (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {draft.categoryIds.map((id) => (
                        <span key={id} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-brand-red">
                          {catName.get(id) || `#${id}`}
                          <button onClick={() => toggleCat(id)} className="text-brand-red/60 hover:text-brand-red">×</button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <input value={catFilter} onChange={(e) => setCatFilter(e.target.value)} placeholder="סינון קטגוריות…" className="mb-2 w-full rounded-lg border border-line px-3 py-2 text-base outline-none focus:border-brand-red sm:py-1.5 sm:text-sm" />
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-line p-2">
                    {filteredCats.map((c) => (
                      <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-soft">
                        <input type="checkbox" checked={draft.categoryIds.includes(c.id)} onChange={() => toggleCat(c.id)} className="h-4 w-4 accent-brand-red" />
                        <span className="text-heading">{c.name}</span>
                        <span className="text-xs text-line">#{c.id}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <RichTextArea label="תיאור" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} />
            </div>

            <div className="flex justify-end gap-3 border-t border-line px-4 py-3 sm:rounded-b-2xl">
              <Button variant="ghost" onClick={close}>ביטול</Button>
              <Button onClick={save} disabled={saving}>{saving ? "שומר…" : "שמירה"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
