import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/dashboard/actions";
import { getUsersForAdminList } from "@/lib/member-profiles";

export async function GET() {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }
  const users = await getUsersForAdminList();
  return NextResponse.json({ users });
}
