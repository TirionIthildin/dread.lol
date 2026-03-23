# Migrating uploads from SeaweedFS to `FILE_STORAGE_PATH`

Production may still have profile URLs like `/api/files/3,0123456789` pointing at SeaweedFS. The app serves from disk first, then falls back to Seaweed when `SEAWEED_MASTER_URL` is set.

## Goal

Copy every legacy blob into the volume using the **same file id** so MongoDB URLs do not need editing.

On-disk layout per id:

```text
{FILE_STORAGE_PATH}/{normalizedId}/blob
{FILE_STORAGE_PATH}/{normalizedId}/meta.json
```

`meta.json` contains `{ "contentType": "<mime>", "size": <number> }`.

## Steps

1. **Deploy** the new app with `FILE_STORAGE_PATH` set and the uploads volume mounted (see `docker-compose.coolify.yml`). Keep `SEAWEED_MASTER_URL` until migration finishes so missing files still load.

2. **Inventory** unique `/api/files/...` paths from MongoDB (profiles, `gallery_items`, `profile_templates`, `profile_versions`, badges, etc.). A practical approach is a one-off script using `DATABASE_URL` that walks relevant collections and string fields, or export from Compass/aggregation.

3. **For each id** (legacy `volumeId,hex` or already on disk):

   - `GET` the file with the app’s `Authorization` cookie **or** call the internal Seaweed volume URL while Seaweed still runs.
   - Write `blob` bytes and `meta.json` under `{FILE_STORAGE_PATH}/{normalizedId}/` (see `normalizeFileId` in `lib/file-id.ts`).

4. **Verify** a sample of URLs (browser or `curl`) return `200` with correct `Content-Type` and no Seaweed fallback.

5. **Remove Seaweed** from the stack and unset `SEAWEED_MASTER_URL` / `SEAWEED_VOLUME_PUBLIC_URL` when disk hits are complete.

## Notes

- Multi-instance deployments must share one `FILE_STORAGE_PATH` (NFS or replicated volume) or all replicas must see the same files.
- Back up the `uploads_data` (or equivalent) volume with MongoDB restores.
