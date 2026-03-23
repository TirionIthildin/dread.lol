"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type SessionRow = {
  sessionId: string;
  createdAt: number;
  lastSeenAt: number;
  userAgent: string | null;
  ip: string | null;
};

function formatTs(ms: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}

export default function DashboardSecuritySessions() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sessions", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load sessions");
      setSessions(data.sessions ?? []);
      setCurrentSessionId(data.currentSessionId ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function revokeOne(sessionId: string) {
    setActionId(sessionId);
    try {
      const res = await fetch("/api/auth/sessions/revoke", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to revoke");
      if (data.loggedOut) {
        window.location.href = "/dashboard";
        return;
      }
      toast.success("Session revoked");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke");
    } finally {
      setActionId(null);
    }
  }

  async function revokeAll() {
    if (!window.confirm("Sign out on all devices? You will need to log in again on this device.")) {
      return;
    }
    setRevokingAll(true);
    try {
      const res = await fetch("/api/auth/sessions/revoke-all", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      window.location.href = "/dashboard";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setRevokingAll(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading sessions…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--muted)]">
          Active sign-ins on this account. Revoke any you don’t recognize.
        </p>
        <button
          type="button"
          onClick={() => revokeAll()}
          disabled={revokingAll || sessions.length === 0}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:border-[var(--accent)]/50 disabled:opacity-50"
        >
          {revokingAll ? "Signing out…" : "Sign out everywhere"}
        </button>
      </div>
      {sessions.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No active sessions.</p>
      ) : (
        <ul className="space-y-2 list-none p-0 m-0">
          {sessions.map((s) => {
            const isCurrent = currentSessionId !== null && s.sessionId === currentSessionId;
            return (
              <li
                key={s.sessionId}
                className="rounded-xl border border-[var(--border)]/80 bg-[var(--bg)]/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {isCurrent ? "This device" : "Other session"}
                    {isCurrent && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-[var(--accent)]">
                        current
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--muted)] truncate" title={s.userAgent ?? undefined}>
                    {s.userAgent ?? "Unknown browser"}
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {s.ip ? `IP ${s.ip} · ` : ""}
                    Last active {formatTs(s.lastSeenAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revokeOne(s.sessionId)}
                  disabled={actionId === s.sessionId}
                  className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--warning)]/50 hover:text-[var(--warning)] disabled:opacity-50"
                >
                  {actionId === s.sessionId ? "…" : "Revoke"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
