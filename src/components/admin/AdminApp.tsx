"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  apiGet,
  getAuthConfig,
  getAuthToken,
  setAuthToken,
} from "./lib";
import { Toast, type ToastState } from "./ui";
import BrandTab from "./BrandTab";
import HomepageTab from "./HomepageTab";
import ProductsTab from "./ProductsTab";
import CategoriesTab from "./CategoriesTab";

type TabId = "brand" | "homepage" | "products" | "categories";

const TABS: { id: TabId; label: string }[] = [
  { id: "homepage", label: "עמוד הבית" },
  { id: "products", label: "מוצרים" },
  { id: "categories", label: "קטגוריות" },
  { id: "brand", label: "מותג ופרטים" },
];

type AuthState = "checking" | "authorized" | "denied";

type GoogleId = {
  initialize: (cfg: {
    client_id: string;
    callback: (resp: { credential?: string }) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
  disableAutoSelect: () => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

function isLocalHost(): boolean {
  return (
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
  );
}

function decodeEmail(jwt: string): string {
  try {
    let s = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const payload = JSON.parse(atob(s)) as { email?: string; name?: string };
    return payload.email || payload.name || "מנהל";
  } catch {
    return "מנהל";
  }
}

function loadGsiScript(): Promise<GoogleId | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null);
    if (window.google?.accounts?.id) return resolve(window.google.accounts.id);
    const existing = document.getElementById("gsi-script");
    const onReady = () => resolve(window.google?.accounts?.id ?? null);
    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      return;
    }
    const s = document.createElement("script");
    s.id = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = onReady;
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

export default function AdminApp() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [user, setUser] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [tab, setTab] = useState<TabId>("homepage");
  const [toast, setToast] = useState<ToastState>(null);
  const btnRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef(false);

  const onToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Validate a Google token against the API (server enforces the allowlist).
  const enter = useCallback(async (token: string, email: string): Promise<boolean> => {
    setAuthToken(token);
    try {
      await apiGet("/api/categories");
      setUser(email);
      setLoginError("");
      setAuth("authorized");
      return true;
    } catch {
      setAuthToken(null);
      return false;
    }
  }, []);

  // Initial auth decision: local dev bypass, or resume a stored token.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isLocalHost()) {
        setUser("מצב פיתוח מקומי");
        setAuth("authorized");
        return;
      }
      const cfg = await getAuthConfig();
      if (cancelled) return;
      setClientId(cfg.googleClientId);

      const stored = getAuthToken();
      if (stored) {
        const ok = await enter(stored, decodeEmail(stored));
        if (cancelled) return;
        if (ok) return;
      }
      setAuth("denied");
    })();
    return () => {
      cancelled = true;
    };
  }, [enter]);

  // Render the "Sign in with Google" button on the denied screen.
  useEffect(() => {
    if (auth !== "denied" || !clientId || renderedRef.current) return;
    let cancelled = false;
    (async () => {
      const gid = await loadGsiScript();
      if (cancelled || !gid || !btnRef.current) return;
      gid.initialize({
        client_id: clientId,
        cancel_on_tap_outside: true,
        callback: async (resp) => {
          if (!resp.credential) return;
          const ok = await enter(resp.credential, decodeEmail(resp.credential));
          if (!ok) {
            setLoginError("לחשבון הזה אין הרשאת מנהל. פנה למנהל האתר.");
          }
        },
      });
      gid.renderButton(btnRef.current, {
        type: "standard",
        theme: "filled_blue",
        size: "large",
        text: "signin_with",
        shape: "pill",
        locale: "he",
        width: 280,
      });
      renderedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [auth, clientId, enter]);

  const logout = useCallback(() => {
    try {
      window.google?.accounts?.id?.disableAutoSelect();
    } catch {
      /* ignore */
    }
    setAuthToken(null);
    renderedRef.current = false;
    setUser("");
    setAuth("denied");
  }, []);

  if (auth === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-gray-100 text-gray-500">
        בודק הרשאות…
      </div>
    );
  }

  if (auth === "denied") {
    return (
      <div className="grid min-h-screen place-items-center bg-gray-100 p-6" dir="rtl">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-red-700 text-lg font-black text-white">
            ח
          </span>
          <h1 className="mb-2 text-xl font-extrabold text-gray-800">ניהול · חשמל חנקין</h1>
          <p className="mb-6 text-sm text-gray-500">
            התחבר עם חשבון Google המורשה כדי לנהל את האתר.
          </p>
          {clientId ? (
            <div className="flex justify-center">
              <div ref={btnRef} />
            </div>
          ) : (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              ההתחברות עדיין לא הוגדרה. יש להגדיר את מזהה Google (Client ID).
            </p>
          )}
          {loginError ? (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {loginError}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-700 text-sm font-black text-white">ח</span>
            <div>
              <h1 className="text-base font-extrabold text-gray-800">ניהול · חשמל חנקין</h1>
              <p className="text-[0.7rem] text-gray-400">{user}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-500 hover:text-red-700">
              צפייה באתר ↗
            </a>
            <button onClick={logout} className="text-sm font-semibold text-gray-400 hover:text-red-700">
              יציאה
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition ${
                tab === t.id
                  ? "border-red-700 text-red-700"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {tab === "brand" ? <BrandTab onToast={onToast} /> : null}
        {tab === "homepage" ? <HomepageTab onToast={onToast} /> : null}
        {tab === "products" ? <ProductsTab onToast={onToast} /> : null}
        {tab === "categories" ? <CategoriesTab onToast={onToast} /> : null}
      </main>

      <Toast toast={toast} />
    </div>
  );
}
