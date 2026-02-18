"use client";

import TerminalWindow from "@/app/components/TerminalWindow";
import WelcomeTerminal from "@/app/components/WelcomeTerminal";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export default function HomePageContent() {
  return (
    <div className="relative z-10 w-full max-w-2xl max-h-[calc(100vh-1.5rem)] overflow-auto">
      <h1 className="sr-only">
        {SITE_NAME} — {SITE_DESCRIPTION}
      </h1>
      <TerminalWindow
        title="user@dread:~ — welcome"
        className="animate-fade-in hover-lift"
      >
        <WelcomeTerminal />
      </TerminalWindow>
    </div>
  );
}
