"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import TerminalWindow from "@/app/components/TerminalWindow";
import { FeatureUpdateList } from "@/app/components/FeatureUpdateList";
import { FEATURE_UPDATES } from "@/lib/updates";

const INITIAL_COUNT = 5;

function UpdatesModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("home");
  const tc = useTranslations("common");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="updates-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3 bg-[var(--bg)]/90 shrink-0">
          <h2
            id="updates-modal-title"
            className="text-base font-semibold text-[var(--foreground)]"
          >
            {t("updatesRecent")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            aria-label={tc("close")}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <FeatureUpdateList updates={FEATURE_UPDATES} />
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}

export default function FeatureUpdates() {
  const [modalOpen, setModalOpen] = useState(false);
  const t = useTranslations("home");
  const visibleUpdates = FEATURE_UPDATES.slice(0, INITIAL_COUNT);
  const hasMore = FEATURE_UPDATES.length > INITIAL_COUNT;
  const moreCount = FEATURE_UPDATES.length - INITIAL_COUNT;

  return (
    <>
      <TerminalWindow title={t("terminalUpdatesTitle")} className="animate-fade-in">
        <div className="space-y-3">
          <p className="text-xs text-[var(--muted)] uppercase tracking-wider">{t("updatesRecent")}</p>
          <FeatureUpdateList updates={visibleUpdates} />
          {hasMore && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-xs font-mono text-[var(--accent)] hover:underline focus:outline-none focus:underline"
            >
              {t("updatesMore", { count: moreCount })}
            </button>
          )}
        </div>
      </TerminalWindow>
      {modalOpen && <UpdatesModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
