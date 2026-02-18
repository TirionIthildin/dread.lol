"use client";

import TerminalWindow from "@/app/components/TerminalWindow";
import WelcomeTerminal from "@/app/components/WelcomeTerminal";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { PROFILES } from "@/lib/profiles";

export default function HomePageContent() {
  return (
    <div className="relative z-10 w-full max-w-2xl">
      <h1 className="sr-only">
        {SITE_NAME} — Profiles for friends.
      </h1>
      <TerminalWindow
        title="user@dread:~ — welcome"
        className="animate-fade-in hover-lift"
      >
        <WelcomeTerminal />
      </TerminalWindow>

      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        {PROFILES.map((p, i) => (
          <span key={p.slug}>
            {i > 0 && <span className="mx-2">·</span>}
            <Link
              href={`/${p.slug}`}
              className="text-[var(--muted)] transition-colors hover:text-[var(--terminal)] focus:outline-none focus:underline focus:decoration-[var(--accent)]"
            >
              open {p.slug}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}
