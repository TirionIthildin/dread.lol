import type { Metadata } from "next";
import Link from "next/link";
import TerminalWindow from "@/app/components/TerminalWindow";
import { FeatureUpdateList } from "@/app/components/FeatureUpdateList";
import { FEATURE_UPDATES } from "@/lib/updates";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Changelog — ${SITE_NAME}`,
  description: `Product updates and new features on ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/changelog` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/changelog`,
    siteName: SITE_NAME,
    title: `Changelog — ${SITE_NAME}`,
    description: `Product updates and new features on ${SITE_NAME}.`,
  },
};

export default function ChangelogPage() {
  return (
    <div className="w-full max-w-lg px-2 py-4">
      <p className="mb-4 text-center text-[11px] text-[var(--muted)]">
        <Link href="/" className="text-[var(--accent)] hover:underline">
          Home
        </Link>
        <span className="mx-1 text-[var(--muted)]/60">·</span>
        <Link href="/about" className="text-[var(--accent)] hover:underline">
          About
        </Link>
      </p>
      <TerminalWindow title="user@dread:~ — changelog" className="animate-fade-in">
        <div className="space-y-3">
          <p className="text-xs text-[var(--muted)] uppercase tracking-wider">All updates</p>
          <FeatureUpdateList updates={FEATURE_UPDATES} />
        </div>
      </TerminalWindow>
    </div>
  );
}
