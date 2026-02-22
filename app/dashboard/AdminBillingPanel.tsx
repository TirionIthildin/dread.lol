"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CreditCard, CheckCircle, XCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

export type BillingSettingsState = {
  enabled: boolean;
  tierName: string;
  productId: string | null;
  sandbox: boolean;
  polarConfigured: boolean;
  basicEnabled: boolean;
  basicProductId: string | null;
  basicTierName: string;
  basicPriceCents: number;
};

export default function AdminBillingPanel() {
  const [settings, setSettings] = useState<BillingSettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formEnabled, setFormEnabled] = useState(false);
  const [formTierName, setFormTierName] = useState("Premium");
  const [formProductId, setFormProductId] = useState("");
  const [formSandbox, setFormSandbox] = useState(false);
  const [formBasicEnabled, setFormBasicEnabled] = useState(false);
  const [formBasicProductId, setFormBasicProductId] = useState("");
  const [formBasicTierName, setFormBasicTierName] = useState("Basic");
  const [formBasicPriceCents, setFormBasicPriceCents] = useState(400);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/admin/settings");
      if (!res.ok) return;
      const data = await res.json();
      const b = data.billing ?? {};
      setSettings({
        enabled: !!b.enabled,
        tierName: b.tierName ?? "Premium",
        productId: b.productId ?? null,
        sandbox: !!b.sandbox,
        polarConfigured: !!b.polarConfigured,
        basicEnabled: !!b.basicEnabled,
        basicProductId: b.basicProductId ?? null,
        basicTierName: b.basicTierName ?? "Basic",
        basicPriceCents: typeof b.basicPriceCents === "number" ? b.basicPriceCents : 400,
      });
      setFormEnabled(!!b.enabled);
      setFormTierName(b.tierName ?? "Premium");
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
      setFormTierName(settings.tierName);
      setFormProductId(settings.productId ?? "");
      setFormSandbox(settings.sandbox);
      setFormBasicEnabled(settings.basicEnabled);
      setFormBasicProductId(settings.basicProductId ?? "");
      setFormBasicTierName(settings.basicTierName ?? "Basic");
      setFormBasicPriceCents(settings.basicPriceCents ?? 400);
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
              tierName: formTierName.trim() || "Premium",
              productId: formProductId.trim() || null,
              sandbox: formSandbox,
              basicEnabled: formBasicEnabled,
              basicProductId: formBasicProductId.trim() || null,
              basicTierName: formBasicTierName.trim() || "Basic",
              basicPriceCents: formBasicPriceCents,
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
          tierName: data.billing.tierName,
          productId: data.billing.productId,
          sandbox: data.billing.sandbox,
          polarConfigured: data.billing.polarConfigured,
          basicEnabled: data.billing.basicEnabled,
          basicProductId: data.billing.basicProductId,
          basicTierName: data.billing.basicTierName,
          basicPriceCents: data.billing.basicPriceCents,
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
            Premium (Polar)
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
              <label htmlFor="billing-tier-name" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Tier name
              </label>
              <input
                id="billing-tier-name"
                type="text"
                value={formTierName}
                onChange={(e) => setFormTierName(e.target.value)}
                placeholder="Premium"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <p className="text-xs text-[var(--muted)] mt-1">
                Display name for the subscription tier (e.g. Premium).
              </p>
            </div>

            <div>
              <label htmlFor="billing-product-id" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Premium product ID
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
                Polar product ID for the Premium tier. Used by checkout-redirect.
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

            <div className="pt-6 mt-6 border-t border-[var(--border)]">
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Basic (account creation)</h4>
              <p className="text-xs text-[var(--muted)] mb-4">
                One-time payment to create an account. When enabled, unapproved users see &quot;Pay $4 for Basic&quot; instead of the Discord message.
              </p>
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={formBasicEnabled}
                  onChange={(e) => setFormBasicEnabled(e.target.checked)}
                  disabled={!settings?.polarConfigured}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Basic paywall enabled
                </span>
              </label>
              <div className="space-y-3 mb-4">
                <div>
                  <label htmlFor="billing-basic-product-id" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Basic product ID
                  </label>
                  <input
                    id="billing-basic-product-id"
                    type="text"
                    value={formBasicProductId}
                    onChange={(e) => setFormBasicProductId(e.target.value)}
                    placeholder="prod_xxx (fallback: POLAR_BASIC_PRODUCT_ID)"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Polar one-time product (e.g. $4). Create in Polar dashboard.
                  </p>
                </div>
                <div>
                  <label htmlFor="billing-basic-tier-name" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Tier name
                  </label>
                  <input
                    id="billing-basic-tier-name"
                    type="text"
                    value={formBasicTierName}
                    onChange={(e) => setFormBasicTierName(e.target.value)}
                    placeholder="Basic"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="billing-basic-price" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Price (cents, for display)
                  </label>
                  <input
                    id="billing-basic-price"
                    type="number"
                    min={0}
                    step={100}
                    value={formBasicPriceCents}
                    onChange={(e) => setFormBasicPriceCents(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">
                    e.g. 400 = $4. Shown as &quot;Pay $4 for Basic&quot;. Actual price is set in Polar.
                  </p>
                </div>
              </div>
            </div>

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
