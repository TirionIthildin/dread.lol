"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import NextImage from "next/image";
import { Medal, Plus, PencilSimple, Trash, LinkSimple, X } from "@phosphor-icons/react";
import { BADGE_ICON_OPTIONS } from "@/lib/badge-icons";
import BadgeIconClient from "@/app/components/BadgeIconClient";
import SearchableSelect from "@/app/components/SearchableSelect";
import { toast } from "sonner";
import CopyButton from "@/app/components/CopyButton";
import { CUSTOM_BADGE_COLORS } from "@/lib/profile-themes";

type BadgeProduct = { id: string; name: string; priceFormatted: string | null };

type Props = {
  hasAddon: boolean;
  slotCount: number;
  customBadgeProducts: BadgeProduct[];
  billingEnabled: boolean;
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

function BadgePreview({ badge }: { badge: Partial<UserCreatedBadge> }) {
  const isHex = badge.color?.startsWith("#");
  const preset = !isHex && badge.color ? CUSTOM_BADGE_COLORS[badge.color] : null;
  const className = preset
    ? `inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${preset}`
    : "inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/15 px-1.5 py-0.5 text-xs font-medium text-[var(--accent)]";
  const style =
    isHex && badge.color
      ? { backgroundColor: `${badge.color}20`, color: badge.color }
      : undefined;
  const showImage = badge.badgeType === "image" && badge.imageUrl && (badge.imageUrl.startsWith("/") || badge.imageUrl.startsWith("http"));
  const showIcon = badge.badgeType === "icon" && badge.iconName;
  return (
    <span className={className} style={style} title={badge.description || badge.label}>
      {showImage ? (
        <NextImage src={badge.imageUrl!} alt="" width={14} height={14} className="shrink-0 object-contain inline-block align-middle rounded" unoptimized />
      ) : showIcon ? (
        <BadgeIconClient iconName={badge.iconName} />
      ) : null}
      {badge.label || "Label"}
    </span>
  );
}

export default function DashboardBadgesClient({
  hasAddon,
  slotCount,
  customBadgeProducts,
  billingEnabled,
}: Props) {
  const [badges, setBadges] = useState<UserCreatedBadge[]>([]);
  const [loading, setLoading] = useState(hasAddon);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formLabel, setFormLabel] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formBadgeType, setFormBadgeType] = useState<"label" | "image" | "icon">("label");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIconName, setFormIconName] = useState("");
  const [saving, setSaving] = useState(false);
  const [linkModal, setLinkModal] = useState<{
    badgeId: string;
    url?: string;
    maxRedemptions?: string;
    expiresAt?: string;
  } | null>(null);
  const [linkPending, setLinkPending] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    if (!hasAddon) return;
    try {
      const res = await fetch("/api/dashboard/shop/custom-badge");
      if (!res.ok) return;
      const data = await res.json();
      setBadges(data.badges ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [hasAddon]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formLabel.trim()) {
      toast.error("Label is required");
      return;
    }
    setSaving(true);
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
      setSaving(false);
    }
  }

  function openLinkModal(b: UserCreatedBadge) {
    setLinkModal({ badgeId: b.id });
  }

  async function handleCreateLink(payload: { badgeId: string; maxRedemptions?: string; expiresAt?: string }) {
    setLinkPending(payload.badgeId);
    try {
      const body: { badgeId: string; maxRedemptions?: number | null; expiresAt?: string } = {
        badgeId: payload.badgeId,
      };
      const cap = payload.maxRedemptions?.trim();
      if (cap) {
        const n = parseInt(cap, 10);
        body.maxRedemptions = Number.isFinite(n) && n > 0 ? n : null;
      }
      if (payload.expiresAt?.trim()) {
        body.expiresAt = payload.expiresAt.trim();
      }
      const res = await fetch("/api/dashboard/shop/custom-badge/redemption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else if (data.url) {
        setLinkModal((prev) => (prev ? { ...prev, url: data.url } : null));
        toast.success("Redemption link created. Share it—each person can redeem once.");
      } else {
        toast.error("Failed to create link");
      }
    } catch {
      toast.error("Failed to create link");
    } finally {
      setLinkPending(null);
    }
  }

  async function handleDelete(b: UserCreatedBadge) {
    if (!confirm(`Delete badge "${b.label}"?`)) return;
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
  }

  const previewBadge: Partial<UserCreatedBadge> = {
    label: formLabel || "Label",
    description: formDescription || undefined,
    color: formColor || undefined,
    badgeType: formBadgeType,
    imageUrl: formBadgeType === "image" ? formImageUrl || undefined : undefined,
    iconName: formBadgeType === "icon" ? formIconName || undefined : undefined,
  };

  // No addon – direct to Premium
  if (!hasAddon) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-8 md:p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
          <Medal size={32} weight="regular" className="text-[var(--accent)]" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">Custom badge addon</h2>
        <p className="mt-2 text-sm text-[var(--muted)] max-w-sm mx-auto">
          Create your own badges with label, color, icon, or image. Each purchase adds one slot.
        </p>
        {billingEnabled && customBadgeProducts.length > 0 ? (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {customBadgeProducts.map((prod) => (
              <Link
                key={prod.id}
                href={`/api/polar/checkout-redirect?product=${prod.id}`}
                prefetch={false}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                <Plus size={18} weight="regular" />
                Get addon {prod.priceFormatted && `(${prod.priceFormatted})`}
              </Link>
            ))}
          </div>
        ) : (
          <Link
            href="/dashboard/premium"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-5 py-3 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
          >
            Go to Premium
          </Link>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-8">
        <p className="text-sm text-[var(--muted)]">Loading badges…</p>
      </div>
    );
  }

  const showForm = isAdding || editingId;
  const canAddMore = badges.length < slotCount;

  return (
    <div className="space-y-8">
      {/* Slot status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[var(--muted)]">
          {slotCount} slot{slotCount !== 1 ? "s" : ""} · {badges.length} badge{badges.length !== 1 ? "s" : ""} used
        </p>
        <div className="flex items-center gap-3">
          {canAddMore && !showForm && (
            <button
              type="button"
              onClick={startAdd}
              className="flex items-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
            >
              <Plus size={16} weight="regular" />
              Add badge
            </button>
          )}
          {customBadgeProducts.length > 0 && (
            <Link
              href="/dashboard/premium"
              className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
            >
              Buy more slots →
            </Link>
          )}
        </div>
      </div>

      {/* Badge list */}
      {badges.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">Your badges</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`rounded-xl border p-4 transition-colors ${
                  editingId === b.id ? "border-[var(--accent)]/50 bg-[var(--accent)]/5" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-bright)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <BadgePreview badge={b} />
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openLinkModal(b)}
                      disabled={linkPending !== null}
                      className="p-1.5 text-[var(--muted)] hover:text-[var(--accent)] rounded transition-colors disabled:opacity-50"
                      title="Create redemption link"
                    >
                      <LinkSimple size={16} weight="regular" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(b)}
                      className="p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] rounded transition-colors"
                      title="Edit"
                    >
                      <PencilSimple size={16} weight="regular" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b)}
                      className="p-1.5 text-[var(--muted)] hover:text-[var(--warning)] rounded transition-colors"
                      title="Delete"
                    >
                      <Trash size={16} weight="regular" />
                    </button>
                  </div>
                </div>
                {b.description && (
                  <p className="mt-2 text-xs text-[var(--muted)] line-clamp-2">{b.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Create/Edit form */}
      {showForm && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-6 md:p-8">
          <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
            {editingId ? "Edit badge" : "New badge"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label htmlFor="badge-label" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Label
                  </label>
                  <input
                    id="badge-label"
                    type="text"
                    maxLength={50}
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="e.g. Early supporter"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label htmlFor="badge-description" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Description <span className="text-[var(--muted)] font-normal">(tooltip on hover)</span>
                  </label>
                  <input
                    id="badge-description"
                    type="text"
                    maxLength={200}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Style</label>
                  <div className="flex flex-wrap gap-3">
                    {(["label", "icon", "image"] as const).map((t) => (
                      <label
                        key={t}
                        className={`flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${
                          formBadgeType === t ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--border-bright)]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="badgeType"
                          checked={formBadgeType === t}
                          onChange={() => setFormBadgeType(t)}
                          className="sr-only"
                        />
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
                {formBadgeType === "icon" && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Icon</label>
                    <SearchableSelect
                      value={formIconName}
                      onChange={setFormIconName}
                      options={BADGE_ICON_OPTIONS}
                      placeholder="Choose icon"
                      className="w-full max-w-xs"
                    />
                  </div>
                )}
                {formBadgeType === "image" && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Image URL</label>
                    <input
                      type="url"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2.5 text-sm font-mono focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="badge-color" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Color
                  </label>
                  <input
                    id="badge-color"
                    type="text"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    placeholder="amber, blue, #ff0000"
                    className="w-full max-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
              </div>
              <div className="flex flex-col items-start justify-center md:justify-start">
                <p className="text-sm font-medium text-[var(--muted)] mb-2">Preview</p>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/40 p-6 w-full min-h-[120px] flex items-center justify-center">
                  <BadgePreview badge={previewBadge} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50 transition-colors"
              >
                <PencilSimple size={16} weight="regular" />
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {!showForm && badges.length === 0 && canAddMore && (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
          <p className="text-sm text-[var(--muted)] mb-3">No badges yet</p>
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
          >
            <Plus size={16} weight="regular" />
            Create your first badge
          </button>
        </div>
      )}

      {linkModal && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="badge-link-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setLinkModal(null)}
            aria-hidden
          />
          <div
            className="relative z-10 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 id="badge-link-modal-title" className="text-base font-semibold text-[var(--foreground)]">
                Redemption link
              </h3>
              <button
                type="button"
                onClick={() => setLinkModal(null)}
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Close"
              >
                <X size={20} weight="regular" aria-hidden />
              </button>
            </div>
            {linkModal.url ? (
              <>
                <p className="text-sm text-[var(--muted)] mb-3">
                  Share this link. Each person can redeem once per account. Create another link for a different badge.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={linkModal.url}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm font-mono text-[var(--foreground)]"
                  />
                  <CopyButton copyValue={linkModal.url} ariaLabel="Copy redemption link">
                    Copy
                  </CopyButton>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--muted)] mb-4">
                  Create a shareable link. Each person can redeem once per account. Optional: set a cap or expiry.
                </p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="link-max-redemptions" className="block text-xs font-medium text-[var(--muted)] mb-1">
                      Max redemptions (leave empty for unlimited)
                    </label>
                    <input
                      id="link-max-redemptions"
                      type="number"
                      min={1}
                      placeholder="Unlimited"
                      value={linkModal.maxRedemptions ?? ""}
                      onChange={(e) => setLinkModal((p) => (p ? { ...p, maxRedemptions: e.target.value } : null))}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="link-expires" className="block text-xs font-medium text-[var(--muted)] mb-1">
                      Expiry date (optional)
                    </label>
                    <input
                      id="link-expires"
                      type="date"
                      value={linkModal.expiresAt ?? ""}
                      onChange={(e) => setLinkModal((p) => (p ? { ...p, expiresAt: e.target.value } : null))}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCreateLink(linkModal)}
                    disabled={!!linkPending}
                    className="w-full rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
                  >
                    {linkPending === linkModal.badgeId ? "Creating…" : "Create link"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
