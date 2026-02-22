"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye } from "@phosphor-icons/react/dist/ssr";
import type { VouchedByUser } from "@/lib/member-profiles";

const iconProps = { size: 14, weight: "regular" as const, className: "shrink-0 text-current" };

interface ProfileVouchesProps {
  slug: string;
  count: number;
  vouchedBy: VouchedByUser[];
  mutualVouchers?: VouchedByUser[];
  currentUserHasVouched: boolean;
  canVouch: boolean;
  updatedAt?: string;
  viewCount?: number | null;
}

export default function ProfileVouches({
  slug,
  count: initialCount,
  vouchedBy: initialVouchedBy,
  mutualVouchers = [],
  currentUserHasVouched: initialHasVouched,
  canVouch,
  updatedAt,
  viewCount,
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

  const parts: React.ReactNode[] = [];
  if (mutualVouchers.length > 0) {
    parts.push(
      <span key="mutual">
        You&apos;re both vouched by{" "}
        {mutualVouchers.map((u, i) => (
          <span key={u.userId}>
            {i > 0 && ", "}
            <span className="font-medium text-[var(--foreground)]">{displayName(u)}</span>
          </span>
        ))}
      </span>
    );
  }
  parts.push(
    <span key="count">
      {count} {count === 1 ? "vouch" : "vouches"}
    </span>
  );
  if (updatedAt) parts.push(<span key="updated">Last updated {updatedAt}</span>);
  if (viewCount != null) {
    parts.push(
      <span key="views" className="inline-flex items-center gap-1">
        <Eye {...iconProps} aria-hidden />
        {viewCount} view{viewCount !== 1 ? "s" : ""}
      </span>
    );
  }

  return (
    <div className="mt-4 pt-3 border-t border-[var(--border)]/50">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-[var(--muted)] min-w-0 flex-1">
          {parts.flatMap((p, i) =>
            i === 0 ? [<span key={i}>{p}</span>] : [<span key={`s-${i}`} className="opacity-60">·</span>, <span key={i}>{p}</span>]
          )}
        </div>
        {vouchedBy.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
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
            className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] disabled:opacity-50"
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
