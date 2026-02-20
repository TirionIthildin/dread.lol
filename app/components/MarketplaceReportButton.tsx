"use client";

import { useState } from "react";
import { Flag } from "@phosphor-icons/react";
import { toast } from "sonner";

interface Props {
  templateId: string;
  className?: string;
}

export default function MarketplaceReportButton({ templateId, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketplace/templates/${templateId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to report");
        return;
      }
      toast.success("Report submitted. Thank you.");
      setOpen(false);
      setReason("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <Flag size={14} weight="regular" />
        Report
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2">
          <label className="block text-xs font-medium text-[var(--muted)]">
            Reason (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 1000))}
            rows={2}
            className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
            placeholder="What's wrong with this template?"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="rounded border border-[var(--warning)]/50 px-2 py-1 text-xs text-[var(--warning)] hover:bg-[var(--warning)]/10 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Submit report"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setReason(""); }}
              className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
