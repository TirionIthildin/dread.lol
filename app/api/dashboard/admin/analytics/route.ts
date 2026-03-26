/**
 * Admin-only service analytics. Returns counts and metrics for the admin overview.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/[locale]/dashboard/actions";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";

export async function GET() {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }

  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    usersCount,
    profilesCount,
    usersLast7Days,
    usersLast30Days,
    templatesPublished,
    templatesAppliedTotal,
    polarSubscriptionsActive,
    polarOrdersPaid,
    profileViewsLast7Days,
    pastesCount,
    galleryItemsCount,
    blogPostsCount,
    vouchesCount,
    customBadgesCount,
    recentUsers,
  ] = await Promise.all([
    db.collection(COLLECTIONS.users).countDocuments(),
    db.collection(COLLECTIONS.profiles).countDocuments(),
    db.collection(COLLECTIONS.users).countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    db.collection(COLLECTIONS.users).countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    db.collection(COLLECTIONS.profileTemplates).countDocuments({ status: "published" }),
    db
      .collection(COLLECTIONS.profileTemplates)
      .aggregate([{ $group: { _id: null, total: { $sum: "$applyCount" } } }])
      .toArray()
      .then((r) => r[0]?.total ?? 0),
    db
      .collection(COLLECTIONS.polarSubscriptions)
      .countDocuments({ status: { $in: ["active", "trialing"] } }),
    db.collection(COLLECTIONS.polarOrders).countDocuments({ status: "paid" }),
    db.collection(COLLECTIONS.profileViews).countDocuments({ viewedAt: { $gte: sevenDaysAgo } }),
    db.collection(COLLECTIONS.pastes).countDocuments(),
    db.collection(COLLECTIONS.galleryItems).countDocuments(),
    db.collection(COLLECTIONS.blogPosts).countDocuments(),
    db.collection(COLLECTIONS.vouches).countDocuments(),
    db.collection(COLLECTIONS.userCreatedBadges).countDocuments(),
    db
      .collection(COLLECTIONS.users)
      .find({}, { projection: { _id: 1, username: 1, displayName: 1, avatarUrl: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray(),
  ]);

  const analytics = {
    users: usersCount,
    profiles: profilesCount,
    signupsLast7Days: usersLast7Days,
    signupsLast30Days: usersLast30Days,
    templatesPublished,
    templatesAppliedTotal,
    polarSubscriptionsActive,
    polarOrdersPaid,
    profileViewsLast7Days,
    pastes: pastesCount,
    galleryItems: galleryItemsCount,
    blogPosts: blogPostsCount,
    vouches: vouchesCount,
    customBadges: customBadgesCount,
    recentUsers: recentUsers.map((u) => ({
      id: u._id,
      username: u.username ?? null,
      displayName: u.displayName ?? null,
      avatarUrl: u.avatarUrl ?? null,
      createdAt: (u.createdAt as Date)?.toISOString?.() ?? null,
    })),
  };

  return NextResponse.json(analytics);
}
