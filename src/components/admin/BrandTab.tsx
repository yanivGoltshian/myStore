"use client";

import { useEffect, useState } from "react";
import type { Site } from "@/lib/types";
import { apiGet, apiSend } from "./lib";
import { Field, TextArea, Button } from "./ui";

export default function BrandTab({
  onToast,
}: {
  onToast: (msg: string, ok: boolean) => void;
}) {
  const [site, setSite] = useState<Site | null>(null);
  const [saving, setSaving] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [rawText, setRawText] = useState("");

  useEffect(() => {
    apiGet<Site>("/api/site")
      .then(setSite)
      .catch((e: Error) => onToast(e.message, false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!site) return <p className="p-8 text-gray-500">טוען…</p>;

  function set<K extends keyof Site>(k: K, v: Site[K]) {
    setSite((s) => (s ? { ...s, [k]: v } : s));
  }
  function setAddr<K extends keyof Site["address"]>(
    k: K,
    v: Site["address"][K]
  ) {
    setSite((s) => (s ? { ...s, address: { ...s.address, [k]: v } } : s));
  }

  async function save(payload: Site) {
    setSaving(true);
    try {
      await apiSend("/api/site", "PUT", payload);
      onToast("הגדרות המותג נשמרו — האתר יתעדכן בעוד דקה־שתיים", true);
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      setSaving(false);
    }
  }

  function openRaw() {
    setRawText(JSON.stringify(site, null, 2));
    setShowRaw(true);
  }

  function applyRaw() {
    try {
      const parsed = JSON.parse(rawText) as Site;
      setSite(parsed);
      setShowRaw(false);
      onToast("עודכן מ־JSON. לחצו שמירה כדי לפרסם.", true);
    } catch {
      onToast("JSON לא תקין", false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-extrabold text-heading">שם ומיתוג</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="שם החנות" value={site.name} onChange={(v) => set("name", v)} />
          <Field label="שם באנגלית" value={site.nameEn} onChange={(v) => set("nameEn", v)} dir="ltr" />
          <Field label="שם משפטי / חברה" value={site.legalName} onChange={(v) => set("legalName", v)} />
          <Field label="סלוגן / תיאור קצר" value={site.tagline} onChange={(v) => set("tagline", v)} />
          <Field
            label="כתובת האתר (Domain)"
            value={site.url}
            onChange={(v) => set("url", v)}
            dir="ltr"
            hint="חשוב ל־SEO. עדכנו לכתובת האמיתית אחרי הפריסה."
          />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-extrabold text-heading">פרטי קשר ורשתות</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="טלפון (תצוגה)" value={site.phone} onChange={(v) => set("phone", v)} dir="ltr" />
          <Field label="טלפון (ספרות בלבד)" value={site.phoneRaw} onChange={(v) => set("phoneRaw", v)} dir="ltr" hint="לקישור חיוג, לדוגמה 035562520" />
          <Field label="וואטסאפ (בינלאומי)" value={site.whatsapp} onChange={(v) => set("whatsapp", v)} dir="ltr" hint="לדוגמה 972522503151" />
          <Field label="וואטסאפ (תצוגה)" value={site.whatsappDisplay} onChange={(v) => set("whatsappDisplay", v)} dir="ltr" />
          <Field label="אימייל" value={site.email} onChange={(v) => set("email", v)} dir="ltr" />
          <Field label="פייסבוק (URL)" value={site.facebook} onChange={(v) => set("facebook", v)} dir="ltr" />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-extrabold text-heading">כתובת הסניף</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="רחוב" value={site.address.street} onChange={(v) => setAddr("street", v)} />
          <Field label="רחוב (אנגלית)" value={site.address.streetEn} onChange={(v) => setAddr("streetEn", v)} dir="ltr" />
          <Field label="עיר" value={site.address.city} onChange={(v) => setAddr("city", v)} />
          <Field label="עיר (אנגלית)" value={site.address.cityEn} onChange={(v) => setAddr("cityEn", v)} dir="ltr" />
          <Field label="מיקוד" value={site.address.postalCode} onChange={(v) => setAddr("postalCode", v)} dir="ltr" />
          <Field label="מדינה" value={site.address.country} onChange={(v) => setAddr("country", v)} dir="ltr" />
        </div>
        <div className="mt-4">
          <Field label="כתובת מלאה (תצוגה)" value={site.address.full} onChange={(v) => setAddr("full", v)} />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-extrabold text-heading">שעות פעילות</h2>
        <TextArea label="שעות (טקסט חופשי)" value={site.hours} onChange={(v) => set("hours", v)} rows={2} />
        <p className="mt-2 text-xs text-gray-400">
          שעות מובְנות ל־SEO ניתן לערוך דרך עורך ה־JSON המתקדם למטה.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => save(site)} disabled={saving}>
          {saving ? "שומר…" : "שמירת הגדרות המותג"}
        </Button>
        <Button variant="ghost" onClick={openRaw}>
          עריכה מתקדמת (JSON)
        </Button>
      </div>

      {showRaw ? (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <h3 className="mb-2 text-sm font-extrabold text-heading">עורך JSON מתקדם</h3>
          <textarea
            value={rawText}
            dir="ltr"
            rows={16}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full rounded-lg border border-line bg-gray-50 p-3 font-mono text-xs text-gray-900"
          />
          <div className="mt-3 flex gap-2">
            <Button variant="subtle" onClick={applyRaw}>
              החלה
            </Button>
            <Button variant="ghost" onClick={() => setShowRaw(false)}>
              ביטול
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
