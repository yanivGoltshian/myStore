"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  apiGet,
  apiSend,
  uploadImage,
  adminPreviewSrc,
  formatPrice,
  type LightingAdminProduct,
  type LightingSubcat,
  type LightingList,
} from "./lib";
import { Field, TextArea, Toggle, Button, Card } from "./ui";
import FallbackImage from "@/components/FallbackImage";

const PAGE_SIZE = 60;

type LDraft = {
  id?: number;
  name: string;
  model: string;
  price: string;
  inStock: boolean;
  description: string;
  image: string;
  subId: number;
};

function toDraft(p: LightingAdminProduct): LDraft {
  return {
    id: p.id,
    name: p.name || "",
    model: p.model || "",
    price: String(p.price ?? 0),
    inStock: p.inStock !== false,
    description: p.description || "",
    image: p.image || "",
    subId: Number(p.subId || 0),
  };
}

export default function LightingProducts({
  onToast,
}: {
  onToast: (msg: string, ok: boolean) => void;
}) {
  const [subs, setSubs] = useState<LightingSubcat[]>([]);
  const [activeSub, setActiveSub] = useState<number>(0);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<LightingList | null>(null);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState<LDraft | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadSubs = useCallback(async () => {
    try {
      const data = await apiGet<LightingSubcat[]>("/api/lighting/subcats");
      setSubs(data);
      setActiveSub((cur) => (cur ? cur : data[0]?.id || 0));
    } catch (e) {
      onToast((e as Error).message, false);
    }
  }, [onToast]);

  useEffect(() => {
    loadSubs();
  }, [loadSubs]);

  // debounce the search box, reset to page 1 on every change
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [activeSub]);

  const loadList = useCallback(async () => {
    // "all categories" with no query has nothing to browse — prompt to search.
    if (!activeSub && !debounced) {
      setList({ count: 0, page: 1, pageSize: PAGE_SIZE, products: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sub: String(activeSub),
        q: debounced,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      const data = await apiGet<LightingList>(`/api/lighting/products?${params}`);
      setList(data);
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      setLoading(false);
    }
  }, [activeSub, debounced, page, onToast]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const subName = useMemo(() => {
    const m = new Map<number, string>();
    subs.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [subs]);

  const products = list?.products ?? [];
  const count = list?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  function pickFile(f: File | undefined) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function openEdit(p: LightingAdminProduct) {
    setFile(null);
    setPreview("");
    setDraft(toDraft(p));
  }

  function openNew() {
    setFile(null);
    setPreview("");
    setDraft({
      name: "",
      model: "",
      price: "",
      inStock: true,
      description: "",
      image: "",
      subId: activeSub || subs[0]?.id || 0,
    });
  }

  function close() {
    setDraft(null);
    setFile(null);
    setPreview("");
  }

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      onToast("יש להזין שם מוצר", false);
      return;
    }
    if (!draft.subId) {
      onToast("יש לבחור קטגוריית תאורה", false);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: draft.name,
        model: draft.model,
        price: Number(draft.price) || 0,
        inStock: draft.inStock,
        description: draft.description,
        image: draft.image,
        subId: draft.subId,
      };

      let id = draft.id;
      if (!id) {
        const created = await apiSend<LightingAdminProduct>(
          "/api/lighting/products",
          "POST",
          payload
        );
        id = created.id;
      }
      if (file && id) {
        const path = await uploadImage("lighting", file, { id });
        payload.image = path;
      }
      await apiSend(`/api/lighting/products/${id}`, "PUT", { ...payload, id });

      onToast("המוצר נשמר — האתר יתעדכן בעוד דקה־שתיים", true);
      close();
      await Promise.all([loadSubs(), loadList()]);
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: LightingAdminProduct) {
    if (!confirm(`למחוק את "${p.name}"? פעולה זו אינה הפיכה.`)) return;
    try {
      await apiSend(`/api/lighting/products/${p.id}`, "DELETE", {});
      onToast("המוצר נמחק", true);
      await Promise.all([loadSubs(), loadList()]);
    } catch (e) {
      onToast((e as Error).message, false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-heading sm:text-lg">ניהול תאורה</h2>
          <p className="text-xs text-muted">
            {count.toLocaleString("he-IL")} פריטים{activeSub ? ` ב${subName.get(activeSub) || ""}` : ""}
          </p>
        </div>
        <Button onClick={openNew}>+ פריט תאורה</Button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 חיפוש לפי שם, דגם או מק״ט…"
        className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base shadow-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-red-100 sm:py-2.5 sm:text-sm"
      />

      {/* subcategory chips */}
      <div className="-mx-1 flex flex-wrap gap-2 px-1">
        <button
          onClick={() => setActiveSub(0)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-bold transition ${
            !activeSub
              ? "border-brand-red bg-brand-red text-white"
              : "border-line bg-white text-heading hover:bg-soft"
          }`}
        >
          🔍 כל הקטגוריות
        </button>
        {subs.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSub(s.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-bold transition ${
              activeSub === s.id
                ? "border-brand-red bg-brand-red text-white"
                : "border-line bg-white text-heading hover:bg-soft"
            }`}
          >
            <span>💡</span>
            {s.name}
            <span className={`mr-0.5 text-xs ${activeSub === s.id ? "text-white/80" : "text-muted"}`}>
              {s.count?.toLocaleString("he-IL")}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center gap-3 py-16 text-muted">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand-red" />
          <span className="text-sm">טוען פריטים…</span>
        </div>
      ) : !activeSub && !debounced ? (
        <Card>
          <p className="py-8 text-center text-sm text-muted">
            בחרו קטגוריית תאורה למעלה, או הקלידו בחיפוש כדי לחפש בכל הקטגוריות.
          </p>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-muted">לא נמצאו פריטים. נסו חיפוש אחר או קטגוריה אחרת.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <article
                key={p.id}
                className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card"
              >
                <button
                  onClick={() => openEdit(p)}
                  className="flex flex-1 flex-col p-2.5 text-right"
                  title="לחצו לעריכת הפריט"
                >
                  <span className="relative mb-2 block aspect-square overflow-hidden rounded-xl bg-soft">
                    <FallbackImage
                      src={adminPreviewSrc(p.image)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                    {!p.inStock ? (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-gray-800/80 px-2 py-0.5 text-[0.65rem] font-bold text-white">
                        אזל
                      </span>
                    ) : null}
                  </span>
                  <span className="clamp-2 text-[0.8rem] font-bold leading-snug text-heading">{p.name}</span>
                  {p.model ? (
                    <span className="mt-0.5 text-[0.7rem] text-muted" dir="ltr">{p.model}</span>
                  ) : null}
                  <span className="mt-auto pt-1.5 text-sm font-black text-brand-red">{formatPrice(p.price)}</span>
                </button>
                <div className="flex border-t border-line text-xs font-bold">
                  <button onClick={() => openEdit(p)} className="flex-1 py-2 text-brand-blue transition hover:bg-soft">
                    ✎ עריכה
                  </button>
                  <span className="w-px bg-line" aria-hidden="true" />
                  <button
                    onClick={() => remove(p)}
                    className="flex-1 py-2 text-muted transition hover:bg-red-50 hover:text-brand-red"
                  >
                    🗑 מחיקה
                  </button>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-1">
              <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                ← הקודם
              </Button>
              <span className="text-sm font-semibold text-muted">
                עמוד {page.toLocaleString("he-IL")} מתוך {totalPages.toLocaleString("he-IL")}
              </span>
              <Button
                variant="ghost"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                הבא →
              </Button>
            </div>
          ) : null}
        </>
      )}

      {draft ? (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 sm:items-start sm:p-4"
          onClick={close}
        >
          <div
            className="flex max-h-screen w-full flex-col bg-white shadow-pop sm:my-2 sm:max-h-[calc(100vh-1rem)] sm:max-w-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3 sm:rounded-t-2xl">
              <h3 className="text-base font-extrabold text-heading">
                {draft.id ? `עריכת פריט תאורה #${draft.id}` : "פריט תאורה חדש"}
              </h3>
              <button
                onClick={close}
                aria-label="סגירה"
                className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-soft"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-line bg-soft">
                  {preview || draft.image ? (
                    <FallbackImage
                      src={preview || adminPreviewSrc(draft.image)}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-2xl text-line">💡</span>
                  )}
                </div>
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => pickFile(e.target.files?.[0])}
                  />
                  <Button variant="ghost" onClick={() => fileRef.current?.click()}>בחירת תמונה</Button>
                  <p className="mt-1 text-xs text-muted">התמונה תועלה בעת השמירה</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="שם המוצר" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
                <Field label="דגם / מק״ט" value={draft.model} onChange={(v) => setDraft({ ...draft, model: v })} dir="ltr" />
                <Field label="מחיר (₪)" type="number" value={draft.price} onChange={(v) => setDraft({ ...draft, price: v })} />
                <div className="flex items-end">
                  <Toggle label="במלאי" checked={draft.inStock} onChange={(v) => setDraft({ ...draft, inStock: v })} />
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-heading">קטגוריית תאורה</span>
                <select
                  value={draft.subId || ""}
                  onChange={(e) => setDraft({ ...draft, subId: Number(e.target.value) })}
                  disabled={!!draft.id}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base outline-none focus:border-brand-red disabled:bg-soft disabled:text-muted sm:text-sm"
                >
                  <option value="">בחרו קטגוריה…</option>
                  {subs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {draft.id ? (
                  <span className="mt-1 block text-xs text-muted">לא ניתן לשנות קטגוריה לפריט קיים</span>
                ) : null}
              </label>

              <TextArea
                label="תיאור"
                value={draft.description}
                onChange={(v) => setDraft({ ...draft, description: v })}
                rows={4}
              />
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
