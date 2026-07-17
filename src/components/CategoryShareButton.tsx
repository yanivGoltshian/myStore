"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CategoryShareButtonProps = {
  /** Absolute URL of the category page to copy to the clipboard. */
  shareUrl: string;
};

const LinkIcon = (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export default function CategoryShareButton({ shareUrl }: CategoryShareButtonProps) {
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const copyText = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* fall through to legacy path */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }, []);

  const onCopy = useCallback(async () => {
    const ok = await copyText(shareUrl);
    showToast(ok ? "הקישור הועתק! ✓" : "לא הצלחנו להעתיק, נסו שוב");
  }, [shareUrl, copyText, showToast]);

  return (
    <>
      <button
        type="button"
        onClick={onCopy}
        aria-label="העתקת קישור"
        title="העתקת קישור"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:border-white/40 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
      >
        {LinkIcon}
      </button>
      {toast && (
        <span className="share-toast" role="status" aria-live="polite">
          {toast}
        </span>
      )}
    </>
  );
}
