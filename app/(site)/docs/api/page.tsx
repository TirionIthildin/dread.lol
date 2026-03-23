import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `API scope — ${SITE_NAME}`,
  description: `Public JSON endpoints and usage notes for ${SITE_NAME}.`,
  robots: "index, follow",
};

const base = SITE_URL.replace(/\/$/, "");

export default function ApiDocsPage() {
  return (
    <article className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-xs text-[var(--muted)] mb-6">
          <Link href="/" className="text-[var(--accent)] hover:underline">
            ← Home
          </Link>
          <span className="mx-2">·</span>
          <Link href="/about" className="text-[var(--accent)] hover:underline">
            About
          </Link>
        </p>
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">HTTP API scope</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          {SITE_NAME} is primarily a web application. These routes are documented so integrations (widgets, scripts,
          mirrors) can rely on <strong className="text-[var(--foreground)] font-medium">read-only</strong> JSON where
          noted. Write endpoints require a browser session (HTTP-only cookie) from Discord or local sign-in unless
          stated otherwise—there is no public API key for third-party automation today.
        </p>

        <div className="prose prose-invert prose-sm max-w-none text-[var(--foreground)] space-y-4">
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">Base URL</h2>
            <p className="text-sm text-[var(--muted)]">
              All paths are relative to{" "}
              <code className="text-xs text-[var(--foreground)] break-all">{base}</code>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              Public reads (no sign-in)
            </h2>
            <ul className="text-sm text-[var(--muted)] space-y-3 list-none pl-0">
              <li>
                <code className="text-xs text-[var(--foreground)] break-all">
                  GET /api/profiles/{"{slug}"}/gallery
                </code>
                <p className="mt-1">Returns gallery items for the profile slug. 404 if the profile does not exist.</p>
              </li>
              <li>
                <code className="text-xs text-[var(--foreground)] break-all">
                  GET /api/profiles/{"{slug}"}/blog
                </code>
                <p className="mt-1">Returns blog posts for the profile.</p>
              </li>
              <li>
                <code className="text-xs text-[var(--foreground)] break-all">
                  GET /api/profiles/{"{slug}"}/discord-status
                </code>
                <p className="mt-1">Returns cached Discord presence for the profile owner, or null.</p>
              </li>
              <li>
                <code className="text-xs text-[var(--foreground)] break-all">GET /api/profiles/{"{slug}"}/vouch</code>
                <p className="mt-1">
                  Returns vouch count, list, and whether the current session has vouched (optional cookie).
                </p>
              </li>
              <li>
                <code className="text-xs text-[var(--foreground)] break-all">
                  GET /api/marketplace/templates?limit=20&amp;skip=0&amp;sort=applied|recent&amp;q=
                </code>
                <p className="mt-1">
                  Lists published templates. Omit <code className="text-xs">mine=1</code> and{" "}
                  <code className="text-xs">admin=1</code> (those require sign-in).
                </p>
              </li>
              <li>
                <code className="text-xs text-[var(--foreground)] break-all">
                  GET /api/marketplace/templates/{"{id}"}
                </code>
                <p className="mt-1">Returns a template if it is published (or you are the creator/admin).</p>
              </li>
              <li>
                <code className="text-xs text-[var(--foreground)] break-all">
                  GET /api/paste/{"{slug}"}?raw=1
                </code>
                <p className="mt-1">
                  Returns paste body: JSON by default, or plain text when <code className="text-xs">raw=1</code> or{" "}
                  <code className="text-xs">raw=true</code>.
                </p>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">
              Authenticated or write actions
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Creating pastes, posting to blogs, uploading files, applying templates, checkout, and dashboard APIs
              require an active session. Expect <code className="text-xs text-[var(--foreground)]">401</code> or{" "}
              <code className="text-xs text-[var(--foreground)]">403</code> without it. Do not depend on undocumented{" "}
              <code className="text-xs text-[var(--foreground)]">/api/dashboard/*</code> routes—they can change at any
              time.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">Rate limiting</h2>
            <p className="text-sm text-[var(--muted)]">
              Some endpoints apply per-IP or per-user limits. If you exceed them, responses may return{" "}
              <code className="text-xs text-[var(--foreground)]">429 Too Many Requests</code> with a{" "}
              <code className="text-xs text-[var(--foreground)]">Retry-After</code> header. Use public reads
              reasonably—batching and caching are appreciated.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">Stability</h2>
            <p className="text-sm text-[var(--muted)]">
              Field names and shapes for the routes above follow the current app behavior. We may add fields or tighten
              validation; avoid brittle scraping. For product direction and changes, see the{" "}
              <Link href="/" className="text-[var(--accent)] hover:underline">
                homepage updates
              </Link>{" "}
              and{" "}
              <Link href="/about" className="text-[var(--accent)] hover:underline">
                About
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
