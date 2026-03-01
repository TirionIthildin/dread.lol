"use client";

import { useEffect } from "react";
import ConnectionLostBanner from "./ConnectionLostBanner";

/**
 * Registers the minimal PWA service worker and renders the connection-lost banner.
 * The PWA is used ONLY to show when the user has lost connection — no offline content.
 */
export default function PwaRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        reg.update();
      } catch {
        // SW registration is best-effort; app works without it
      }
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return <ConnectionLostBanner />;
}
