/**
 * S3-compatible object storage for user uploads (AWS S3, Cloudflare R2, MinIO, etc.).
 * Configure S3_BUCKET + region; optional S3_ENDPOINT. Use S3_UPLOAD_PREFIX or S3_KEY_PREFIX
 * for a path prefix inside the bucket (default: uploads).
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import type { FileUploadResult } from "@/lib/file-storage-types";
import { normalizeFileId } from "@/lib/file-id";
import { logger } from "@/lib/logger";
import { parseRangeHeader } from "@/lib/file-range";

let client: S3Client | null = null;

function bucket(): string {
  return process.env.S3_BUCKET?.trim() ?? "";
}

function region(): string {
  return (
    process.env.S3_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    ""
  );
}

/** Prefer S3_UPLOAD_PREFIX; S3_KEY_PREFIX is an alias (main branch name). */
function uploadPrefix(): string {
  const p =
    process.env.S3_UPLOAD_PREFIX?.trim() ||
    process.env.S3_KEY_PREFIX?.trim() ||
    "uploads";
  return p.replace(/\/+$/, "");
}

export function isS3Configured(): boolean {
  return bucket().length > 0 && region().length > 0;
}

function getS3Client(): S3Client {
  if (client) return client;
  const endpoint = process.env.S3_ENDPOINT?.trim() || undefined;
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  client = new S3Client({
    region: region(),
    endpoint,
    forcePathStyle,
    ...(accessKeyId && secretAccessKey
      ? {
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        }
      : {}),
  });
  return client;
}

export function objectKeyForFileId(fileId: string): string {
  return `${uploadPrefix()}/${normalizeFileId(fileId)}/blob`;
}

function isNotFound(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    e.name === "NoSuchKey" ||
    e.name === "NotFound" ||
    e.$metadata?.httpStatusCode === 404
  );
}

function summarizeS3Error(e: unknown): Record<string, unknown> {
  if (typeof e !== "object" || e === null) {
    return { message: String(e) };
  }
  const err = e as {
    name?: string;
    message?: string;
    $metadata?: { httpStatusCode?: number; requestId?: string };
  };
  return {
    name: err.name,
    message: err.message?.slice(0, 400),
    httpStatusCode: err.$metadata?.httpStatusCode,
    requestId: err.$metadata?.requestId,
  };
}

/**
 * Prefer AWS SDK's transformToWebStream for GetObject bodies; Readable.toWeb(sdkStream)
 * can throw TypeError: controller[kState].transformAlgorithm is not a function in Node/Next.
 */
function sdkBodyToWebStream(body: unknown): ReadableStream<Uint8Array> {
  if (
    body &&
    typeof body === "object" &&
    typeof (body as { transformToWebStream?: () => ReadableStream<Uint8Array> })
      .transformToWebStream === "function"
  ) {
    return (body as { transformToWebStream: () => ReadableStream<Uint8Array> }).transformToWebStream();
  }
  return Readable.toWeb(body as Readable) as ReadableStream<Uint8Array>;
}

/**
 * Verify PutObject + DeleteObject on the upload prefix (matches real upload IAM; avoids HeadBucket-only policies).
 */
export async function ensureS3Ready(): Promise<boolean> {
  if (!isS3Configured()) return false;

  const b = bucket();
  const probeKey = `${uploadPrefix()}/.probe/${crypto.randomUUID()}`;
  logger.debug("FILE_STORAGE", "S3 readiness probe starting", {
    bucket: b,
    region: region(),
    endpointConfigured: Boolean(process.env.S3_ENDPOINT?.trim()),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    hasExplicitCredentials: Boolean(
      process.env.AWS_ACCESS_KEY_ID?.trim() &&
        process.env.AWS_SECRET_ACCESS_KEY?.trim()
    ),
    probeKeySuffix: probeKey.split("/").slice(-2).join("/"),
  });

  try {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: b,
        Key: probeKey,
        Body: Buffer.from("1"),
        ContentLength: 1,
        ContentType: "application/octet-stream",
      })
    );
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: b,
        Key: probeKey,
      })
    );
    logger.debug("FILE_STORAGE", "S3 readiness probe succeeded", { bucket: b });
    return true;
  } catch (e) {
    const summary = summarizeS3Error(e);
    logger.warn("FILE_STORAGE", "S3 readiness probe failed", {
      bucket: b,
      region: region(),
      ...summary,
      ...(summary.name === "LocationConstraintConflict"
        ? {
            hint: "Region must match your provider (e.g. Hetzner: fsn1/nbg1/hel1 from the bucket endpoint, not AWS names like eu-central).",
          }
        : {}),
    });
    return false;
  }
}

export async function uploadToS3(
  buffer: Buffer,
  contentType: string
): Promise<FileUploadResult> {
  const fid = crypto.randomUUID();
  const key = objectKeyForFileId(fid);
  const ct = contentType?.trim() || "application/octet-stream";
  const size = buffer.length;
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: buffer,
      ContentType: ct,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return {
    fid,
    path: `/api/files/${fid}`,
    size,
  };
}

export async function getFromS3(
  fileId: string,
  rangeHeader?: string | null
): Promise<Response | null> {
  if (!isS3Configured()) return null;
  const key = objectKeyForFileId(fileId);
  try {
    const hasRange =
      typeof rangeHeader === "string" && rangeHeader.startsWith("bytes=");

    if (!hasRange) {
      const full = await getS3Client().send(
        new GetObjectCommand({ Bucket: bucket(), Key: key })
      );
      if (!full.Body) return null;
      const fileSize = full.ContentLength ?? 0;
      const baseContentType =
        full.ContentType?.trim() || "application/octet-stream";
      const stream = sdkBodyToWebStream(full.Body);
      return new Response(stream, {
        status: 200,
        headers: {
          "content-type": baseContentType,
          "content-length": String(fileSize),
          "accept-ranges": "bytes",
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    }

    const head = await getS3Client().send(
      new HeadObjectCommand({ Bucket: bucket(), Key: key })
    );
    const fileSize = head.ContentLength ?? 0;
    const baseContentType =
      head.ContentType?.trim() || "application/octet-stream";

    const parsed = parseRangeHeader(rangeHeader ?? null, fileSize);

    if (!parsed.ok) {
      const full = await getS3Client().send(
        new GetObjectCommand({ Bucket: bucket(), Key: key })
      );
      if (!full.Body) return null;
      const stream = sdkBodyToWebStream(full.Body);
      return new Response(stream, {
        status: 200,
        headers: {
          "content-type": baseContentType,
          "content-length": String(fileSize),
          "accept-ranges": "bytes",
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    }

    const { start, end } = parsed;
    const ranged = await getS3Client().send(
      new GetObjectCommand({
        Bucket: bucket(),
        Key: key,
        Range: `bytes=${start}-${end}`,
      })
    );
    if (!ranged.Body) return null;
    const chunkSize = end - start + 1;
    const stream = sdkBodyToWebStream(ranged.Body);
    const contentRange =
      ranged.ContentRange ?? `bytes ${start}-${end}/${fileSize}`;
    return new Response(stream, {
      status: 206,
      headers: {
        "content-type": baseContentType,
        "content-length": String(chunkSize),
        "content-range": contentRange,
        "accept-ranges": "bytes",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    if (isNotFound(e)) return null;
    throw e;
  }
}

export async function deleteFromS3(fileId: string): Promise<void> {
  if (!isS3Configured()) return;
  const key = objectKeyForFileId(fileId);
  try {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: bucket(),
        Key: key,
      })
    );
  } catch (e) {
    if (isNotFound(e)) return;
    throw e;
  }
}
