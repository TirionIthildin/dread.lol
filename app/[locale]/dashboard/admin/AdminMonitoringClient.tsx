"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleCheck, Copy, Activity, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import CopyButton from "@/app/components/CopyButton";

type MonitoringState = {
  enabled: boolean;
  webhookConfigured: boolean;
  webhookUrlSuffix: string | null;
  webhookUrlHint: string | null;
  cronSecretConfigured: boolean;
};

export default function AdminMonitoringClient() {
  const [monitoring, setMonitoring] = useState<MonitoringState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [webhookInput, setWebhookInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoadError(null);
    setLoading(true);
    fetch("/api/dashboard/admin/monitoring")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || data.error) {
          throw new Error(data.error ?? "Failed to load");
        }
        const m = data.monitoring as MonitoringState;
        setMonitoring(m);
        setEnabled(m.enabled);
        setWebhookInput("");
      })
      .catch(() => setLoadError("Could not load monitoring settings"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTestError(null);
    setTestMessage(null);
    try {
      const body: {
        monitoring: { enabled: boolean; discordWebhookUrl?: string };
      } = {
        monitoring: { enabled },
      };
      const trimmed = webhookInput.trim();
      if (trimmed !== "") {
        body.monitoring.discordWebhookUrl = trimmed;
      }

      const res = await fetch("/api/dashboard/admin/monitoring", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; monitoring?: MonitoringState };
      if (!res.ok) {
        toast.error(data.error ?? `Save failed (${res.status})`);
        return;
      }
      if (data.monitoring) {
        setMonitoring(data.monitoring);
        setEnabled(data.monitoring.enabled);
        setWebhookInput("");
      }
      toast.success("Monitoring settings saved.");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function clearWebhook() {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/admin/monitoring", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monitoring: { enabled, discordWebhookUrl: "" } }),
      });
      const data = (await res.json()) as { error?: string; monitoring?: MonitoringState };
      if (!res.ok) {
        toast.error(data.error ?? `Save failed (${res.status})`);
        return;
      }
      if (data.monitoring) {
        setMonitoring(data.monitoring);
        setWebhookInput("");
      }
      toast.success("Webhook cleared.");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTestError(null);
    setTestMessage(null);
    setTestLoading(true);
    try {
      const res = await fetch("/api/dashboard/admin/monitoring/test", { method: "POST" });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setTestError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setTestMessage("Test message sent to Discord.");
    } catch {
      setTestError("Network error");
    } finally {
      setTestLoading(false);
    }
  }

  const siteUrl =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string"
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
      : "";
  const cronExample =
    siteUrl &&
    `curl -fsS -H "Authorization: Bearer $CRON_SECRET" "${siteUrl}/api/cron/monitoring"`;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 rounded-lg bg-[var(--surface)]" />
          <div className="h-40 rounded-xl bg-[var(--surface)]" />
        </div>
      </div>
    );
  }

  if (loadError || !monitoring) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/5 p-4">
          <p className="text-sm text-[var(--warning)]">{loadError ?? "Unknown error"}</p>
        </div>
      </div>
    );
  }

  const webhookReady = monitoring.webhookConfigured;

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
          <Activity className="h-6 w-6 text-[var(--accent)]" strokeWidth={1.5} aria-hidden />
          System monitoring
        </h2>
        <p className="text-sm text-[var(--muted)] mt-0.5">
          Periodically push host, process, MongoDB, and Valkey snapshots to a Discord channel via a webhook. Configure the
          webhook here; schedule runs on your host (e.g. Coolify) using <code className="rounded bg-[var(--bg)] px-1">CRON_SECRET</code>.
        </p>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 p-5 space-y-4">
        <h3 className="text-sm font-medium text-[var(--foreground)]">Current configuration</h3>
        <dl className="grid gap-3 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--border)]/60 pb-3">
            <dt className="text-[var(--muted)]">Discord webhook</dt>
            <dd className="font-mono text-xs text-[var(--foreground)] text-right break-all">
              {webhookReady ? (
                <span className="inline-flex items-center gap-1.5 text-[var(--accent)]">
                  <CircleCheck className="h-4 w-4 shrink-0 fill-current" aria-hidden />
                  {monitoring.webhookUrlHint ?? "configured"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[var(--warning)]">
                  <AlertCircle className="h-4 w-4 shrink-0 fill-current" aria-hidden />
                  Not set
                </span>
              )}
            </dd>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--border)]/60 pb-3">
            <dt className="text-[var(--muted)]">Pushes enabled</dt>
            <dd className="text-[var(--foreground)]">{monitoring.enabled ? "Yes" : "No"}</dd>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <dt className="text-[var(--muted)]">CRON_SECRET on server</dt>
            <dd className="text-[var(--foreground)]">
              {monitoring.cronSecretConfigured ? (
                <span className="inline-flex items-center gap-1.5 text-[var(--accent)]">
                  <CircleCheck className="h-4 w-4 shrink-0 fill-current" aria-hidden />
                  Set
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[var(--warning)]">
                  <AlertCircle className="h-4 w-4 shrink-0 fill-current" aria-hidden />
                  Not set — add for scheduled jobs
                </span>
              )}
            </dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={refresh}
          className="text-xs text-[var(--accent)] hover:underline"
        >
          Refresh status
        </button>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 p-5 space-y-4">
        <h3 className="text-sm font-medium text-[var(--foreground)]">Webhook and enable</h3>
        <p className="text-xs text-[var(--muted)]">
          Create an incoming webhook in your Discord server (Server settings → Integrations → Webhooks), paste the URL
          below. Use HTTPS URLs only (
          <code className="rounded bg-[var(--bg)] px-1">discord.com/api/webhooks/…</code>
          ).
        </p>
        <form onSubmit={save} className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <span className="text-sm text-[var(--foreground)]">Enable scheduled pushes</span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--muted)]">
              Webhook URL (leave blank to keep existing; use Clear to remove)
            </span>
            <input
              type="password"
              autoComplete="off"
              value={webhookInput}
              onChange={(e) => setWebhookInput(e.target.value)}
              placeholder={webhookReady ? "•••••••• (enter new URL to replace)" : "https://discord.com/api/webhooks/…"}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)] font-mono"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--accent)]/20 px-4 py-2 text-sm font-medium text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/30 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {webhookReady ? (
              <button
                type="button"
                disabled={saving}
                onClick={clearWebhook}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
              >
                Clear webhook
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 p-5 space-y-4">
        <h3 className="text-sm font-medium text-[var(--foreground)]">Schedule (external cron)</h3>
        <p className="text-xs text-[var(--muted)]">
          The app does not run a timer internally. Point Coolify, systemd, or cron at this endpoint with the
          Authorization header. Set <code className="rounded bg-[var(--bg)] px-1">CRON_SECRET</code> in your deployment
          environment to a long random value (e.g. <code className="rounded bg-[var(--bg)] px-1">openssl rand -hex 32</code>
          ).
        </p>
        {cronExample ? (
          <div className="flex items-start gap-2 flex-wrap">
            <pre className="text-xs font-mono p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] overflow-x-auto flex-1 min-w-0">
              {cronExample}
            </pre>
            <CopyButton copyValue={cronExample} ariaLabel="Copy curl command for cron">
              <Copy size={16} />
            </CopyButton>
          </div>
        ) : (
          <p className="text-xs text-[var(--warning)]">
            Set <code className="rounded bg-[var(--bg)] px-1">NEXT_PUBLIC_SITE_URL</code> at build time so this page can show
            a copy-ready curl command, or substitute your public origin manually.
          </p>
        )}
        <p className="text-xs text-[var(--muted)]">
          Discord rate-limits webhooks; use an interval of several minutes (e.g. 5–15), not every second.
        </p>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 p-5 space-y-4">
        <h3 className="text-sm font-medium text-[var(--foreground)]">Send test</h3>
        <p className="text-xs text-[var(--muted)]">
          Sends one snapshot immediately. Requires monitoring enabled and a saved webhook URL.
        </p>
        <button
          type="button"
          onClick={sendTest}
          disabled={!monitoring.enabled || !webhookReady || testLoading}
          className="rounded-lg bg-[var(--accent)]/20 px-4 py-2 text-sm font-medium text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/30 disabled:opacity-50"
        >
          {testLoading ? "Sending…" : "Send test to Discord"}
        </button>
        {!monitoring.enabled || !webhookReady ? (
          <p className="text-xs text-[var(--warning)]">Enable monitoring and save a webhook URL first.</p>
        ) : null}
        {testError ? <p className="text-xs text-[var(--warning)]">{testError}</p> : null}
        {testMessage ? <p className="text-xs text-[var(--accent)]">{testMessage}</p> : null}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 p-5 space-y-3">
        <h3 className="text-sm font-medium text-[var(--foreground)]">Discord docs</h3>
        <a
          href="https://discord.com/developers/docs/resources/webhook#execute-webhook"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--accent)] inline-flex items-center gap-1 hover:underline"
        >
          Execute webhook (Discord API)
          <ExternalLink className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        </a>
      </section>
    </div>
  );
}
