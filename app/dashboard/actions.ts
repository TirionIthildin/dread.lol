"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  updateMemberProfile,
  getOrCreateUser,
  approveUser,
  setUserBadges,
  getProfileSlugByUserId,
  addGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  setGalleryOrder,
  addShortLink,
  deleteShortLink,
  createBadge,
  updateBadge,
  deleteBadge,
  setUserCustomBadges,
} from "@/lib/member-profiles";
import { normalizeSlug } from "@/lib/slug";
import { getProfileTemplate } from "@/lib/profile-templates";

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
          x && typeof x === "object" && typeof (x as { label?: string }).label === "string" && typeof (x as { href?: string }).href === "string"
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
      return label && href ? { label, href } : null;
    })
    .filter(Boolean);
  return parsed.length > 0 ? JSON.stringify(parsed) : null;
}

export async function updateProfileAction(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!user.approved && !user.isAdmin) return { error: "Account not approved" };
  const profileId = formData.get("profileId");
  if (!profileId || typeof profileId !== "string") return { error: "Missing profile" };
  const rawSlug = (formData.get("slug") as string)?.trim();
  const slug = rawSlug ? normalizeSlug(rawSlug) : undefined;
  const linksJson = parseLinksValue((formData.get("links") as string) ?? undefined);
  try {
    await updateMemberProfile(profileId, session.sub, {
      slug,
      name: ((formData.get("name") as string)?.trim() || undefined)?.slice(0, 100),
      tagline: ((formData.get("tagline") as string)?.trim() || undefined)?.slice(0, 120),
      description: ((formData.get("description") as string) ?? undefined)?.slice(0, 2000) ?? undefined,
      avatarUrl: (formData.get("avatarUrl") as string)?.trim() || undefined,
      quote: (formData.get("quote") as string)?.trim() || undefined,
      tags: formData.get("tags")
        ? (formData.get("tags") as string)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
      discord: (formData.get("discord") as string)?.trim() || undefined,
      roblox: (formData.get("roblox") as string)?.trim() || undefined,
      banner: (formData.get("banner") as string)?.trim() || undefined,
      bannerSmall: formData.get("bannerSmall") === "on",
      bannerAnimatedFire: formData.get("bannerAnimatedFire") === "on",
      bannerStyle: (formData.get("bannerStyle") as string)?.trim() || undefined,
      useTerminalLayout: formData.get("useTerminalLayout") === "on",
      terminalTitle: (formData.get("terminalTitle") as string)?.trim() || undefined,
      terminalCommands: (formData.get("terminalCommands") as string)?.trim() || null,
      links: linksJson,
      ogImageUrl: (formData.get("ogImageUrl") as string)?.trim() || undefined,
      showUpdatedAt: formData.get("showUpdatedAt") === "on",
      accentColor: (formData.get("accentColor") as string)?.trim() || undefined,
      terminalPrompt: (formData.get("terminalPrompt") as string)?.trim() || undefined,
      nameGreeting: (formData.get("nameGreeting") as string)?.trim() || undefined,
      cardStyle: (formData.get("cardStyle") as string)?.trim() || undefined,
      pronouns: ((formData.get("pronouns") as string)?.trim() || undefined)?.slice(0, 40),
      location: ((formData.get("location") as string)?.trim() || undefined)?.slice(0, 80),
      timezone: ((formData.get("timezone") as string)?.trim() || undefined)?.slice(0, 64),
      avatarShape: (formData.get("avatarShape") as string)?.trim() || undefined,
      layoutDensity: (formData.get("layoutDensity") as string)?.trim() || undefined,
      noindex: formData.get("noindex") === "on",
      metaDescription: ((formData.get("metaDescription") as string)?.trim() || undefined)?.slice(0, 200),
      showPageViews: formData.get("showPageViews") === "on",
      showDiscordBadges: formData.get("showDiscordBadges") === "on",
      customFont: (formData.get("customFont") as string)?.trim() || undefined,
      backgroundType: (formData.get("backgroundType") as string)?.trim() || undefined,
      backgroundUrl: (() => {
        const t = (formData.get("backgroundType") as string)?.trim();
        if (t !== "image" && t !== "youtube") return undefined;
        return (formData.get("backgroundUrl") as string)?.trim() || undefined;
      })(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return { error: msg.includes("unique") && msg.includes("slug") ? "That slug is already taken." : msg };
  }
  revalidatePath("/dashboard");
  if (slug) revalidatePath(`/${slug}`);
  return { success: true, savedAt: new Date().toISOString() };
}

/** Apply a profile template to the user's profile. Replaces content fields (tagline, description, banner, etc.). */
export async function applyTemplateAction(
  profileId: string,
  templateId: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!user.approved && !user.isAdmin) return { error: "Account not approved" };
  const template = getProfileTemplate(templateId);
  if (!template) return { error: "Template not found" };
  const d = template.data;
  const update: Parameters<typeof updateMemberProfile>[2] = {};
  if (d.tagline !== undefined) update.tagline = d.tagline;
  if (d.description !== undefined) update.description = d.description;
  if (d.banner !== undefined) update.banner = d.banner;
  if (d.discord !== undefined) update.discord = d.discord;
  if (d.roblox !== undefined) update.roblox = d.roblox;
  if (d.bannerSmall !== undefined) update.bannerSmall = d.bannerSmall;
  if (d.bannerAnimatedFire !== undefined) update.bannerAnimatedFire = d.bannerAnimatedFire;
  if (d.bannerStyle !== undefined) update.bannerStyle = d.bannerStyle;
  if (d.useTerminalLayout !== undefined) update.useTerminalLayout = d.useTerminalLayout;
  if (d.terminalTitle !== undefined) update.terminalTitle = d.terminalTitle;
  if (d.terminalCommands !== undefined) update.terminalCommands = d.terminalCommands;
  if (d.easterEgg !== undefined) update.easterEgg = d.easterEgg;
  if (d.easterEggTaglineWord !== undefined) update.easterEggTaglineWord = d.easterEggTaglineWord;
  if (d.easterEggLinkTrigger !== undefined) update.easterEggLinkTrigger = d.easterEggLinkTrigger;
  if (d.easterEggLinkUrl !== undefined) update.easterEggLinkUrl = d.easterEggLinkUrl;
  if (d.easterEggLinkPopupUrl !== undefined) update.easterEggLinkPopupUrl = d.easterEggLinkPopupUrl;
  if (d.tags !== undefined) update.tags = d.tags;
  if (d.links !== undefined) update.links = typeof d.links === "string" ? d.links : (d.links ? JSON.stringify(d.links) : null);
  if (d.quote !== undefined) update.quote = d.quote;
  try {
    await updateMemberProfile(profileId, session.sub, update);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to apply template" };
  }
  revalidatePath("/dashboard");
  const slug = await getProfileSlugByUserId(session.sub);
  if (slug) revalidatePath(`/${slug}`);
  return {};
}

/** Add a gallery item (image URL, optional title/description). */
export async function addGalleryItemAction(
  profileId: string,
  data: { imageUrl: string; title?: string; description?: string }
): Promise<{ error?: string; id?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!user.approved && !user.isAdmin) return { error: "Account not approved" };
  if (!data.imageUrl?.trim()) return { error: "Image URL required" };
  try {
    const item = await addGalleryItem(profileId, session.sub, {
      imageUrl: data.imageUrl.trim(),
      title: data.title?.trim() || null,
      description: data.description?.trim() || null,
    });
    revalidatePath("/dashboard");
    const slug = await getProfileSlugByUserId(session.sub);
    if (slug) revalidatePath(`/${slug}`);
    return { id: item.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add" };
  }
}

/** Update a gallery item (title/description). */
export async function updateGalleryItemAction(
  itemId: string,
  data: { title?: string; description?: string }
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!user.approved && !user.isAdmin) return { error: "Account not approved" };
  try {
    await updateGalleryItem(itemId, session.sub, {
      title: data.title !== undefined ? (data.title?.trim() || null) : undefined,
      description: data.description !== undefined ? (data.description?.trim() || null) : undefined,
    });
    revalidatePath("/dashboard");
    const slug = await getProfileSlugByUserId(session.sub);
    if (slug) revalidatePath(`/${slug}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update" };
  }
}

/** Delete a gallery item. */
export async function deleteGalleryItemAction(itemId: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!user.approved && !user.isAdmin) return { error: "Account not approved" };
  try {
    await deleteGalleryItem(itemId, session.sub);
    revalidatePath("/dashboard");
    const slug = await getProfileSlugByUserId(session.sub);
    if (slug) revalidatePath(`/${slug}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete" };
  }
}

/** Reorder gallery items. */
export async function setGalleryOrderAction(profileId: string, orderedIds: string[]): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!user.approved && !user.isAdmin) return { error: "Account not approved" };
  try {
    await setGalleryOrder(profileId, session.sub, orderedIds);
    revalidatePath("/dashboard");
    const slug = await getProfileSlugByUserId(session.sub);
    if (slug) revalidatePath(`/${slug}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to reorder" };
  }
}

/** Add a short link (e.g. /username/twitch -> https://twitch.tv/...). */
export async function addShortLinkAction(
  profileId: string,
  data: { slug: string; url: string }
): Promise<{ error?: string; id?: string; slug?: string; url?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!user.approved && !user.isAdmin) return { error: "Account not approved" };
  try {
    const link = await addShortLink(profileId, session.sub, { slug: data.slug.trim(), url: data.url.trim() });
    revalidatePath("/dashboard");
    const slug = await getProfileSlugByUserId(session.sub);
    if (slug) revalidatePath(`/${slug}`);
    return { id: link.id, slug: link.slug, url: link.url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add link" };
  }
}

/** Delete a short link. */
export async function deleteShortLinkAction(linkId: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!user.approved && !user.isAdmin) return { error: "Account not approved" };
  try {
    await deleteShortLink(linkId, session.sub);
    revalidatePath("/dashboard");
    const slug = await getProfileSlugByUserId(session.sub);
    if (slug) revalidatePath(`/${slug}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete" };
  }
}

/** Ensure current user is admin; returns error string or null if allowed. */
export async function requireAdmin(): Promise<string | null> {
  const session = await getSession();
  if (!session) return "Not signed in";
  const user = await getOrCreateUser(session);
  if (!user.isAdmin) return "Access denied";
  return null;
}

export async function approveUserAction(userId: string): Promise<{ error?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };
  if (!userId?.trim()) return { error: "Missing user" };
  const ok = await approveUser(userId.trim());
  if (!ok) return { error: "User not found or already approved" };
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard");
  return {};
}

export async function setUserBadgesAction(
  userId: string,
  badges: { verified?: boolean; staff?: boolean }
): Promise<{ error?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };
  const id = userId?.trim();
  if (!id) return { error: "Missing user" };
  const ok = await setUserBadges(id, badges);
  if (!ok) return { error: "User not found" };
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard");
  const slug = await getProfileSlugByUserId(id);
  if (slug) revalidatePath(`/${slug}`);
  return {};
}

export async function createBadgeAction(data: {
  key: string;
  label: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  badgeType?: string;
  imageUrl?: string;
  iconName?: string;
}): Promise<{ error?: string; id?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };
  const key = data.key?.trim();
  const label = data.label?.trim();
  if (!key || !label) return { error: "Key and label required" };
  const result = await createBadge({ ...data, key, label });
  if (!result) return { error: "Failed to create badge" };
  revalidatePath("/dashboard/admin");
  return { id: result.id };
}

export async function updateBadgeAction(
  id: string,
  data: {
    key?: string;
    label?: string;
    description?: string;
    color?: string;
    sortOrder?: number;
    badgeType?: string;
    imageUrl?: string;
    iconName?: string;
  }
): Promise<{ error?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };
  await updateBadge(id, data);
  revalidatePath("/dashboard/admin");
  return {};
}

export async function deleteBadgeAction(id: string): Promise<{ error?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };
  const ok = await deleteBadge(id);
  if (!ok) return { error: "Badge not found" };
  revalidatePath("/dashboard/admin");
  return {};
}

export async function setUserCustomBadgesAction(userId: string, badgeIds: string[]): Promise<{ error?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };
  const id = userId?.trim();
  if (!id) return { error: "Missing user" };
  await setUserCustomBadges(id, badgeIds);
  revalidatePath("/dashboard/admin");
  const slug = await getProfileSlugByUserId(id);
  if (slug) revalidatePath(`/${slug}`);
  return {};
}
