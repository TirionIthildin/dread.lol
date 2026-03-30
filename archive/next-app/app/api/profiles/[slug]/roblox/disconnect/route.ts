import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMemberProfileBySlug } from "@/lib/member-profiles";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";

/** DELETE: Unlink Roblox from the current user's account. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const profile = await getMemberProfileBySlug(slug);
  if (!profile || profile.userId !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await getDb();
  const dbName = await getDbName();
  await client.db(dbName).collection(COLLECTIONS.userRoblox).deleteOne({
    userId: session.sub,
  });

  return NextResponse.json({ ok: true });
}
