/**
 * Profile section/block IDs for layout ordering (`sectionOrder`).
 * Each ID maps to a logical block in ProfileContent.
 */
export const PROFILE_SECTION_IDS = [
  "banner",
  "hero",
  "description",
  "tags",
  "skills",
  "quote",
  "links",
  "discord-widgets",
  "roblox-widgets",
  "crypto-widgets",
  "gallery-blog",
  "audio",
  "similar",
  "vouches",
] as const;

export type ProfileSectionId = (typeof PROFILE_SECTION_IDS)[number];

/** Default order when sectionOrder is not set (matches original ProfileContent order). */
export const DEFAULT_SECTION_ORDER: ProfileSectionId[] = [...PROFILE_SECTION_IDS];

export type SectionCategory = "identity" | "content" | "connect" | "media" | "social";

export interface SectionDefinition {
  id: ProfileSectionId;
  label: string;
  /** Short description for element picker tooltip. */
  description?: string;
  /** Category for element picker grouping. */
  category?: SectionCategory;
  /** Whether this section has content that can be empty (e.g. vouches, similar). */
  optional?: boolean;
}

export const SECTION_CATEGORIES: { id: SectionCategory; label: string }[] = [
  { id: "identity", label: "Identity" },
  { id: "content", label: "Content" },
  { id: "connect", label: "Connect" },
  { id: "media", label: "Media" },
  { id: "social", label: "Social" },
];

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  { id: "banner", label: "Text art", category: "identity", description: "ASCII art or custom banner", optional: true },
  { id: "hero", label: "Avatar & name", category: "identity", description: "Profile photo, name, tagline, badges" },
  { id: "description", label: "Description", category: "content", description: "About you paragraph", optional: true },
  { id: "tags", label: "Tags", category: "content", description: "Profile tags & labels", optional: true },
  { id: "skills", label: "Skills", category: "content", description: "Skills list", optional: true },
  { id: "quote", label: "Quote", category: "content", description: "Featured quote", optional: true },
  { id: "links", label: "Links", category: "connect", description: "Website, Discord, Roblox, custom links" },
  { id: "discord-widgets", label: "Discord widgets", category: "connect", description: "Account age, server count, invite", optional: true },
  { id: "roblox-widgets", label: "Roblox widgets", category: "connect", description: "Account age, profile link", optional: true },
  { id: "crypto-widgets", label: "Crypto prices", category: "connect", description: "Spot prices for selected coins", optional: true },
  { id: "gallery-blog", label: "Gallery & blog", category: "media", description: "Image gallery and blog links" },
  { id: "audio", label: "Audio player", category: "media", description: "Music or voice showcase", optional: true },
  { id: "similar", label: "Similar profiles", category: "social", description: "Suggested similar profiles", optional: true },
  { id: "vouches", label: "Vouches & views", category: "social", description: "Vouches and view count", optional: true },
];

/**
 * Returns the ordered list of section IDs to render.
 * Merges custom sectionOrder with defaults, filters hidden and removed sections.
 */
export function getOrderedSectionIds(
  sectionOrder?: string[] | null,
  sectionVisibility?: Record<string, boolean> | null,
  removedSectionIds?: string[] | null
): ProfileSectionId[] {
  const order = sectionOrder?.length
    ? sectionOrder.filter((id): id is ProfileSectionId =>
        PROFILE_SECTION_IDS.includes(id as ProfileSectionId)
      )
    : DEFAULT_SECTION_ORDER;

  // Append any new sections not in custom order
  const seen = new Set(order);
  const removed = new Set(removedSectionIds ?? []);
  const appended = PROFILE_SECTION_IDS.filter((id) => !seen.has(id) && !removed.has(id));
  const fullOrder = [...order, ...appended];

  // Filter hidden and removed
  const hidden = sectionVisibility ?? {};
  return fullOrder.filter((id) => !hidden[id] && !removed.has(id));
}
