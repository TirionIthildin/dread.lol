import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { uploadFile, isSeaweedConfigured } from "@/lib/seaweed";

const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MiB
const VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50 MiB (general use)
const VIDEO_BACKGROUND_MAX_BYTES = 20 * 1024 * 1024; // 20 MiB for profile background
const AUDIO_MAX_BYTES = 15 * 1024 * 1024; // 15 MiB

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/x-gif", // alternate MIME for GIF
  "image/webp",
  "image/svg+xml",
]);
const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime", // .mov
]);
const AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/ogg",
  "audio/webm",
  "audio/x-wav",
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
  const type = file.type?.toLowerCase().split(";")[0]?.trim();
  const purpose = (formData.get("purpose") as string)?.toLowerCase();
  let maxBytes: number;
  if (type && IMAGE_TYPES.has(type)) {
    maxBytes = IMAGE_MAX_BYTES;
  } else if (type && VIDEO_TYPES.has(type)) {
    maxBytes = purpose === "background-video" ? VIDEO_BACKGROUND_MAX_BYTES : VIDEO_MAX_BYTES;
  } else if (type && AUDIO_TYPES.has(type)) {
    maxBytes = AUDIO_MAX_BYTES;
  } else {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: images (JPEG, PNG, GIF, WebP, SVG), video (MP4, WebM, OGG), audio (MP3, WAV, OGG, WebM)" },
      { status: 400 }
    );
  }
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large. Max ${maxBytes / 1024 / 1024} MiB for this file type` },
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
