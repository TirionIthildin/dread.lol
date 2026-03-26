"use client";

import { useState } from "react";
import Link from "next/link";
import TerminalWindow from "@/app/components/TerminalWindow";

export default function MfaPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const c = code.trim().replace(/\s/g, "");
    if (c.length < 6) {
      setError("Enter your authenticator code or a backup code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Verification failed");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md px-2 py-4">
      <p className="mb-4 text-center text-[11px] text-[var(--muted)]">
        <Link href="/dashboard" className="text-[var(--accent)] hover:underline">
          Dashboard
        </Link>
        <span className="mx-1 text-[var(--muted)]/60">·</span>
        <Link href="/" className="text-[var(--accent)] hover:underline">
          Home
        </Link>
      </p>
      <TerminalWindow title="user@dread:~ — 2fa" className="animate-fade-in">
        <div className="space-y-3">
          <p className="text-xs text-[var(--muted)]">
            Enter the 6-digit code from your authenticator app, or a one-time backup code.
          </p>
          <form onSubmit={onSubmit} className="space-y-2">
            <input
              className="w-full rounded border border-[var(--border)] bg-transparent px-2 py-2 text-sm text-[var(--foreground)] font-mono"
              placeholder="123456 or backup code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
              autoFocus
            />
            {error && <p className="text-xs text-[var(--warning)]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--accent)]/90 px-3 py-2 text-sm font-medium text-[var(--bg)] hover:bg-[var(--accent)] disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Continue"}
            </button>
          </form>
        </div>
      </TerminalWindow>
    </div>
  );
}
