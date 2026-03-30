"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_DOCS_NAV, type SiteDocNavItem } from "@/lib/site-docs";

function navClass(active: boolean) {
  return [
    "block rounded-md px-2.5 py-1.5 text-sm transition-colors",
    active
      ? "bg-[var(--accent-muted)] text-[var(--foreground)] border border-[var(--accent)]/30"
      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] border border-transparent",
  ].join(" ");
}

function NavItem({ item, pathname }: { item: SiteDocNavItem; pathname: string }) {
  if (item.kind === "link") {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link href={item.href} className={navClass(active)}>
        <span className="font-mono text-xs text-[var(--terminal)]/80 mr-1.5 select-none" aria-hidden>
          $
        </span>
        {item.title}
      </Link>
    );
  }
  const href = `/docs/${item.slug}`;
  const active = pathname === href;
  return (
    <Link href={href} className={navClass(active)}>
      <span className="font-mono text-xs text-[var(--terminal)]/80 mr-1.5 select-none" aria-hidden>
        $
      </span>
      {item.title}
    </Link>
  );
}

function NavList({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Documentation sections">
      <Link
        href="/docs"
        className={navClass(pathname === "/docs")}
      >
        <span className="font-mono text-xs text-[var(--terminal)]/80 mr-1.5 select-none" aria-hidden>
          #
        </span>
        Overview
      </Link>
      {SITE_DOCS_NAV.map((item) => (
        <NavItem key={item.kind === "page" ? item.slug : item.href} item={item} pathname={pathname} />
      ))}
    </nav>
  );
}

export default function DocsNav() {
  const pathname = usePathname() ?? "";

  return (
    <>
      <details className="group md:hidden w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm shadow-sm">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-[var(--foreground)] flex items-center justify-between gap-2">
          <span className="font-mono text-[var(--terminal)]">~/docs</span>
          <span className="text-[var(--muted)] text-xs group-open:rotate-0">Menu</span>
        </summary>
        <div className="border-t border-[var(--border)] px-2 py-2">
          <NavList pathname={pathname} />
        </div>
      </details>

      <aside className="hidden md:block w-52 shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm p-3 shadow-sm">
        <p className="font-mono text-xs text-[var(--terminal)] mb-3 px-1 truncate" title="Documentation">
          ~/docs
        </p>
        <NavList pathname={pathname} />
      </aside>
    </>
  );
}
