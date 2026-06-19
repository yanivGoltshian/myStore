"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, type Principal } from "./lib";
import { Toast, type ToastState } from "./ui";
import BrandTab from "./BrandTab";
import HomepageTab from "./HomepageTab";
import ProductsTab from "./ProductsTab";

type TabId = "brand" | "homepage" | "products";

const TABS: { id: TabId; label: string }[] = [
  { id: "homepage", label: "עמוד הבית" },
  { id: "products", label: "מוצרים" },
  { id: "brand", label: "מותג ופרטים" },
];

type AuthState = "checking" | "authorized" | "denied";

export default function AdminApp() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [user, setUser] = useState<string>("");
  const [tab, setTab] = useState<TabId>("homepage");
  const [toast, setToast] = useState<ToastState>(null);

  const onToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const isLocal =
      typeof window !== "undefined" &&
      /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
    apiGet<Principal>("/.auth/me")
      .then((p) => {
        const cp = p?.clientPrincipal;
        const isAdmin = !!cp && Array.isArray(cp.userRoles) && cp.userRoles.includes("admin");
        if (isAdmin) {
          setUser(cp!.userDetails);
          setAuth("authorized");
        } else if (isLocal) {
          setUser("מצב פיתוח מקומי");
          setAuth("authorized");
        } else {
          setAuth("denied");
        }
      })
      .catch(() => {
        // /.auth/me not available (e.g. plain `next dev`) → allow on localhost
        if (isLocal) {
          setUser("מצב פיתוח מקומי");
          setAuth("authorized");
        } else {
          setAuth("denied");
        }
      });
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
      <div className="grid min-h-screen place-items-center bg-gray-100 p-6">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-2 text-xl font-extrabold text-gray-800">ניהול · חשמל חנקין</h1>
          <p className="mb-6 text-sm text-gray-500">נדרשת התחברות עם הרשאת מנהל כדי לגשת לפאנל.</p>
          <a
            href="/.auth/login/aad?post_login_redirect_uri=/admin"
            className="inline-flex w-full items-center justify-center rounded-lg bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800"
          >
            התחברות
          </a>
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
            <a href="/.auth/logout" className="text-sm font-semibold text-gray-400 hover:text-red-700">
              יציאה
            </a>
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
      </main>

      <Toast toast={toast} />
    </div>
  );
}
