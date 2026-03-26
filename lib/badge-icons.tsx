/**
 * Lucide icons for custom badges. Admins pick by name in the Badges panel.
 */
import type { LucideProps } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { BADGE_ICON_OPTIONS } from "@/lib/lucide-icon-names";
import { resolveStoredIconNameToLucide } from "@/lib/resolve-stored-lucide-icon";

const iconProps: LucideProps = { size: 14, strokeWidth: 2.5, className: "shrink-0 fill-current" };

export { BADGE_ICON_OPTIONS };

const icons = LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>;

/** Sync render for any Lucide icon (accepts legacy Phosphor names). Use BadgeIconServer in RSC for proper SSR. */
export function getBadgeIcon(iconName: string | null | undefined) {
  const resolved = resolveStoredIconNameToLucide(iconName);
  if (!resolved) return null;
  const Icon = icons[resolved];
  return Icon ? <Icon {...iconProps} /> : null;
}

/** Server component: renders any Lucide icon. */
export function BadgeIconServer({
  iconName,
}: {
  iconName: string | null | undefined;
}) {
  const resolved = resolveStoredIconNameToLucide(iconName);
  if (!resolved) return null;
  const Icon = icons[resolved];
  if (!Icon) return null;
  return <Icon {...iconProps} />;
}
