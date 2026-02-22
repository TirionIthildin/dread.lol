"use client";

import { DiscordLogo } from "@phosphor-icons/react";

const DISCORD_INVITE = "https://discord.gg/sHN28UTbh6";

export default function UnapprovedMessage() {
  return (
    <div
      className="animate-fade-in-up rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
      role="status"
    >
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        Account pending approval
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Your account is not yet approved. Join our Discord to learn how to get an account and to request access.
      </p>
      <a
        href={DISCORD_INVITE}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#5865F2]/15 px-4 py-2.5 text-sm font-medium text-[#5865F2] transition-colors hover:bg-[#5865F2]/25 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
      >
        <DiscordLogo size={20} weight="fill" className="shrink-0 text-[#5865F2]" aria-hidden />
        Join Discord to get access
      </a>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Discord invite:{" "}
        <a
          href={DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] hover:underline"
        >
          discord.gg/sHN28UTbh6
        </a>
      </p>
    </div>
  );
}
