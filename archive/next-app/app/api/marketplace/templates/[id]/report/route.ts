import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getTemplateById } from "@/lib/marketplace-templates";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

const MAX_REASON_LENGTH = 1000;

/** POST: Report a template. Body: { reason?: string } */
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in to report a template." }, { status: 401 });
  }

  const { id } = await params;
  const template = await getTemplateById(id);
  if (!template) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  if (template.creatorId === session.sub) {
    return NextResponse.json({ error: "You cannot report your own template." }, { status: 400 });
  }

  let body: { reason?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, MAX_REASON_LENGTH) : "";

  let templateOid: ObjectId;
  try {
    templateOid = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Invalid template." }, { status: 400 });
  }

  const client = await getDb();
  const dbName = await getDbName();

  await client.db(dbName).collection(COLLECTIONS.templateReports).updateOne(
    { templateId: templateOid, reportedBy: session.sub },
    {
      $set: {
        reason: reason || null,
        templateName: template.name,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        templateId: templateOid,
        reportedBy: session.sub,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true, message: "Thank you. We'll look into this report." });
}
