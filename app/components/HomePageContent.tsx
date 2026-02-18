"use client";

import TerminalWindow from "@/app/components/TerminalWindow";
import WelcomeTerminal from "@/app/components/WelcomeTerminal";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { PROFILES } from "@/lib/profiles";

export default function HomePageContent() {
  return (
    <div className="relative z-10 w-full max-w-2xl max-h-[calc(100vh-1.5rem)] overflow-auto">
      <h1 className="sr-only">
        {SITE_NAME} — Profiles for friends.
      </h1>
      <TerminalWindow
        title="user@dread:~ — welcome"
        className="animate-fade-in hover-lift"
      >
        <WelcomeTerminal />
      </TerminalWindow>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {PROFILES.map((p) => (
          <Link
            key={p.slug}
            href={`/${p.slug}`}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-2 text-xs text-[var(--muted)] transition-all duration-200 hover:border-[var(--accent)]/50 hover:text-[var(--accent)] hover:shadow-[0_0_14px_rgba(6,182,212,0.1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
          >
            <span className="text-[var(--terminal)]">$</span> open {p.slug}
          </Link>
        ))}
        <a
          href="https://ithildin.co"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-2 text-xs text-[var(--muted)] transition-all duration-200 hover:border-[var(--accent)]/50 hover:text-[var(--accent)] hover:shadow-[0_0_14px_rgba(6,182,212,0.1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
        >
          <span className="text-[var(--terminal)]">$</span> ithildin.co
        </a>
      </div>
    </div>
  );
}
