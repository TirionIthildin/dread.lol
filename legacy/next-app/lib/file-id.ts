/**
 * Public file URL ids for /api/files/{id} (shared server + client; no Node fs).
 */

/** Legacy Seaweed volumeId,fileId (hex needle). */
const LEGACY_FILE_ID_RE = /^\d+,[a-f0-9]+$/i;

/** UUID v4 from crypto.randomUUID(). */
const UUID_FILE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Captures file id in a /api/files/... path (for regex on full URLs). */
const FILE_ID_IN_PATH =
  /\/api\/files\/((?:\d+,[a-f0-9]+)|(?:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}))/i;

export function isValidFileId(id: string): boolean {
  if (!id || id.includes("..") || id.includes("/") || id.includes("\\")) {
    return false;
  }
  return LEGACY_FILE_ID_RE.test(id) || UUID_FILE_ID_RE.test(id);
}

export function normalizeFileId(id: string): string {
  if (UUID_FILE_ID_RE.test(id)) return id.toLowerCase();
  if (LEGACY_FILE_ID_RE.test(id)) {
    const [vol, needle] = id.split(",", 2);
    return `${vol},${needle.toLowerCase()}`;
  }
  return id;
}

/**
 * Extract file id from /api/files/... Supports legacy fid and UUID.
 */
export function fileIdFromPath(urlOrPath: string | null | undefined): string | null {
  const trimmed = urlOrPath?.trim();
  if (!trimmed) return null;
  const match = trimmed.match(
    /^\/api\/files\/((?:\d+,[a-f0-9]+)|(?:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}))$/i
  );
  return match ? match[1] : null;
}

/** @deprecated Use fileIdFromPath */
export function fidFromPath(urlOrPath: string | null | undefined): string | null {
  return fileIdFromPath(urlOrPath);
}

/** Extract file id from a full URL or path that contains /api/files/{id}. */
export function extractFileIdFromFilesUrl(url: string): string | null {
  const m = url.trim().match(FILE_ID_IN_PATH);
  return m ? m[1] : null;
}
