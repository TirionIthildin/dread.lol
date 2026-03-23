/**
 * Premium-gated monetization fields: tip/wishlist link types and commissions.
 */
import type { LinkType } from "@/lib/link-entries";
import { resolveLinkTypeFromSavedLink } from "@/lib/link-entries";

export const PREMIUM_MONETIZATION_LINK_TYPES = ["kofi", "throne", "amazonWishlist"] as const;

export type PremiumMonetizationLinkType = (typeof PREMIUM_MONETIZATION_LINK_TYPES)[number];

export function isPremiumMonetizationLinkType(t: LinkType): boolean {
  return (PREMIUM_MONETIZATION_LINK_TYPES as readonly string[]).includes(t);
}

export function filterLinksForPremiumAccess(
  links: { label: string; href: string }[],
  hasPremium: boolean
): { label: string; href: string }[] {
  if (hasPremium) return links;
  return links.filter((e) => !isPremiumMonetizationLinkType(resolveLinkTypeFromSavedLink(e.label, e.href)));
}

/** Allowed DB values for commissionStatus. */
export const COMMISSION_STATUS_VALUES = ["open", "closed", "waitlist"] as const;
export type CommissionStatusValue = (typeof COMMISSION_STATUS_VALUES)[number];

export function parseCommissionStatus(raw: string | null | undefined): CommissionStatusValue | null {
  if (!raw?.trim()) return null;
  const v = raw.trim().toLowerCase();
  if (COMMISSION_STATUS_VALUES.includes(v as CommissionStatusValue)) return v as CommissionStatusValue;
  return null;
}
