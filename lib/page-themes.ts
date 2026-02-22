/**
 * Page themes — profile-level design (Classic/Minimalist × light/dark).
 * Separate from profile accent colors and card styles.
 */
export const PAGE_THEMES = ["classic-dark", "classic-light", "minimalist-light", "minimalist-dark"] as const;
export type PageTheme = (typeof PAGE_THEMES)[number];

export const PAGE_THEME_OPTIONS: { value: PageTheme; label: string }[] = [
  { value: "classic-dark", label: "Classic — dark" },
  { value: "classic-light", label: "Classic — light" },
  { value: "minimalist-light", label: "Minimalist — light" },
  { value: "minimalist-dark", label: "Minimalist — dark" },
];

export const DEFAULT_PAGE_THEME: PageTheme = "classic-dark";

export function isPageTheme(value: unknown): value is PageTheme {
  return typeof value === "string" && PAGE_THEMES.includes(value as PageTheme);
}

export function isMinimalistTheme(theme: PageTheme): boolean {
  return theme === "minimalist-light" || theme === "minimalist-dark";
}

export function isLightTheme(theme: PageTheme): boolean {
  return theme === "classic-light" || theme === "minimalist-light";
}
