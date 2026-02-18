"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { updateMemberProfile, getOrCreateUser, approveUser, setUserBadges, getProfileSlugByUserId } from "@/lib/member-profiles";
import { normalizeSlug } from "@/lib/slug";

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
  const id = parseInt(profileId, 10);
  if (Number.isNaN(id)) return { error: "Invalid profile" };
  const rawSlug = (formData.get("slug") as string)?.trim();
  const slug = rawSlug ? normalizeSlug(rawSlug) : undefined;
  const linksJson = parseLinksValue((formData.get("links") as string) ?? undefined);
  try {
    await updateMemberProfile(id, session.sub, {
      slug,
      name: ((formData.get("name") as string)?.trim() || undefined)?.slice(0, 100),
      tagline: ((formData.get("tagline") as string)?.trim() || undefined)?.slice(0, 120),
      description: ((formData.get("description") as string) ?? undefined)?.slice(0, 2000) ?? undefined,
      avatarUrl: (formData.get("avatarUrl") as string)?.trim() || undefined,
      status: (formData.get("status") as string)?.trim() || undefined,
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
      displayStatus: (formData.get("displayStatus") as string)?.trim() || undefined,
      pronouns: ((formData.get("pronouns") as string)?.trim() || undefined)?.slice(0, 40),
      location: ((formData.get("location") as string)?.trim() || undefined)?.slice(0, 80),
      timezone: ((formData.get("timezone") as string)?.trim() || undefined)?.slice(0, 64),
      avatarShape: (formData.get("avatarShape") as string)?.trim() || undefined,
      layoutDensity: (formData.get("layoutDensity") as string)?.trim() || undefined,
      noindex: formData.get("noindex") === "on",
      metaDescription: ((formData.get("metaDescription") as string)?.trim() || undefined)?.slice(0, 200),
      showPageViews: formData.get("showPageViews") === "on",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return { error: msg.includes("unique") && msg.includes("slug") ? "That slug is already taken." : msg };
  }
  revalidatePath("/dashboard");
  if (slug) revalidatePath(`/${slug}`);
  return { success: true, savedAt: new Date().toISOString() };
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
