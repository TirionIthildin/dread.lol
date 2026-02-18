"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { VouchedByUser } from "@/lib/member-profiles";

interface ProfileVouchesProps {
  slug: string;
  count: number;
  vouchedBy: VouchedByUser[];
  currentUserHasVouched: boolean;
  canVouch: boolean;
}

export default function ProfileVouches({
  slug,
  count: initialCount,
  vouchedBy: initialVouchedBy,
  currentUserHasVouched: initialHasVouched,
  canVouch,
}: ProfileVouchesProps) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [vouchedBy, setVouchedBy] = useState(initialVouchedBy);
  const [hasVouched, setHasVouched] = useState(initialHasVouched);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleVouch = async () => {
    if (!canVouch || loading) return;
    setLoading(true);
    setError(null);
    try {
      const method = hasVouched ? "DELETE" : "POST";
      const res = await fetch(`/api/profiles/${encodeURIComponent(slug)}/vouch`, { method });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setCount(data.count);
      setVouchedBy(data.vouchedBy ?? []);
      setHasVouched(data.hasVouched ?? false);
      router.refresh();
    } catch {
      setError("Failed to update vouch.");
    } finally {
      setLoading(false);
    }
  };

  const displayName = (u: VouchedByUser) => u.displayName?.trim() || u.username || "Someone";

  return (
    <div className="mt-4 pt-3 border-t border-[var(--border)]/50">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--muted)]">
          {count} {count === 1 ? "vouch" : "vouches"}
        </span>
        {vouchedBy.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {vouchedBy.slice(0, 12).map((u) => (
              <span
                key={u.userId}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border)]/60 bg-[var(--bg)]/80 px-2 py-0.5 text-xs text-[var(--foreground)]"
                title={displayName(u)}
              >
                {u.avatarUrl && u.avatarUrl.includes("cdn.discordapp.com") ? (
                  <Image
                    src={u.avatarUrl}
                    alt=""
                    width={16}
                    height={16}
                    className="size-4 rounded-full object-cover"
                  />
                ) : (
                  <span className="size-4 rounded-full bg-[var(--accent)]/30 flex items-center justify-center text-[10px] font-medium text-[var(--accent)]">
                    {(u.displayName || u.username || "?")[0].toUpperCase()}
                  </span>
                )}
                <span className="max-w-[80px] truncate">{displayName(u)}</span>
              </span>
            ))}
            {vouchedBy.length > 12 && (
              <span className="text-xs text-[var(--muted)]">+{vouchedBy.length - 12} more</span>
            )}
          </div>
        )}
        {canVouch && (
          <button
            type="button"
            onClick={toggleVouch}
            disabled={loading}
            className="ml-auto shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] disabled:opacity-50"
          >
            {loading ? "…" : hasVouched ? "Unvouch" : "Vouch"}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
