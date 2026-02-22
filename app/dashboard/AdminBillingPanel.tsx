"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CreditCard, CheckCircle, XCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

export type BillingSettingsState = {
  enabled: boolean;
  tierName: string;
  productIds: string[];
  sandbox: boolean;
  polarConfigured: boolean;
  galleryAddonProductIds: string[];
  blogPremiumOnly: boolean;
  pastePremiumOnly: boolean;
  pasteMaxFreePerMonth: number;
  customBadgeProductIds: string[];
};

export default function AdminBillingPanel() {
  const [settings, setSettings] = useState<BillingSettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formEnabled, setFormEnabled] = useState(false);
  const [formTierName, setFormTierName] = useState("Premium");
  const [formProductIds, setFormProductIds] = useState("");
  const [formSandbox, setFormSandbox] = useState(false);
  const [formGalleryAddonProductIds, setFormGalleryAddonProductIds] = useState("");
  const [formBlogPremiumOnly, setFormBlogPremiumOnly] = useState(true);
  const [formPastePremiumOnly, setFormPastePremiumOnly] = useState(true);
  const [formPasteMaxFreePerMonth, setFormPasteMaxFreePerMonth] = useState(10);
  const [formCustomBadgeProductIds, setFormCustomBadgeProductIds] = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/admin/settings");
      if (!res.ok) return;
      const data = await res.json();
      const b = data.billing ?? {};
      const prodIds = Array.isArray(b.productIds) ? b.productIds : (b.productId ? [b.productId] : []);
      const customBadgeIds = Array.isArray(b.customBadgeProductIds) ? b.customBadgeProductIds : [];
      setSettings({
        enabled: !!b.enabled,
        tierName: b.tierName ?? "Premium",
        productIds: prodIds,
        sandbox: !!b.sandbox,
        polarConfigured: !!b.polarConfigured,
        galleryAddonProductIds: Array.isArray(b.galleryAddonProductIds) ? b.galleryAddonProductIds : [],
        blogPremiumOnly: typeof b.blogPremiumOnly === "boolean" ? b.blogPremiumOnly : true,
        pastePremiumOnly: typeof b.pastePremiumOnly === "boolean" ? b.pastePremiumOnly : true,
        pasteMaxFreePerMonth: typeof b.pasteMaxFreePerMonth === "number" ? b.pasteMaxFreePerMonth : 10,
        customBadgeProductIds: customBadgeIds,
      });
      setFormEnabled(!!b.enabled);
      setFormTierName(b.tierName ?? "Premium");
      setFormProductIds(prodIds.join("\n"));
      setFormSandbox(!!b.sandbox);
      setFormCustomBadgeProductIds(customBadgeIds.join("\n"));
      setFormGalleryAddonProductIds((Array.isArray(b.galleryAddonProductIds) ? b.galleryAddonProductIds : []).join("\n"));
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
      setFormProductIds(settings.productIds.join("\n"));
      setFormSandbox(settings.sandbox);
      setFormGalleryAddonProductIds(settings.galleryAddonProductIds?.join("\n") ?? "");
      setFormBlogPremiumOnly(settings.blogPremiumOnly ?? true);
      setFormPastePremiumOnly(settings.pastePremiumOnly ?? true);
      setFormPasteMaxFreePerMonth(settings.pasteMaxFreePerMonth ?? 10);
      setFormCustomBadgeProductIds(settings.customBadgeProductIds?.join("\n") ?? "");
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
              productIds: formProductIds.split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
              sandbox: formSandbox,
              galleryAddonProductIds: formGalleryAddonProductIds.split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
              blogPremiumOnly: formBlogPremiumOnly,
              pastePremiumOnly: formPastePremiumOnly,
              pasteMaxFreePerMonth: formPasteMaxFreePerMonth,
              customBadgeProductIds: formCustomBadgeProductIds.split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
            },
          }),
        });
        const data = await res.json();
        if (data.error) {
          toast.error(data.error);
          return;
        }
        const pIds = Array.isArray(data.billing.productIds) ? data.billing.productIds : [];
        setSettings({
          enabled: data.billing.enabled,
          tierName: data.billing.tierName,
          productIds: pIds,
          sandbox: data.billing.sandbox,
          polarConfigured: data.billing.polarConfigured,
          galleryAddonProductIds: Array.isArray(data.billing.galleryAddonProductIds) ? data.billing.galleryAddonProductIds : [],
          blogPremiumOnly: data.billing.blogPremiumOnly ?? true,
          pastePremiumOnly: data.billing.pastePremiumOnly ?? true,
          pasteMaxFreePerMonth: data.billing.pasteMaxFreePerMonth ?? 10,
          customBadgeProductIds: Array.isArray(data.billing.customBadgeProductIds) ? data.billing.customBadgeProductIds : [],
        });
        toast.success("Shop settings saved");
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
            Shop (Premium + addons)
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
                Shop enabled
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
              <label htmlFor="billing-product-ids" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Premium product IDs
              </label>
              <textarea
                id="billing-product-ids"
                rows={3}
                value={formProductIds}
                onChange={(e) => setFormProductIds(e.target.value)}
                placeholder="prod_xxx&#10;prod_yyy (one per line)"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono"
              />
              <p className="text-xs text-[var(--muted)] mt-1">
                Polar product IDs that grant Premium. Subscription vs one-time is auto-detected from Polar. Subscribe/Buy buttons route to the right product.
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

            <div>
              <label htmlFor="billing-custom-badge-ids" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Custom badge addon product IDs
              </label>
              <textarea
                id="billing-custom-badge-ids"
                rows={2}
                value={formCustomBadgeProductIds}
                onChange={(e) => setFormCustomBadgeProductIds(e.target.value)}
                placeholder="prod_xxx (one per line)"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm font-mono"
              />
              <p className="text-xs text-[var(--muted)] mt-1">
                Polar one-time product IDs. Each purchase = one badge slot. Users can buy multiple to create more badges.
              </p>
            </div>

            <div>
              <label htmlFor="billing-gallery-addon-ids" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Gallery addon product IDs
              </label>
              <textarea
                id="billing-gallery-addon-ids"
                rows={2}
                value={formGalleryAddonProductIds}
                onChange={(e) => setFormGalleryAddonProductIds(e.target.value)}
                placeholder="prod_xxx (one per line)"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm font-mono"
              />
              <p className="text-xs text-[var(--muted)] mt-1">
                Polar product IDs that grant image hosting (gallery). Premium includes gallery; this addon is for users who want just gallery.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-[var(--border)]">
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Premium limits (configurable)</h4>
              <p className="text-xs text-[var(--muted)] mb-4">
                Free users hit these limits. Premium users have no limits.
              </p>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formBlogPremiumOnly}
                    onChange={(e) => setFormBlogPremiumOnly(e.target.checked)}
                    className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Microblog requires Premium
                  </span>
                </label>
                <p className="text-xs text-[var(--muted)] -mt-2">
                  When on, only Premium users can create blog posts.
                </p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPastePremiumOnly}
                    onChange={(e) => setFormPastePremiumOnly(e.target.checked)}
                    className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Paste requires Premium
                  </span>
                </label>
                <p className="text-xs text-[var(--muted)] -mt-2">
                  When on, only Premium users can create pastes. When off, use paste limit below.
                </p>
                <div>
                  <label htmlFor="billing-paste-max-free" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Pastes per month (free, when Paste Premium is off)
                  </label>
                  <input
                    id="billing-paste-max-free"
                    type="number"
                    min={0}
                    value={formPasteMaxFreePerMonth}
                    onChange={(e) => setFormPasteMaxFreePerMonth(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full max-w-[100px] rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Max pastes per calendar month for free users. 0 = unlimited.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Saving…" : "Save shop settings"}
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
