"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Status = { enabled: boolean; backupCodesRemaining: number };

export default function DashboardTotpSection() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [enrollUrl, setEnrollUrl] = useState<string | null>(null);
  const [enrollSecret, setEnrollSecret] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [regenCode, setRegenCode] = useState("");
  const [shownBackup, setShownBackup] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/totp/status", { credentials: "include" });
      const data = (await res.json()) as Status & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setStatus({ enabled: data.enabled, backupCodesRemaining: data.backupCodesRemaining });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load 2FA status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function startEnroll() {
    setBusy(true);
    setEnrollUrl(null);
    setEnrollSecret(null);
    setConfirmCode("");
    setShownBackup(null);
    try {
      const res = await fetch("/api/auth/totp/enroll/start", { method: "POST", credentials: "include" });
      const data = (await res.json()) as { otpauthUrl?: string; secretBase32?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not start enrollment");
      setEnrollUrl(data.otpauthUrl ?? null);
      setEnrollSecret(data.secretBase32 ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/totp/enroll/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: confirmCode.trim() }),
      });
      const data = (await res.json()) as { backupCodes?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      setShownBackup(data.backupCodes ?? []);
      setEnrollUrl(null);
      setEnrollSecret(null);
      setConfirmCode("");
      toast.success("Two-factor authentication enabled");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function disableTotp() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/totp/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: disableCode.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      setDisableCode("");
      toast.success("Two-factor authentication disabled");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function regenerateBackups() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/totp/backup-codes/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: regenCode.trim() }),
      });
      const data = (await res.json()) as { backupCodes?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      setShownBackup(data.backupCodes ?? []);
      setRegenCode("");
      toast.success("New backup codes generated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !status) {
    return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  }

  return (
    <div className="space-y-4 text-sm">
      {shownBackup && shownBackup.length > 0 && (
        <div
          className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-3 space-y-2"
          role="status"
        >
          <p className="text-xs font-medium text-[var(--foreground)]">Save these backup codes now</p>
          <p className="text-[11px] text-[var(--muted)]">
            Each code works once. Store them somewhere safe—we won’t show them again.
          </p>
          <ul className="font-mono text-xs text-[var(--foreground)] space-y-0.5 list-none p-0 m-0">
            {shownBackup.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setShownBackup(null)}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            I’ve saved them
          </button>
        </div>
      )}

      {!status.enabled ? (
        <div className="space-y-3">
          <p className="text-[var(--muted)] text-xs">
            Use an authenticator app (1Password, Google Authenticator, etc.) for a second step at sign-in.
          </p>
          {!enrollUrl ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => startEnroll()}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium hover:border-[var(--accent)]/50 disabled:opacity-50"
            >
              {busy ? "…" : "Set up authenticator"}
            </button>
          ) : (
            <div className="space-y-2">
              {enrollUrl && (
                <a
                  href={enrollUrl}
                  className="inline-block text-xs text-[var(--accent)] hover:underline break-all"
                >
                  Open in authenticator app
                </a>
              )}
              {enrollSecret && (
                <p className="text-[11px] text-[var(--muted)] break-all">
                  Manual entry: <span className="font-mono text-[var(--foreground)]">{enrollSecret}</span>
                </p>
              )}
              <input
                className="w-full max-w-xs rounded border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs font-mono"
                placeholder="6-digit code"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                autoComplete="one-time-code"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => confirmEnroll()}
                  className="rounded-lg bg-[var(--accent)]/20 px-3 py-1.5 text-xs font-medium text-[var(--accent)] disabled:opacity-50"
                >
                  Confirm & enable
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setEnrollUrl(null);
                    setEnrollSecret(null);
                    setConfirmCode("");
                  }}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-[var(--muted)]">
            Two-factor is on. Backup codes left: <strong>{status.backupCodesRemaining}</strong>
          </p>
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-[var(--foreground)]">Disable 2FA</p>
            <input
              className="w-full max-w-xs rounded border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs font-mono"
              placeholder="TOTP or backup code"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => disableTotp()}
              className="rounded-lg border border-[var(--warning)]/40 px-3 py-1.5 text-xs text-[var(--warning)] hover:bg-[var(--warning)]/10 disabled:opacity-50"
            >
              Disable 2FA
            </button>
          </div>
          <div className="space-y-2 border-t border-[var(--border)]/60 pt-4">
            <p className="text-[11px] font-medium text-[var(--foreground)]">Regenerate backup codes</p>
            <input
              className="w-full max-w-xs rounded border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs font-mono"
              placeholder="TOTP or a backup code"
              value={regenCode}
              onChange={(e) => setRegenCode(e.target.value)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => regenerateBackups()}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--foreground)] hover:border-[var(--accent)]/50 disabled:opacity-50"
            >
              Generate new backup codes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
