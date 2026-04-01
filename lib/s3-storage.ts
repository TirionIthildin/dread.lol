/**
 * S3-compatible object storage for user uploads (same key layout as disk: id/blob, id/meta.json).
 */

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { parseRangeHeader } from "@/lib/file-range";
import { normalizeFileId } from "@/lib/file-id";

const BUCKET = process.env.S3_BUCKET?.trim() ?? "";
const REGION =
  process.env.AWS_REGION?.trim() || process.env.S3_REGION?.trim() || "";
const KEY_PREFIX = (process.env.S3_KEY_PREFIX?.trim() ?? "").replace(
  /^\/+|\/+$/g,
  ""
);
const ENDPOINT = process.env.S3_ENDPOINT?.trim();
const FORCE_PATH_STYLE =
  process.env.S3_FORCE_PATH_STYLE === "1" ||
  process.env.S3_FORCE_PATH_STYLE?.toLowerCase() === "true";

let client: S3Client | null = null;

function s3Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: REGION,
      ...(ENDPOINT
        ? { endpoint: ENDPOINT, forcePathStyle: FORCE_PATH_STYLE }
        : {}),
    });
  }
  return client;
}

export function isS3Configured(): boolean {
  return BUCKET.length > 0 && REGION.length > 0;
}

function prefixKey(rel: string): string {
  return KEY_PREFIX ? `${KEY_PREFIX}/${rel}` : rel;
}

function blobObjectKey(fileId: string): string {
  return prefixKey(`${normalizeFileId(fileId)}/blob`);
}

function metaObjectKey(fileId: string): string {
  return prefixKey(`${normalizeFileId(fileId)}/meta.json`);
}

export async function ensureS3Ready(): Promise<boolean> {
  if (!isS3Configured()) return false;
  try {
    await s3Client().send(new HeadBucketCommand({ Bucket: BUCKET }));
    return true;
  } catch {
    return false;
  }
}

interface FileMetaParsed {
  contentType: string;
  size: number;
}

async function readMetaFromS3(fileId: string): Promise<FileMetaParsed | null> {
  try {
    const res = await s3Client().send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: metaObjectKey(fileId),
      })
    );
    const body = res.Body;
    if (!body) return null;
    const raw = await body.transformToString();
    const parsed = JSON.parse(raw) as {
      contentType?: unknown;
      size?: unknown;
    };
    const contentType =
      typeof parsed.contentType === "string"
        ? parsed.contentType
        : "application/octet-stream";
    const size = typeof parsed.size === "number" ? parsed.size : 0;
    return { contentType, size };
  } catch (e: unknown) {
    if (isNotFoundError(e)) return null;
    throw e;
  }
}

function isNotFoundError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const name = "name" in e && typeof e.name === "string" ? e.name : "";
  return name === "NoSuchKey" || name === "NotFound";
}

export async function uploadFileToS3(
  fileId: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const ct =
    contentType?.trim() || "application/octet-stream";
  const size = buffer.length;
  const c = s3Client();
  await c.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: blobObjectKey(fileId),
      Body: buffer,
      ContentType: ct,
    })
  );
  await c.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: metaObjectKey(fileId),
      Body: JSON.stringify({ contentType: ct, size }, null, 0),
      ContentType: "application/json",
    })
  );
}

/**
 * Stream file from S3, or return null if missing. Supports Range like disk storage.
 */
export async function getFileFromS3(
  fileId: string,
  rangeHeader?: string | null
): Promise<Response | null> {
  const meta = await readMetaFromS3(fileId);
  if (!meta) return null;

  const fileSize = meta.size;
  const contentType = meta.contentType || "application/octet-stream";
  const parsed = parseRangeHeader(rangeHeader ?? null, fileSize);

  if (!parsed.ok) {
    const res = await s3Client().send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: blobObjectKey(fileId),
      })
    );
    const body = res.Body;
    if (!body) return null;
    const web = body.transformToWebStream();
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
  const rangeVal = `bytes=${start}-${end}`;
  const res = await s3Client().send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: blobObjectKey(fileId),
      Range: rangeVal,
    })
  );
  const body = res.Body;
  if (!body) return null;
  const web = body.transformToWebStream();

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

export async function deleteFileFromS3(fileId: string): Promise<void> {
  try {
    await s3Client().send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: {
          Objects: [
            { Key: blobObjectKey(fileId) },
            { Key: metaObjectKey(fileId) },
          ],
        },
      })
    );
  } catch (e) {
    console.error(`S3 delete failed for ${fileId}:`, e);
  }
}
