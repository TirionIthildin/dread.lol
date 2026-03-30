"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { DiscordBotStats } from "@/lib/discord-bot-stats";

function healthLabel(health: DiscordBotStats["health"]): string {
  switch (health) {
    case "healthy":
      return "Healthy";
    case "degraded":
      return "Degraded";
    default:
      return "Unhealthy";
  }
}

function healthClass(health: DiscordBotStats["health"]): string {
  switch (health) {
    case "healthy":
      return "text-emerald-600 dark:text-emerald-400";
    case "degraded":
      return "text-amber-600 dark:text-amber-400";
    default:
      return "text-red-600 dark:text-red-400";
  }
}

function formatAge(ms: number | null): string {
  if (ms == null || ms < 0) return "—";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function StaffDiscordBotClient() {
  const [stats, setStats] = useState<DiscordBotStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    fetch("/api/dashboard/staff/discord-bot")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || data.error) throw new Error(data.error ?? "Failed to load");
        setStats(data.stats as DiscordBotStats);
      })
      .catch(() => setError("Could not load bot stats. Is Valkey reachable?"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">Discord presence bot</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Separate Node process (<code className="text-xs">npm run discord-presence-bot</code>) — Gateway
            presence intent, shared guild with members.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden />
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-3 py-2 text-sm text-[var(--warning)]">
          {error}
        </p>
      )}

      {loading && !stats ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Status</p>
            <p className={`text-2xl font-semibold mt-1 ${healthClass(stats.health)}`}>{healthLabel(stats.health)}</p>
            {!stats.valkeyReachable && stats.valkeyError && (
              <p className="text-xs text-[var(--muted)] mt-2 font-mono break-all">{stats.valkeyError}</p>
            )}
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Heartbeat</p>
            <p className="text-sm text-[var(--foreground)] mt-1">
              {stats.heartbeatAt
                ? new Date(stats.heartbeatAt).toLocaleString()
                : "No heartbeat key (bot may be off or not deployed)"}
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">Age: {formatAge(stats.heartbeatAgeMs)}</p>
            {stats.heartbeatPid != null && (
              <p className="text-xs text-[var(--muted)] mt-0.5">PID: {stats.heartbeatPid}</p>
            )}
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Presence keys</p>
            <p className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.presenceKeysCount}</p>
            <p className="text-xs text-[var(--muted)] mt-1">discord:presence:*</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Last seen keys</p>
            <p className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.lastSeenKeysCount}</p>
            <p className="text-xs text-[var(--muted)] mt-1">discord:lastseen:*</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4 sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Flags cache keys</p>
            <p className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.flagsKeysCount}</p>
            <p className="text-xs text-[var(--muted)] mt-1">discord:flags:* (fetched on demand)</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
