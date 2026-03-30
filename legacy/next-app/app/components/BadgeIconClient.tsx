"use client";

import type { LucideProps } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { resolveStoredIconNameToLucide } from "@/lib/resolve-stored-lucide-icon";

const iconProps: LucideProps = { size: 14, strokeWidth: 2.5, className: "shrink-0 fill-current" };

/** Client component: renders any Lucide icon (accepts legacy Phosphor names). */
function BadgeIconClient({
  iconName,
}: {
  iconName: string | null | undefined;
}) {
  const resolved = resolveStoredIconNameToLucide(iconName);
  if (!resolved) return null;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>)[resolved];
  if (!Icon) return null;
  return <Icon {...iconProps} />;
}

export default BadgeIconClient;
