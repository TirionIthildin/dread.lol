"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Plus } from "lucide-react";
import { toast } from "sonner";
import CopyButton from "@/app/components/CopyButton";

type StatsByCreator = {
  creatorId: string;
  displayName: string;
  linkCount: number;
  redemptionCount: number;
};

type StatsByLink = {
  linkId: string;
  token: string;
  creatorId: string;
  displayName: string;
  label?: string | null;
  redemptionCount: number;
  createdAt: string;
};

export default function AdminPremiumVouchersClient() {
  const [byCreator, setByCreator] = useState<StatsByCreator[]>([]);
  const [byLink, setByLink] = useState<StatsByLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatorId, setCreatorId] = useState("");
  const [label, setLabel] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [createPending, setCreatePending] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/admin/premium-voucher-stats");
      if (!res.ok) return;
      const data = await res.json();
      setByCreator(data.byCreator ?? []);
      setByLink(data.byLink ?? []);
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const cid = creatorId.trim();
    if (!cid) {
      toast.error("Creator ID (Discord user ID) is required");
      return;
    }
    setCreatePending(true);
    setCreatedUrl(null);
    try {
      const body: { creatorId: string; maxRedemptions?: number | null; expiresAt?: string; label?: string } = {
        creatorId: cid,
      };
      const cap = maxRedemptions.trim();
      if (cap) {
        const n = parseInt(cap, 10);
        if (Number.isFinite(n) && n > 0) body.maxRedemptions = n;
      }
      if (expiresAt.trim()) {
        const d = new Date(expiresAt);
        if (!Number.isNaN(d.getTime())) body.expiresAt = d.toISOString();
      }
      if (label.trim()) body.label = label.trim();

      const res = await fetch("/api/dashboard/admin/premium-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else if (data.url) {
        setCreatedUrl(data.url);
        setCreatorId("");
        setLabel("");
        setMaxRedemptions("");
        setExpiresAt("");
        toast.success("Premium voucher link created");
        fetchStats();
      } else {
        toast.error("Failed to create link");
      }
    } catch {
      toast.error("Failed to create link");
    } finally {
      setCreatePending(false);
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
          <Gift size={24} className="text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">Premium voucher links</h1>
          <p className="text-sm text-[var(--muted)]">
            Create shareable links that grant Premium. Redemptions are tracked per creator.
          </p>
        </div>
      </div>

      {/* Create link form */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Create link
        </h2>
        {createdUrl ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--muted)]">Link created. Share it with the creator.</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={createdUrl}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm font-mono"
              />
              <CopyButton copyValue={createdUrl} ariaLabel="Copy link">
                Copy
              </CopyButton>
            </div>
            <button
              type="button"
              onClick={() => setCreatedUrl(null)}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Create another
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="creator-id" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Creator ID <span className="text-[var(--muted)]">(Discord user ID for attribution)</span>
              </label>
              <input
                id="creator-id"
                type="text"
                value={creatorId}
                onChange={(e) => setCreatorId(e.target.value)}
                placeholder="e.g. 123456789012345678"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="link-label" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Label <span className="text-[var(--muted)]">(optional, for admin display)</span>
              </label>
              <input
                id="link-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Summer campaign"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-4">
              <div>
                <label htmlFor="max-redemptions" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Max redemptions
                </label>
                <input
                  id="max-redemptions"
                  type="number"
                  min={1}
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                  placeholder="Unlimited"
                  className="w-32 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="expires-at" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Expiry date
                </label>
                <input
                  id="expires-at"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={createPending}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
            >
              <Plus size={18} />
              {createPending ? "Creating…" : "Create link"}
            </button>
          </form>
        )}
      </section>

      {/* Stats */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Redemption stats
        </h2>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        ) : byCreator.length === 0 && byLink.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No premium voucher links yet.</p>
        ) : (
          <div className="space-y-8">
            <div>
              <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]">By creator</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="py-2 pr-4 text-left font-medium text-[var(--muted)]">Creator</th>
                      <th className="py-2 pr-4 text-right font-medium text-[var(--muted)]">Links</th>
                      <th className="py-2 text-right font-medium text-[var(--muted)]">Redemptions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCreator.map((c) => (
                      <tr key={c.creatorId} className="border-b border-[var(--border)]/50">
                        <td className="py-2 pr-4">
                          <span className="font-medium">{c.displayName}</span>
                          <span className="ml-1 text-xs text-[var(--muted)]">({c.creatorId})</span>
                        </td>
                        <td className="py-2 pr-4 text-right">{c.linkCount}</td>
                        <td className="py-2 text-right">{c.redemptionCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]">By link</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="py-2 pr-4 text-left font-medium text-[var(--muted)]">Token</th>
                      <th className="py-2 pr-4 text-left font-medium text-[var(--muted)]">Creator</th>
                      <th className="py-2 pr-4 text-left font-medium text-[var(--muted)]">Label</th>
                      <th className="py-2 pr-4 text-right font-medium text-[var(--muted)]">Redemptions</th>
                      <th className="py-2 text-left font-medium text-[var(--muted)]">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byLink.map((l) => (
                      <tr key={l.linkId} className="border-b border-[var(--border)]/50">
                        <td className="py-2 pr-4 font-mono text-xs">{l.token}</td>
                        <td className="py-2 pr-4">{l.displayName}</td>
                        <td className="py-2 pr-4 text-[var(--muted)]">{l.label ?? "—"}</td>
                        <td className="py-2 pr-4 text-right">{l.redemptionCount}</td>
                        <td className="py-2 text-[var(--muted)]">
                          {l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
