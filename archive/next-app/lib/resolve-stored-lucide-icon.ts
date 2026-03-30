import { isValidLucideIconName } from "@/lib/lucide-icon-names";
import { PHOSPHOR_TO_LUCIDE_ICON } from "@/lib/legacy-phosphor-to-lucide-map.generated";

const FALLBACK_LUCIDE_ICON = "CircleHelp";

/**
 * Resolves a stored icon name (historically Phosphor or Lucide PascalCase) to a Lucide export name.
 */
export function resolveStoredIconNameToLucide(stored: string | null | undefined): string | null {
  if (!stored?.trim()) return null;
  const raw = stored.trim();
  if (raw === "Award") return "Medal";
  if (isValidLucideIconName(raw)) return raw;
  const mapped = PHOSPHOR_TO_LUCIDE_ICON[raw];
  if (mapped && isValidLucideIconName(mapped)) return mapped;
  if (isValidLucideIconName(FALLBACK_LUCIDE_ICON)) return FALLBACK_LUCIDE_ICON;
  return null;
}
