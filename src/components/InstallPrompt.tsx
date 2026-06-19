"use client";

import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SHOWN_KEY = "hankin-a2hs-v2"; // one-time per browser

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isiOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iphone|ipad|ipod/i.test(ua);
  const iPadOS = navigator.platform === "MacIntel" && (navigator as unknown as { maxTouchPoints: number }).maxTouchPoints > 1;
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  return (iOS || iPadOS) && isSafari;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    let already = false;
    try {
      already = localStorage.getItem(SHOWN_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (already) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    const onInstalled = () => {
      setShow(false);
      try {
        localStorage.setItem(SHOWN_KEY, "1");
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari has no beforeinstallprompt — show a manual hint once.
    let iosTimer: ReturnType<typeof setTimeout> | null = null;
    if (isiOS()) {
      iosTimer = setTimeout(() => {
        setIosHint(true);
        setShow(true);
      }, 2500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  function markDone() {
    try {
      localStorage.setItem(SHOWN_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function dismiss() {
    setShow(false);
    markDone();
  }

  async function install() {
    if (!deferred) return;
    markDone();
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    setShow(false);
    setDeferred(null);
  }

  if (!show) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
    >
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-192.png"
          alt="חשמל חנקין"
          className="h-12 w-12 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[0.9rem] font-extrabold leading-tight text-heading">
            התקינו את חשמל חנקין
          </p>
          {iosHint ? (
            <p className="mt-0.5 text-[0.74rem] leading-snug text-muted">
              הקישו על <span className="font-bold">שיתוף</span> ואז על{" "}
              <span className="font-bold">«הוסף למסך הבית»</span>
            </p>
          ) : (
            <p className="mt-0.5 text-[0.74rem] leading-snug text-muted">
              גישה מהירה מהמסך הראשי — בלי להוריד מחנות
            </p>
          )}
        </div>
        {!iosHint && (
          <button
            type="button"
            onClick={install}
            className="shrink-0 rounded-lg bg-brand-red px-4 py-2 text-[0.82rem] font-bold text-white hover:bg-brand-red-dark"
          >
            התקנה
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="סגירה"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-soft"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
