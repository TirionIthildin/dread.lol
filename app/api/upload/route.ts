import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { uploadFile, deleteFile, isSeaweedConfigured } from "@/lib/seaweed";

const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MiB (general use, e.g. gallery)
const IMAGE_BACKGROUND_MAX_BYTES = 100 * 1024 * 1024; // 100 MiB for profile background
const VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50 MiB (general use)
const VIDEO_BACKGROUND_MAX_BYTES = 100 * 1024 * 1024; // 100 MiB for profile background
const AUDIO_BACKGROUND_MAX_BYTES = 10 * 1024 * 1024; // 10 MiB for profile background

// .png, .jpg, .jpeg, .gif, .webp (background, avatar); + svg for gallery
const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/x-gif",
  "image/webp",
  "image/svg+xml",
]);
const BACKGROUND_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/x-gif",
  "image/webp",
]);
// Avatar: PNG, JPG, GIF, WebP only, 5MB
const AVATAR_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/x-gif",
  "image/webp",
]);
// .mp4, .m4v, .webm, .mov, .mkv
const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/x-m4v",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
]);
// .mp3, .aac
const AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/aac",
  "audio/x-aac",
]);
// Custom cursor: .cur, .png, .jpg, .jpeg, .gif, .webp, 5MB
const CURSOR_TYPES = new Set([
  "image/x-icon", // .cur, .ico
  "image/vnd.microsoft.icon",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/x-gif",
  "image/webp",
]);
// Custom font: .ttf, .otf, .woff, .woff2, 5MB
const FONT_TYPES = new Set([
  "font/ttf",
  "font/otf",
  "font/woff",
  "font/woff2",
  "application/font-woff",
  "application/font-woff2",
  "application/x-font-ttf",
  "application/x-font-otf",
  "application/vnd.ms-fontobject", // sometimes .woff
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
  const isBackgroundImage = purpose === "background-image";
  const isBackground = purpose?.startsWith("background-");
  const ext = (file instanceof File ? file.name : "").toLowerCase().split(".").pop();
  let maxBytes: number;
  if (purpose === "avatar" && type && AVATAR_IMAGE_TYPES.has(type)) {
    maxBytes = IMAGE_MAX_BYTES; // 5 MiB
  } else if (purpose === "cursor" && (type && CURSOR_TYPES.has(type) || ext === "cur")) {
    maxBytes = IMAGE_MAX_BYTES; // 5 MiB
  } else if (purpose === "font" && (type && FONT_TYPES.has(type) || ["ttf", "otf", "woff", "woff2"].includes(ext ?? ""))) {
    maxBytes = IMAGE_MAX_BYTES; // 5 MiB
  } else if (type && (isBackgroundImage ? BACKGROUND_IMAGE_TYPES : IMAGE_TYPES).has(type)) {
    maxBytes = isBackground ? IMAGE_BACKGROUND_MAX_BYTES : IMAGE_MAX_BYTES;
  } else if (type && VIDEO_TYPES.has(type)) {
    maxBytes = purpose === "background-video" ? VIDEO_BACKGROUND_MAX_BYTES : VIDEO_MAX_BYTES;
  } else if (type && AUDIO_TYPES.has(type)) {
    maxBytes =
      purpose === "background-audio" || purpose === "audio-player"
        ? AUDIO_BACKGROUND_MAX_BYTES
        : 10 * 1024 * 1024;
  } else {
    return NextResponse.json(
      { error: "Invalid file type. Avatar: PNG, JPG, GIF, WebP (5MB). Cursor: CUR, PNG, JPG, GIF, WebP (5MB). Font: TTF, OTF, WOFF, WOFF2 (5MB)." },
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
  const replaceFid = (formData.get("replaceFid") as string)?.trim();
  try {
    const result = await uploadFile(file, name ?? "image");
    if (isBackground && replaceFid && /^\d+,\d+$/.test(replaceFid)) {
      deleteFile(replaceFid).catch((err) => console.error("Delete old background failed:", err));
    }
    const json: { url: string; fid: string; size: number; contentType?: string } = {
      url: result.path,
      fid: result.fid,
      size: result.size,
    };
    if (purpose === "font" && (type && FONT_TYPES.has(type) || ["ttf", "otf", "woff", "woff2"].includes(ext ?? ""))) {
      json.contentType = type && FONT_TYPES.has(type) ? type : { ttf: "font/ttf", otf: "font/otf", woff: "font/woff", woff2: "font/woff2" }[ext ?? ""] ?? "font/woff";
    }
    return NextResponse.json(json);
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 502 }
    );
  }
}
