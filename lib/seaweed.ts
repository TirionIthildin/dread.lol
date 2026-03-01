/**
 * SeaweedFS client for internal (non-internet-facing) storage.
 * Upload via master /submit; serve files by resolving fid to volume and streaming.
 */

const MASTER_URL = process.env.SEAWEED_MASTER_URL ?? "";
/** When the app runs outside Docker, the master may return volume URLs (e.g. seaweed-volume:8080) that don't resolve. Set this to the reachable volume URL (e.g. http://localhost:8080). */
const VOLUME_PUBLIC_URL = process.env.SEAWEED_VOLUME_PUBLIC_URL?.replace(/\/$/, "");

export function isSeaweedConfigured(): boolean {
  return Boolean(MASTER_URL?.startsWith("http"));
}

/** Result of uploading a file to SeaweedFS. Use path as the public URL path (e.g. /api/files/3,0123456789). */
export interface SeaweedUploadResult {
  fid: string;
  path: string;
  size: number;
}

/**
 * Upload a file to SeaweedFS via the master /submit endpoint.
 * Master will assign a fid and stream the file to the volume.
 */
export async function uploadFile(
  file: Blob | Buffer,
  fileName?: string
): Promise<SeaweedUploadResult> {
  if (!isSeaweedConfigured()) {
    throw new Error("SEAWEED_MASTER_URL is not set");
  }
  const form = new FormData();
  const blob =
    (file instanceof Buffer ? new Blob([new Uint8Array(file)]) : file) as Blob;
  form.append("file", blob, fileName ?? "upload");
  const res = await fetch(`${MASTER_URL.replace(/\/$/, "")}/submit`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SeaweedFS upload failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as {
    fid?: string;
    size?: number;
    fileUrl?: string;
  };
  if (!data?.fid) {
    throw new Error("SeaweedFS returned no fid");
  }
  return {
    fid: data.fid,
    path: `/api/files/${data.fid}`,
    size: typeof data.size === "number" ? data.size : 0,
  };
}

/**
 * Resolve a fid (e.g. "3,0123456789") to the volume server URL for reading.
 * Uses master /dir/lookup?volumeId=...
 */
export async function lookupVolumeUrl(fid: string): Promise<string> {
  if (!isSeaweedConfigured()) {
    throw new Error("SEAWEED_MASTER_URL is not set");
  }
  const volumeId = fid.includes(",") ? fid.split(",")[0] : fid;
  const res = await fetch(
    `${MASTER_URL.replace(/\/$/, "")}/dir/lookup?volumeId=${encodeURIComponent(volumeId)}`
  );
  if (!res.ok) {
    throw new Error(`SeaweedFS lookup failed: ${res.status}`);
  }
  const data = (await res.json()) as { locations?: { url: string }[] };
  if (VOLUME_PUBLIC_URL) {
    return VOLUME_PUBLIC_URL;
  }
  const url = data?.locations?.[0]?.url;
  if (!url) {
    throw new Error("SeaweedFS lookup returned no volume URL");
  }
  return url.startsWith("http") ? url : `http://${url}`;
}

/**
 * Fetch file from SeaweedFS (volume server) and return the Response for streaming.
 * Pass rangeHeader (e.g. "bytes=0-1023") to enable partial content / seeking.
 */
export async function getFile(fid: string, rangeHeader?: string | null): Promise<Response> {
  const baseUrl = await lookupVolumeUrl(fid);
  const url = `${baseUrl.replace(/\/$/, "")}/${fid}`;
  const init: RequestInit = { cache: "no-store" };
  if (rangeHeader) init.headers = { Range: rangeHeader };
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`SeaweedFS get failed: ${res.status}`);
  }
  return res;
}

/**
 * Extract fid from a path like /api/files/3,0123456789.
 * Returns null if not a valid internal file path.
 */
export function fidFromPath(path: string | null | undefined): string | null {
  const trimmed = path?.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^\/api\/files\/(\d+,[a-f0-9]+)$/i);
  return match ? match[1] : null;
}

/**
 * Copy a file from SeaweedFS (by path e.g. /api/files/3,xxx) and re-upload.
 * Returns the new path for the copy. Used for template apply (copy-on-apply).
 * If Seaweed is not configured or file not found, returns null.
 */
export async function copyFile(sourcePath: string | null | undefined): Promise<string | null> {
  const fid = fidFromPath(sourcePath);
  if (!fid || !isSeaweedConfigured()) return null;
  try {
    const res = await getFile(fid);
    if (!res.ok) return null;
    const blob = await res.blob();
    const result = await uploadFile(blob);
    return result.path;
  } catch {
    return null;
  }
}

/**
 * Delete a file from SeaweedFS by fid.
 * Uses soft delete; disk space reclaimed by background vacuum.
 */
export async function deleteFile(fid: string): Promise<void> {
  if (!isSeaweedConfigured()) return;
  const baseUrl = await lookupVolumeUrl(fid);
  const url = `${baseUrl.replace(/\/$/, "")}/${fid}`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    console.error(`SeaweedFS delete failed for ${fid}: ${res.status}`);
  }
}
