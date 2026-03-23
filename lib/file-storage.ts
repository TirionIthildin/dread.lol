/**
 * User uploads on a local directory (Docker volume in production).
 * Public URLs stay /api/files/{id}. New ids are UUIDs; legacy Seaweed fids remain valid after migration.
 */

import { createReadStream } from "fs";
import fs from "fs/promises";
import path from "path";
import { Readable } from "stream";
import {
  fileIdFromPath,
  isValidFileId,
  normalizeFileId,
} from "@/lib/file-id";
import { getFile as getFileFromSeaweed, isSeaweedConfigured } from "@/lib/seaweed";

const STORAGE_ROOT = process.env.FILE_STORAGE_PATH?.trim() ?? "";

export {
  fidFromPath,
  fileIdFromPath,
  isValidFileId,
  normalizeFileId,
} from "@/lib/file-id";

export interface FileMeta {
  contentType: string;
  size: number;
}

export interface FileUploadResult {
  fid: string;
  path: string;
  size: number;
}

export function isStorageConfigured(): boolean {
  return STORAGE_ROOT.length > 0;
}

/** True if FILE_STORAGE_PATH is set and the directory exists or can be created. */
export async function ensureStorageReady(): Promise<boolean> {
  if (!isStorageConfigured()) return false;
  try {
    await fs.mkdir(STORAGE_ROOT, { recursive: true });
    await fs.access(STORAGE_ROOT, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function dirForId(fileId: string): string {
  return path.join(STORAGE_ROOT, normalizeFileId(fileId));
}

async function readMeta(fileId: string): Promise<FileMeta | null> {
  const metaPath = path.join(dirForId(fileId), "meta.json");
  try {
    const raw = await fs.readFile(metaPath, "utf8");
    const parsed = JSON.parse(raw) as { contentType?: unknown; size?: unknown };
    const contentType =
      typeof parsed.contentType === "string"
        ? parsed.contentType
        : "application/octet-stream";
    const size = typeof parsed.size === "number" ? parsed.size : 0;
    return { contentType, size };
  } catch {
    return null;
  }
}

async function blobPath(fileId: string): Promise<string> {
  return path.join(dirForId(fileId), "blob");
}

export async function uploadFile(
  file: Blob | Buffer,
  _fileName?: string,
  contentType?: string
): Promise<FileUploadResult> {
  if (!isStorageConfigured()) {
    throw new Error("FILE_STORAGE_PATH is not set");
  }
  const ready = await ensureStorageReady();
  if (!ready) {
    throw new Error("FILE_STORAGE_PATH is not writable");
  }

  const fid = crypto.randomUUID();
  const dir = dirForId(fid);
  await fs.mkdir(dir, { recursive: true });

  const buffer = Buffer.isBuffer(file)
    ? file
    : Buffer.from(await (file as Blob).arrayBuffer());
  const size = buffer.length;
  const ct =
    contentType?.trim() ||
    (file instanceof Blob && file.type ? file.type : "") ||
    "application/octet-stream";

  const blobFile = path.join(dir, "blob");
  const metaFile = path.join(dir, "meta.json");

  await fs.writeFile(blobFile, buffer);
  await fs.writeFile(
    metaFile,
    JSON.stringify({ contentType: ct, size }, null, 0),
    "utf8"
  );

  return {
    fid,
    path: `/api/files/${fid}`,
    size,
  };
}

type ParsedRange =
  | { ok: true; start: number; end: number }
  | { ok: false };

function parseRangeHeader(
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

async function getFileFromDisk(
  fileId: string,
  rangeHeader?: string | null
): Promise<Response | null> {
  if (!isValidFileId(fileId)) return null;

  const meta = await readMeta(fileId);
  if (!meta) return null;

  const bPath = await blobPath(fileId);
  let stat;
  try {
    stat = await fs.stat(bPath);
  } catch {
    return null;
  }

  const fileSize = stat.size;
  const contentType = meta.contentType || "application/octet-stream";

  const parsed = parseRangeHeader(rangeHeader ?? null, fileSize);

  if (!parsed.ok) {
    const stream = createReadStream(bPath);
    const web = Readable.toWeb(stream) as ReadableStream;
    return new Response(web, {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-length": String(fileSize),
        "accept-ranges": "bytes",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }

  const { start, end } = parsed;
  const chunkSize = end - start + 1;
  const stream = createReadStream(bPath, { start, end });
  const web = Readable.toWeb(stream) as ReadableStream;

  return new Response(web, {
    status: 206,
    headers: {
      "content-type": contentType,
      "content-length": String(chunkSize),
      "content-range": `bytes ${start}-${end}/${fileSize}`,
      "accept-ranges": "bytes",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

/**
 * Stream file from disk, or fall back to SeaweedFS when configured and blob is missing on disk.
 */
export async function getFile(
  fileId: string,
  rangeHeader?: string | null
): Promise<Response> {
  if (isStorageConfigured()) {
    const fromDisk = await getFileFromDisk(fileId, rangeHeader);
    if (fromDisk) return fromDisk;
  }
  if (isSeaweedConfigured()) {
    return getFileFromSeaweed(fileId, rangeHeader);
  }
  throw new Error("File not found");
}

export async function deleteFile(fileId: string): Promise<void> {
  if (!isValidFileId(fileId)) return;
  if (!isStorageConfigured()) return;
  const dir = dirForId(fileId);
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (e) {
    console.error(`File storage delete failed for ${fileId}:`, e);
  }
}

export async function copyFile(
  sourcePath: string | null | undefined
): Promise<string | null> {
  const id = fileIdFromPath(sourcePath);
  if (!id) return null;
  try {
    const res = await getFile(id);
    if (!res.ok) return null;
    const blob = await res.blob();
    const ct =
      res.headers.get("content-type")?.trim() || "application/octet-stream";
    const result = await uploadFile(blob, "copy", ct);
    return result.path;
  } catch {
    return null;
  }
}

/** Exported for tests. */
export const __test__ = { parseRangeHeader };
