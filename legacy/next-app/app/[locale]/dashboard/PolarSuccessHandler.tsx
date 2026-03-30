"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function PolarSuccessHandler() {
  const searchParams = useSearchParams();
  const [handled, setHandled] = useState<string | null>(null);

  const checkoutId = searchParams.get("checkout_id");
  const polarSuccess = searchParams.get("polar");

  const verify = useCallback(async () => {
    if (!checkoutId || polarSuccess !== "success") return;
    if (handled === checkoutId) return;

    try {
      const res = await fetch("/api/polar/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutId }),
      });
      const data = await res.json();
      setHandled(checkoutId);

      if (data.ok) {
        toast.success(
          data.alreadyProcessed
            ? "Payment already processed."
            : "Payment verified. Thanks for your support!"
        );
      } else {
        toast.error(data.error ?? "Could not verify payment.");
      }
    } catch {
      toast.error("Failed to verify payment.");
    }
  }, [checkoutId, polarSuccess, handled]);

  useEffect(() => {
    verify();
  }, [verify]);

  return null;
}
