"use client";

import { useCallback, useEffect, useState } from "react";
import NextImage from "next/image";
import { Gift, LinkSimple, Plus, Trash } from "@phosphor-icons/react";
import { BADGE_ICON_OPTIONS } from "@/lib/phosphor-icon-names";
import BadgeIconClient from "@/app/components/BadgeIconClient";
import SearchableSelect from "@/app/components/SearchableSelect";
import CopyButton from "@/app/components/CopyButton";
import { CUSTOM_BADGE_COLORS } from "@/lib/profile-themes";
import { toast } from "sonner";

type CreatorBadge = {
  id: string;
  label: string;
  description?: string | null;
  color?: string | null;
  badgeType?: "label" | "image" | "icon";
  imageUrl?: string | null;
  iconName?: string | null;
};

function BadgePreview({ badge }: { badge: Partial<CreatorBadge> }) {
  const isHex = badge.color?.startsWith("#");
  const preset = !isHex && badge.color ? CUSTOM_BADGE_COLORS[badge.color] : null;
  const className = preset
    ? `inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${preset}`
    : "inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/15 px-1.5 py-0.5 text-xs font-medium text-[var(--accent)]";
  const style =
    isHex && badge.color ? { backgroundColor: `${badge.color}20`, color: badge.color } : undefined;
  const showImage =
    badge.badgeType === "image" && badge.imageUrl && (badge.imageUrl.startsWith("/") || badge.imageUrl.startsWith("http"));
  const showIcon = badge.badgeType === "icon" && badge.iconName;
  return (
    <span className={className} style={style} title={badge.description || badge.label}>
      {showImage ? (
        <NextImage
          src={badge.imageUrl!}
          alt=""
          width={14}
          height={14}
          className="shrink-0 object-contain inline-block align-middle rounded"
          unoptimized
        />
      ) : showIcon ? (
        <BadgeIconClient iconName={badge.iconName} />
      ) : null}
      {badge.label || "Label"}
    </span>
  );
}

export default function CreatorSpaceClient() {
  const [badge, setBadge] = useState<CreatorBadge | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);

  const [voucherLinks, setVoucherLinks] = useState<
    {
      linkId: string;
      url: string;
      label: string | null;
      maxRedemptions: number | null;
      expiresAt: string | null;
      redemptionCount: number;
      createdAt: string;
    }[]
  >([]);
  const [voucherLoading, setVoucherLoading] = useState(true);
  const [voucherLabel, setVoucherLabel] = useState("");
  const [voucherMax, setVoucherMax] = useState("");
  const [voucherExpires, setVoucherExpires] = useState("");
  const [voucherCreatePending, setVoucherCreatePending] = useState(false);
  const [voucherCreatedUrl, setVoucherCreatedUrl] = useState<string | null>(null);

  const [formLabel, setFormLabel] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formBadgeType, setFormBadgeType] = useState<"label" | "image" | "icon">("label");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIconName, setFormIconName] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/creator/badge");
      if (!res.ok) {
        setBadge(null);
        return;
      }
      const data = await res.json();
      const b = data.badge as CreatorBadge | null;
      setBadge(b);
      if (b) {
        setFormLabel(b.label ?? "");
        setFormDescription(b.description ?? "");
        setFormColor(b.color ?? "");
        setFormBadgeType((b.badgeType as "label" | "image" | "icon") ?? "label");
        setFormImageUrl(b.imageUrl ?? "");
        setFormIconName(b.iconName ?? "");
      }
    } catch {
      setBadge(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadVouchers = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/creator/premium-voucher");
      if (!res.ok) {
        setVoucherLinks([]);
        return;
      }
      const data = await res.json();
      const raw = (data.links ?? []) as Array<{
        linkId: string;
        url: string;
        label: string | null;
        maxRedemptions: number | null;
        expiresAt: string | null;
        redemptionCount: number;
        createdAt: string;
      }>;
      setVoucherLinks(
        raw.map((l) => ({
          ...l,
          expiresAt:
            l.expiresAt == null
              ? null
              : typeof l.expiresAt === "string"
                ? l.expiresAt
                : new Date(l.expiresAt as unknown as Date).toISOString(),
          createdAt:
            typeof l.createdAt === "string"
              ? l.createdAt
              : new Date((l.createdAt as unknown) as Date).toISOString(),
        }))
      );
    } catch {
      setVoucherLinks([]);
    } finally {
      setVoucherLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formLabel.trim()) {
      toast.error("Label is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/creator/badge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badgeId: badge?.id,
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
        setBadge(data.badge);
        toast.success("Saved");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateVoucher(e: React.FormEvent) {
    e.preventDefault();
    setVoucherCreatePending(true);
    setVoucherCreatedUrl(null);
    try {
      const body: { maxRedemptions?: number | null; expiresAt?: string; label?: string } = {};
      const cap = voucherMax.trim();
      if (cap) {
        const n = parseInt(cap, 10);
        if (Number.isFinite(n) && n > 0) body.maxRedemptions = n;
      }
      if (voucherExpires.trim()) {
        const d = new Date(voucherExpires);
        if (!Number.isNaN(d.getTime())) body.expiresAt = d.toISOString();
      }
      if (voucherLabel.trim()) body.label = voucherLabel.trim();

      const res = await fetch("/api/dashboard/creator/premium-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else if (data.url) {
        setVoucherCreatedUrl(data.url);
        setVoucherLabel("");
        setVoucherMax("");
        setVoucherExpires("");
        toast.success("Premium voucher link created");
        loadVouchers();
      } else {
        toast.error("Failed to create link");
      }
    } catch {
      toast.error("Failed to create link");
    } finally {
      setVoucherCreatePending(false);
    }
  }

  async function handleGetLink() {
    setLinkBusy(true);
    setLinkUrl(null);
    try {
      const res = await fetch("/api/dashboard/creator/redemption", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else if (data.url) {
        setLinkUrl(data.url);
        toast.success("Link ready — unlimited redemptions, one per person");
      }
    } catch {
      toast.error("Failed to create link");
    } finally {
      setLinkBusy(false);
    }
  }

  async function handleDelete() {
    if (!badge || !confirm("Delete your creator badge and its share link? People who already redeemed keep the badge.")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/creator/badge", { method: "DELETE" });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        setBadge(null);
        setLinkUrl(null);
        setFormLabel("");
        setFormDescription("");
        setFormColor("");
        setFormBadgeType("label");
        setFormImageUrl("");
        setFormIconName("");
        toast.success("Creator badge removed");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setSaving(false);
    }
  }

  const preview: Partial<CreatorBadge> = {
    label: formLabel || "Preview",
    description: formDescription || undefined,
    color: formColor || undefined,
    badgeType: formBadgeType,
    imageUrl: formImageUrl || undefined,
    iconName: formIconName || undefined,
  };

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  }

  return (
    <div className="space-y-8 max-w-xl">
      <p className="text-sm text-[var(--muted)] leading-relaxed">
        Design one badge for your audience. You get a single share link with unlimited redemptions (each Discord account can redeem once).
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/40 p-6">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Preview</span>
          <BadgePreview badge={preview} />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Label</label>
          <input
            value={formLabel}
            onChange={(e) => setFormLabel(e.target.value)}
            maxLength={50}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)]"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Description (optional)</label>
          <input
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            maxLength={200}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Color</label>
          <select
            value={formColor}
            onChange={(e) => setFormColor(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)]"
          >
            <option value="">Default (accent)</option>
            {Object.keys(CUSTOM_BADGE_COLORS).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Type</label>
          <select
            value={formBadgeType}
            onChange={(e) => setFormBadgeType(e.target.value as "label" | "image" | "icon")}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)]"
          >
            <option value="label">Text</option>
            <option value="image">Image</option>
            <option value="icon">Icon</option>
          </select>
        </div>
        {formBadgeType === "image" && (
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Image URL</label>
            <input
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)]"
              placeholder="https://…"
            />
          </div>
        )}
        {formBadgeType === "icon" && (
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Icon</label>
            <SearchableSelect
              name="creatorBadgeIcon"
              value={formIconName}
              onChange={setFormIconName}
              options={BADGE_ICON_OPTIONS}
              placeholder="Search icons…"
              ariaLabel="Badge icon"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : badge ? "Update badge" : "Create badge"}
          </button>
          {badge && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--warning)] hover:bg-[var(--warning)]/10 disabled:opacity-50"
            >
              <Trash size={18} />
              Delete
            </button>
          )}
        </div>
      </form>

      {badge && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/40 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
            <LinkSimple size={18} className="text-[var(--accent)]" />
            Share link
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Generate one link to share everywhere. It stays the same if you click again.
          </p>
          <button
            type="button"
            onClick={handleGetLink}
            disabled={linkBusy}
            className="rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
          >
            {linkBusy ? "Working…" : linkUrl ? "Refresh link (same URL)" : "Get share link"}
          </button>
          {linkUrl && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
              <code className="text-xs text-[var(--foreground)] break-all flex-1 min-w-0">{linkUrl}</code>
              <CopyButton copyValue={linkUrl} ariaLabel="Copy share link">
                Copy
              </CopyButton>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/40 p-6 space-y-4 max-w-xl">
        <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
          <Gift size={18} className="text-[var(--accent)]" />
          Premium voucher links
        </h2>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          Separate from your badge link above: these URLs grant site Premium when someone redeems (one redemption per
          Discord account per link). Share them for giveaways or campaigns.
        </p>

        {voucherCreatedUrl ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--muted)]">Link created. Copy and share it.</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={voucherCreatedUrl}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-xs font-mono"
              />
              <CopyButton copyValue={voucherCreatedUrl} ariaLabel="Copy voucher link">
                Copy
              </CopyButton>
            </div>
            <button
              type="button"
              onClick={() => setVoucherCreatedUrl(null)}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Create another
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateVoucher} className="space-y-4">
            <div>
              <label htmlFor="voucher-label" className="block text-xs font-medium text-[var(--muted)] mb-1">
                Label <span className="text-[var(--muted)]/80">(optional, for your reference)</span>
              </label>
              <input
                id="voucher-label"
                type="text"
                value={voucherLabel}
                onChange={(e) => setVoucherLabel(e.target.value)}
                placeholder="e.g. Summer campaign"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <label htmlFor="voucher-max" className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Max redemptions
                </label>
                <input
                  id="voucher-max"
                  type="number"
                  min={1}
                  value={voucherMax}
                  onChange={(e) => setVoucherMax(e.target.value)}
                  placeholder="Unlimited"
                  className="w-32 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="voucher-expires" className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Expiry date
                </label>
                <input
                  id="voucher-expires"
                  type="date"
                  value={voucherExpires}
                  onChange={(e) => setVoucherExpires(e.target.value)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={voucherCreatePending}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
            >
              <Plus size={18} weight="regular" />
              {voucherCreatePending ? "Creating…" : "Create link"}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-[var(--border)]/60">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">Your links</h3>
          {voucherLoading ? (
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          ) : voucherLinks.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No Premium voucher links yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-2 pr-3 text-left font-medium text-[var(--muted)]">Label</th>
                    <th className="py-2 pr-3 text-right font-medium text-[var(--muted)]">Redemptions</th>
                    <th className="py-2 pr-3 text-left font-medium text-[var(--muted)]">Expires</th>
                    <th className="py-2 pr-3 text-left font-medium text-[var(--muted)]">Created</th>
                    <th className="py-2 text-left font-medium text-[var(--muted)]">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {voucherLinks.map((l) => (
                    <tr key={l.linkId} className="border-b border-[var(--border)]/50 align-top">
                      <td className="py-2 pr-3 text-[var(--foreground)]">{l.label ?? "—"}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {l.redemptionCount}
                        {l.maxRedemptions != null && l.maxRedemptions > 0 ? (
                          <span className="text-[var(--muted)]"> / {l.maxRedemptions}</span>
                        ) : (
                          <span className="text-[var(--muted)]"> / ∞</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-[var(--muted)]">
                        {l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2 pr-3 text-[var(--muted)]">
                        {l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2">
                        <div className="flex flex-wrap items-center gap-1 max-w-[14rem]">
                          <code className="text-[10px] text-[var(--foreground)] break-all flex-1 min-w-0">{l.url}</code>
                          <CopyButton copyValue={l.url} ariaLabel="Copy voucher link">
                            Copy
                          </CopyButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
