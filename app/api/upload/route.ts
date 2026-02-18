import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { uploadFile, isSeaweedConfigured } from "@/lib/seaweed";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MiB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSeaweedConfigured()) {
    return NextResponse.json(
      { error: "Upload not configured" },
      { status: 503 }
    );
  }
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 }
    );
  }
  const type = file.type?.toLowerCase();
  if (!type || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File too large. Max ${MAX_SIZE_BYTES / 1024 / 1024} MiB` },
      { status: 400 }
    );
  }
  const name = file instanceof File ? file.name : undefined;
  try {
    const result = await uploadFile(file, name ?? "image");
    return NextResponse.json({
      url: result.path,
      fid: result.fid,
      size: result.size,
    });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 502 }
    );
  }
}
