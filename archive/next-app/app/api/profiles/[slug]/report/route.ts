import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireSession } from "@/lib/auth/require-session";
import { getMemberProfileBySlug } from "@/lib/member-profiles";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import { reportSchema } from "@/lib/api-schemas";
import { rateLimitByUser } from "@/lib/rate-limit";

type Params = { params: Promise<{ slug: string }> };

const REPORT_LIMIT = 5;
const REPORT_WINDOW = 300;

/** POST: report a profile. Body: { reason?: string } */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const rateLimitResult = await rateLimitByUser(
    auth.session.sub,
    "profile-report",
    REPORT_LIMIT,
    REPORT_WINDOW
  );
  if (!rateLimitResult.allowed) return rateLimitResult.response;

  const { slug } = await params;
  const profile = await getMemberProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  if (profile.userId === auth.session.sub) {
    return NextResponse.json({ error: "You cannot report your own profile." }, { status: 400 });
  }

  let body: { reason?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = reportSchema.safeParse(body);
  const reason = parsed.success && parsed.data.reason ? parsed.data.reason.trim() : "";

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
    { profileId: profileOid, reportedBy: auth.session.sub },
    {
      $set: {
        reason: reason || null,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        profileId: profileOid,
        reportedBy: auth.session.sub,
        slug,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true, message: "Thank you. We'll look into this report." });
}
