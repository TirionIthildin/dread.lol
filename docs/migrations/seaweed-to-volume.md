# Historical: migrating uploads from SeaweedFS to `FILE_STORAGE_PATH`

**Status:** The app no longer reads from SeaweedFS. Legacy blobs must exist on disk under `FILE_STORAGE_PATH` (same layout as below) or `/api/files/...` will 404.

Previously, production could have profile URLs like `/api/files/3,0123456789` backed only by SeaweedFS. Operators copied those blobs onto the volume before removing Seaweed.

## On-disk layout per id

```text
{FILE_STORAGE_PATH}/{normalizedId}/blob
{FILE_STORAGE_PATH}/{normalizedId}/meta.json
```

`meta.json` contains `{ "contentType": "<mime>", "size": <number> }`.

## Reference steps (completed migration)

1. Deploy with `FILE_STORAGE_PATH` set and the uploads volume mounted (see `docker-compose.coolify.yml`).
2. Inventory unique `/api/files/...` paths from MongoDB (profiles, `gallery_items`, `profile_templates`, `profile_versions`, badges, etc.).
3. For each id, copy bytes into `blob` and write `meta.json` under `{FILE_STORAGE_PATH}/{normalizedId}/` (see `normalizeFileId` in `lib/file-id.ts`).
4. Verify URLs return `200` with correct `Content-Type`.

## Notes

- Multi-instance deployments must share one `FILE_STORAGE_PATH` (NFS or replicated volume) or all replicas must see the same files.
- Back up the `uploads_data` (or equivalent) volume with MongoDB restores.
