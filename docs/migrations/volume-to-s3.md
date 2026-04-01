# Migrating uploads from disk (`FILE_STORAGE_PATH`) to S3

Production may still have blobs only on a Docker volume under `FILE_STORAGE_PATH`. The app uses the **same object layout** on S3 as on disk so MongoDB URLs (`/api/files/{id}`) stay valid.

## Object layout

For each file id (normalized; see `normalizeFileId` in `lib/file-id.ts`):

```text
{blob key}   = [S3_KEY_PREFIX/]{normalizedId}/blob
{meta key}   = [S3_KEY_PREFIX/]{normalizedId}/meta.json
```

`meta.json` is JSON: `{ "contentType": "<mime>", "size": <number> }`.

## Steps

1. **Create** a private S3 bucket (or compatible bucket) and IAM policy allowing `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` (for `HeadBucket` / readiness) on that bucket and prefix.

2. **Sync** from the volume to the bucket, preserving paths. Example (adjust `SOURCE` and bucket/prefix):

   ```bash
   aws s3 sync "$SOURCE/" "s3://YOUR_BUCKET/YOUR_PREFIX/" --exclude "*" --include "*/blob" --include "*/meta.json"
   ```

   If you used no prefix on disk, sync each top-level id folder so keys become `{id}/blob` and `{id}/meta.json`.

3. **Deploy** with `S3_BUCKET`, `AWS_REGION` (or `S3_REGION`), and credentials (or instance/task role). Set `S3_KEY_PREFIX` if you used a prefix in the bucket.

4. **Overlap (optional):** You can leave `FILE_STORAGE_PATH` mounted briefly; `GET /api/files` tries S3 first, then disk, then optional Seaweed. Unset `FILE_STORAGE_PATH` when S3 is complete.

5. **Verify** a sample of URLs return `200` with correct `Content-Type`.

6. **Remove** the uploads volume and `FILE_STORAGE_PATH` from the stack when satisfied.

## Notes

- **SeaweedFS:** If you still rely on `SEAWEED_MASTER_URL` for legacy ids, keep it until those objects are copied into S3 (same key layout) or retired.
- **Multi-instance:** S3 removes the need for a shared NFS-style volume for uploads.
