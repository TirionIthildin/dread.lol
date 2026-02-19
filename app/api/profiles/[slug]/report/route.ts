import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getMemberProfileBySlug } from "@/lib/member-profiles";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };

const MAX_REASON_LENGTH = 1000;

/** POST: report a profile. Body: { reason?: string } */
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in to report a profile." }, { status: 401 });
  }

  const { slug } = await params;
  const profile = await getMemberProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  if (profile.userId === session.sub) {
    return NextResponse.json({ error: "You cannot report your own profile." }, { status: 400 });
  }

  let body: { reason?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, MAX_REASON_LENGTH) : "";

  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);

  let profileOid: ObjectId;
  try {
    profileOid = new ObjectId(profile.id);
  } catch {
    return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
  }

  await db.collection(COLLECTIONS.profileReports).updateOne(
    { profileId: profileOid, reportedBy: session.sub },
    {
      $set: {
        reason: reason || null,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        profileId: profileOid,
        reportedBy: session.sub,
        slug,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true, message: "Thank you. We'll look into this report." });
}
