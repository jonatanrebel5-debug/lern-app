"use client";

import { useEffect } from "react";

/** Registriert den Service Worker (nur im Production-Build, damit Dev-Reloads nicht gecacht werden). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* ignorieren – App funktioniert auch ohne SW */
    });
  }, []);
  return null;
}
