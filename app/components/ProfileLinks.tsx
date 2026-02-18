"use client";

import { DiscordLogo, Cube } from "@phosphor-icons/react";
import CopyButton from "@/app/components/CopyButton";

const iconProps = { size: 20, weight: "regular" as const, className: "shrink-0" };

interface ProfileLinksProps {
  discord?: string;
  roblox?: string;
}

export default function ProfileLinks({ discord, roblox }: ProfileLinksProps) {
  if (!discord && !roblox) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-2">
      {discord && (
        <CopyButton
          copyValue={discord}
          ariaLabel={`Copy Discord username ${discord}`}
        >
          <DiscordLogo {...iconProps} />
          <span className="text-xs">{discord}</span>
        </CopyButton>
      )}
      {roblox && (
        <a
          href={roblox}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 min-h-[44px] min-w-[44px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)]/60 px-3 py-2.5 text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 active:scale-[0.98] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
          aria-label="Open Roblox profile (opens in new tab)"
        >
          <Cube {...iconProps} />
          <span className="text-xs">Roblox</span>
        </a>
      )}
    </div>
  );
}
