"use client";

import type { IconProps } from "@phosphor-icons/react";
import * as PhosphorIcons from "@phosphor-icons/react";

const iconProps: IconProps = { size: 14, weight: "fill" };

/** Client component: renders any Phosphor icon. */
export function BadgeIconClient({
  iconName,
}: {
  iconName: string | null | undefined;
}) {
  if (!iconName) return null;
  const resolved = iconName === "Award" ? "Medal" : iconName;
  const Icon = (PhosphorIcons as unknown as Record<string, React.ComponentType<IconProps>>)[resolved];
  if (!Icon) return null;
  return <Icon {...iconProps} className="shrink-0" />;
}

export default BadgeIconClient;
