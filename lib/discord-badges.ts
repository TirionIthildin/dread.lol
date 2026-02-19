/**
 * Discord user public_flags bitfield. Decode to display badges on profiles.
 * @see https://discord.com/developers/docs/resources/user#user-object-user-flags
 */
export const DISCORD_PUBLIC_FLAGS = {
  Staff: 1 << 0,
  Partner: 1 << 1,
  HypeSquad: 1 << 2,
  BugHunterLevel1: 1 << 3,
  HypeSquadOnlineHouse1: 1 << 6, // Bravery
  HypeSquadOnlineHouse2: 1 << 7, // Brilliance
  HypeSquadOnlineHouse3: 1 << 8, // Balance
  PremiumEarlySupporter: 1 << 9,
  BugHunterLevel2: 1 << 14,
  VerifiedDeveloper: 1 << 17,
  CertifiedModerator: 1 << 18,
  ActiveDeveloper: 1 << 22,
} as const;

export type DiscordBadgeKey = keyof typeof DISCORD_PUBLIC_FLAGS;

/** Human-readable label and short description for each badge (for tooltips). */
export const DISCORD_BADGE_INFO: Record<
  DiscordBadgeKey,
  { label: string; title: string }
> = {
  Staff: { label: "Staff", title: "Discord Employee" },
  Partner: { label: "Partner", title: "Discord Partner" },
  HypeSquad: { label: "HypeSquad", title: "HypeSquad Events" },
  BugHunterLevel1: { label: "Bug Hunter", title: "Bug Hunter Level 1" },
  HypeSquadOnlineHouse1: { label: "Bravery", title: "HypeSquad Bravery" },
  HypeSquadOnlineHouse2: { label: "Brilliance", title: "HypeSquad Brilliance" },
  HypeSquadOnlineHouse3: { label: "Balance", title: "HypeSquad Balance" },
  PremiumEarlySupporter: { label: "Early Supporter", title: "Early Nitro Supporter" },
  BugHunterLevel2: { label: "Bug Hunter", title: "Bug Hunter Level 2" },
  VerifiedDeveloper: { label: "Verified Dev", title: "Early Verified Bot Developer" },
  CertifiedModerator: { label: "Certified Mod", title: "Discord Certified Moderator" },
  ActiveDeveloper: { label: "Developer", title: "Active Developer" },
};

/** Premium type: 0=None, 1=Nitro Classic, 2=Nitro, 3=Nitro Basic. Shown as badges. */
export const PREMIUM_BADGE_INFO: Record<string, { label: string; title: string }> = {
  Nitro: { label: "Nitro", title: "Discord Nitro" },
  NitroClassic: { label: "Nitro Classic", title: "Discord Nitro Classic" },
  NitroBasic: { label: "Nitro Basic", title: "Discord Nitro Basic" },
};

/** Map premium_type number to badge keys. */
export function getPremiumBadgeKeys(premiumType: number | null | undefined): string[] {
  if (premiumType === 1) return ["NitroClassic"];
  if (premiumType === 2) return ["Nitro"];
  if (premiumType === 3) return ["NitroBasic"];
  return [];
}

/** Decode public_flags bitfield into an array of badge keys (display order). */
export function decodeDiscordPublicFlags(flags: number): DiscordBadgeKey[] {
  const out: DiscordBadgeKey[] = [];
  const order: DiscordBadgeKey[] = [
    "Staff",
    "Partner",
    "HypeSquad",
    "HypeSquadOnlineHouse1",
    "HypeSquadOnlineHouse2",
    "HypeSquadOnlineHouse3",
    "PremiumEarlySupporter",
    "BugHunterLevel1",
    "BugHunterLevel2",
    "VerifiedDeveloper",
    "CertifiedModerator",
    "ActiveDeveloper",
  ];
  for (const key of order) {
    const value = DISCORD_PUBLIC_FLAGS[key];
    if ((flags & value) === value) out.push(key);
  }
  return out;
}

/** Resolve badge key to display info (supports both public_flags and premium badges). */
export function getDiscordBadgeInfo(key: string): { label: string; title: string } | null {
  if ((key as DiscordBadgeKey) in DISCORD_BADGE_INFO) {
    return DISCORD_BADGE_INFO[key as DiscordBadgeKey];
  }
  if (key in PREMIUM_BADGE_INFO) return PREMIUM_BADGE_INFO[key];
  return null;
}
