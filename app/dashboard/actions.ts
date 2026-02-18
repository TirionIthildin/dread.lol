"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { updateMemberProfile } from "@/lib/member-profiles";

export type ProfileFormState = { error?: string; success?: boolean } | null;

function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "member";
}

export async function updateProfileAction(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const profileId = formData.get("profileId");
  if (!profileId || typeof profileId !== "string") return { error: "Missing profile" };
  const id = parseInt(profileId, 10);
  if (Number.isNaN(id)) return { error: "Invalid profile" };
  const rawSlug = (formData.get("slug") as string)?.trim();
  const slug = rawSlug ? normalizeSlug(rawSlug) : undefined;
  const linksRaw = (formData.get("links") as string)?.trim();
  const linksJson =
    linksRaw &&
    JSON.stringify(
      linksRaw
        .split("\n")
        .map((line) => {
          const sep = line.includes("|") ? "|" : "\t";
          const i = line.indexOf(sep);
          if (i === -1) return null;
          const label = line.slice(0, i).trim();
          const href = line.slice(i + 1).trim();
          return label && href ? { label, href } : null;
        })
        .filter(Boolean)
    );
  try {
    await updateMemberProfile(id, session.sub, {
      slug,
      name: (formData.get("name") as string)?.trim() || undefined,
      tagline: (formData.get("tagline") as string)?.trim() || undefined,
      description: (formData.get("description") as string) ?? undefined,
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
      easterEgg: formData.get("easterEgg") === "on",
      easterEggTaglineWord: (formData.get("easterEggTaglineWord") as string)?.trim() || undefined,
      easterEggLinkTrigger: (formData.get("easterEggLinkTrigger") as string)?.trim() || undefined,
      easterEggLinkUrl: (formData.get("easterEggLinkUrl") as string)?.trim() || undefined,
      easterEggLinkPopupUrl: (formData.get("easterEggLinkPopupUrl") as string)?.trim() || undefined,
      links: linksJson ?? null,
      ogImageUrl: (formData.get("ogImageUrl") as string)?.trim() || undefined,
      showUpdatedAt: formData.get("showUpdatedAt") === "on",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return { error: msg.includes("unique") && msg.includes("slug") ? "That slug is already taken." : msg };
  }
  revalidatePath("/dashboard");
  if (slug) revalidatePath(`/${slug}`);
  return { success: true };
}
