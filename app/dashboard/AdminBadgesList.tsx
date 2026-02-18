"use client";

import { useTransition, useState } from "react";
import { setUserBadgesAction } from "@/app/dashboard/actions";
import type { AdminUser } from "@/app/dashboard/AdminUserModal";

type Props = {
  users: AdminUser[];
  onUpdate: () => void;
};

export default function AdminBadgesList({ users, onUpdate }: Props) {
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function handleToggle(userId: string, badge: "verified" | "staff", value: boolean) {
    setUpdatingId(userId);
    startTransition(async () => {
      const result = await setUserBadgesAction(userId, { [badge]: value });
      if (result.error) {
        alert(result.error);
      } else {
        onUpdate();
      }
      setUpdatingId(null);
    });
  }

  return (
    <ul className="space-y-2 max-h-64 overflow-y-auto">
      {users.map((u) => {
        const busy = updatingId === u.id && isPending;
        const displayName = u.displayName || u.username || `User ${u.id.slice(0, 8)}…`;
        return (
          <li
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {u.avatarUrl ? (
                <img
                  src={u.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full border border-[var(--border)] shrink-0"
                  width={32}
                  height={32}
                />
              ) : (
                <div className="h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center justify-center text-xs text-[var(--muted)]">
                  ?
                </div>
              )}
              <span className="text-sm font-medium text-[var(--foreground)] truncate" title={displayName}>
                {displayName}
              </span>
              {!u.approved && (
                <span className="text-xs text-[var(--muted)] shrink-0">(pending)</span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer disabled:opacity-50">
                <input
                  type="checkbox"
                  checked={u.verified}
                  disabled={busy}
                  onChange={(e) => handleToggle(u.id, "verified", e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-[var(--muted)]">Verified</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer disabled:opacity-50">
                <input
                  type="checkbox"
                  checked={u.staff}
                  disabled={busy}
                  onChange={(e) => handleToggle(u.id, "staff", e.target.checked)}
                  className="rounded border-[var(--border)] text-amber-500 focus:ring-amber-500"
                />
                <span className="text-[var(--muted)]">Staff</span>
              </label>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
