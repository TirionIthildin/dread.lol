import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/dashboard/actions";
import { getAdminUserById } from "@/lib/member-profiles";

type Params = { params: Promise<{ userId: string }> };

/** GET: Fetch a single user for admin (e.g. when opening user modal from profile page). */
export async function GET(request: NextRequest, { params }: Params) {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }
  const { userId } = await params;
  if (!userId?.trim()) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }
  const user = await getAdminUserById(userId.trim());
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({
    user: {
      ...user,
      createdAt: typeof user.createdAt === "string" ? user.createdAt : (user.createdAt as Date)?.toISOString?.() ?? "",
    },
  });
}
