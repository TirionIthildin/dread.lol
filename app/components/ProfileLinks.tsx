"use client";

import {
  DiscordLogo,
  Cube,
  Link as LinkIcon,
  GithubLogo,
  XLogo,
  YoutubeLogo,
  InstagramLogo,
  TiktokLogo,
  TwitchLogo,
  SpotifyLogo,
  LinkedinLogo,
  RedditLogo,
  SteamLogo,
  PaypalLogo,
  TelegramLogo,
  PatreonLogo,
  MediumLogo,
  MastodonLogo,
  BehanceLogo,
  FigmaLogo,
  NotionLogo,
  CodepenLogo,
  DevToLogo,
  SoundcloudLogo,
  PinterestLogo,
  ThreadsLogo,
  WhatsappLogo,
  Coffee,
  Crown,
  ShoppingCart,
} from "@phosphor-icons/react";
import CopyButton from "@/app/components/CopyButton";
import { resolveLinkTypeFromSavedLink } from "@/lib/link-entries";

const iconProps = { size: 20, weight: "regular" as const, className: "shrink-0 text-current" };

const linkButtonClass =
  "inline-flex items-center gap-2 min-h-[44px] min-w-[44px] rounded-lg border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2.5 text-[var(--muted)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:shadow-[0_0_14px_rgba(6,182,212,0.12)] active:scale-[0.98] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]";

function LinkIconForLabel({ label, href }: { label: string; href: string }) {
  const resolved = resolveLinkTypeFromSavedLink(label, href);
  if (resolved === "kofi") return <Coffee {...iconProps} />;
  if (resolved === "throne") return <Crown {...iconProps} />;
  if (resolved === "amazonWishlist") return <ShoppingCart {...iconProps} />;

  const lower = label.toLowerCase();
  if (lower.includes("github")) return <GithubLogo {...iconProps} />;
  if (lower.includes("twitter") || lower.includes("x.com") || lower.includes("x logo")) return <XLogo {...iconProps} />;
  if (lower.includes("youtube")) return <YoutubeLogo {...iconProps} />;
  if (lower.includes("instagram")) return <InstagramLogo {...iconProps} />;
  if (lower.includes("tiktok")) return <TiktokLogo {...iconProps} />;
  if (lower.includes("twitch")) return <TwitchLogo {...iconProps} />;
  if (lower.includes("spotify")) return <SpotifyLogo {...iconProps} />;
  if (lower.includes("linkedin")) return <LinkedinLogo {...iconProps} />;
  if (lower.includes("reddit")) return <RedditLogo {...iconProps} />;
  if (lower.includes("steam")) return <SteamLogo {...iconProps} />;
  if (lower.includes("paypal")) return <PaypalLogo {...iconProps} />;
  if (lower.includes("telegram")) return <TelegramLogo {...iconProps} />;
  if (lower.includes("patreon")) return <PatreonLogo {...iconProps} />;
  if (lower.includes("medium")) return <MediumLogo {...iconProps} />;
  if (lower.includes("mastodon")) return <MastodonLogo {...iconProps} />;
  if (lower.includes("behance")) return <BehanceLogo {...iconProps} />;
  if (lower.includes("figma")) return <FigmaLogo {...iconProps} />;
  if (lower.includes("notion")) return <NotionLogo {...iconProps} />;
  if (lower.includes("codepen")) return <CodepenLogo {...iconProps} />;
  if (lower.includes("dev.to")) return <DevToLogo {...iconProps} />;
  if (lower.includes("soundcloud")) return <SoundcloudLogo {...iconProps} />;
  if (lower.includes("pinterest")) return <PinterestLogo {...iconProps} />;
  if (lower.includes("threads")) return <ThreadsLogo {...iconProps} />;
  if (lower.includes("whatsapp")) return <WhatsappLogo {...iconProps} />;
  return <LinkIcon {...iconProps} />;
}

interface ProfileLinksProps {
  websiteUrl?: string;
  discord?: string;
  roblox?: string;
  links?: { label: string; href: string }[];
}

export default function ProfileLinks({ websiteUrl, discord, roblox, links }: ProfileLinksProps) {
  const hasAny = websiteUrl || discord || roblox || (links && links.length > 0);
  if (!hasAny) return null;
  return (
    <div className="mt-4 pt-3 border-t border-[var(--border)]/50">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]/80">Links</p>
      <div className="flex flex-wrap items-center gap-2">
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 min-h-[44px] min-w-[44px] rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2.5 text-[var(--accent)] transition-all duration-200 hover:border-[var(--accent)] hover:bg-[var(--accent)]/20 hover:shadow-[0_0_14px_rgba(6,182,212,0.12)] active:scale-[0.98] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
            aria-label="Open portfolio (opens in new tab)"
          >
            <LinkIcon {...iconProps} />
            <span className="text-xs font-medium">Portfolio</span>
          </a>
        )}
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
            <LinkIconForLabel label={label} href={href} />
            <span className="text-xs">{label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
