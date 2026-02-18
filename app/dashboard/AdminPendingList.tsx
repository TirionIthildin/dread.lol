"use client";

import { useTransition, useState } from "react";
import { approveUserAction } from "@/app/dashboard/actions";

export type PendingUser = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
};

type Props = {
  pending: PendingUser[];
  onApproved?: () => void;
};

export default function AdminPendingList({ pending, onApproved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  function handleApprove(userId: string) {
    setApprovingId(userId);
    startTransition(async () => {
      const result = await approveUserAction(userId);
      if (result.error) {
        alert(result.error);
        setApprovingId(null);
      } else {
        onApproved?.() ?? window.location.reload();
        setApprovingId(null);
      }
    });
  }

  return (
    <ul className="space-y-3">
      {pending.map((u) => {
        const busy = approvingId === u.id && isPending;
        return (
          <li
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              {u.avatarUrl ? (
                <img
                  src={u.avatarUrl}
                  alt=""
                  className="h-10 w-10 rounded-full border border-[var(--border)]"
                  width={40}
                  height={40}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] text-sm">
                  ?
                </div>
              )}
              <div>
                <p className="font-medium text-[var(--foreground)]">
                  {u.displayName || u.username || `User ${u.id.slice(0, 8)}…`}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {u.username && `@${u.username} · `}
                  Discord ID: {u.id}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Signed up {new Date(u.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleApprove(u.id)}
              disabled={busy}
              className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-3 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/20 disabled:opacity-50"
            >
              {busy ? "Approving…" : "Approve"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
