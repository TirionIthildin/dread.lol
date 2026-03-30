"use client";

import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  MessageCircle,
  Box,
  Link as LinkIcon,
  Github,
  Twitter,
  Youtube,
  Instagram,
  Video,
  Twitch,
  Music,
  Linkedin,
  CircleDot,
  Gamepad2,
  Wallet,
  Send,
  HeartHandshake,
  Rss,
  Milestone,
  Palette,
  Figma,
  StickyNote,
  Codepen,
  BookOpen,
  Cloud,
  Pin,
  AtSign,
  Coffee,
  Crown,
  ShoppingCart,
  CircleDollarSign,
  Heart,
  Mail,
} from "lucide-react";
import CopyButton from "@/app/components/CopyButton";
import { resolveLinkTypeFromSavedLink } from "@/lib/link-entries";
import { shouldOpenProfileLink } from "@/lib/profile-links-display";
import { isMailtoHref } from "@/lib/validate-url";
import { resolveStoredIconNameToLucide } from "@/lib/resolve-stored-lucide-icon";

const iconProps: LucideProps = { size: 20, className: "shrink-0 text-current" };

const linkButtonBaseClass =
  "inline-flex items-center gap-2 min-h-[44px] min-w-[44px] rounded-lg border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2.5 text-[var(--muted)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 active:scale-[0.98] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]";

const linkButtonGlowClass = "hover:shadow-[0_0_14px_rgba(6,182,212,0.12)]";

const portfolioBaseClass =
  "inline-flex items-center gap-2 min-h-[44px] min-w-[44px] rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2.5 text-[var(--accent)] transition-all duration-200 hover:border-[var(--accent)] hover:bg-[var(--accent)]/20 active:scale-[0.98] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]";

const portfolioGlowClass = "hover:shadow-[0_0_14px_rgba(6,182,212,0.12)]";

function DynamicLucideIcon({ name }: { name: string }) {
  const resolved = resolveStoredIconNameToLucide(name);
  if (!resolved) return <LinkIcon {...iconProps} />;
  const Icon = (LucideIcons as unknown as Record<string, ComponentType<LucideProps>>)[resolved];
  if (!Icon) return <LinkIcon {...iconProps} />;
  return <Icon {...iconProps} />;
}

function LinkIconForLabel({
  label,
  href,
  iconName,
}: {
  label: string;
  href: string;
  iconName?: string;
}) {
  const resolved = resolveLinkTypeFromSavedLink(label, href);
  if (resolved === "custom" && iconName?.trim()) {
    return <DynamicLucideIcon name={iconName.trim()} />;
  }
  if (resolved === "cryptoWallet") return <CircleDollarSign {...iconProps} />;
  if (resolved === "kofi") return <Coffee {...iconProps} />;
  if (resolved === "throne") return <Crown {...iconProps} />;
  if (resolved === "amazonWishlist") return <ShoppingCart {...iconProps} />;
  if (resolved === "onlyfans") return <Heart {...iconProps} />;
  if (resolved === "namemc") return <Gamepad2 {...iconProps} />;
  if (resolved === "email") return <Mail {...iconProps} />;

  const lower = label.toLowerCase();
  if (lower.includes("github")) return <Github {...iconProps} />;
  if (lower.includes("twitter") || lower.includes("x.com") || lower.includes("x logo")) return <Twitter {...iconProps} />;
  if (lower.includes("youtube")) return <Youtube {...iconProps} />;
  if (lower.includes("instagram")) return <Instagram {...iconProps} />;
  if (lower.includes("tiktok")) return <Video {...iconProps} />;
  if (lower.includes("twitch")) return <Twitch {...iconProps} />;
  if (lower.includes("spotify")) return <Music {...iconProps} />;
  if (lower.includes("linkedin")) return <Linkedin {...iconProps} />;
  if (lower.includes("reddit")) return <CircleDot {...iconProps} />;
  if (lower.includes("steam")) return <Gamepad2 {...iconProps} />;
  if (lower.includes("paypal")) return <Wallet {...iconProps} />;
  if (lower.includes("telegram")) return <Send {...iconProps} />;
  if (lower.includes("patreon")) return <HeartHandshake {...iconProps} />;
  if (lower.includes("medium")) return <Rss {...iconProps} />;
  if (lower.includes("mastodon")) return <Milestone {...iconProps} />;
  if (lower.includes("behance")) return <Palette {...iconProps} />;
  if (lower.includes("figma")) return <Figma {...iconProps} />;
  if (lower.includes("notion")) return <StickyNote {...iconProps} />;
  if (lower.includes("codepen")) return <Codepen {...iconProps} />;
  if (lower.includes("dev.to")) return <BookOpen {...iconProps} />;
  if (lower.includes("soundcloud")) return <Cloud {...iconProps} />;
  if (lower.includes("pinterest")) return <Pin {...iconProps} />;
  if (lower.includes("threads")) return <AtSign {...iconProps} />;
  if (lower.includes("whatsapp")) return <MessageCircle {...iconProps} />;
  return <LinkIcon {...iconProps} />;
}

interface ProfileLinksProps {
  websiteUrl?: string;
  discord?: string;
  roblox?: string;
  links?: { label: string; href: string; iconName?: string }[];
  /** When true, non-http(s) values render as copy buttons. */
  copyableSocials?: boolean;
  /** When false, link chips omit hover glow. Default true (legacy). */
  socialLinksGlow?: boolean;
}

export default function ProfileLinks({
  websiteUrl,
  discord,
  roblox,
  links,
  copyableSocials = false,
  socialLinksGlow = true,
}: ProfileLinksProps) {
  const hasAny = websiteUrl || discord || roblox || (links && links.length > 0);
  if (!hasAny) return null;

  const chipClass = socialLinksGlow ? `${linkButtonBaseClass} ${linkButtonGlowClass}` : linkButtonBaseClass;
  const portfolioClass = socialLinksGlow ? `${portfolioBaseClass} ${portfolioGlowClass}` : portfolioBaseClass;

  return (
    <div className="mt-4 pt-3 border-t border-[var(--border)]/50">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]/80">Links</p>
      <div className="flex flex-wrap items-center gap-2">
        {websiteUrl &&
          (copyableSocials && !shouldOpenProfileLink(websiteUrl) ? (
            <CopyButton
              copyValue={websiteUrl}
              ariaLabel={`Copy portfolio: ${websiteUrl}`}
              className={portfolioClass}
            >
              <LinkIcon {...iconProps} />
              <span className="text-xs font-medium">Portfolio</span>
            </CopyButton>
          ) : (
            <a
              href={websiteUrl}
              {...(isMailtoHref(websiteUrl)
                ? {}
                : { target: "_blank" as const, rel: "noopener noreferrer" as const })}
              className={portfolioClass}
              aria-label={
                isMailtoHref(websiteUrl)
                  ? "Open portfolio email"
                  : "Open portfolio (opens in new tab)"
              }
            >
              <LinkIcon {...iconProps} />
              <span className="text-xs font-medium">Portfolio</span>
            </a>
          ))}
        {discord && (
          <CopyButton
            copyValue={discord}
            ariaLabel={`Copy Discord username ${discord}`}
          >
            <MessageCircle {...iconProps} />
            <span className="text-xs">{discord}</span>
          </CopyButton>
        )}
        {roblox &&
          (copyableSocials && !shouldOpenProfileLink(roblox) ? (
            <CopyButton copyValue={roblox} ariaLabel={`Copy Roblox: ${roblox}`} className={chipClass}>
              <Box {...iconProps} />
              <span className="text-xs">Roblox</span>
            </CopyButton>
          ) : (
            <a
              href={roblox}
              {...(isMailtoHref(roblox)
                ? {}
                : { target: "_blank" as const, rel: "noopener noreferrer" as const })}
              className={chipClass}
              aria-label={
                isMailtoHref(roblox)
                  ? "Open Roblox email"
                  : "Open Roblox profile (opens in new tab)"
              }
            >
              <Box {...iconProps} />
              <span className="text-xs">Roblox</span>
            </a>
          ))}
        {links?.map(({ label, href, iconName }, index) => {
          const mailto = isMailtoHref(href);
          const openAsLink = shouldOpenProfileLink(href);
          const linkInner = (
            <>
              <LinkIconForLabel label={label} href={href} iconName={iconName} />
              <span className="text-xs">{label}</span>
            </>
          );
          if (copyableSocials && !openAsLink) {
            return (
              <CopyButton
                key={`${index}-${href}-${label}`}
                copyValue={href}
                ariaLabel={`Copy ${label}: ${href}`}
                className={chipClass}
              >
                {linkInner}
              </CopyButton>
            );
          }
          return (
            <a
              key={`${index}-${href}-${label}`}
              href={href}
              {...(mailto ? {} : { target: "_blank" as const, rel: "noopener noreferrer" })}
              className={chipClass}
              aria-label={mailto ? `Email ${label}` : `Open ${label} (opens in new tab)`}
            >
              {linkInner}
            </a>
          );
        })}
      </div>
    </div>
  );
}
