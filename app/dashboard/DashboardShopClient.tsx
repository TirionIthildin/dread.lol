"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle,
  Plus,
  Crown,
  Sparkle,
  Lock,
  ChartLine,
  Palette,
  ImageSquare,
  CrownSimple,
  Article,
  Copy,
  Stack,
  ShieldCheck,
  Medal,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react";
import type { PremiumSource } from "@/lib/premium-permissions";
import { BADGE_ICON_OPTIONS } from "@/lib/badge-icons";
import SearchableSelect from "@/app/components/SearchableSelect";
import { toast } from "sonner";

type PremiumProduct = {
  id: string;
  name: string;
  isRecurring: boolean;
  priceFormatted: string | null;
  pricesFormatted: string[];
};

type Props = {
  billingEnabled: boolean;
  tierName: string;
  premiumProducts: PremiumProduct[];
  hasActiveSubscription: boolean;
  activeSubscription: {
    polarSubscriptionId: string;
    productId: string;
    productName?: string;
    status: string;
  } | null;
  ownedProductIds: string[];
  hasPremiumAccess: boolean;
  premiumSource: PremiumSource;
  customBadgeProducts: PremiumProduct[];
  hasCustomBadgeAddon: boolean;
  customBadgeSlotCount: number;
  galleryAddonProducts: PremiumProduct[];
  hasGalleryAddon: boolean;
};

type UserCreatedBadge = {
  id: string;
  label: string;
  description?: string | null;
  color?: string | null;
  badgeType?: "label" | "image" | "icon";
  imageUrl?: string | null;
  iconName?: string | null;
};

const PREMIUM_FEATURES = [
  { icon: Sparkle, label: "Username effects", desc: "Typewriter, sparkle, animated text" },
  { icon: Palette, label: "Custom colors", desc: "Accent, text, background" },
  { icon: ImageSquare, label: "Background effects", desc: "Snow, rain, blur, retro" },
  { icon: ChartLine, label: "Profile analytics", desc: "Views, traffic sources, devices" },
  { icon: CrownSimple, label: "Premium badge", desc: "Stand out on your profile" },
  { icon: Article, label: "Profile microblog", desc: "Write posts on your profile" },
  { icon: Stack, label: "Unlimited gallery", desc: "No limit on profile images" },
  { icon: Copy, label: "Unlimited pastes", desc: "Create pastes without monthly caps" },
];

export default function DashboardShopClient({
  billingEnabled,
  tierName,
  premiumProducts,
  hasActiveSubscription,
  activeSubscription,
  ownedProductIds,
  hasPremiumAccess,
  premiumSource,
  customBadgeProducts,
  hasCustomBadgeAddon,
  customBadgeSlotCount = 0,
  galleryAddonProducts,
  hasGalleryAddon,
}: Props) {
  const [badges, setBadges] = useState<UserCreatedBadge[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formLabel, setFormLabel] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formBadgeType, setFormBadgeType] = useState<"label" | "image" | "icon">("label");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIconName, setFormIconName] = useState("");
  const [badgeSaving, setBadgeSaving] = useState(false);

  const fetchBadges = useCallback(async () => {
    if (!hasCustomBadgeAddon) return;
    try {
      const res = await fetch("/api/dashboard/shop/custom-badge");
      if (!res.ok) return;
      const data = await res.json();
      setBadges(data.badges ?? []);
    } catch {
      // ignore
    }
  }, [hasCustomBadgeAddon]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  function startEdit(b: UserCreatedBadge) {
    setEditingId(b.id);
    setIsAdding(false);
    setFormLabel(b.label ?? "");
    setFormDescription(b.description ?? "");
    setFormColor(b.color ?? "");
    setFormBadgeType((b.badgeType as "label" | "image" | "icon") ?? "label");
    setFormImageUrl(b.imageUrl ?? "");
    setFormIconName(b.iconName ?? "");
  }

  function startAdd() {
    setEditingId(null);
    setIsAdding(true);
    setFormLabel("");
    setFormDescription("");
    setFormColor("");
    setFormBadgeType("label");
    setFormImageUrl("");
    setFormIconName("");
  }

  function cancelForm() {
    setEditingId(null);
    setIsAdding(false);
  }

  const premiumProductIds = premiumProducts.map((p) => p.id);
  const hasSubscriptionProducts = premiumProducts.some((p) => p.isRecurring);
  const hasOneTimeProducts = premiumProducts.some((p) => !p.isRecurring);
  const subProducts = premiumProducts.filter((p) => p.isRecurring);
  const oneTimeProducts = premiumProducts.filter((p) => !p.isRecurring);
  const ownedPremium = ownedProductIds.some((id) => premiumProductIds.includes(id));

  if (!billingEnabled) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--surface)]/50 p-12 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/20">
          <CreditCard size={40} weight="duotone" className="text-[var(--accent)]" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-[var(--foreground)]">
          Shop not yet available
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)]">
          Shop is not configured yet. Admins can enable it in Admin → Shop.
        </p>
      </div>
    );
  }

  const statusLabel =
    premiumSource === "granted"
      ? "Complimentary access from admin"
      : premiumSource === "subscription"
        ? "Active subscription"
        : premiumSource === "product"
          ? "Lifetime access"
          : null;

  const allProducts = [...premiumProducts, ...customBadgeProducts, ...galleryAddonProducts];

  return (
    <div className="space-y-10">
      {/* Premium hero */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 transition-colors ${
          hasPremiumAccess
            ? "border-[var(--accent)]/50 bg-gradient-to-br from-[var(--accent)]/15 via-[var(--accent)]/8 to-transparent shadow-[0_0_40px_-12px_var(--accent)]"
            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-bright)]"
        }`}
      >
        {hasPremiumAccess && (
          <>
            <div className="pointer-events-none absolute -right-4 -top-4 text-[10rem] opacity-[0.06]">
              <Crown weight="fill" className="text-[var(--accent)]" />
            </div>
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[var(--accent)]/10 blur-2xl" />
          </>
        )}
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                hasPremiumAccess ? "bg-[var(--accent)]/25 shadow-inner" : "bg-[var(--border)]/40"
              }`}
            >
              {hasPremiumAccess ? (
                <Crown size={28} weight="fill" className="text-[var(--accent)]" />
              ) : (
                <Crown size={28} weight="regular" className="text-[var(--muted)]" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-[var(--foreground)] md:text-2xl">
                  {hasPremiumAccess ? `You have ${tierName}` : `${tierName}`}
                </h2>
                {statusLabel && (
                  <span className="inline-flex items-center rounded-full bg-[var(--accent)]/20 px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
                    {statusLabel}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-[var(--muted)]">
                {hasPremiumAccess
                  ? "All premium features are unlocked on your profile."
                  : "Unlock effects, analytics, custom colors, and more."}
              </p>
            </div>
          </div>
          {hasPremiumAccess && hasActiveSubscription && (
            <Link
              href="/api/polar/customer-portal"
              prefetch={false}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/15 px-5 py-3 text-sm font-medium text-[var(--accent)] transition-all hover:bg-[var(--accent)]/25 hover:border-[var(--accent)]/70"
            >
              <CreditCard size={18} weight="regular" />
              Manage subscription
            </Link>
          )}
        </div>
      </div>

      {/* Premium plans */}
      {(!hasPremiumAccess || (ownedPremium && !hasActiveSubscription && hasSubscriptionProducts)) && (
        <section>
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            {hasPremiumAccess ? "Add recurring access" : `${tierName}`}
          </h3>
          <p className="mb-4 text-xs text-[var(--muted)]">
            Secure payments via Polar. Cancel anytime.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {subProducts.map((prod) => (
              <PlanCard
                key={prod.id}
                name={tierName}
                priceStr={prod.priceFormatted ?? prod.pricesFormatted[0] ?? null}
                period="/month"
                description="Cancel anytime. Full access to all features."
                cta="Subscribe"
                href="/api/polar/checkout-redirect?prefer=recurring"
                icon={<Plus size={20} weight="regular" />}
                featured
              />
            ))}
            {oneTimeProducts.map((prod) => (
              <PlanCard
                key={prod.id}
                name={prod.name}
                priceStr={prod.priceFormatted ?? prod.pricesFormatted[0] ?? null}
                period="one-time"
                description="Pay once, keep forever."
                cta="Buy lifetime"
                href="/api/polar/checkout-redirect?prefer=one_time"
                icon={<CreditCard size={20} weight="regular" />}
              />
            ))}
            {!hasSubscriptionProducts && !hasOneTimeProducts && (
              <PlanCard
                name={tierName}
                priceStr={null}
                period={null}
                description="Get started"
                cta="Get Premium"
                href="/api/polar/checkout-redirect"
                icon={<Plus size={20} weight="regular" />}
                featured
              />
            )}
          </div>
        </section>
      )}

      {/* Custom Badge addon */}
      {customBadgeProducts.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-6 md:p-8">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            <Medal size={18} weight="regular" />
            Custom badge addon
          </h3>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Create your own badges with label, color, icon, or image. Each purchase = one badge slot. Buy more to add more.
          </p>

          {hasCustomBadgeAddon ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-[var(--accent)] flex items-center gap-2">
                  <CheckCircle size={18} weight="fill" />
                  {customBadgeSlotCount} slot{customBadgeSlotCount !== 1 ? "s" : ""} · {badges.length} badge{badges.length !== 1 ? "s" : ""} used
                </span>
              </div>

              {badges.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--muted)]">Your badges</p>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/60 px-3 py-2"
                      >
                        <span className="text-sm font-medium">{b.label}</span>
                        <button
                          type="button"
                          onClick={() => startEdit(b)}
                          className="text-[var(--muted)] hover:text-[var(--foreground)] p-0.5"
                          title="Edit"
                        >
                          <PencilSimple size={14} weight="regular" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Delete this badge?")) return;
                            try {
                              const res = await fetch(`/api/dashboard/shop/custom-badge?id=${encodeURIComponent(b.id)}`, { method: "DELETE" });
                              if (res.ok) {
                                setBadges((prev) => prev.filter((x) => x.id !== b.id));
                                if (editingId === b.id) cancelForm();
                                toast.success("Badge deleted");
                              } else {
                                const d = await res.json();
                                toast.error(d.error ?? "Failed to delete");
                              }
                            } catch {
                              toast.error("Failed to delete");
                            }
                          }}
                          className="text-[var(--muted)] hover:text-[var(--warning)] p-0.5"
                          title="Delete"
                        >
                          <Trash size={14} weight="regular" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(isAdding || editingId) && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!formLabel.trim()) {
                    toast.error("Label is required");
                    return;
                  }
                  setBadgeSaving(true);
                  try {
                    const res = await fetch("/api/dashboard/shop/custom-badge", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        badgeId: editingId || undefined,
                        label: formLabel.trim(),
                        description: formDescription.trim() || undefined,
                        color: formColor.trim() || undefined,
                        badgeType: formBadgeType,
                        imageUrl: formBadgeType === "image" ? formImageUrl.trim() || undefined : undefined,
                        iconName: formBadgeType === "icon" ? formIconName || undefined : undefined,
                      }),
                    });
                    const data = await res.json();
                    if (data.error) {
                      toast.error(data.error);
                    } else {
                      if (editingId) {
                        setBadges((prev) => prev.map((x) => (x.id === editingId ? data.badge : x)));
                      } else {
                        setBadges((prev) => [...prev, data.badge]);
                      }
                      cancelForm();
                      toast.success("Badge saved");
                    }
                  } catch {
                    toast.error("Failed to save");
                  } finally {
                    setBadgeSaving(false);
                  }
                }}
                className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-4"
              >
                <div>
                  <label htmlFor="badge-label" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Badge label
                  </label>
                  <input
                    id="badge-label"
                    type="text"
                    maxLength={50}
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="e.g. Early supporter"
                    className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="badge-description" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Description (tooltip)
                  </label>
                  <input
                    id="badge-description"
                    type="text"
                    maxLength={200}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Shown on hover"
                    className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Badge style
                  </label>
                  <div className="flex gap-4">
                    {(["label", "icon", "image"] as const).map((t) => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="badgeType"
                          checked={formBadgeType === t}
                          onChange={() => setFormBadgeType(t)}
                          className="text-[var(--accent)]"
                        />
                        <span className="text-sm capitalize">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {formBadgeType === "icon" && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Icon</label>
                    <SearchableSelect
                      value={formIconName}
                      onChange={setFormIconName}
                      options={BADGE_ICON_OPTIONS}
                      placeholder="Choose icon"
                      className="max-w-[200px]"
                    />
                  </div>
                )}
                {formBadgeType === "image" && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Image URL</label>
                    <input
                      type="url"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="badge-color" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Color (preset or hex)
                  </label>
                  <input
                    id="badge-color"
                    type="text"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    placeholder="amber, blue, #ff0000"
                    className="w-full max-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={badgeSaving}
                    className="flex items-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
                  >
                    <PencilSimple size={16} weight="regular" />
                    {badgeSaving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface)]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              )}

              {!isAdding && !editingId && badges.length < customBadgeSlotCount && (
                <button
                  type="button"
                  onClick={startAdd}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] transition-colors"
                >
                  <Plus size={16} weight="regular" />
                  Add badge
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {customBadgeProducts.map((prod) => (
                <PlanCard
                  key={prod.id}
                  name="Custom badge"
                  priceStr={prod.priceFormatted ?? prod.pricesFormatted[0] ?? null}
                  period="one-time"
                  description="Design your own badge. Label, color, icon or image. Shows on your profile."
                  cta="Get addon"
                  href={`/api/polar/checkout-redirect?product=${prod.id}`}
                  icon={<Medal size={20} weight="regular" />}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Gallery addon */}
      {galleryAddonProducts.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-6 md:p-8">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            <ImageSquare size={18} weight="regular" />
            Gallery addon
          </h3>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Image hosting on your profile. Add images to your gallery. Premium includes this; or get just the addon.
          </p>

          {hasGalleryAddon || hasPremiumAccess ? (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={18} weight="fill" className="text-[var(--accent)]" />
              <span className="text-[var(--accent)]">You have gallery access</span>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {galleryAddonProducts.map((prod) => (
                <PlanCard
                  key={prod.id}
                  name="Gallery addon"
                  priceStr={prod.priceFormatted ?? prod.pricesFormatted[0] ?? null}
                  period="one-time"
                  description="Host images on your profile gallery."
                  cta="Get addon"
                  href={`/api/polar/checkout-redirect?product=${prod.id}`}
                  icon={<ImageSquare size={20} weight="regular" />}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Your products */}
      {ownedProductIds.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Your products
          </h3>
          <div className="flex flex-wrap gap-3">
            {ownedProductIds.map((id) => {
              const prod = allProducts.find((p) => p.id === id);
              const label = prod ? (prod.isRecurring ? tierName : prod.name) : id;
              const priceStr = prod?.priceFormatted ?? prod?.pricesFormatted[0];
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--accent)]/30"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/15">
                    <CheckCircle size={18} weight="fill" className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
                    {priceStr && (
                      <span className="ml-2 text-xs text-[var(--muted)]">({priceStr})</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Premium features */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-6 md:p-8">
        <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
          <Lock size={20} weight="regular" className="text-[var(--muted)]" />
          What {tierName} unlocks
        </h3>
        <p className="mb-5 text-sm text-[var(--muted)]">
          Everything you need to make your profile stand out.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PREMIUM_FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                hasPremiumAccess
                  ? "border-[var(--accent)]/25 bg-[var(--accent)]/8"
                  : "border-[var(--border)] bg-[var(--bg)]/40 hover:border-[var(--border-bright)]"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  hasPremiumAccess ? "bg-[var(--accent)]/20" : "bg-[var(--border)]/50"
                }`}
              >
                <Icon
                  size={18}
                  weight="regular"
                  className={hasPremiumAccess ? "text-[var(--accent)]" : "text-[var(--muted)]"}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PlanCard({
  name,
  priceStr,
  period,
  description,
  cta,
  href,
  icon,
  featured = false,
}: {
  name: string;
  priceStr: string | null;
  period: string | null;
  description: string;
  cta: string;
  href: string;
  icon: React.ReactNode;
  featured?: boolean;
}) {
  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border p-6 transition-all ${
        featured
          ? "border-[var(--accent)]/50 bg-[var(--accent)]/8 shadow-[0_0_24px_-8px_var(--accent)] hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/12"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-bright)] hover:bg-[var(--surface-hover)]"
      }`}
    >
      <div>
        <h4 className="text-lg font-semibold text-[var(--foreground)]">{name}</h4>
        {priceStr && (
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums text-[var(--foreground)]">{priceStr}</span>
            {period && (
              <span className="text-sm font-normal text-[var(--muted)]">{period}</span>
            )}
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{description}</p>
      </div>
      <Link
        href={href}
        prefetch={false}
        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
          featured
            ? "bg-[var(--accent)]/25 text-[var(--accent)] ring-1 ring-[var(--accent)]/40 hover:bg-[var(--accent)]/35 hover:ring-[var(--accent)]/60"
            : "border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--foreground)] hover:border-[var(--border-bright)]"
        }`}
      >
        {icon}
        {cta}
      </Link>
    </div>
  );
}
