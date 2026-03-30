import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireStaff } from "@/app/[locale]/dashboard/actions";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";

/** GET: Aggregated profile reports (staff only). */
export async function GET() {
  const err = await requireStaff();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }

  const client = await getDb();
  const dbName = await getDbName();
  const reports = await client
    .db(dbName)
    .collection(COLLECTIONS.profileReports)
    .aggregate<{
      _id: ObjectId;
      slug: string;
      reason: string | null;
      reportedBy: string;
      reportCount: number;
      lastReportAt: Date | null;
    }>([
      {
        $group: {
          _id: "$profileId",
          slug: { $first: "$slug" },
          reason: { $first: "$reason" },
          reportedBy: { $first: "$reportedBy" },
          reportCount: { $sum: 1 },
          lastReportAt: { $max: "$updatedAt" },
        },
      },
      { $sort: { reportCount: -1, lastReportAt: -1 } },
    ])
    .toArray();

  const items = reports.map((r) => ({
    profileId: r._id.toString(),
    slug: r.slug,
    reason: r.reason,
    reportedBy: r.reportedBy,
    reportCount: r.reportCount,
    lastReportAt: r.lastReportAt ? r.lastReportAt.toISOString() : null,
  }));

  return NextResponse.json({ items });
}

/** DELETE: Clear all reports for a profile. Query: profileId */
export async function DELETE(request: NextRequest) {
  const err = await requireStaff();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }

  const profileId = request.nextUrl.searchParams.get("profileId")?.trim();
  if (!profileId) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }

  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return NextResponse.json({ error: "Invalid profileId" }, { status: 400 });
  }

  const client = await getDb();
  const dbName = await getDbName();
  const result = await client
    .db(dbName)
    .collection(COLLECTIONS.profileReports)
    .deleteMany({ profileId: oid });

  return NextResponse.json({ ok: true, deleted: result.deletedCount });
}
