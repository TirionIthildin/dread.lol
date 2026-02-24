"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Storefront,
  CaretDown,
  CaretRight,
  Copy,
  Link as LinkIcon,
  Plugs,
  Package,
  Sliders,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import CopyButton from "@/app/components/CopyButton";

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

type ProductInfo = Record<string, { name: string; price: string; isRecurring: boolean }>;

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
  const [productInfo, setProductInfo] = useState<ProductInfo>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    setup: false,
    subscription: true,
    addons: true,
    limits: true,
    api: false,
  });

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

  const fetchProductInfo = useCallback(async (ids: string[], sandbox: boolean) => {
    if (ids.length === 0) return {};
    try {
      const res = await fetch(
        `/api/dashboard/admin/products?ids=${encodeURIComponent(ids.join(","))}&sandbox=${sandbox}`
      );
      if (!res.ok) return {};
      const data = await res.json();
      return data.products ?? {};
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    if (!settings || !settings.polarConfigured) return;
    const allIds = [
      ...settings.productIds,
      ...settings.customBadgeProductIds,
      ...settings.galleryAddonProductIds,
    ].filter(Boolean);
    if (allIds.length === 0) {
      setProductInfo({});
      return;
    }
    fetchProductInfo(allIds, settings.sandbox).then(setProductInfo);
  }, [settings?.productIds, settings?.customBadgeProductIds, settings?.galleryAddonProductIds, settings?.polarConfigured, settings?.sandbox, fetchProductInfo]);

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

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
          galleryAddonProductIds: data.billing.galleryAddonProductIds ?? [],
          blogPremiumOnly: data.billing.blogPremiumOnly ?? true,
          pastePremiumOnly: data.billing.pastePremiumOnly ?? true,
          pasteMaxFreePerMonth: data.billing.pasteMaxFreePerMonth ?? 10,
          customBadgeProductIds: data.billing.customBadgeProductIds ?? [],
        });
        toast.success("Shop settings saved");
      } catch {
        toast.error("Failed to save");
      }
    });
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-24 rounded-xl bg-[var(--surface)]" />
          <div className="h-64 rounded-xl bg-[var(--surface)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/5 p-4">
          <p className="text-sm text-[var(--warning)]">{error}</p>
          <button
            type="button"
            onClick={fetchSettings}
            className="mt-3 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const checkoutUrl = `${origin}/api/polar/checkout`;
  const checkoutRedirectUrl = `${origin}/api/polar/checkout-redirect`;
  const portalUrl = `${origin}/api/polar/customer-portal`;

  const setupComplete =
    !!settings?.polarConfigured &&
    (settings.productIds?.length ?? 0) > 0 &&
    formEnabled;

  function Section({
    id,
    title,
    icon: Icon,
    children,
    defaultOpen = true,
  }: {
    id: string;
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }) {
    const isOpen = expandedSections[id] ?? defaultOpen;
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-[var(--surface-hover)]/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Icon size={18} weight="regular" className="text-[var(--accent)] shrink-0" />
            <span className="text-sm font-semibold text-[var(--foreground)]">{title}</span>
          </div>
          {isOpen ? (
            <CaretDown size={16} weight="bold" className="text-[var(--muted)]" />
          ) : (
            <CaretRight size={16} weight="bold" className="text-[var(--muted)]" />
          )}
        </button>
        {isOpen && <div className="px-4 pb-4 pt-0 border-t border-[var(--border)]">{children}</div>}
      </div>
    );
  }

  function ProductIdInput({
    id,
    label,
    hint,
    value,
    onChange,
    productIds,
    placeholder = "prod_xxx (one per line)",
  }: {
    id: string;
    label: string;
    hint: string;
    value: string;
    onChange: (v: string) => void;
    productIds: string[];
    placeholder?: string;
  }) {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          {label}
        </label>
        <textarea
          id={id}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm font-mono focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        {productIds.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {productIds.map((pid) => {
              const info = productInfo[pid];
              return (
                <span
                  key={pid}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[var(--surface)] px-2 py-1 text-xs font-mono"
                  title={pid}
                >
                  <span className="text-[var(--muted)] truncate max-w-[120px]">{pid}</span>
                  {info ? (
                    <span className="text-[var(--accent)] truncate max-w-[140px]">
                      {info.name} {info.price && `(${info.price})`}
                    </span>
                  ) : (
                    <span className="text-[var(--muted)] italic">—</span>
                  )}
                </span>
              );
            })}
          </div>
        )}
        <p className="text-xs text-[var(--muted)] mt-1.5">{hint}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="space-y-6">
        {/* Status Overview */}
        <div className="rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--bg)]/50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-2.5 bg-[var(--accent)]/15">
                <Storefront size={24} weight="regular" className="text-[var(--accent)]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--foreground)]">Shop status</h3>
                <p className="text-sm text-[var(--muted)] mt-0.5">
                  {settings?.polarConfigured
                    ? formEnabled
                      ? "Live and accepting payments"
                      : "Configured but disabled"
                    : "Polar not configured"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {settings?.polarConfigured ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/15 px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
                  <CheckCircle size={14} weight="fill" />
                  Polar connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--warning)]/15 px-2.5 py-1 text-xs font-medium text-[var(--warning)]">
                  <XCircle size={14} weight="fill" />
                  Set POLAR_ACCESS_TOKEN
                </span>
              )}
              {formSandbox && (
                <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  Sandbox mode
                </span>
              )}
              {setupComplete && (
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Ready
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-[var(--bg)]/80 px-3 py-2 border border-[var(--border)]/50">
              <span className="text-xs text-[var(--muted)]">Premium products</span>
              <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">
                {formProductIds.split(/[\n,]/).filter((s) => s.trim()).length}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--bg)]/80 px-3 py-2 border border-[var(--border)]/50">
              <span className="text-xs text-[var(--muted)]">Custom badge</span>
              <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">
                {formCustomBadgeProductIds.split(/[\n,]/).filter((s) => s.trim()).length}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--bg)]/80 px-3 py-2 border border-[var(--border)]/50">
              <span className="text-xs text-[var(--muted)]">Gallery addon</span>
              <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">
                {formGalleryAddonProductIds.split(/[\n,]/).filter((s) => s.trim()).length}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--bg)]/80 px-3 py-2 border border-[var(--border)]/50">
              <span className="text-xs text-[var(--muted)]">Tier name</span>
              <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5 truncate">
                {formTierName || "Premium"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Setup checklist */}
          <Section id="setup" title="Setup checklist" icon={Plugs} defaultOpen={false}>
            <div className="space-y-3 pt-2">
              <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--foreground)]">
                <li>
                  Add <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-xs">POLAR_ACCESS_TOKEN</code> to env (create at polar.sh org settings)
                </li>
                <li>
                  Add <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-xs">POLAR_WEBHOOK_SECRET</code> for webhooks (Polar dashboard → Webhooks)
                </li>
                <li>
                  Set webhook URL to <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-xs truncate max-w-full inline-block">
                    {origin}/api/webhooks/polar
                  </code>
                </li>
                <li>Create products in Polar (subscriptions, one-time, addons)</li>
                <li>Paste product IDs below and enable the shop</li>
              </ol>
              <p className="text-xs text-[var(--muted)]">
                Use <code className="rounded bg-[var(--surface)] px-1 py-0.5">POLAR_SANDBOX=1</code> for testing.
              </p>
            </div>
          </Section>

          {/* Subscription */}
          <Section id="subscription" title="Subscription & main products" icon={CreditCard}>
            <div className="space-y-4 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formEnabled}
                  onChange={(e) => setFormEnabled(e.target.checked)}
                  disabled={!settings?.polarConfigured}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-sm font-medium text-[var(--foreground)]">Shop enabled</span>
              </label>
              <p className="text-xs text-[var(--muted)] -mt-2">
                When enabled, checkout and customer portal are available.
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
                  className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <p className="text-xs text-[var(--muted)] mt-1">Display name (e.g. Premium, Pro)</p>
              </div>

              <ProductIdInput
                id="billing-product-ids"
                label="Premium product IDs"
                hint="Polar product IDs that grant the main tier. Subscription vs one-time is auto-detected. First ID is default for checkout."
                value={formProductIds}
                onChange={setFormProductIds}
                productIds={formProductIds.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)}
                placeholder="prod_xxx&#10;prod_yyy"
              />

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSandbox}
                  onChange={(e) => setFormSandbox(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-sm font-medium text-[var(--foreground)]">Use Polar sandbox</span>
              </label>
              <p className="text-xs text-[var(--muted)] -mt-2">For testing. Overrides POLAR_SANDBOX env.</p>
            </div>
          </Section>

          {/* Add-ons */}
          <Section id="addons" title="Add-on products" icon={Package}>
            <div className="space-y-4 pt-2">
              <ProductIdInput
                id="billing-custom-badge-ids"
                label="Custom badge addon"
                hint="One-time product IDs. Each purchase = one badge slot. Users can buy multiple."
                value={formCustomBadgeProductIds}
                onChange={setFormCustomBadgeProductIds}
                productIds={formCustomBadgeProductIds.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)}
              />
              <ProductIdInput
                id="billing-gallery-addon-ids"
                label="Gallery addon"
                hint="Product IDs for image hosting. Premium includes gallery. Each purchase counts."
                value={formGalleryAddonProductIds}
                onChange={setFormGalleryAddonProductIds}
                productIds={formGalleryAddonProductIds.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)}
              />
            </div>
          </Section>

          {/* Feature limits */}
          <Section id="limits" title="Feature limits" icon={Sliders}>
            <div className="space-y-4 pt-2">
              <p className="text-xs text-[var(--muted)]">
                Free users hit these limits. Premium users have no limits.
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formBlogPremiumOnly}
                  onChange={(e) => setFormBlogPremiumOnly(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-sm font-medium text-[var(--foreground)]">Microblog requires Premium</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPastePremiumOnly}
                  onChange={(e) => setFormPastePremiumOnly(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-sm font-medium text-[var(--foreground)]">Paste requires Premium</span>
              </label>
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
                  className="w-24 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                />
                <p className="text-xs text-[var(--muted)] mt-1">0 = unlimited</p>
              </div>
            </div>
          </Section>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-5 py-2.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <CheckCircle size={18} weight="regular" />
            {isPending ? "Saving…" : "Save shop settings"}
          </button>
        </form>

        {/* API Links */}
        <Section id="api" title="API & integration" icon={LinkIcon} defaultOpen={false}>
          <div className="space-y-3 pt-2">
            <p className="text-xs text-[var(--muted)]">Use these endpoints for checkout and customer portal.</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-xs font-mono rounded bg-[var(--surface)] px-2 py-1.5 flex-1 min-w-0 truncate">
                  {checkoutUrl}
                </code>
                <CopyButton copyValue={checkoutUrl} ariaLabel="Copy checkout URL">
                  <Copy size={16} weight="regular" />
                </CopyButton>
              </div>
              <p className="text-xs text-[var(--muted)]">Checkout. Add ?products=prod_xxx&customerExternalId=USER_ID</p>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-xs font-mono rounded bg-[var(--surface)] px-2 py-1.5 flex-1 min-w-0 truncate">
                  {checkoutRedirectUrl}
                </code>
                <CopyButton copyValue={checkoutRedirectUrl} ariaLabel="Copy checkout redirect URL">
                  <Copy size={16} weight="regular" />
                </CopyButton>
              </div>
              <p className="text-xs text-[var(--muted)]">Redirects signed-in user to checkout</p>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-xs font-mono rounded bg-[var(--surface)] px-2 py-1.5 flex-1 min-w-0 truncate">
                  {portalUrl}
                </code>
                <CopyButton copyValue={portalUrl} ariaLabel="Copy customer portal URL">
                  <Copy size={16} weight="regular" />
                </CopyButton>
              </div>
              <p className="text-xs text-[var(--muted)]">Manage subscription in Polar</p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
