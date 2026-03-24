"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  createProfileAlias,
  deleteProfileAlias,
  getOrCreateUser,
  getProfileSlugByUserId,
} from "@/lib/member-profiles";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { canUseDashboard } from "@/lib/dashboard-access";

export async function createProfileAliasAction(
  profileId: string,
  rawSlug: string
): Promise<{ error?: string; id?: string; slug?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) return { error: "Account not approved" };
  const premiumAccess = await getPremiumAccess(session.sub);
  try {
    const alias = await createProfileAlias(profileId, session.sub, rawSlug, premiumAccess.hasAccess);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/aliases");
    const primary = await getProfileSlugByUserId(session.sub);
    if (primary) revalidatePath(`/${primary}`);
    revalidatePath(`/${alias.slug}`);
    return { id: alias.id, slug: alias.slug };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add alias" };
  }
}

export async function deleteProfileAliasAction(aliasId: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) return { error: "Account not approved" };
  try {
    const { slug } = await deleteProfileAlias(aliasId, session.sub);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/aliases");
    const primary = await getProfileSlugByUserId(session.sub);
    if (primary) revalidatePath(`/${primary}`);
    revalidatePath(`/${slug}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to remove alias" };
  }
}
