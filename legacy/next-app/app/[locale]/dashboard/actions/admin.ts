"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  getOrCreateUser,
  getProfileSlugByUserId,
  setUserBadges,
  setUserRestricted,
  createBadge,
  updateBadge,
  deleteBadge,
  setUserCustomBadges,
  setCustomBadgeVouchers,
} from "@/lib/member-profiles";
import { wipeUserSubscriptionData } from "@/lib/polar-subscription";
/** Ensure current user is admin; returns error string or null if allowed. */
export async function requireAdmin(): Promise<string | null> {
  const session = await getSession();
  if (!session) return "Not signed in";
  const user = await getOrCreateUser(session);
  if (!user.isAdmin) return "Access denied";
  return null;
}

/** Same as requireAdmin — staff tools use `isAdmin` on the user document. */
export async function requireStaff(): Promise<string | null> {
  return requireAdmin();
}

export async function setUserBadgesAction(
  userId: string,
  badges: { verified?: boolean; staff?: boolean; premiumGranted?: boolean; verifiedCreator?: boolean }
): Promise<{ error?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };
  const id = userId?.trim();
  if (!id) return { error: "Missing user" };
  const ok = await setUserBadges(id, badges);
  if (!ok) return { error: "User not found" };
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard");
  const slug = await getProfileSlugByUserId(id);
  if (slug) revalidatePath(`/${slug}`);
  return {};
}

export async function setUserRestrictedAction(userId: string, restricted: boolean): Promise<{ error?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };
  const id = userId?.trim();
  if (!id) return { error: "Missing user" };
  const ok = await setUserRestricted(id, restricted);
  if (!ok) return { error: "User not found" };
  revalidatePath("/dashboard/staff");
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
  revalidatePath("/dashboard/staff");
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
  revalidatePath("/dashboard/staff");
  return {};
}

export async function deleteBadgeAction(id: string): Promise<{ error?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };
  const ok = await deleteBadge(id);
  if (!ok) return { error: "Badge not found" };
  revalidatePath("/dashboard/staff");
  return {};
}

export async function setUserCustomBadgesAction(userId: string, badgeIds: string[]): Promise<{ error?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };
  const id = userId?.trim();
  if (!id) return { error: "Missing user" };
  await setUserCustomBadges(id, badgeIds);
  revalidatePath("/dashboard/staff");
  const slug = await getProfileSlugByUserId(id);
  if (slug) revalidatePath(`/${slug}`);
  return {};
}

/** Grant custom badge voucher slots to a user (admin only). */
export async function setCustomBadgeVouchersAction(
  userId: string,
  count: number
): Promise<{ error?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };
  const id = userId?.trim();
  if (!id) return { error: "Missing user" };
  const ok = await setCustomBadgeVouchers(id, count);
  if (!ok) return { error: "User not found" };
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/badges");
  const slug = await getProfileSlugByUserId(id);
  if (slug) revalidatePath(`/${slug}`);
  return {};
}

/** Wipe user's subscription and order data from local DB (admin only). Clears Polar cache and user-created badges. */
export async function wipeUserSubscriptionAction(
  userId: string
): Promise<{ error?: string; wiped?: { subscriptions: number; orders: number; badges: number } }> {
  const err = await requireAdmin();
  if (err) return { error: err };
  const id = userId?.trim();
  if (!id) return { error: "Missing user" };
  const result = await wipeUserSubscriptionData(id);
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/premium");
  const slug = await getProfileSlugByUserId(id);
  if (slug) revalidatePath(`/${slug}`);
  return {
    wiped: {
      subscriptions: result.subscriptionsDeleted,
      orders: result.ordersDeleted,
      badges: result.badgesDeleted,
    },
  };
}
