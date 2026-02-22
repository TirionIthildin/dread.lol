/**
 * Curated Phosphor icons for custom badges. Admins pick by name in the Badges panel.
 * Keeps bundle small while offering badge-appropriate icons.
 * Uses SSR export for server component compatibility (ProfileContent).
 *
 * To add new icons: search at https://phosphoricons.com (site uses kebab-case, e.g. rocket-launch).
 * Import the component (PascalCase: RocketLaunch) and add to BADGE_ICONS and BADGE_ICON_OPTIONS.
 */
import type { IconProps } from "@phosphor-icons/react";
import {
  ShieldCheck,
  Shield,
  Star,
  Crown,
  Heart,
  Fire,
  Lightning,
  SealCheck,
  Sparkle,
  Trophy,
  Medal,
  Flag,
  Gift,
  RocketLaunch,
} from "@phosphor-icons/react/dist/ssr";

const iconProps: IconProps = { size: 14, weight: "fill" };

export const BADGE_ICONS: Record<string, React.ComponentType<IconProps>> = {
  ShieldCheck,
  Shield,
  Star,
  Award: Medal, // Award not in @phosphor-icons; use Medal as alias
  Crown,
  Heart,
  Fire,
  Lightning,
  SealCheck,
  Sparkle,
  Trophy,
  Medal,
  Flag,
  Gift,
  RocketLaunch,
};

/** Display labels for the icon picker dropdown. */
export const BADGE_ICON_OPTIONS = [
  { value: "", label: "None (text only)" },
  { value: "ShieldCheck", label: "Shield check" },
  { value: "Shield", label: "Shield" },
  { value: "Star", label: "Star" },
  { value: "Award", label: "Award" },
  { value: "Crown", label: "Crown" },
  { value: "Heart", label: "Heart" },
  { value: "Fire", label: "Fire" },
  { value: "Lightning", label: "Lightning" },
  { value: "SealCheck", label: "Seal check" },
  { value: "Sparkle", label: "Sparkle" },
  { value: "Trophy", label: "Trophy" },
  { value: "Medal", label: "Medal" },
  { value: "Flag", label: "Flag" },
  { value: "Gift", label: "Gift" },
  { value: "RocketLaunch", label: "Rocket launch" },
];

export function getBadgeIcon(iconName: string | null | undefined) {
  if (!iconName) return null;
  const Icon = BADGE_ICONS[iconName];
  return Icon ? <Icon {...iconProps} className="shrink-0" /> : null;
}
