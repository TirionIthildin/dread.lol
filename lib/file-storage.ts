/**
 * User uploads: S3-compatible object storage when configured, else local directory
 * (Docker volume). Public URLs stay /api/files/{id}. New ids are UUIDs; legacy
 * Seaweed-style fids may still be valid ids on disk.
 */

import { createReadStream } from "fs";
import fs from "fs/promises";
import path from "path";
import { Readable } from "stream";
import type { FileMeta, FileUploadResult } from "@/lib/file-storage-types";
import {
  fileIdFromPath,
  isValidFileId,
  normalizeFileId,
} from "@/lib/file-id";
import { logger } from "@/lib/logger";
import { parseRangeHeader } from "@/lib/parse-http-range";
import {
  deleteFromS3,
  ensureS3Ready,
  getFromS3,
  isS3Configured,
  uploadToS3,
} from "@/lib/s3-storage";

const STORAGE_ROOT = process.env.FILE_STORAGE_PATH?.trim() ?? "";

export {
  fidFromPath,
  fileIdFromPath,
  isValidFileId,
  normalizeFileId,
} from "@/lib/file-id";

export type { FileMeta, FileUploadResult } from "@/lib/file-storage-types";

export function isStorageConfigured(): boolean {
  return isS3Configured() || STORAGE_ROOT.length > 0;
}

/** True when S3 is ready, or local path exists / can be created and is writable. */
export async function ensureStorageReady(): Promise<boolean> {
  if (isS3Configured()) {
    return ensureS3Ready();
  }
  if (STORAGE_ROOT.length === 0) return false;
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

async function uploadFileToDisk(
  file: Blob | Buffer,
  contentType?: string
): Promise<FileUploadResult> {
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

export async function uploadFile(
  file: Blob | Buffer,
  _fileName?: string,
  contentType?: string
): Promise<FileUploadResult> {
  if (isS3Configured()) {
    const buffer = Buffer.isBuffer(file)
      ? file
      : Buffer.from(await (file as Blob).arrayBuffer());
    const ct =
      contentType?.trim() ||
      (file instanceof Blob && file.type ? file.type : "") ||
      "application/octet-stream";
    return uploadToS3(buffer, ct);
  }

  if (!STORAGE_ROOT.length) {
    throw new Error("FILE_STORAGE_PATH is not set and S3 is not configured");
  }
  const ready = await ensureStorageReady();
  if (!ready) {
    throw new Error("FILE_STORAGE_PATH is not writable");
  }
  return uploadFileToDisk(file, contentType);
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

/** Stream file from S3 (preferred) or local volume (legacy). */
export async function getFile(
  fileId: string,
  rangeHeader?: string | null
): Promise<Response> {
  if (isS3Configured()) {
    const fromS3 = await getFromS3(fileId, rangeHeader);
    if (fromS3) return fromS3;
  }
  if (STORAGE_ROOT.length > 0) {
    const fromDisk = await getFileFromDisk(fileId, rangeHeader);
    if (fromDisk) return fromDisk;
  }
  throw new Error("File not found");
}

export async function deleteFile(fileId: string): Promise<void> {
  if (!isValidFileId(fileId)) return;
  if (isS3Configured()) {
    try {
      await deleteFromS3(fileId);
    } catch (e) {
      logger.error("FileStorage", "S3 delete failed:", e);
    }
  }
  if (STORAGE_ROOT.length > 0) {
    const dir = dirForId(fileId);
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (e) {
      logger.error("FileStorage", `Disk delete failed for ${fileId}:`, e);
    }
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
