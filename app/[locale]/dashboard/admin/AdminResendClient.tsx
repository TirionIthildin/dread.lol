"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, CircleCheck, Mail, AlertCircle } from "lucide-react";

type ResendStatus = {
  apiKeyConfigured: boolean;
  apiKeySuffix: string | null;
  apiKeyHint: string | null;
  emailFrom: string;
  usingDefaultFromAddress: boolean;
  canonicalOrigin: string;
};

export default function AdminResendClient() {
  const [status, setStatus] = useState<ResendStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [testTo, setTestTo] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoadError(null);
    setLoading(true);
    fetch("/api/dashboard/admin/resend")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || data.error) {
          throw new Error(data.error ?? "Failed to load");
        }
        setStatus(data.resend as ResendStatus);
      })
      .catch(() => setLoadError("Could not load Resend status"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function sendTest(e: React.FormEvent) {
    e.preventDefault();
    setTestMessage(null);
    setTestError(null);
    const to = testTo.trim();
    if (!to) {
      setTestError("Enter an email address.");
      return;
    }
    setTestLoading(true);
    try {
      const res = await fetch("/api/dashboard/admin/resend/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setTestError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setTestMessage(`Test email sent to ${to}.`);
    } catch {
      setTestError("Network error");
    } finally {
      setTestLoading(false);
    }
  }

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

  if (loadError || !status) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/5 p-4">
          <p className="text-sm text-[var(--warning)]">{loadError ?? "Unknown error"}</p>
        </div>
      </div>
    );
  }

  const ready = status.apiKeyConfigured;

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
          <Mail className="h-6 w-6 text-[var(--accent)]" strokeWidth={1.5} aria-hidden />
          Resend (email)
        </h2>
        <p className="text-sm text-[var(--muted)] mt-0.5">
          Local accounts use Resend for verification emails. Configure API keys and sender in your deployment environment,
          then verify delivery here.
        </p>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 p-5 space-y-4">
        <h3 className="text-sm font-medium text-[var(--foreground)]">Current configuration</h3>
        <dl className="grid gap-3 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--border)]/60 pb-3">
            <dt className="text-[var(--muted)]">API key</dt>
            <dd className="font-mono text-xs text-[var(--foreground)] text-right">
              {ready ? (
                <span className="inline-flex items-center gap-1.5 text-[var(--accent)]">
                  <CircleCheck className="h-4 w-4 shrink-0 fill-current" aria-hidden />
                  {status.apiKeyHint}
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
            <dt className="text-[var(--muted)]">From address</dt>
            <dd className="font-mono text-xs text-[var(--foreground)] break-all text-right">{status.emailFrom}</dd>
          </div>
          {status.usingDefaultFromAddress ? (
            <p className="text-xs text-[var(--muted)]">
              Using Resend&apos;s default <code className="rounded bg-[var(--bg)] px-1">onboarding@resend.dev</code>. Set{" "}
              <code className="rounded bg-[var(--bg)] px-1">EMAIL_FROM</code> to your verified domain for production.
            </p>
          ) : null}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <dt className="text-[var(--muted)]">Auth link origin</dt>
            <dd className="font-mono text-xs text-[var(--foreground)] break-all text-right">{status.canonicalOrigin}</dd>
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

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 p-5 space-y-3">
        <h3 className="text-sm font-medium text-[var(--foreground)]">Setup checklist</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--muted)]">
          <li>
            Create an API key in the{" "}
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] inline-flex items-center gap-0.5 hover:underline"
            >
              Resend dashboard
              <ExternalLink className="inline h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            </a>
            .
          </li>
          <li>
            Set <code className="rounded bg-[var(--bg)] px-1 text-[var(--foreground)]">RESEND_API_KEY</code> in your host
            (e.g. Coolify) and redeploy.
          </li>
          <li>
            Add and verify your sending domain, then set{" "}
            <code className="rounded bg-[var(--bg)] px-1 text-[var(--foreground)]">EMAIL_FROM</code> (e.g.{" "}
            <code className="rounded bg-[var(--bg)] px-1">noreply@yourdomain.com</code>).
          </li>
          <li>
            Ensure <code className="rounded bg-[var(--bg)] px-1 text-[var(--foreground)]">SITE_URL</code> matches your public
            URL so verification links are correct.
          </li>
        </ol>
        <p className="text-xs text-[var(--muted)]">
          See <code className="rounded bg-[var(--bg)] px-1">README.md</code> and{" "}
          <code className="rounded bg-[var(--bg)] px-1">.env.example</code> in the repo for variable names.
        </p>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 p-5 space-y-4">
        <h3 className="text-sm font-medium text-[var(--foreground)]">Send test email</h3>
        <p className="text-xs text-[var(--muted)]">
          Sends a short message through the same Resend integration as signup verification. Limited to a few sends per hour per
          IP.
        </p>
        <form onSubmit={sendTest} className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <label className="flex-1 flex flex-col gap-1">
            <span className="text-xs text-[var(--muted)]">Recipient</span>
            <input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="you@example.com"
              disabled={!ready || testLoading}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)] disabled:opacity-50"
              autoComplete="email"
            />
          </label>
          <button
            type="submit"
            disabled={!ready || testLoading}
            className="rounded-lg bg-[var(--accent)]/20 px-4 py-2 text-sm font-medium text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/30 disabled:opacity-50 shrink-0"
          >
            {testLoading ? "Sending…" : "Send test"}
          </button>
        </form>
        {!ready ? (
          <p className="text-xs text-[var(--warning)]">Configure RESEND_API_KEY before sending tests.</p>
        ) : null}
        {testError ? <p className="text-xs text-[var(--warning)]">{testError}</p> : null}
        {testMessage ? <p className="text-xs text-[var(--accent)]">{testMessage}</p> : null}
      </section>
    </div>
  );
}
