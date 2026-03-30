import type { Metadata } from "next";

/**
 * Use the member's avatar as the page favicon (tab icon / Apple touch).
 * Skips when missing, Discord dynamic placeholder, or not an absolute http(s) URL.
 */
export function profileIconsFromAvatar(avatar: string | undefined): Pick<Metadata, "icons"> | undefined {
  const u = avatar?.trim();
  if (!u || u === "discord") return undefined;
  if (!/^https?:\/\//i.test(u)) return undefined;
  return {
    icons: {
      icon: u,
      apple: u,
    },
  };
}
