"use client";

import { useCallback, useEffect, useState } from "react";
import { Megaphone } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  SITE_NOTICE_MAX_MESSAGE_LENGTH,
  type SiteNoticeVariant,
} from "@/lib/site-notice-settings-shared";

type SiteNoticeState = {
  enabled: boolean;
  message: string;
  showOnHome: boolean;
  showOnDashboard: boolean;
  variant: SiteNoticeVariant;
};

export default function AdminSiteNoticeClient() {
  const [data, setData] = useState<SiteNoticeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [showOnHome, setShowOnHome] = useState(false);
  const [showOnDashboard, setShowOnDashboard] = useState(false);
  const [variant, setVariant] = useState<SiteNoticeVariant>("info");

  const refresh = useCallback(() => {
    setLoadError(null);
    setLoading(true);
    fetch("/api/dashboard/admin/site-notice")
      .then((res) => res.json().then((j) => ({ ok: res.ok, j })))
      .then(({ ok, j }) => {
        if (!ok || j.error) {
          throw new Error(j.error ?? "Failed to load");
        }
        const s = j.siteNotice as SiteNoticeState;
        setData(s);
        setEnabled(s.enabled);
        setMessage(s.message);
        setShowOnHome(s.showOnHome);
        setShowOnDashboard(s.showOnDashboard);
        setVariant(s.variant);
      })
      .catch(() => setLoadError("Could not load site notice settings"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: SiteNoticeState = {
        enabled,
        message: message.trim().slice(0, SITE_NOTICE_MAX_MESSAGE_LENGTH),
        showOnHome,
        showOnDashboard,
        variant,
      };
      const res = await fetch("/api/dashboard/admin/site-notice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as { error?: string; siteNotice?: SiteNoticeState };
      if (!res.ok) {
        toast.error(j.error ?? `Save failed (${res.status})`);
        return;
      }
      if (j.siteNotice) {
        setData(j.siteNotice);
        setEnabled(j.siteNotice.enabled);
        setMessage(j.siteNotice.message);
        setShowOnHome(j.siteNotice.showOnHome);
        setShowOnDashboard(j.siteNotice.showOnDashboard);
        setVariant(j.siteNotice.variant);
      }
      toast.success("Site notice saved");
    } finally {
      setSaving(false);
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

  if (loadError || !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/5 p-4">
          <p className="text-sm text-[var(--warning)]">{loadError ?? "Failed to load"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-start gap-3">
        <Megaphone size={28} weight="duotone" className="shrink-0 text-[var(--accent)] mt-0.5" aria-hidden />
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Site notice</h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            Short broadcast message on the{" "}
            <span className="text-[var(--foreground)]">homepage</span> and/or{" "}
            <span className="text-[var(--foreground)]">dashboard</span> only. Plain text; no HTML.
          </p>
        </div>
      </div>

      <form onSubmit={save} className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 p-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded border-[var(--border)]"
          />
          <span className="text-sm font-medium text-[var(--foreground)]">Enable notice</span>
        </label>

        <div>
          <label htmlFor="site-notice-message" className="block text-sm font-medium text-[var(--muted)] mb-1">
            Message
          </label>
          <textarea
            id="site-notice-message"
            value={message}
            onChange={(e) =>
              setMessage(e.target.value.slice(0, SITE_NOTICE_MAX_MESSAGE_LENGTH))
            }
            rows={4}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            placeholder="e.g. Scheduled maintenance tonight at 2am UTC."
            maxLength={SITE_NOTICE_MAX_MESSAGE_LENGTH}
          />
          <p className="text-xs text-[var(--muted)] mt-1">
            {message.length}/{SITE_NOTICE_MAX_MESSAGE_LENGTH} characters
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[var(--muted)] mb-1">Show on</legend>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnHome}
              onChange={(e) => setShowOnHome(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <span className="text-sm text-[var(--foreground)]">Homepage (/)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnDashboard}
              onChange={(e) => setShowOnDashboard(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <span className="text-sm text-[var(--foreground)]">Dashboard (/dashboard)</span>
          </label>
        </fieldset>

        <div>
          <label htmlFor="site-notice-variant" className="block text-sm font-medium text-[var(--muted)] mb-1">
            Style
          </label>
          <select
            id="site-notice-variant"
            value={variant}
            onChange={(e) => setVariant(e.target.value as SiteNoticeVariant)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          >
            <option value="info">Info (accent)</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
