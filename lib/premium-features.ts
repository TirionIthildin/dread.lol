/**
 * Premium feature gates. Use these to check if a value requires Premium.
 */

/** Username effects that require Premium (typewriter, sparkle variants). */
export const PREMIUM_NAME_ANIMATIONS = ["typewriter", "sparkle", "sparkle-stars"] as const;

export function isPremiumNameAnimation(value: string | null | undefined): boolean {
  return value != null && PREMIUM_NAME_ANIMATIONS.includes(value as (typeof PREMIUM_NAME_ANIMATIONS)[number]);
}

/** Tagline/description animations require Premium when not "none". */
export function isPremiumFieldAnimation(value: string | null | undefined): boolean {
  return value != null && value !== "none";
}

/** Custom colors (accent override, text, background) require Premium. */
export function isPremiumColor(value: string | null | undefined): boolean {
  return value != null && value.trim() !== "";
}

/** Background effects require Premium. */
export const PREMIUM_BACKGROUND_EFFECTS = ["snow", "rain", "blur", "retro-computer"] as const;

export function isPremiumBackgroundEffect(value: string | null | undefined): boolean {
  return (
    value != null &&
    PREMIUM_BACKGROUND_EFFECTS.includes(value as (typeof PREMIUM_BACKGROUND_EFFECTS)[number])
  );
}

/** Max alternate profile URL slugs (aliases) per account. */
export const PROFILE_ALIAS_MAX_FREE = 1;
export const PROFILE_ALIAS_MAX_PREMIUM = 5;
