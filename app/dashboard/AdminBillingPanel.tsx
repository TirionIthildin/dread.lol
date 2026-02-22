"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CreditCard, CheckCircle, XCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

export type BillingSettingsState = {
  enabled: boolean;
  productId: string | null;
  sandbox: boolean;
  polarConfigured: boolean;
};

export default function AdminBillingPanel() {
  const [settings, setSettings] = useState<BillingSettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formEnabled, setFormEnabled] = useState(false);
  const [formProductId, setFormProductId] = useState("");
  const [formSandbox, setFormSandbox] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/admin/settings");
      if (!res.ok) return;
      const data = await res.json();
      const b = data.billing ?? {};
      setSettings({
        enabled: !!b.enabled,
        productId: b.productId ?? null,
        sandbox: !!b.sandbox,
        polarConfigured: !!b.polarConfigured,
      });
      setFormEnabled(!!b.enabled);
      setFormProductId(b.productId ?? "");
      setFormSandbox(!!b.sandbox);
      setError(null);
    } catch {
      setError("Failed to load settings");
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormEnabled(settings.enabled);
      setFormProductId(settings.productId ?? "");
      setFormSandbox(settings.sandbox);
    }
  }, [settings]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch("/api/dashboard/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billing: {
              enabled: formEnabled,
              productId: formProductId.trim() || null,
              sandbox: formSandbox,
            },
          }),
        });
        const data = await res.json();
        if (data.error) {
          toast.error(data.error);
          return;
        }
        setSettings({
          enabled: data.billing.enabled,
          productId: data.billing.productId,
          sandbox: data.billing.sandbox,
          polarConfigured: data.billing.polarConfigured,
        });
        toast.success("Billing settings saved");
      } catch {
        toast.error("Failed to save");
      }
    });
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-[var(--warning)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2 mb-3">
            <CreditCard size={18} weight="regular" className="text-[var(--accent)]" />
            Polar billing
          </h3>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-[var(--muted)]">Connection:</span>
            {settings?.polarConfigured ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)]">
                <CheckCircle size={16} weight="fill" />
                Configured
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-[var(--warning)]">
                <XCircle size={16} weight="fill" />
                Set POLAR_ACCESS_TOKEN in env
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formEnabled}
                onChange={(e) => setFormEnabled(e.target.checked)}
                disabled={!settings?.polarConfigured}
                className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-sm font-medium text-[var(--foreground)]">
                Billing enabled
              </span>
            </label>
            <p className="text-xs text-[var(--muted)] -mt-2">
              When enabled, checkout and customer portal are available. Requires Polar env vars.
            </p>

            <div>
              <label htmlFor="billing-product-id" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Default product ID
              </label>
              <input
                id="billing-product-id"
                type="text"
                value={formProductId}
                onChange={(e) => setFormProductId(e.target.value)}
                placeholder="prod_xxx (optional, fallback: POLAR_PRODUCT_ID)"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <p className="text-xs text-[var(--muted)] mt-1">
                Used by /api/polar/checkout-redirect when no product param is passed.
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formSandbox}
                onChange={(e) => setFormSandbox(e.target.checked)}
                className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-sm font-medium text-[var(--foreground)]">
                Use Polar sandbox
              </span>
            </label>
            <p className="text-xs text-[var(--muted)] -mt-2">
              Sandbox mode for testing. Overrides POLAR_SANDBOX env when set.
            </p>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Saving…" : "Save billing settings"}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/30 p-4 text-sm text-[var(--muted)]">
          <p className="font-medium text-[var(--foreground)] mb-2">Links</p>
          <ul className="space-y-1 text-xs">
            <li>
              <code className="rounded bg-[var(--surface)] px-1.5 py-0.5">/api/polar/checkout</code>
              {" "}— Checkout (add ?products=prod_xxx&customerExternalId=USER_ID)
            </li>
            <li>
              <code className="rounded bg-[var(--surface)] px-1.5 py-0.5">/api/polar/checkout-redirect</code>
              {" "}— Redirects signed-in user with default product
            </li>
            <li>
              <code className="rounded bg-[var(--surface)] px-1.5 py-0.5">/api/polar/customer-portal</code>
              {" "}— Manage subscription in Polar
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
