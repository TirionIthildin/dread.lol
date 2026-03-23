/**
 * User-facing documentation served at /docs. Markdown sources live in
 * `content/site-docs/` (see {@link loadSiteDoc}).
 */

export type SiteDocNavItem =
  | { kind: "page"; slug: string; title: string; description?: string }
  | { kind: "link"; href: string; title: string; description?: string };

/** Ordered navigation for the docs shell (sidebar + home cards). */
export const SITE_DOCS_NAV: SiteDocNavItem[] = [
  {
    kind: "page",
    slug: "welcome",
    title: "Welcome",
    description: "What Dread.lol is and how this documentation is organized.",
  },
  {
    kind: "page",
    slug: "local-development",
    title: "Local development",
    description: "Run the app locally with Docker, env, and databases.",
  },
  {
    kind: "page",
    slug: "contributing",
    title: "Contributing",
    description: "PRs, CI, license, and where to report security issues.",
  },
  {
    kind: "link",
    href: "/docs/api",
    title: "HTTP API",
    description: "Public JSON endpoints and integration notes.",
  },
];

export function getSiteDocPageSlugs(): string[] {
  return SITE_DOCS_NAV.filter((item): item is Extract<SiteDocNavItem, { kind: "page" }> => item.kind === "page").map(
    (p) => p.slug,
  );
}

export function getSiteDocMeta(slug: string): { title: string; description?: string } | null {
  const page = SITE_DOCS_NAV.find((item) => item.kind === "page" && item.slug === slug);
  if (!page || page.kind !== "page") return null;
  return { title: page.title, description: page.description };
}
