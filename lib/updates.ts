/**
 * Feature updates displayed on the main page.
 * Edit this file to add or modify update entries.
 */
export interface FeatureUpdate {
  date: string;
  title: string;
  description?: string;
}

export const FEATURE_UPDATES: FeatureUpdate[] = [
  {
    date: "2026-02",
    title: "Page themes",
    description: "Choose Classic or Minimalist with light or dark mode for your profile.",
  },
  {
    date: "2026-02",
    title: "Paste history & raw",
    description: "View, edit, and delete your pastes. Copy raw URL or open raw content directly.",
  },
  {
    date: "2026-02",
    title: "Paste: Markdown by default",
    description: "Pastes now default to Markdown and render formatted when viewed.",
  },
  {
    date: "2026-02",
    title: "Themed embed images",
    description: "Twitter, Discord, and other platforms now show a custom preview with your profile picture, grid background, and description.",
  },
  {
    date: "2026-02",
    title: "More profile fields",
    description: "Add website, skills, languages, availability, current focus, and when you're usually online.",
  },
  {
    date: "2026-02",
    title: "Profile Marketplace",
    description: "Browse and apply community templates to style your profile.",
  },
  {
    date: "2026-02",
    title: "Trending profiles",
    description: "Discover profiles getting the most attention this week.",
  },
  {
    date: "2026-02",
    title: "Leaderboard",
    description: "Top vouched profiles ranked monthly.",
  },
  {
    date: "2026-02",
    title: "Gallery & paste",
    description: "Add images and text blocks to your profile.",
  },
];
