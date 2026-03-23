"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { updateMemberProfile, getOrCreateUser, getProfileSlugByUserId } from "@/lib/member-profiles";
import { isReservedProfileSlug, normalizeSlug } from "@/lib/slug";
import { validateUrlOrEmpty, isSafeUrl, validateBackgroundUrl } from "@/lib/validate-url";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { parseEnabledCryptoIds } from "@/lib/crypto-widgets";
import { isPremiumNameAnimation, isPremiumFieldAnimation } from "@/lib/premium-features";
import { filterLinksForPremiumAccess, parseCommissionStatus } from "@/lib/monetization-profile";
import { canUseDashboard } from "@/lib/dashboard-access";
function parseAudioTracksValue(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return null;
    const valid = arr
      .filter(
        (x): x is { url: string; title?: string } =>
          x && typeof x === "object" && typeof (x as { url?: unknown }).url === "string"
      )
      .map((x) => ({
        url: validateBackgroundUrl((x as { url: string }).url.trim()) ?? "",
        title: ((x as { title?: string }).title?.trim() || undefined)?.slice(0, 100),
      }))
      .filter((x) => x.url.length > 0);
    return valid.length > 0 ? JSON.stringify(valid) : null;
  } catch {
    return null;
  }
}

export type ProfileFormState = { error?: string; success?: boolean; savedAt?: string } | null;

function parseLinksValue(linksRaw: string | null | undefined): string | null {
  if (!linksRaw?.trim()) return null;
  const trimmed = linksRaw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed) as unknown;
      if (!Array.isArray(arr)) return null;
      const valid = arr.filter(
        (x): x is { label: string; href: string } =>
          x && typeof x === "object" && typeof (x as { label?: string }).label === "string" && typeof (x as { href?: string }).href === "string" && isSafeUrl((x as { href: string }).href)
      );
      return valid.length > 0 ? JSON.stringify(valid) : null;
    } catch {
      return null;
    }
  }
  const parsed = trimmed
    .split("\n")
    .map((line) => {
      const sep = line.includes("|") ? "|" : "\t";
      const i = line.indexOf(sep);
      if (i === -1) return null;
      const label = line.slice(0, i).trim();
      const href = line.slice(i + 1).trim();
      return label && href && isSafeUrl(href) ? { label, href } : null;
    })
    .filter(Boolean);
  return parsed.length > 0 ? JSON.stringify(parsed) : null;
}

/** Remove Premium-only monetization links when the owner does not have Premium. */
function applyPremiumFilterToLinksJson(parsed: string | null, hasPremium: boolean): string | null {
  if (!parsed) return null;
  try {
    const arr = JSON.parse(parsed) as { label: string; href: string }[];
    if (!Array.isArray(arr)) return parsed;
    const filtered = filterLinksForPremiumAccess(arr, hasPremium);
    return filtered.length > 0 ? JSON.stringify(filtered) : null;
  } catch {
    return parsed;
  }
}

/** Update only link-related profile fields (websiteUrl, discord, roblox, links). */
export async function updateLinksAction(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) return { error: "Account not approved" };
  const profileId = formData.get("profileId");
  if (!profileId || typeof profileId !== "string") return { error: "Missing profile" };
  const premiumAccess = await getPremiumAccess(session.sub);
  const linksJson = applyPremiumFilterToLinksJson(
    parseLinksValue((formData.get("links") as string) ?? undefined),
    premiumAccess.hasAccess
  );
  const websiteUrl = (() => {
    const v = (formData.get("websiteUrl") as string)?.trim();
    if (!v) return null;
    return validateUrlOrEmpty(v) ?? null;
  })();
  try {
    await updateMemberProfile(profileId, session.sub, {
      websiteUrl,
      discord: (formData.get("discord") as string)?.trim() || undefined,
      roblox: (formData.get("roblox") as string)?.trim() || undefined,
      links: linksJson,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Update failed" };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/links");
  const slug = await getProfileSlugByUserId(session.sub);
  if (slug) revalidatePath(`/${slug}`);
  return { success: true, savedAt: new Date().toISOString() };
}

/** Partial profile update — only updates provided fields (e.g. section panels). */
export async function updateProfileFieldsAction(
  profileId: string,
  fields: Record<string, unknown>
): Promise<ProfileFormState> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) return { error: "Account not approved" };
  if (Object.keys(fields).length === 0) return { success: true, savedAt: new Date().toISOString() };
  try {
    await updateMemberProfile(profileId, session.sub, fields);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Update failed" };
  }
  revalidatePath("/dashboard");
  const slug = await getProfileSlugByUserId(session.sub);
  if (slug) revalidatePath(`/${slug}`);
  return { success: true, savedAt: new Date().toISOString() };
}

export async function updateProfileAction(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) return { error: "Account not approved" };
  const profileId = formData.get("profileId");
  if (!profileId || typeof profileId !== "string") return { error: "Missing profile" };
  const rawSlug = (formData.get("slug") as string)?.trim();
  const slug = rawSlug ? normalizeSlug(rawSlug) : undefined;
  if (slug !== undefined && isReservedProfileSlug(slug)) {
    return { error: "That URL slug is reserved." };
  }
  // Link-related fields only updated when present (i.e. from Links page). Main profile form omits them.

  const rawAvatar = (formData.get("avatarUrl") as string)?.trim();
  const avatarUrl =
    rawAvatar === "discord" ? "discord" : validateUrlOrEmpty(rawAvatar);
  // Banner is ASCII art text, not a URL
  const bannerRaw = (formData.get("banner") as string)?.trim();
  const banner = bannerRaw ? bannerRaw.slice(0, 5000) : undefined;
  const bgType = (formData.get("backgroundType") as string)?.trim();
  const usesCustomMedia = ["image", "video"].includes(bgType ?? "");
  const usesVisualBackground = usesCustomMedia || ["grid", "gradient", "solid", "dither"].includes(bgType ?? "");
  const rawBackgroundUrl = usesCustomMedia
    ? (formData.get("backgroundUrl") as string)?.trim()
    : undefined;
  const backgroundUrl = validateBackgroundUrl(rawBackgroundUrl);
  const rawBackgroundAudioUrl = (formData.get("backgroundAudioUrl") as string)?.trim();
  const backgroundAudioUrl = validateBackgroundUrl(rawBackgroundAudioUrl);

  if (rawAvatar && !avatarUrl) return { error: "Avatar URL must use https or http" };
  if (rawBackgroundUrl && !backgroundUrl) return { error: "Background URL must use https or http or a valid path" };
  if (usesCustomMedia && !backgroundUrl) return { error: "Choose a background and provide a valid URL or upload" };
  if (rawBackgroundAudioUrl && !backgroundAudioUrl) return { error: "Background audio URL must use https or http or a valid path" };

  const premiumAccess = await getPremiumAccess(session.sub);
  const hasPremium = premiumAccess.hasAccess;

  const linksJson = formData.has("links")
    ? applyPremiumFilterToLinksJson(parseLinksValue((formData.get("links") as string) ?? undefined), hasPremium)
    : undefined;

  const widgetSelection = (() => {
    const order: Array<{ src: "discord" | "roblox"; val: string }> = [];
    if (formData.get("showDiscordWidgetAccountAge") === "on") order.push({ src: "discord", val: "accountAge" });
    if (formData.get("showDiscordWidgetJoined") === "on") order.push({ src: "discord", val: "joined" });
    if (formData.get("showDiscordWidgetServerCount") === "on") order.push({ src: "discord", val: "serverCount" });
    if (formData.get("showDiscordWidgetServerInvite") === "on") order.push({ src: "discord", val: "serverInvite" });
    if (formData.get("showRobloxWidgetAccountAge") === "on") order.push({ src: "roblox", val: "accountAge" });
    if (formData.get("showRobloxWidgetProfile") === "on") order.push({ src: "roblox", val: "profile" });
    const taken = order.slice(0, 4);
    return {
      discord: taken.filter((x) => x.src === "discord").map((x) => x.val),
      roblox: taken.filter((x) => x.src === "roblox").map((x) => x.val),
    };
  })();

  try {
    await updateMemberProfile(profileId, session.sub, {
      slug,
      name: ((formData.get("name") as string)?.trim() || undefined)?.slice(0, 100),
      tagline: ((formData.get("tagline") as string)?.trim() || undefined)?.slice(0, 120),
      description: ((formData.get("description") as string) ?? undefined)?.slice(0, 2000) ?? undefined,
      avatarUrl,
      quote: (formData.get("quote") as string)?.trim() || undefined,
      tags: formData.get("tags")
        ? (formData.get("tags") as string)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
      ...(formData.has("links") && {
        discord: (formData.get("discord") as string)?.trim() || undefined,
        roblox: (formData.get("roblox") as string)?.trim() || undefined,
        links: linksJson,
      }),
      banner,
      bannerSmall: formData.get("bannerSmall") === "on",
      bannerAnimatedFire: formData.get("bannerAnimatedFire") === "on",
      bannerStyle: (formData.get("bannerStyle") as string)?.trim() || undefined,
      useTerminalLayout: formData.get("useTerminalLayout") === "on",
      terminalTitle: (formData.get("terminalTitle") as string)?.trim() || undefined,
      terminalCommands: (formData.get("terminalCommands") as string)?.trim() || null,
      accentColor: (() => {
        if (!hasPremium) return null;
        const custom = (formData.get("accentColorCustom") as string)?.trim();
        if (custom && /^#[0-9a-fA-F]{6}$/.test(custom)) return custom;
        const preset = (formData.get("accentColor") as string)?.trim();
        return preset ? preset : undefined;
      })(),
      customTextColor: (() => {
        if (!hasPremium) return null;
        const v = (formData.get("customTextColor") as string)?.trim();
        return v && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null;
      })(),
      customBackgroundColor: (() => {
        if (!hasPremium) return null;
        const v = (formData.get("customBackgroundColor") as string)?.trim();
        return v && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null;
      })(),
      terminalPrompt: (formData.get("terminalPrompt") as string)?.trim() || undefined,
      nameGreeting: (formData.get("nameGreeting") as string)?.trim() || undefined,
      cardStyle: (formData.get("cardStyle") as string)?.trim() || undefined,
      pageTheme: (() => {
        const t = (formData.get("pageTheme") as string)?.trim();
        return ["classic-dark", "classic-light", "minimalist-light", "minimalist-dark", "professional-light", "professional-dark"].includes(t) ? t : undefined;
      })(),
      cardOpacity: (() => {
        const v = formData.get("cardOpacity");
        if (v == null || v === "") return undefined;
        const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
        if (Number.isNaN(n)) return undefined;
        return Math.max(50, Math.min(100, n));
      })(),
      cardBlur: (() => {
        const b = (formData.get("cardBlur") as string)?.trim();
        return b && ["none", "sm", "md", "lg"].includes(b) ? (b as "none" | "sm" | "md" | "lg") : undefined;
      })(),
      cardEffectTilt: formData.get("cardEffectTilt") === "on",
      cardEffectSpotlight: formData.get("cardEffectSpotlight") === "on",
      cardEffectGlare: formData.get("cardEffectGlare") === "on",
      cardEffectMagneticBorder: formData.get("cardEffectMagneticBorder") === "on",
      cardEffectsEnabled: false,
      pronouns: ((formData.get("pronouns") as string)?.trim() || undefined)?.slice(0, 40),
      location: ((formData.get("location") as string)?.trim() || undefined)?.slice(0, 80),
      timezone: ((formData.get("timezone") as string)?.trim() || undefined)?.slice(0, 64),
      timezoneRange: ((formData.get("timezoneRange") as string)?.trim() || null)?.slice(0, 120) ?? null,
      birthday: (() => {
        const mm = (formData.get("birthdayMonth") as string)?.trim();
        const dd = (formData.get("birthdayDay") as string)?.trim();
        if (!mm || !dd || !/^\d{2}$/.test(mm) || !/^\d{2}$/.test(dd)) return null;
        const m = parseInt(mm, 10);
        const d = parseInt(dd, 10);
        if (m < 1 || m > 12 || d < 1 || d > 31) return null;
        return `${mm}-${dd}`;
      })(),
      ...(formData.has("websiteUrl") && {
        websiteUrl: (() => {
          const v = (formData.get("websiteUrl") as string)?.trim();
          if (!v) return null;
          return validateUrlOrEmpty(v) ?? null;
        })(),
      }),
      skills: (() => {
        const raw = (formData.get("skills") as string)?.trim();
        if (!raw) return null;
        const arr = raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
        return arr.length > 0 ? arr : null;
      })(),
      languages: ((formData.get("languages") as string)?.trim() || null)?.slice(0, 80) ?? null,
      availability: ((formData.get("availability") as string)?.trim() || null)?.slice(0, 60) ?? null,
      currentFocus: ((formData.get("currentFocus") as string)?.trim() || null)?.slice(0, 120) ?? null,
      ...(hasPremium
        ? {
            commissionStatus: parseCommissionStatus(formData.get("commissionStatus") as string | null),
            commissionPriceRange: (() => {
              const v = (formData.get("commissionPriceRange") as string)?.trim();
              return v ? v.slice(0, 80) : null;
            })(),
          }
        : {}),
      avatarShape: (formData.get("avatarShape") as string)?.trim() || undefined,
      layoutDensity: (formData.get("layoutDensity") as string)?.trim() || undefined,
      showPageViews: formData.get("showPageViews") === "on",
      showDiscordBadges: formData.get("showDiscordBadges") === "on",
      hiddenDiscordBadges: (() => {
        if (formData.get("showDiscordBadges") !== "on") return null;
        const raw = (formData.get("availableDiscordBadgeKeys") as string)?.trim();
        if (!raw) return null;
        const keys = raw.split(",").map((s) => s.trim()).filter(Boolean);
        const hidden = keys.filter((key) => formData.get(`showDiscordBadge_${key}`) !== "on");
        return hidden.length > 0 ? hidden.join(",") : null;
      })(),
      showDiscordPresence: formData.get("showDiscordPresence") === "on",
      discordPresenceStyle: (() => {
        const s = (formData.get("discordPresenceStyle") as string)?.trim();
        return ["pills", "minimal", "stacked", "inline", "widget"].includes(s) ? s : undefined;
      })(),
      showDiscordWidgets: widgetSelection.discord.length > 0 ? widgetSelection.discord.join(",") : null,
      widgetsMatchAccent: formData.get("widgetsMatchAccent") === "on",
      ...(formData.get("showDiscordWidgetServerInvite") === "on" && {
        discordInviteUrl: (() => {
          const v = (formData.get("discordInviteUrl") as string)?.trim();
          if (!v) return null;
          if (v.startsWith("http")) {
            if (!isSafeUrl(v)) return null;
            if (!v.includes("discord.gg") && !v.includes("discord.com/invite")) return null;
          }
          return v.slice(0, 256);
        })(),
      }),
      showRobloxWidgets: widgetSelection.roblox.length > 0 ? widgetSelection.roblox.join(",") : null,
      showCryptoWidgets: (() => {
        const raw = (formData.get("showCryptoWidgets") as string)?.trim();
        if (!raw) return null;
        const ids = parseEnabledCryptoIds(raw);
        return ids.length > 0 ? ids.join(",") : null;
      })(),
      customFont: (() => {
        const f = (formData.get("customFont") as string)?.trim();
        const url = validateBackgroundUrl((formData.get("customFontUrl") as string)?.trim());
        if (f === "custom" && !url) return null;
        return f || undefined;
      })(),
      customFontUrl: (formData.get("customFont") as string)?.trim() === "custom"
        ? (validateBackgroundUrl((formData.get("customFontUrl") as string)?.trim()) ?? null)
        : null,
      cursorStyle: (() => {
        const c = (formData.get("cursorStyle") as string)?.trim();
        const url = validateBackgroundUrl((formData.get("cursorImageUrl") as string)?.trim());
        if (c === "custom" && !url) return null;
        return c || undefined;
      })(),
      cursorImageUrl: (formData.get("cursorStyle") as string)?.trim() === "custom"
        ? (validateBackgroundUrl((formData.get("cursorImageUrl") as string)?.trim()) ?? null)
        : null,
      animationPreset: (formData.get("animationPreset") as string)?.trim() || undefined,
      nameAnimation: (() => {
        const v = (formData.get("nameAnimation") as string)?.trim();
        const val = v && ["none", "typewriter", "fade-in", "slide-up", "slide-in-left", "blur-in", "sparkle", "sparkle-stars"].includes(v) ? v : undefined;
        if (!hasPremium && isPremiumNameAnimation(val)) return undefined;
        return val;
      })(),
      taglineAnimation: (() => {
        const v = (formData.get("taglineAnimation") as string)?.trim();
        const val = v && ["none", "typewriter", "fade-in", "slide-up", "slide-in-left", "blur-in"].includes(v) ? v : undefined;
        if (!hasPremium && isPremiumFieldAnimation(val)) return undefined;
        return val;
      })(),
      descriptionAnimation: (() => {
        const v = (formData.get("descriptionAnimation") as string)?.trim();
        const val = v && ["none", "fade-in", "slide-up", "slide-in-left", "blur-in"].includes(v) ? v : undefined;
        if (!hasPremium && isPremiumFieldAnimation(val)) return undefined;
        return val;
      })(),
      backgroundType: usesVisualBackground ? bgType : null,
      backgroundUrl: usesCustomMedia ? backgroundUrl : null,
      backgroundAudioUrl: backgroundAudioUrl || null,
      backgroundAudioStartSeconds: (() => {
        const v = formData.get("backgroundAudioStartSeconds");
        if (v == null || v === "") return null;
        const n = typeof v === "string" ? parseFloat(v) : Number(v);
        if (Number.isNaN(n) || n < 0) return null;
        return Math.min(9999, n);
      })(),
      backgroundEffect: (() => {
        if (!hasPremium) return null;
        const v = (formData.get("backgroundEffect") as string)?.trim();
        return v && ["snow", "rain", "blur", "retro-computer"].includes(v) ? v : null;
      })(),
      ...(bgType === "video" || backgroundAudioUrl
        ? {
            unlockOverlayText: ((formData.get("unlockOverlayText") as string)?.trim() || null)?.slice(0, 80) ?? null,
          }
        : {}),
      showAudioPlayer: formData.get("showAudioPlayer") === "on",
      audioVisualizerStyle: (() => {
        const s = (formData.get("audioVisualizerStyle") as string)?.trim();
        return ["bars", "wave", "spectrum"].includes(s ?? "") ? s : null;
      })(),
      audioVisualizerAnimation: null,
      audioTracks: parseAudioTracksValue((formData.get("audioTracks") as string) ?? undefined),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return { error: msg.includes("unique") && msg.includes("slug") ? "That slug is already taken." : msg };
  }
  revalidatePath("/dashboard");
  if (slug) revalidatePath(`/${slug}`);
  return { success: true, savedAt: new Date().toISOString() };
}
