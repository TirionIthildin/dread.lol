/**
 * SeaweedFS read-only fallback for legacy file ids during migration.
 * Uploads use {@link "@/lib/file-storage"}.
 */

const MASTER_URL = process.env.SEAWEED_MASTER_URL ?? "";
const VOLUME_PUBLIC_URL = process.env.SEAWEED_VOLUME_PUBLIC_URL?.replace(
  /\/$/,
  ""
);

export function isSeaweedConfigured(): boolean {
  return Boolean(MASTER_URL?.startsWith("http"));
}

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
 * Fetch file from SeaweedFS (volume server). Used as fallback for legacy fids.
 */
export async function getFile(
  fid: string,
  rangeHeader?: string | null
): Promise<Response> {
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
