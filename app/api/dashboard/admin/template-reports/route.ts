import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";

/** GET: List reported templates. Admin only. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser(session);
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const client = await getDb();
  const dbName = await getDbName();
  const reports = await client
    .db(dbName)
    .collection(COLLECTIONS.templateReports)
    .aggregate<{
      _id: ObjectId; // grouped templateId from $group
      templateName: string;
      reason: string | null;
      reportedBy: string;
      reportCount: number;
    }>([
      {
        $group: {
          _id: "$templateId",
          templateName: { $first: "$templateName" },
          reason: { $first: "$reason" },
          reportedBy: { $first: "$reportedBy" },
          reportCount: { $sum: 1 },
        },
      },
      { $sort: { reportCount: -1 } },
    ])
    .toArray();

  const items = reports.map((r) => ({
    templateId: r._id.toString(),
    templateName: r.templateName,
    reason: r.reason,
    reportedBy: r.reportedBy,
    reportCount: r.reportCount,
  }));

  return NextResponse.json({ items });
}
