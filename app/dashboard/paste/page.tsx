import type { Metadata } from "next";
import PasteSection from "@/app/components/PasteSection";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import { getBillingSettings } from "@/lib/settings";
import { getPremiumAccess } from "@/lib/premium-permissions";

export const metadata: Metadata = {
  title: "Paste",
  description: `Share code or text. Paste service by ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/dashboard/paste` },
};

export default async function DashboardPastePage() {
  const session = await getSession();
  const [billing, premiumAccess] = session
    ? await Promise.all([getBillingSettings(), getPremiumAccess(session.sub)])
    : [null, null];

  const canCreatePaste =
    !!session && (!!premiumAccess?.hasAccess || !billing?.pastePremiumOnly);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          <span className="text-[var(--terminal)]">$</span> paste
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {canCreatePaste
            ? "Create and share pastes."
            : "Paste requires Premium. Log in and upgrade at the Shop to create pastes."}
        </p>
      </div>

      <PasteSection isLoggedIn={!!session} canCreatePaste={canCreatePaste} />
    </div>
  );
}
