"use client";

import { useEffect, useRef, useState } from "react";
import type { Homepage, Category, PromoTile, HomeSection } from "@/lib/types";
import { apiGet, apiSend, uploadImage, adminPreviewSrc } from "./lib";
import { Field, TextArea, Button } from "./ui";

// Deep clone via JSON (homepage data is plain JSON) for the save-merge baseline.
function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function ImageUpload({
  label,
  value,
  onUploaded,
  onError,
}: {
  label: string;
  value: string;
  onUploaded: (path: string) => void;
  onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // Local object-URL preview of the just-picked file. Shown immediately so the
  // thumbnail isn't a broken 404 during the ~2–3 min CI publish window (the
  // committed path isn't served from this origin until the rebuild finishes).
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setJustUploaded(false);
    setImgError(false);
    const preview = URL.createObjectURL(file);
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return preview;
    });
    try {
      const path = await uploadImage("banner", file);
      onUploaded(path);
      setJustUploaded(true);
    } catch (e) {
      onError((e as Error).message);
      URL.revokeObjectURL(preview);
      setLocalPreview(null);
    } finally {
      setBusy(false);
    }
  }

  // Prefer the just-picked local blob; otherwise preview the committed image
  // from GitHub raw (available within seconds of commit, unlike this origin).
  const previewSrc = localPreview || adminPreviewSrc(value);

  useEffect(() => {
    setImgError(false);
  }, [previewSrc]);

  return (
    <div>
      <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50">
          {previewSrc && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt=""
              className="h-full w-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : value ? (
            <span className="px-1 text-center text-[10px] leading-tight text-gray-400">🕓 מתפרסם…</span>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <Button variant="ghost" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "מעלה…" : "העלאת תמונה"}
        </Button>
      </div>
      {justUploaded ? (
        <p className="mt-1 text-xs text-emerald-700">
          ✓ התמונה נשמרה. שמרו ופרסמו — היא תופיע באתר תוך 2–3 דקות (זמן פרסום).
        </p>
      ) : null}
      <Field label="" value={value} onChange={() => {}} dir="ltr" hint="נתיב התמונה (מתעדכן אוטומטית לאחר העלאה)" />
    </div>
  );
}

export default function HomepageTab({
  onToast,
}: {
  onToast: (msg: string, ok: boolean) => void;
}) {
  const [hp, setHp] = useState<Homepage | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [rawText, setRawText] = useState("");
  // Snapshot of the homepage exactly as it was loaded. Used at save time to tell
  // which top-level regions THIS session actually edited, so we never clobber a
  // region (e.g. promo tiles) that changed on the server after we loaded.
  const baseRef = useRef<Homepage | null>(null);

  useEffect(() => {
    apiGet<Homepage>("/api/homepage")
      .then((d) => {
        setHp(d);
        baseRef.current = clone(d);
      })
      .catch((e: Error) => onToast(e.message, false));
    apiGet<Category[]>("/api/categories").then(setCats).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hp) return <p className="p-8 text-gray-500">טוען…</p>;

  function setHero<K extends keyof Homepage["hero"]>(k: K, v: Homepage["hero"][K]) {
    setHp((s) => (s ? { ...s, hero: { ...s.hero, [k]: v } } : s));
  }
  function setTile(i: number, patch: Partial<PromoTile>) {
    setHp((s) =>
      s ? { ...s, promoTiles: s.promoTiles.map((t, j) => (j === i ? { ...t, ...patch } : t)) } : s
    );
  }
  function setSection(i: number, patch: Partial<HomeSection>) {
    setHp((s) =>
      s ? { ...s, sections: s.sections.map((t, j) => (j === i ? { ...t, ...patch } : t)) } : s
    );
  }
  function addTile() {
    setHp((s) =>
      s
        ? {
            ...s,
            promoTiles: [
              ...s.promoTiles,
              { id: `t-${Date.now()}`, title: "אריח חדש", image: "", categoryId: 0 },
            ],
          }
        : s
    );
  }
  function removeTile(i: number) {
    setHp((s) => (s ? { ...s, promoTiles: s.promoTiles.filter((_, j) => j !== i) } : s));
  }
  function addSection() {
    setHp((s) =>
      s
        ? {
            ...s,
            sections: [
              ...s.sections,
              {
                id: `s-${Date.now()}`,
                title: "מקטע חדש",
                icon: "✨",
                categoryId: 0,
                limit: 12,
                layout: "carousel",
              },
            ],
          }
        : s
    );
  }
  function removeSection(i: number) {
    setHp((s) => (s ? { ...s, sections: s.sections.filter((_, j) => j !== i) } : s));
  }

  async function save() {
    if (!hp) return;
    setSaving(true);
    try {
      // Lost-update safe save. We send the full homepage we hold PLUS the list of
      // top-level regions this session actually edited (vs the baseline we loaded).
      // The server re-reads the latest commit and overwrites ONLY those regions,
      // so editing the Hero can't revert promo tiles another admin/process changed.
      // The merge happens on the SERVER (against a guaranteed-fresh read), so even
      // a flaky client network can't make us clobber newer data with a stale copy.
      const base = baseRef.current;
      let body: unknown = hp;
      if (base) {
        const changedKeys = (Object.keys(hp) as (keyof Homepage)[])
          .filter((k) => JSON.stringify(hp[k]) !== JSON.stringify(base[k]))
          .map((k) => String(k));
        body = { homepage: hp, changedKeys };
      }
      await apiSend("/api/homepage", "PUT", body);
      // Re-sync to the authoritative server copy so the editor (and our baseline)
      // reflect the merged result, including any regions another session changed.
      const latest = await apiGet<Homepage>("/api/homepage").catch(() => hp);
      setHp(latest);
      baseRef.current = clone(latest);
      onToast("עמוד הבית נשמר — האתר יתעדכן בעוד דקה־שתיים", true);
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      setSaving(false);
    }
  }

  function catOptions(value: number, onChange: (v: number) => void) {
    return (
      <select
        value={String(value || 0)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-red-500"
      >
        <option value="0">— קטגוריה —</option>
        {cats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} (#{c.id})
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-extrabold text-gray-800">באנר ראשי (Hero)</h2>
        <div className="space-y-4">
          <ImageUpload
            label="תמונת הבאנר"
            value={hp.hero.image}
            onUploaded={(p) => {
              setHero("image", p);
              onToast("התמונה הועלתה. לחצו שמירה כדי לפרסם.", true);
            }}
            onError={(m) => onToast(m, false)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="טקסט חלופי (Alt · ל־SEO)" value={hp.hero.alt} onChange={(v) => setHero("alt", v)} />
            <Field label="קישור בלחיצה" value={hp.hero.href} onChange={(v) => setHero("href", v)} dir="ltr" hint="לדוגמה /category/146/" />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-extrabold text-gray-800">הודעת מבצע ופרטי טופבר</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="הודעת רצועה עליונה" value={hp.announcement} onChange={(v) => setHp((s) => (s ? { ...s, announcement: v } : s))} />
          <Field label="טלפון בטופבר" value={hp.topbarPhone} onChange={(v) => setHp((s) => (s ? { ...s, topbarPhone: v } : s))} dir="ltr" />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-800">אריחי קידום (Promo Tiles)</h2>
          <Button variant="subtle" onClick={addTile}>+ אריח</Button>
        </div>
        <div className="space-y-4">
          {hp.promoTiles.map((t, i) => (
            <div key={t.id} className="grid items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-[7rem_1fr_1fr_auto]">
              <ImageUpload
                label="תמונה"
                value={t.image}
                onUploaded={(p) => setTile(i, { image: p })}
                onError={(m) => onToast(m, false)}
              />
              <Field label="כותרת" value={t.title} onChange={(v) => setTile(i, { title: v })} />
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">קטגוריה</span>
                {catOptions(t.categoryId, (v) => setTile(i, { categoryId: v }))}
              </label>
              <Button variant="danger" onClick={() => removeTile(i)}>מחיקה</Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-800">מקטעי מוצרים בעמוד הבית</h2>
          <Button variant="subtle" onClick={addSection}>+ מקטע</Button>
        </div>
        <div className="space-y-4">
          {hp.sections.map((sec, i) => (
            <div key={sec.id} className="grid items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-[auto_1fr_1fr_5rem_auto]">
              <Field label="אייקון" value={sec.icon} onChange={(v) => setSection(i, { icon: v })} />
              <Field label="כותרת" value={sec.title} onChange={(v) => setSection(i, { title: v })} />
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">קטגוריה</span>
                {catOptions(sec.categoryId, (v) => setSection(i, { categoryId: v }))}
              </label>
              <Field label="מקסימום" type="number" value={String(sec.limit)} onChange={(v) => setSection(i, { limit: Number(v) || 0 })} />
              <Button variant="danger" onClick={() => removeSection(i)}>מחיקה</Button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? "שומר…" : "שמירת עמוד הבית"}</Button>
        <Button
          variant="ghost"
          onClick={() => {
            setRawText(JSON.stringify(hp, null, 2));
            setShowRaw((v) => !v);
          }}
        >
          עריכה מתקדמת (JSON)
        </Button>
      </div>

      {showRaw ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <textarea
            value={rawText}
            dir="ltr"
            rows={16}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-xs text-gray-900"
          />
          <div className="mt-3 flex gap-2">
            <Button
              variant="subtle"
              onClick={() => {
                try {
                  setHp(JSON.parse(rawText) as Homepage);
                  setShowRaw(false);
                  onToast("עודכן מ־JSON. לחצו שמירה כדי לפרסם.", true);
                } catch {
                  onToast("JSON לא תקין", false);
                }
              }}
            >
              החלה
            </Button>
            <Button variant="ghost" onClick={() => setShowRaw(false)}>ביטול</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
