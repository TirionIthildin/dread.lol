import type { Metadata } from "next";
import PasteSection from "@/app/components/PasteSection";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import { getBillingSettings } from "@/lib/settings";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { DashboardPageHeader } from "@/app/[locale]/dashboard/components/DashboardPageHeader";

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
      <DashboardPageHeader
        title={
          <>
            <span className="text-[var(--terminal)]">$</span> paste
          </>
        }
        description={
          canCreatePaste
            ? "Create and share pastes."
            : "Paste requires Premium. Log in and upgrade at Premium to create pastes."
        }
      />

      <PasteSection isLoggedIn={!!session} canCreatePaste={canCreatePaste} />
    </div>
  );
}
