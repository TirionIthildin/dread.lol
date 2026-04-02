import { NextRequest, NextResponse } from "next/server";
import { getFile, isStorageConfigured, isValidFileId } from "@/lib/file-storage";

type Params = { params: Promise<{ fid: string[] }> };

const FONT_MIME_TYPES = new Set([
  "font/ttf", "font/otf", "font/woff", "font/woff2",
  "application/font-woff", "application/font-woff2",
  "application/x-font-ttf", "application/x-font-otf",
  "application/vnd.ms-fontobject",
]);

/**
 * GET /api/files/{id} – stream file from S3 (when configured) or local volume (FILE_STORAGE_PATH).
 * Supports ?type= for font files to ensure correct MIME type (e.g. ?type=font/woff2).
 *
 * ACCESS CONTROL: Files are public once uploaded. Ids are not secret; do not store
 * sensitive content if exposure is a concern.
 */
export async function GET(request: NextRequest, { params }: Params) {
  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const { fid: fidParts } = await params;
  const fid = Array.isArray(fidParts) ? fidParts.join(",") : fidParts;
  if (!fid || !isValidFileId(fid)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }
  try {
    const rangeHeader = request.headers.get("range");
    const res = await getFile(fid, rangeHeader);
    let contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const typeParam = request.nextUrl.searchParams.get("type");
    if (typeParam && FONT_MIME_TYPES.has(typeParam.toLowerCase())) {
      contentType = typeParam;
    }
    const headers = new Headers();
    headers.set("content-type", contentType);
    headers.set("accept-ranges", "bytes");
    const cacheControl = res.headers.get("cache-control");
    if (cacheControl) headers.set("cache-control", cacheControl);
    if (res.status === 206) {
      const contentRange = res.headers.get("content-range");
      if (contentRange) headers.set("content-range", contentRange);
      const contentLength = res.headers.get("content-length");
      if (contentLength) headers.set("content-length", contentLength);
    }
    return new NextResponse(res.body, {
      status: res.status,
      headers,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("404")) {
      console.warn(`[api/files] ${fid} not found`);
    } else {
      console.error("File get error:", e);
    }
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
