"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { approveUserAction, setUserBadgesAction } from "@/app/dashboard/actions";

export type AdminUser = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  approved: boolean;
  verified: boolean;
  staff: boolean;
  createdAt: string;
};

type Props = {
  user: AdminUser;
  onClose: () => void;
  onUpdate: (updated: AdminUser) => void;
};

export default function AdminUserModal({ user, onClose, onUpdate }: Props) {
  const [approved, setApproved] = useState(user.approved);
  const [verified, setVerified] = useState(user.verified);
  const [staff, setStaff] = useState(user.staff);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setApproved(user.approved);
    setVerified(user.verified);
    setStaff(user.staff);
  }, [user.id, user.approved, user.verified, user.staff]);

  function handleApproveToggle() {
    setError(null);
    startTransition(async () => {
      const result = await approveUserAction(user.id);
      if (result.error) {
        setError(result.error);
      } else {
        setApproved(true);
        onUpdate({ ...user, approved: true });
      }
    });
  }

  function handleBadge(badge: "verified" | "staff", value: boolean) {
    setError(null);
    if (badge === "verified") setVerified(value);
    else setStaff(value);
    startTransition(async () => {
      const result = await setUserBadgesAction(user.id, { [badge]: value });
      if (result.error) {
        setError(result.error);
        if (badge === "verified") setVerified(!value);
        else setStaff(!value);
      } else {
        onUpdate({ ...user, [badge]: value });
      }
    });
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const displayName = user.displayName || user.username || `User ${user.id.slice(0, 8)}…`;

  const content = (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-user-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative z-10 w-full min-w-[280px] max-w-[28rem] rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3 bg-[var(--bg)]/80 shrink-0">
          <h3 id="admin-user-modal-title" className="text-base font-semibold text-[var(--foreground)]">
            User details
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Close"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4 min-h-[220px]">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-12 w-12 rounded-full border border-[var(--border)] shrink-0"
                width={48}
                height={48}
              />
            ) : (
              <div className="h-12 w-12 rounded-full border border-[var(--border)] bg-[var(--bg)] shrink-0 flex items-center justify-center text-[var(--muted)]">
                ?
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-[var(--foreground)] truncate">{displayName}</p>
              {user.username && (
                <p className="text-xs text-[var(--muted)]">@{user.username}</p>
              )}
              <p className="text-xs text-[var(--muted)] font-mono truncate" title={user.id}>
                ID: {user.id}
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-[var(--warning)]" role="alert">
              {error}
            </p>
          )}

          {!user.approved && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 px-3 py-2">
              <span className="text-sm text-[var(--muted)]">Approve user</span>
              <button
                type="button"
                onClick={handleApproveToggle}
                disabled={isPending}
                className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-3 py-1.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Approving…" : "Approve"}
              </button>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--muted)]">Badges</p>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50">
                <input
                  type="checkbox"
                  checked={verified}
                  disabled={isPending}
                  onChange={(e) => handleBadge("verified", e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-[var(--foreground)]">Verified</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50">
                <input
                  type="checkbox"
                  checked={staff}
                  disabled={isPending}
                  onChange={(e) => handleBadge("staff", e.target.checked)}
                  className="rounded border-[var(--border)] text-amber-500 focus:ring-amber-500"
                />
                <span className="text-[var(--foreground)]">Staff</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
