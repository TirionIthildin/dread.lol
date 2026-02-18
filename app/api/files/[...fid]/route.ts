import { NextRequest, NextResponse } from "next/server";
import { getFile, isSeaweedConfigured } from "@/lib/seaweed";

type Params = { params: Promise<{ fid: string[] }> };

/**
 * GET /api/files/3,0123456789 – stream file from internal SeaweedFS.
 * SeaweedFS is not internet-facing; this route proxies the file to the client.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  if (!isSeaweedConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const { fid: fidParts } = await params;
  const fid = Array.isArray(fidParts) ? fidParts.join(",") : fidParts;
  if (!fid || !/^\d+,[a-f0-9]+$/i.test(fid)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }
  try {
    const res = await getFile(fid);
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const headers = new Headers();
    headers.set("content-type", contentType);
    const cacheControl = res.headers.get("cache-control");
    if (cacheControl) headers.set("cache-control", cacheControl);
    return new NextResponse(res.body, {
      status: res.status,
      headers,
    });
  } catch (e) {
    console.error("SeaweedFS get error:", e);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
