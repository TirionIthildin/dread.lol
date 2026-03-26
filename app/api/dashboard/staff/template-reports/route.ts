import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireStaff } from "@/app/[locale]/dashboard/actions";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";

/** GET: List reported templates (staff only). */
export async function GET() {
  const err = await requireStaff();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
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

/** DELETE: Clear all reports for a template. Query: templateId */
export async function DELETE(request: NextRequest) {
  const err = await requireStaff();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }

  const templateId = request.nextUrl.searchParams.get("templateId")?.trim();
  if (!templateId) {
    return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
  }

  let oid: ObjectId;
  try {
    oid = new ObjectId(templateId);
  } catch {
    return NextResponse.json({ error: "Invalid templateId" }, { status: 400 });
  }

  const client = await getDb();
  const dbName = await getDbName();
  const result = await client
    .db(dbName)
    .collection(COLLECTIONS.templateReports)
    .deleteMany({ templateId: oid });

  return NextResponse.json({ ok: true, deleted: result.deletedCount });
}
