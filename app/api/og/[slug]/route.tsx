import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import {
  getMemberProfileBySlug,
  memberProfileToProfile,
  getUserBadges,
  getUserDiscordBadgeData,
  getCustomBadgesForUser,
} from "@/lib/member-profiles";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { getAccentHex } from "@/lib/profile-themes";
import { getDiscordBadgeInfo } from "@/lib/discord-badges";
import { SITE_NAME } from "@/lib/site";

const BG = "#08090a";
const GRID_LINE = "rgba(26, 31, 38, 0.4)";
const TEXT = "#e2e8f0";
const MUTED = "#64748b";
const VERIFIED_BG = "rgba(6, 182, 212, 0.15)";
const VERIFIED_TEXT = "#06b6d4";
const STAFF_BG = "rgba(245, 158, 11, 0.15)";
const STAFF_TEXT = "#f59e0b";
const DISCORD_BG = "rgba(88, 101, 242, 0.15)";
const DISCORD_TEXT = "#5865F2";

/** Hex for custom badge colors (key from admin). */
const BADGE_COLOR_HEX: Record<string, { bg: string; text: string }> = {
  amber: { bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b" },
  blue: { bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6" },
  cyan: { bg: "rgba(6, 182, 212, 0.15)", text: "#06b6d4" },
  green: { bg: "rgba(34, 197, 94, 0.15)", text: "#22c55e" },
  indigo: { bg: "rgba(99, 102, 241, 0.15)", text: "#6366f1" },
  orange: { bg: "rgba(249, 115, 22, 0.15)", text: "#f97316" },
  purple: { bg: "rgba(168, 85, 247, 0.15)", text: "#a855f7" },
  rose: { bg: "rgba(244, 63, 94, 0.15)", text: "#f43f5e" },
  teal: { bg: "rgba(20, 184, 166, 0.15)", text: "#14b8a6" },
  sky: { bg: "rgba(14, 165, 233, 0.15)", text: "#0ea5e9" },
};

/** Strip markdown for plain text (links, bold, etc). */
function plainText(s: string, maxLength = 140): string {
  let out = s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
  if (out.length > maxLength) out = out.slice(0, maxLength - 1) + "…";
  return out;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const memberRow = await getMemberProfileBySlug(slug);
  if (!memberRow) {
    return new NextResponse("Not found", { status: 404 });
  }

  const [badgeFlags, customBadges, discordBadgeData, premiumAccess] = await Promise.all([
    getUserBadges(memberRow.userId),
    getCustomBadgesForUser(memberRow.userId),
    getUserDiscordBadgeData(memberRow.userId),
    getPremiumAccess(memberRow.userId),
  ]);
  const profile = memberProfileToProfile(memberRow, badgeFlags, discordBadgeData, customBadges, premiumAccess.hasAccess);

  // User has a custom OG image – redirect crawlers to it
  if (profile.ogImageUrl?.trim()) {
    return NextResponse.redirect(profile.ogImageUrl.trim(), 302);
  }

  const accent = getAccentHex(profile.accentColor);
  const description =
    profile.metaDescription?.trim() ||
    profile.tagline ||
    profile.description ||
    "";
  const plain = plainText(description);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: BG,
          backgroundImage: `linear-gradient(${GRID_LINE} 1px, transparent 1px), linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          gap: 64,
        }}
      >
        {/* Left: circular avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: `4px solid ${accent}`,
            overflow: "hidden",
            flexShrink: 0,
            boxShadow: `0 0 40px ${accent}40`,
          }}
        >
          {profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar}
              alt=""
              width={220}
              height={220}
              style={{
                objectFit: "cover",
                width: 220,
                height: 220,
              }}
            />
          ) : (
            <div
              style={{
                width: 220,
                height: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(26, 31, 38, 0.6)",
                color: accent,
                fontSize: 72,
                fontWeight: 600,
              }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Right: name + badges + description + tags + meta */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: TEXT,
              letterSpacing: "-0.02em",
            }}
          >
            {profile.name}
          </div>
          {(profile.verified ||
            profile.staff ||
            (profile.customBadges?.length ?? 0) > 0 ||
            (profile.discordBadges?.length ?? 0) > 0) && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
              }}
            >
              {profile.verified && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 18,
                    fontWeight: 500,
                    backgroundColor: VERIFIED_BG,
                    color: VERIFIED_TEXT,
                  }}
                >
                  ✓ Verified
                </span>
              )}
              {profile.staff && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 18,
                    fontWeight: 500,
                    backgroundColor: STAFF_BG,
                    color: STAFF_TEXT,
                  }}
                >
                  Staff
                </span>
              )}
              {profile.customBadges?.map((b) => {
                const colors =
                  b.color?.startsWith("#") && b.color
                    ? { bg: `${b.color}26`, text: b.color }
                    : BADGE_COLOR_HEX[b.color ?? ""] ?? {
                        bg: `${accent}26`,
                        text: accent,
                      };
                return (
                  <span
                    key={b.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 18,
                      fontWeight: 500,
                      backgroundColor: colors.bg,
                      color: colors.text,
                    }}
                  >
                    {b.label}
                  </span>
                );
              })}
              {profile.discordBadges?.map((key) => {
                const info = getDiscordBadgeInfo(key);
                if (!info) return null;
                return (
                  <span
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 18,
                      fontWeight: 500,
                      backgroundColor: DISCORD_BG,
                      color: DISCORD_TEXT,
                    }}
                  >
                    {info.label}
                  </span>
                );
              })}
            </div>
          )}
          {plain && (
            <div
              style={{
                fontSize: 26,
                color: MUTED,
                lineHeight: 1.4,
                display: "flex",
                flexWrap: "wrap",
              }}
            >
              {plain}
            </div>
          )}
          {(profile.tags?.length ?? 0) > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
              }}
            >
              {profile.tags?.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: "flex",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 18,
                    color: MUTED,
                    border: "1px solid rgba(100, 116, 139, 0.3)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {(profile.location?.trim() || profile.availability?.trim()) && (
            <div
              style={{
                fontSize: 20,
                color: MUTED,
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              {profile.location?.trim() && <span>{profile.location.trim()}</span>}
              {profile.availability?.trim() && (
                <span
                  style={{
                    color: accent,
                  }}
                >
                  {profile.availability.trim()}
                </span>
              )}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: "auto",
            }}
          >
            <span
              style={{
                fontSize: 22,
                color: accent,
                fontWeight: 500,
              }}
            >
              dread.lol
            </span>
            <span style={{ color: MUTED, fontSize: 20 }}>/</span>
            <span
              style={{
                fontSize: 22,
                color: MUTED,
              }}
            >
              {profile.slug}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
