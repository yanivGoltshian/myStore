"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Self-built, zero-dependency accessibility widget (a11y toolbar) for the
 * storefront. All state persists in localStorage under `hankin-a11y` and is
 * re-applied on load. Settings are applied by toggling classes / a font-size
 * on <html>; the matching CSS lives in globals.css.
 *
 * Hydration note (static export): defaults render on the server. We read
 * localStorage and apply settings inside a mount useEffect (never a lazy
 * useState initializer) so the first client render matches the server.
 */

const STORAGE_KEY = "hankin-a11y";

// Root font-size steps. Tailwind text utilities are rem-based, so scaling the
// root font-size scales most text on the page.
const FONT_STEPS = [100, 112, 125, 140, 160] as const;

type Settings = {
  fontStep: number; // index into FONT_STEPS
  contrast: boolean;
  noMotion: boolean;
  highlightLinks: boolean;
  readableFont: boolean;
  lineSpacing: boolean;
};

const DEFAULTS: Settings = {
  fontStep: 0,
  contrast: false,
  noMotion: false,
  highlightLinks: false,
  readableFont: false,
  lineSpacing: false,
};

function applySettings(s: Settings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const pct = FONT_STEPS[s.fontStep] ?? 100;
  root.style.fontSize = pct === 100 ? "" : `${pct}%`;

  root.classList.toggle("a11y-contrast", s.contrast);
  root.classList.toggle("a11y-no-motion", s.noMotion);
  root.classList.toggle("a11y-highlight-links", s.highlightLinks);
  root.classList.toggle("a11y-readable-font", s.readableFont);
  root.classList.toggle("a11y-line-spacing", s.lineSpacing);
}

function clearSettings() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.fontSize = "";
  root.classList.remove(
    "a11y-contrast",
    "a11y-no-motion",
    "a11y-highlight-links",
    "a11y-readable-font",
    "a11y-line-spacing",
  );
}

// Accessibility (universal access) glyph.
function AccessIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="4" r="1.6" fill="currentColor" stroke="none" />
      <path d="M4 8.5c2.4 1 5.1 1.5 8 1.5s5.6-.5 8-1.5" />
      <path d="M12 10v5" />
      <path d="M9.5 21l1.4-4.6a1.15 1.15 0 0 1 2.2 0L14.5 21" />
    </svg>
  );
}

export default function AccessibilityWidget() {
  const pathname = usePathname() || "";
  const isAdmin = pathname.startsWith("/admin");

  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [open, setOpen] = useState(false);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load + apply persisted settings after mount (hydration-safe).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Settings>;
        const merged: Settings = { ...DEFAULTS, ...parsed };
        merged.fontStep = Math.min(
          Math.max(0, Math.round(merged.fontStep) || 0),
          FONT_STEPS.length - 1,
        );
        setSettings(merged);
        applySettings(merged);
        return;
      }
    } catch {
      /* ignore malformed storage */
    }
    applySettings(DEFAULTS);
  }, []);

  const commit = useCallback((next: Settings) => {
    setSettings(next);
    applySettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage may be unavailable */
    }
  }, []);

  const setFont = useCallback(
    (dir: 1 | -1) => {
      setSettings((cur) => {
        const step = Math.min(
          Math.max(0, cur.fontStep + dir),
          FONT_STEPS.length - 1,
        );
        const next = { ...cur, fontStep: step };
        applySettings(next);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [],
  );

  const toggleKey = useCallback(
    (key: keyof Omit<Settings, "fontStep">) => {
      setSettings((cur) => {
        const next = { ...cur, [key]: !cur[key] };
        applySettings(next);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [],
  );

  const resetAll = useCallback(() => {
    clearSettings();
    setSettings(DEFAULTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to the toggle so keyboard users are not stranded.
    toggleRef.current?.focus();
  }, []);

  // Move focus into the panel when it opens.
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  // Focus trap + Esc handling scoped to the panel.
  const onPanelKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [close],
  );

  // Keep the widget out of the admin app entirely.
  if (isAdmin) return null;

  const currentPct = FONT_STEPS[settings.fontStep] ?? 100;

  const toggles: {
    key: keyof Omit<Settings, "fontStep">;
    label: string;
  }[] = [
    { key: "contrast", label: "ניגודיות גבוהה" },
    { key: "highlightLinks", label: "הדגשת קישורים" },
    { key: "noMotion", label: "עצירת אנימציות" },
    { key: "readableFont", label: "גופן קריא" },
    { key: "lineSpacing", label: "ריווח שורות מוגדל" },
  ];

  return (
    <>
      {/* Floating toggle button */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="תפריט נגישות"
        aria-expanded={open}
        aria-controls="a11y-panel"
        className="a11y-fab grid place-items-center rounded-full bg-brand-blue text-white shadow-[0_6px_20px_rgba(0,0,0,0.28)] ring-2 ring-white transition-colors hover:bg-brand-blue-dark"
      >
        <AccessIcon className="h-7 w-7" />
      </button>

      {open && (
        <>
          {/* Backdrop — outside click closes the panel */}
          <div
            className="a11y-backdrop"
            onClick={close}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            ref={panelRef}
            id="a11y-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="a11y-title"
            dir="rtl"
            tabIndex={-1}
            onKeyDown={onPanelKeyDown}
            className="a11y-panel"
          >
            <div className="flex items-center justify-between gap-2 border-b border-line pb-2.5">
              <h2
                id="a11y-title"
                className="flex items-center gap-2 text-[0.98rem] font-extrabold text-heading"
              >
                <AccessIcon className="h-5 w-5 text-brand-blue" />
                תפריט נגישות
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="סגירת תפריט הנגישות"
                className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-soft hover:text-brand-red"
              >
                <span aria-hidden="true" className="text-base leading-none">
                  ✕
                </span>
              </button>
            </div>

            {/* Text size */}
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[0.82rem] font-bold text-ink">
                  גודל טקסט
                </span>
                <span
                  className="text-[0.78rem] font-bold text-brand-blue"
                  aria-live="polite"
                >
                  {currentPct}%
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFont(-1)}
                  disabled={settings.fontStep === 0}
                  aria-label="הקטנת טקסט"
                  className="flex-1 rounded-lg border border-line py-2 text-lg font-black text-ink transition-colors hover:border-brand-blue hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span aria-hidden="true">א−</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFont(1)}
                  disabled={settings.fontStep === FONT_STEPS.length - 1}
                  aria-label="הגדלת טקסט"
                  className="flex-1 rounded-lg border border-line py-2 text-lg font-black text-ink transition-colors hover:border-brand-blue hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span aria-hidden="true">א+</span>
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="mt-3 flex flex-col gap-2">
              {toggles.map((t) => {
                const active = settings[t.key];
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => toggleKey(t.key)}
                    aria-pressed={active}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-start text-[0.85rem] font-semibold transition-colors ${
                      active
                        ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                        : "border-line text-ink hover:border-brand-blue/60"
                    }`}
                  >
                    <span>{t.label}</span>
                    <span
                      aria-hidden="true"
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${
                        active
                          ? "bg-brand-blue text-white"
                          : "bg-soft text-muted"
                      }`}
                    >
                      {active ? "פעיל" : "כבוי"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Reset */}
            <button
              type="button"
              onClick={resetAll}
              className="mt-3 w-full rounded-lg border border-brand-red/40 py-2 text-[0.82rem] font-bold text-brand-red transition-colors hover:bg-brand-red hover:text-white"
            >
              איפוס הגדרות הנגישות
            </button>

            <p className="mt-3 text-center text-[0.68rem] leading-snug text-muted">
              ההגדרות נשמרות במכשיר שלכם.{" "}
              <a href="/accessibility/" className="font-bold underline">
                הצהרת הנגישות
              </a>
            </p>
          </div>
        </>
      )}
    </>
  );
}
