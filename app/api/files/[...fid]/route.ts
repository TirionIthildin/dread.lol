import { NextRequest, NextResponse } from "next/server";
import { getFile, isSeaweedConfigured } from "@/lib/seaweed";

type Params = { params: Promise<{ fid: string[] }> };

const FONT_MIME_TYPES = new Set([
  "font/ttf", "font/otf", "font/woff", "font/woff2",
  "application/font-woff", "application/font-woff2",
  "application/x-font-ttf", "application/x-font-otf",
  "application/vnd.ms-fontobject",
]);

/**
 * GET /api/files/3,0123456789 – stream file from internal SeaweedFS.
 * SeaweedFS is not internet-facing; this route proxies the file to the client.
 * Supports ?type= for font files to ensure correct MIME type (e.g. ?type=font/woff2).
 */
export async function GET(request: NextRequest, { params }: Params) {
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
    let contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const typeParam = request.nextUrl.searchParams.get("type");
    if (typeParam && FONT_MIME_TYPES.has(typeParam.toLowerCase())) {
      contentType = typeParam;
    }
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
