"use client";

import Link from "next/link";
import TerminalWindow from "@/app/components/TerminalWindow";
import WelcomeTerminal from "@/app/components/WelcomeTerminal";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export default function HomePageContent() {
  return (
    <>
      <h1 className="sr-only">
        {SITE_NAME} — {SITE_DESCRIPTION}
      </h1>
      <p className="mb-3 max-w-md text-center text-[11px] leading-snug text-[var(--muted)]">
        Terminal-styled member profiles for Discord communities: templates, gallery, blog, analytics, and more.{" "}
        <Link href="/about" className="text-[var(--accent)] hover:underline">
          About
        </Link>
        <span className="mx-1 text-[var(--muted)]/60">·</span>
        <Link href="/dashboard/premium" className="text-[var(--accent)] hover:underline">
          Premium
        </Link>
        <span className="mx-1 text-[var(--muted)]/60">·</span>
        <Link href="/docs/api" className="text-[var(--accent)] hover:underline">
          API
        </Link>
      </p>
      <TerminalWindow
        title="user@dread:~ — welcome"
        className="animate-fade-in hover-lift"
      >
        <WelcomeTerminal />
      </TerminalWindow>
      <footer className="mt-4 pb-2 text-[10px] text-[var(--muted)] flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
        <Link href="/about" className="hover:text-[var(--accent)] hover:underline">
          About
        </Link>
        <span>·</span>
        <Link href="/dashboard/leaderboard" className="hover:text-[var(--accent)] hover:underline">
          Leaderboard
        </Link>
        <span>·</span>
        <Link href="/trending" className="hover:text-[var(--accent)] hover:underline">
          Trending
        </Link>
        <span>·</span>
        <Link href="/marketplace" className="hover:text-[var(--accent)] hover:underline">
          Marketplace
        </Link>
        <span>·</span>
        <Link href="/docs/api" className="hover:text-[var(--accent)] hover:underline">
          API
        </Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-[var(--accent)] hover:underline">
          Privacy
        </Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-[var(--accent)] hover:underline">
          Terms
        </Link>
      </footer>
    </>
  );
}
