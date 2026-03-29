"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type DashboardNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Ref to the control that opened the drawer — receives focus when the drawer closes. */
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
  children: ReactNode;
};

/**
 * Full-height panel from the right for mobile dashboard navigation.
 * Focus trap, Escape to close, overlay click to close, restores focus to the menu button when closed.
 */
export function DashboardNavDrawer({
  open,
  onClose,
  title,
  returnFocusRef,
  children,
}: DashboardNavDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;

    const getFocusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => (el.offsetParent !== null || el.getClientRects().length > 0) && !el.hasAttribute("disabled"));

    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = getFocusable();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onTab);
    requestAnimationFrame(() => {
      getFocusable()[0]?.focus();
    });
    return () => document.removeEventListener("keydown", onTab);
  }, [open]);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      returnFocusRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open, returnFocusRef]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm motion-reduce:backdrop-blur-none"
        onClick={onClose}
        aria-label="Close menu"
      />
      <div
        ref={panelRef}
        className="absolute inset-y-0 right-0 flex w-[min(22rem,calc(100vw-1rem))] flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <h2 id={titleId} className="text-sm font-semibold text-[var(--foreground)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] p-2 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            aria-label="Close navigation menu"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
