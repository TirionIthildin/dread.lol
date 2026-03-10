"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Crown } from "@phosphor-icons/react";
import { toast } from "sonner";

type Props = {
  token: string;
  isLoggedIn: boolean;
  alreadyRedeemed?: boolean;
};

export default function PremiumRedeemClient({ token, isLoggedIn, alreadyRedeemed }: Props) {
  const [status, setStatus] = useState<"idle" | "redeeming" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn || status !== "idle" || alreadyRedeemed) return;
    setStatus("redeeming");
    fetch("/api/premium/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setStatus("error");
          setError(data.error);
          toast.error(data.error);
        } else {
          setStatus("success");
          toast.success("Premium activated! Enjoy all features.");
        }
      })
      .catch(() => {
        setStatus("error");
        setError("Something went wrong");
        toast.error("Failed to redeem");
      });
  }, [isLoggedIn, token, status, alreadyRedeemed]);

  if (alreadyRedeemed) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12 text-center">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
            <Crown size={32} weight="regular" className="text-[var(--accent)]" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-[var(--foreground)]">
            Already redeemed
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            You&apos;ve already claimed Premium from this link. Each link can only be redeemed once per account.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-6 py-3 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12 text-center">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
            <Crown size={32} weight="regular" className="text-[var(--accent)]" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-[var(--foreground)]">
            Redeem Premium
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Sign in to claim Premium and unlock all features.
          </p>
          <Link
            href="/api/auth/discord"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Sign in with Discord
          </Link>
          <p className="mt-4 text-xs text-[var(--muted)]">
            After signing in, return to this page to redeem.
          </p>
        </div>
      </div>
    );
  }

  if (status === "redeeming") {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12 text-center">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/10 animate-pulse">
            <Crown size={32} weight="regular" className="text-[var(--accent)]" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-[var(--foreground)]">
            Redeeming…
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Activating Premium on your account.
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12 text-center">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
            <Crown size={32} weight="regular" className="text-[var(--accent)]" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-[var(--foreground)]">
            Premium activated!
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            You now have full access to Premium features.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-6 py-3 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-12 text-center">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--warning)]/10">
          <Crown size={32} weight="regular" className="text-[var(--warning)]" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-[var(--foreground)]">
          Couldn&apos;t redeem
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {error ?? "Something went wrong."}
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
