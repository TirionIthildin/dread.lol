"use client";

import { DiscordLogo, Cube, Link as LinkIcon } from "@phosphor-icons/react";
import CopyButton from "@/app/components/CopyButton";

const iconProps = { size: 20, weight: "regular" as const, className: "shrink-0 text-current" };

const linkButtonClass =
  "inline-flex items-center gap-2 min-h-[44px] min-w-[44px] rounded-lg border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2.5 text-[var(--muted)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:shadow-[0_0_14px_rgba(6,182,212,0.12)] active:scale-[0.98] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]";

interface ProfileLinksProps {
  discord?: string;
  roblox?: string;
  links?: { label: string; href: string }[];
}

export default function ProfileLinks({ discord, roblox, links }: ProfileLinksProps) {
  const hasAny = discord || roblox || (links && links.length > 0);
  if (!hasAny) return null;
  return (
    <div className="mt-4 pt-3 border-t border-[var(--border)]/50">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]/80">Links</p>
      <div className="flex flex-wrap items-center gap-2">
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
            className={linkButtonClass}
            aria-label="Open Roblox profile (opens in new tab)"
          >
            <Cube {...iconProps} />
            <span className="text-xs">Roblox</span>
          </a>
        )}
        {links?.map(({ label, href }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkButtonClass}
            aria-label={`Open ${label} (opens in new tab)`}
          >
            <LinkIcon {...iconProps} />
            <span className="text-xs">{label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
