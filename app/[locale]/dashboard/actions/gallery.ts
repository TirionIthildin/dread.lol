"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  getOrCreateUser,
  getProfileSlugByUserId,
  addGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  setGalleryOrder,
} from "@/lib/member-profiles";
import { requireHttpOrSameOriginPath } from "@/lib/validate-url";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { canUseDashboard } from "@/lib/dashboard-access";
import { hasGalleryAddon } from "@/lib/gallery-addon";
/** Add a gallery item (image URL, optional title/description). */
export async function addGalleryItemAction(
  profileId: string,
  data: { imageUrl: string; title?: string; description?: string }
): Promise<{ error?: string; id?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const [user, premiumAccess, galleryAddon] = await Promise.all([
    getOrCreateUser(session),
    getPremiumAccess(session.sub),
    hasGalleryAddon(session.sub),
  ]);
  if (!canUseDashboard(user)) return { error: "Account not approved" };
  const hasGalleryAccess = premiumAccess.hasAccess || galleryAddon;
  if (!hasGalleryAccess) {
    return { error: "Image hosting requires Premium or the Gallery addon. Get it at /dashboard/gallery or /dashboard/premium." };
  }
  if (!data.imageUrl?.trim()) return { error: "Image URL required" };
  try {
    const imageUrl = requireHttpOrSameOriginPath(data.imageUrl.trim(), "Image URL");
    const item = await addGalleryItem(profileId, session.sub, {
      imageUrl,
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
  if (!canUseDashboard(user)) return { error: "Account not approved" };
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
  if (!canUseDashboard(user)) return { error: "Account not approved" };
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
  if (!canUseDashboard(user)) return { error: "Account not approved" };
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
