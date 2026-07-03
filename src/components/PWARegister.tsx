"use client";

import { useEffect } from "react";

/** Registers the PWA service worker and auto-reloads once when a new deploy
 *  takes control, so users never get stuck on a stale cached bundle. */
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    // Whether a SW already controls this page. If so, a controllerchange means
    // a NEW deploy took over → reload to pick up fresh assets. On the very first
    // install there is no prior controller, so we must not reload (nothing new).
    const hadController = !!navigator.serviceWorker.controller;

    const onControllerChange = () => {
      if (refreshing || !hadController) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let reg: ServiceWorkerRegistration | undefined;
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((r) => {
          reg = r;
          // Proactively check for a newer SW right away.
          r.update().catch(() => {});
        })
        .catch(() => {});
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    // Re-check for a new deploy whenever the user returns to the tab / PWA.
    const onVisible = () => {
      if (document.visibilityState === "visible") reg?.update().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
