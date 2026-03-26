"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser, getProfileSlugByUserId } from "@/lib/member-profiles";
import {
  saveProfileVersion,
  restoreProfileVersion,
  deleteProfileVersion,
} from "@/lib/profile-versions";
import { canUseDashboard } from "@/lib/dashboard-access";
/** Save current profile as a version (up to 5, includes assets). */
export async function saveProfileVersionAction(
  profileId: string,
  name: string
): Promise<{ id?: string; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) return { error: "Account not approved" };
  const trimmed = name?.trim().slice(0, 80);
  if (!trimmed) return { error: "Name is required" };
  const result = await saveProfileVersion(session.sub, profileId, trimmed);
  if ("error" in result) return { error: result.error };
  revalidatePath("/dashboard");
  const slug = await getProfileSlugByUserId(session.sub);
  if (slug) revalidatePath(`/${slug}`);
  return { id: result.id };
}

/** Restore a saved profile version. */
export async function restoreProfileVersionAction(versionId: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) return { error: "Account not approved" };
  const result = await restoreProfileVersion(session.sub, versionId);
  if (result.error) return result;
  revalidatePath("/dashboard");
  const slug = await getProfileSlugByUserId(session.sub);
  if (slug) revalidatePath(`/${slug}`);
  return {};
}

/** Delete a saved profile version. */
export async function deleteProfileVersionAction(versionId: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) return { error: "Account not approved" };
  const result = await deleteProfileVersion(session.sub, versionId);
  if (result.error) return result;
  revalidatePath("/dashboard");
  return {};
}
