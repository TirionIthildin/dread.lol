"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser, getProfileSlugByUserId, addShortLink, deleteShortLink } from "@/lib/member-profiles";
import { requireSafeUrl } from "@/lib/validate-url";
import { canUseDashboard } from "@/lib/dashboard-access";
/** Add a short link (e.g. /username/twitch -> https://twitch.tv/...). */
export async function addShortLinkAction(
  profileId: string,
  data: { slug: string; url: string }
): Promise<{ error?: string; id?: string; slug?: string; url?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) return { error: "Account not approved" };
  try {
    const url = requireSafeUrl(data.url.trim(), "URL");
    const link = await addShortLink(profileId, session.sub, { slug: data.slug.trim(), url });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/links");
    revalidatePath("/dashboard/short");
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
  if (!canUseDashboard(user)) return { error: "Account not approved" };
  try {
    await deleteShortLink(linkId, session.sub);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/links");
    revalidatePath("/dashboard/short");
    const slug = await getProfileSlugByUserId(session.sub);
    if (slug) revalidatePath(`/${slug}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete" };
  }
}
