"use client";

import { useEffect, useState } from "react";

/**
 * Shows a banner when the user loses connection to the website.
 * The PWA is used ONLY for this purpose — no offline content caching.
 */
export default function ConnectionLostBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center px-4 py-3 bg-[#08090a] border-t border-[#1a1f26] border-t-amber-500/50 shadow-[0_-4px_12px_rgba(0,0,0,0.3)]"
    >
      <p className="text-sm font-mono text-amber-400">
        You&apos;ve lost connection to the website. Check your network and try again.
      </p>
    </div>
  );
}
