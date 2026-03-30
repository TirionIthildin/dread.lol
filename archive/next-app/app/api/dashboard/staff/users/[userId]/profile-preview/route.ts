import { NextResponse } from "next/server";
import { requireStaff } from "@/app/[locale]/dashboard/actions";
import { getStaffProfilePreviewForUser } from "@/lib/staff-profile-preview";

type Params = { params: Promise<{ userId: string }> };

/** GET: Serialized profile for staff preview modal (no view recording). */
export async function GET(_request: Request, { params }: Params) {
  const err = await requireStaff();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }
  const { userId } = await params;
  if (!userId?.trim()) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const result = await getStaffProfilePreviewForUser(userId.trim());
  if (!result.ok) {
    const status = result.code === "not_found" ? 404 : 403;
    return NextResponse.json({ error: result.message, code: result.code }, { status });
  }

  return NextResponse.json({
    profile: result.profile,
    vouches: result.vouches,
    similarProfiles: result.similarProfiles,
    mutualGuilds: result.mutualGuilds,
  });
}
