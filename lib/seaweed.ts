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
 */
export async function getFile(fid: string): Promise<Response> {
  const baseUrl = await lookupVolumeUrl(fid);
  const url = `${baseUrl.replace(/\/$/, "")}/${fid}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`SeaweedFS get failed: ${res.status}`);
  }
  return res;
}
