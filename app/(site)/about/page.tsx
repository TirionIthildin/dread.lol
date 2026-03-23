import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: `About — ${SITE_NAME}`,
  description: `${SITE_NAME}: terminal-styled member profiles, Discord sign-in, marketplace templates, gallery, blog, and more.`,
  robots: "index, follow",
};

export default function AboutPage() {
  return (
    <article className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-xs text-[var(--muted)] mb-6">
          <Link href="/" className="text-[var(--accent)] hover:underline">
            ← Home
          </Link>
        </p>
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">About {SITE_NAME}</h1>
        <p className="text-sm text-[var(--muted)] mb-6">{SITE_DESCRIPTION}</p>

        <div className="prose prose-invert prose-sm max-w-none text-[var(--foreground)] space-y-4">
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              What it is
            </h2>
            <p className="text-sm text-[var(--muted)]">
              {SITE_NAME} is a member profile site with a terminal-inspired look and deep customization: themes,
              effects, widgets, and optional community features like vouches and leaderboards. It is built for people
              who already live on Discord and want a profile that matches that vibe—not a generic link-in-bio block.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              What you can do
            </h2>
            <ul className="text-sm text-[var(--muted)] list-disc pl-5 space-y-1.5">
              <li>
                <Link href="/marketplace" className="text-[var(--accent)] hover:underline">
                  Marketplace
                </Link>
                — browse and apply community-made profile templates.
              </li>
              <li>
                Profile gallery, paste, and markdown blog at{" "}
                <code className="text-xs text-[var(--foreground)]">/yourname/blog</code>.
              </li>
              <li>
                Short links, analytics, badges, Roblox and Discord widgets, and more from the dashboard after you sign
                in.
              </li>
              <li>
                <Link href="/trending" className="text-[var(--accent)] hover:underline">
                  Trending
                </Link>{" "}
                and{" "}
                <Link href="/dashboard/leaderboard" className="text-[var(--accent)] hover:underline">
                  Leaderboard
                </Link>{" "}
                highlight community activity.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              Premium
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Extra visual effects, expanded limits, and add-ons are available through{" "}
              <Link href="/dashboard/premium" className="text-[var(--accent)] hover:underline">
                Premium
              </Link>{" "}
              (Polar checkout). Pricing is shown in the dashboard after you sign in with Discord—plans and products
              can change, so the dashboard always reflects what is live.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              Privacy
            </h2>
            <p className="text-sm text-[var(--muted)]">
              We use Discord for sign-in and store what you add to your profile. Profile view analytics use basic
              technical data (for example IP and user agent) as described in our{" "}
              <Link href="/privacy" className="text-[var(--accent)] hover:underline">
                Privacy Policy
              </Link>
              . We do not sell your data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              Identity and roadmap
            </h2>
            <p className="text-sm text-[var(--muted)] mb-3">
              <strong className="text-[var(--foreground)] font-medium">Discord sign-in.</strong> Accounts are tied to
              Discord OAuth. That keeps onboarding simple for our core audience and aligns the product with Discord
              identity. Additional identity providers (email, Google, etc.) are{" "}
              <strong className="text-[var(--foreground)] font-medium">not planned</strong> in the near term; if that
              ever changes, we will announce it here and in site updates.
            </p>
            <p className="text-sm text-[var(--muted)] mb-3">
              <strong className="text-[var(--foreground)] font-medium">Custom domains and DNS.</strong> Hosting your
              profile on your own domain (CNAME/apex) or offering registrar-style DNS is{" "}
              <strong className="text-[var(--foreground)] font-medium">out of scope</strong> for now. Profiles live on{" "}
              <code className="text-xs text-[var(--foreground)]">dread.lol/yourname</code>. We may revisit custom domains
              later; it is not on the public roadmap today.
            </p>
            <p className="text-sm text-[var(--muted)]">
              <strong className="text-[var(--foreground)] font-medium">API.</strong> A subset of HTTP routes is
              documented for public reads—see{" "}
              <Link href="/docs/api" className="text-[var(--accent)] hover:underline">
                API scope
              </Link>
              . Everything else is for the web app and may change without notice.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              Help
            </h2>
            <p className="text-sm text-[var(--muted)]">
              For questions or issues, use whichever support or community channel you already use for {SITE_NAME}, or
              reach out through contacts listed on the site when available.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
