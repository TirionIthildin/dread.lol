import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Terms of Service — ${SITE_NAME}`,
  description: "Terms of service",
  robots: "index, follow",
};

export default function TermsPage() {
  return (
    <article className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-xs text-[var(--muted)] mb-6">
          <Link href="/" className="text-[var(--accent)] hover:underline">
            ← Home
          </Link>
        </p>
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-4">
          Terms of Service
        </h1>
        <p className="text-sm text-[var(--muted)] mb-4">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
        <div className="prose prose-invert prose-sm max-w-none text-[var(--foreground)] space-y-4">
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              Acceptance
            </h2>
            <p className="text-sm text-[var(--muted)]">
              By using {SITE_NAME}, you agree to these terms. If you do not agree, do not use the service.
            </p>
          </section>
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              Use of the service
            </h2>
            <p className="text-sm text-[var(--muted)]">
              You must use the service in good faith. Do not abuse, spam, or attempt to harm the service or other users. Your profile and content must comply with applicable laws and not infringe others’ rights.
            </p>
          </section>
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              Account and access
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Access may require approval. We may suspend or remove access if we believe you have violated these terms or for operational reasons.
            </p>
          </section>
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              Changes
            </h2>
            <p className="text-sm text-[var(--muted)]">
              We may update these terms. Continued use after changes constitutes acceptance. Important changes may be communicated via the service or community.
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
