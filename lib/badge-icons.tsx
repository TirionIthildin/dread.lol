/**
 * Phosphor icons for custom badges. Admins pick by name in the Badges panel.
 * Uses the full Phosphor icon set for search.
 */
import type { IconProps } from "@phosphor-icons/react";
import * as PhosphorIconsSSR from "@phosphor-icons/react/ssr";
import { BADGE_ICON_OPTIONS } from "./phosphor-icon-names";

const iconProps: IconProps = { size: 14, weight: "fill" };

export { BADGE_ICON_OPTIONS };

const icons = PhosphorIconsSSR as unknown as Record<string, React.ComponentType<IconProps>>;

/** Sync render for any Phosphor icon. Use BadgeIconServer in RSC for proper SSR. */
export function getBadgeIcon(iconName: string | null | undefined) {
  if (!iconName) return null;
  const resolved = iconName === "Award" ? "Medal" : iconName;
  const Icon = icons[resolved];
  return Icon ? <Icon {...iconProps} className="shrink-0" /> : null;
}

/** Server component: renders any Phosphor icon. */
export function BadgeIconServer({
  iconName,
}: {
  iconName: string | null | undefined;
}) {
  if (!iconName) return null;
  const resolved = iconName === "Award" ? "Medal" : iconName;
  const Icon = icons[resolved];
  if (!Icon) return null;
  return <Icon {...iconProps} className="shrink-0" />;
}
