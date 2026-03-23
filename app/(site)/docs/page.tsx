import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { SITE_DOCS_NAV } from "@/lib/site-docs";

export const metadata: Metadata = {
  title: `Documentation — ${SITE_NAME}`,
  description: `Guides and API reference for ${SITE_NAME}.`,
  robots: "index, follow",
};

export default function DocsHomePage() {
  return (
    <article>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2 tracking-tight">Documentation</h1>
        <p className="text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
          Guides for running Dread.lol locally, contributing to the project, and using the public HTTP API. Styled to
          match the site: monospace hints, terminal green, and cyan accents.
        </p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {SITE_DOCS_NAV.map((item) => {
          const href = item.kind === "page" ? `/docs/${item.slug}` : item.href;
          return (
            <li key={href}>
              <Link
                href={href}
                className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)]"
              >
                <span className="font-mono text-[10px] text-[var(--terminal)]/90 mb-1.5 block truncate">{href}</span>
                <span className="font-medium text-[var(--foreground)]">{item.title}</span>
                {item.description ? <p className="text-xs text-[var(--muted)] mt-1.5 leading-snug">{item.description}</p> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
