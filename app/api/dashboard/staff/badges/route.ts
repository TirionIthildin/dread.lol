import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/[locale]/dashboard/actions";
import { getAllCustomBadges, getUserCustomBadgeIds } from "@/lib/member-profiles";

export async function GET(request: Request) {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? undefined;
  const [badges, userBadgeIds] = await Promise.all([
    getAllCustomBadges(),
    userId ? getUserCustomBadgeIds(userId) : Promise.resolve(undefined),
  ]);
  return NextResponse.json({
    badges,
    ...(userBadgeIds !== undefined && { userBadgeIds }),
  });
}
