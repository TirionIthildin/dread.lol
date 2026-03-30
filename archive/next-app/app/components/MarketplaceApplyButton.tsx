"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function MarketplaceApplyButton({
  templateId,
  templateName,
}: {
  templateId: string;
  templateName: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleApply() {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketplace/templates/${templateId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to apply");
        return;
      }
      toast.success(`Applied "${templateName}" to your profile`);
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Failed to apply template");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleApply}
      disabled={loading}
      className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
    >
      {loading ? "Applying…" : "Apply to my profile"}
    </button>
  );
}
