import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy — ${SITE_NAME}`,
  description: "Privacy policy",
  robots: "index, follow",
};

export default function PrivacyPage() {
  return (
    <article className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-xs text-[var(--muted)] mb-6">
          <Link href="/" className="text-[var(--accent)] hover:underline">
            ← Home
          </Link>
        </p>
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--muted)] mb-4">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
        <div className="prose prose-invert prose-sm max-w-none text-[var(--foreground)] space-y-4">
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              Information we collect
            </h2>
            <p className="text-sm text-[var(--muted)]">
              We use Discord OAuth to let you sign in. We store your Discord user ID, username, display name, and avatar URL. If you create a member profile, we store the information you add (bio, links, etc.) and basic view logs (IP, user agent, timestamp) for your profile page.
            </p>
          </section>
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              How we use it
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Your data is used to run the service: authentication, displaying your profile, and (for admins) approving accounts and managing badges.
            </p>
          </section>
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              Data sharing
            </h2>
            <p className="text-sm text-[var(--muted)]">
              We do not sell your data. We may share data only as required by law or to protect the service.
            </p>
          </section>
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              Contact
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Questions? Contact us through the service or community linked from the site.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
