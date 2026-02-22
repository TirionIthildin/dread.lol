import type { Metadata } from "next";
import PasteSection from "@/app/components/PasteSection";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Paste",
  description: `Share code or text. Paste service by ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/dashboard/paste` },
};

export default async function DashboardPastePage() {
  const session = await getSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          <span className="text-[var(--terminal)]">$</span> paste
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Paste code or text. Log in with Discord to create.
        </p>
      </div>

      <PasteSection isLoggedIn={!!session} />
    </div>
  );
}
