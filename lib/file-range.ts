/**
 * Shared Range header parsing for disk and S3 file streaming.
 */

export type ParsedRange =
  | { ok: true; start: number; end: number }
  | { ok: false };

export function parseRangeHeader(
  rangeHeader: string | null | undefined,
  fileSize: number
): ParsedRange {
  if (!rangeHeader || !rangeHeader.startsWith("bytes=") || fileSize <= 0) {
    return { ok: false };
  }
  const part = rangeHeader.slice(6).split(",")[0]?.trim();
  if (!part) return { ok: false };

  if (part.startsWith("-")) {
    const suffix = Number.parseInt(part.slice(1), 10);
    if (!Number.isFinite(suffix) || suffix <= 0) return { ok: false };
    const start = Math.max(0, fileSize - suffix);
    return { ok: true, start, end: fileSize - 1 };
  }

  const dash = part.indexOf("-");
  if (dash === -1) return { ok: false };
  const startStr = part.slice(0, dash);
  const endStr = part.slice(dash + 1);

  if (startStr === "") {
    return { ok: false };
  }
  const start = Number.parseInt(startStr, 10);
  if (!Number.isFinite(start) || start < 0 || start >= fileSize) {
    return { ok: false };
  }

  let end: number;
  if (endStr === "") {
    end = fileSize - 1;
  } else {
    end = Number.parseInt(endStr, 10);
    if (!Number.isFinite(end) || end < start) return { ok: false };
    end = Math.min(end, fileSize - 1);
  }

  return { ok: true, start, end };
}
