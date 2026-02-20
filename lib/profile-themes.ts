/**
 * Profile theme system — single source of truth for accent colors, badge styles, and banner options.
 * Used by ProfileContent, ProfileBackground, ProfileCursorEffect, and the dashboard.
 */

/** Valid accent theme keys. Add new themes here; update globals.css profile-theme-* and banner-style-* to match. */
export const ACCENT_THEMES = [
  "cyan",
  "green",
  "purple",
  "orange",
  "rose",
  "amber",
  "blue",
  "indigo",
  "teal",
  "sky",
] as const;

export type AccentTheme = (typeof ACCENT_THEMES)[number];

/** Hex colors for accent (used by ProfileCursorEffect, programmatic styling). */
export const ACCENT_COLORS: Record<AccentTheme, string> = {
  cyan: "#06b6d4",
  green: "#22c55e",
  purple: "#a855f7",
  orange: "#f97316",
  rose: "#f43f5e",
  amber: "#f59e0b",
  blue: "#3b82f6",
  indigo: "#6366f1",
  teal: "#14b8a6",
  sky: "#0ea5e9",
};

/** Terminal/secondary color for each theme (lighter variant for prompts, cursors). */
export const TERMINAL_COLORS: Record<AccentTheme, string> = {
  cyan: "#22c55e",
  green: "#16a34a",
  purple: "#c084fc",
  orange: "#fb923c",
  rose: "#fb7185",
  amber: "#fbbf24",
  blue: "#60a5fa",
  indigo: "#818cf8",
  teal: "#2dd4bf",
  sky: "#38bdf8",
};

/** Tailwind class names for custom badges (key = badge.color from admin). */
export const CUSTOM_BADGE_COLORS: Record<string, string> = {
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  blue: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  cyan: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  indigo: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  orange: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  purple: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  rose: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  teal: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  sky: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
};

/** Valid banner style keys (accent uses var(--accent), others are gradient animations). */
export const BANNER_STYLES = [
  "accent",
  "fire",
  "cyan",
  "green",
  "purple",
  "orange",
  "rose",
  "amber",
  "blue",
  "indigo",
  "teal",
  "sky",
] as const;

/** Banner styles that use background-clip: text (gradient); accent uses solid var(--accent). */
export const GRADIENT_BANNER_STYLES = [
  "fire",
  "cyan",
  "green",
  "purple",
  "orange",
  "rose",
  "amber",
  "blue",
  "indigo",
  "teal",
  "sky",
] as const;

/** Default accent hex (cyan) when no theme is set. */
export const DEFAULT_ACCENT = ACCENT_COLORS.cyan;

/** Returns the profile-theme-{name} class when accentColor is valid, else "". */
export function getThemeClass(accentColor: string | undefined): string {
  if (
    accentColor &&
    ACCENT_THEMES.includes(accentColor as AccentTheme)
  ) {
    return `profile-theme-${accentColor}`;
  }
  return "";
}

/** Returns true if accentColor is a valid theme key. */
export function isAccentTheme(accentColor: string | undefined): accentColor is AccentTheme {
  return Boolean(
    accentColor && ACCENT_THEMES.includes(accentColor as AccentTheme)
  );
}

/** Returns hex for the accent, or DEFAULT_ACCENT if invalid. */
export function getAccentHex(accentColor: string | undefined): string {
  if (isAccentTheme(accentColor)) {
    return ACCENT_COLORS[accentColor];
  }
  return DEFAULT_ACCENT;
}

/** Options for accent color dropdown (value, label). */
export const ACCENT_COLOR_OPTIONS: { value: AccentTheme; label: string }[] = [
  { value: "cyan", label: "Cyan" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" },
  { value: "rose", label: "Rose" },
  { value: "amber", label: "Amber" },
  { value: "blue", label: "Blue" },
  { value: "indigo", label: "Indigo" },
  { value: "teal", label: "Teal" },
  { value: "sky", label: "Sky" },
];

/** Options for banner gradient dropdown (value, label). */
export const BANNER_STYLE_OPTIONS: { value: string; label: string }[] = [
  { value: "accent", label: "Default (accent)" },
  { value: "fire", label: "Fire" },
  { value: "cyan", label: "Cyan" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" },
  { value: "rose", label: "Rose" },
  { value: "amber", label: "Amber" },
  { value: "blue", label: "Blue" },
  { value: "indigo", label: "Indigo" },
  { value: "teal", label: "Teal" },
  { value: "sky", label: "Sky" },
];
