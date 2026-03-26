"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { setUserBadgesAction, setUserRestrictedAction, setUserCustomBadgesAction, setCustomBadgeVouchersAction, wipeUserSubscriptionAction } from "@/app/[locale]/dashboard/actions";
import type { CustomBadge } from "@/app/[locale]/dashboard/AdminBadgesPanel";

export type AdminUser = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  approved: boolean;
  verified: boolean;
  staff: boolean;
  premiumGranted: boolean;
  verifiedCreator: boolean;
  restricted?: boolean;
  customBadgeVouchers?: number;
  createdAt: string;
};

type Props = {
  user: AdminUser;
  onClose: () => void;
  onUpdate: (updated: AdminUser) => void;
};

export default function AdminUserModal({ user, onClose, onUpdate }: Props) {
  const [verified, setVerified] = useState(user.verified);
  const [staff, setStaff] = useState(user.staff);
  const [premiumGranted, setPremiumGranted] = useState(user.premiumGranted);
  const [verifiedCreator, setVerifiedCreator] = useState(user.verifiedCreator ?? false);
  const [restricted, setRestricted] = useState(user.restricted ?? false);
  const [customBadges, setCustomBadges] = useState<CustomBadge[]>([]);
  const [userBadgeIds, setUserBadgeIds] = useState<string[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [wipePending, setWipePending] = useState(false);
  const [customBadgeVouchers, setCustomBadgeVouchers] = useState(user.customBadgeVouchers ?? 0);
  const [vouchersPending, setVouchersPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVerified(user.verified);
    setStaff(user.staff);
    setPremiumGranted(user.premiumGranted);
    setVerifiedCreator(user.verifiedCreator ?? false);
    setRestricted(user.restricted ?? false);
    setCustomBadgeVouchers(user.customBadgeVouchers ?? 0);
  }, [user.id, user.verified, user.staff, user.premiumGranted, user.verifiedCreator, user.restricted, user.customBadgeVouchers]);

  useEffect(() => {
    let cancelled = false;
    setBadgesLoading(true);
    fetch(`/api/dashboard/admin/badges?userId=${encodeURIComponent(user.id)}`)
      .then((res) => (res.ok ? res.json() : { badges: [], userBadgeIds: [] }))
      .then((data) => {
        if (!cancelled) {
          setCustomBadges(data.badges ?? []);
          setUserBadgeIds(data.userBadgeIds ?? []);
        }
      })
      .finally(() => {
        if (!cancelled) setBadgesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  function handleRestrictedToggle(value: boolean) {
    setError(null);
    setRestricted(value);
    startTransition(async () => {
      const result = await setUserRestrictedAction(user.id, value);
      if (result.error) {
        setError(result.error);
        setRestricted(!value);
      } else {
        onUpdate({ ...user, restricted: value });
      }
    });
  }

  function handleBadge(badge: "verified" | "staff" | "premiumGranted" | "verifiedCreator", value: boolean) {
    setError(null);
    if (badge === "verified") setVerified(value);
    else if (badge === "staff") setStaff(value);
    else if (badge === "premiumGranted") setPremiumGranted(value);
    else setVerifiedCreator(value);
    startTransition(async () => {
      const payload =
        badge === "verified"
          ? { verified: value }
          : badge === "staff"
            ? { staff: value }
            : badge === "premiumGranted"
              ? { premiumGranted: value }
              : { verifiedCreator: value };
      const result = await setUserBadgesAction(user.id, payload);
      if (result.error) {
        setError(result.error);
        if (badge === "verified") setVerified(!value);
        else if (badge === "staff") setStaff(!value);
        else if (badge === "premiumGranted") setPremiumGranted(!value);
        else setVerifiedCreator(!value);
      } else {
        onUpdate({ ...user, ...payload });
      }
    });
  }

  function handleWipeSubscription() {
    if (!confirm("Wipe this user's subscription and order data from the local database? They will lose Premium/access until Polar re-syncs (or they re-subscribe).")) return;
    setError(null);
    setWipePending(true);
    wipeUserSubscriptionAction(user.id).then((result) => {
      setWipePending(false);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result.wiped) {
        toast.success(`Wiped ${result.wiped.subscriptions} sub(s), ${result.wiped.orders} order(s), ${result.wiped.badges} badge(s)`);
        onClose();
      }
    });
  }

  async function handleSetVouchers() {
    const count = Math.max(0, Math.round(customBadgeVouchers));
    setError(null);
    setVouchersPending(true);
    const result = await setCustomBadgeVouchersAction(user.id, count);
    setVouchersPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      setCustomBadgeVouchers(count);
      onUpdate({ ...user, customBadgeVouchers: count });
    }
  }

  function handleCustomBadgeToggle(badgeId: string, checked: boolean) {
    const next = checked
      ? [...userBadgeIds, badgeId]
      : userBadgeIds.filter((id) => id !== badgeId);
    setUserBadgeIds(next);
    setError(null);
    startTransition(async () => {
      const result = await setUserCustomBadgesAction(user.id, next);
      if (result.error) setError(result.error);
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
            <X size={20} className="shrink-0" aria-hidden />
          </button>
        </div>
        <div className="p-4 space-y-4 min-h-[220px]">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt=""
                className="h-12 w-12 rounded-full border border-[var(--border)] shrink-0"
                width={48}
                height={48}
                unoptimized
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

          <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 px-3 py-2">
            <span className="text-sm text-[var(--muted)]">Restrict profile</span>
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50">
              <input
                type="checkbox"
                checked={restricted}
                disabled={isPending}
                onChange={(e) => handleRestrictedToggle(e.target.checked)}
                className="rounded border-[var(--border)] text-amber-500 focus:ring-amber-500"
              />
              <span className="text-[var(--foreground)]">{restricted ? "Restricted" : "Active"}</span>
            </label>
          </div>

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
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50">
                <input
                  type="checkbox"
                  checked={premiumGranted}
                  disabled={isPending}
                  onChange={(e) => handleBadge("premiumGranted", e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-[var(--foreground)]">Premium (free)</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50">
                <input
                  type="checkbox"
                  checked={verifiedCreator}
                  disabled={isPending}
                  onChange={(e) => handleBadge("verifiedCreator", e.target.checked)}
                  className="rounded border-[var(--border)] text-violet-500 focus:ring-violet-500"
                />
                <span className="text-[var(--foreground)]">Verified Creator</span>
              </label>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-sm text-[var(--muted)]">Custom badge vouchers</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={customBadgeVouchers}
                  onChange={(e) => setCustomBadgeVouchers(Number(e.target.value) || 0)}
                  disabled={vouchersPending}
                  className="w-16 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSetVouchers}
                  disabled={vouchersPending}
                  className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-2 py-1 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50 transition-colors"
                >
                  {vouchersPending ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
            {customBadges.length > 0 && (
              <div className="pt-2 border-t border-[var(--border)]/50">
                <p className="text-xs font-medium text-[var(--muted)] mb-2">Custom badges</p>
                <div className="flex flex-wrap gap-3">
                  {customBadges.map((b) => (
                    <label
                      key={b.id}
                      className="inline-flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50"
                    >
                      <input
                        type="checkbox"
                        checked={userBadgeIds.includes(b.id)}
                        disabled={isPending}
                        onChange={(e) => handleCustomBadgeToggle(b.id, e.target.checked)}
                        className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                      />
                      <span className="text-[var(--foreground)]">{b.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {!badgesLoading && customBadges.length === 0 && (
              <p className="text-xs text-[var(--muted)] pt-1">
                Create custom badges in the Badges section to assign them here.
              </p>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--muted)] mb-2">Subscription</p>
            <button
              type="button"
              onClick={handleWipeSubscription}
              disabled={wipePending}
              className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
            >
              {wipePending ? "Wiping…" : "Wipe subscription data"}
            </button>
            <p className="text-xs text-[var(--muted)] mt-1">
              Clears cached Polar subscriptions and orders. User loses Premium/addons until Polar re-syncs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
