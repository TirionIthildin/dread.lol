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
      <TerminalWindow
        title="user@dread:~ — welcome"
        className="animate-fade-in hover-lift"
      >
        <WelcomeTerminal />
      </TerminalWindow>
      <footer className="mt-4 pb-2 text-[10px] text-[var(--muted)]">
        <Link href="/dashboard/leaderboard" className="hover:text-[var(--accent)] hover:underline">
          Leaderboard
        </Link>
        <span className="mx-1.5">·</span>
        <Link href="/trending" className="hover:text-[var(--accent)] hover:underline">
          Trending
        </Link>
        <span className="mx-1.5">·</span>
        <Link href="/privacy" className="hover:text-[var(--accent)] hover:underline">
          Privacy
        </Link>
        <span className="mx-1.5">·</span>
        <Link href="/terms" className="hover:text-[var(--accent)] hover:underline">
          Terms
        </Link>
      </footer>
    </>
  );
}
