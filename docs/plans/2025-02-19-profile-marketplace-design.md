# Profile Marketplace Design

**Date:** 2025-02-19

## Goal

Community-submitted profile templates: users create and share templates that others can apply to their profile. Built-in templates removed.

## Architecture

- **Data:** MongoDB `profile_templates` collection. Templates have creator, name, description, preview, status (draft/published), and a `data` object containing profile fields to apply.
- **Media:** Copy-on-apply for all `/api/files/` URLs—when applying, we fetch each file from SeaweedFS and re-upload to create an independent copy for the applying user. External URLs (Discord CDN, etc.) pass through unchanged.
- **Flow:** Create draft from current profile → edit → publish → others browse marketplace and apply.

## Data Model

| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| creatorId | string | Discord user ID |
| name | string | Template name |
| description | string | Optional |
| previewUrl | string? | Optional preview image |
| data | object | Profile fields (tagline, description, banner, links, display options, media URLs, gallery, etc.) |
| applyCount | number | Default 0 |
| status | "draft" \| "published" \| "unpublished" | |
| createdAt | Date | |
| updatedAt | Date | |

## Media Handling

- Template creation: Creator uploads via existing API (purpose=template or reuse profile purpose).
- Apply: For each media URL in template data that starts with `/api/files/`, fetch via getFile, re-upload via uploadFile, replace URL in applied payload. External URLs unchanged.
- Limits: Reuse existing upload limits. If copy fails (file missing), skip or error per-field.

## Routes

- GET /marketplace — Browse published templates
- GET /marketplace/[id] — Template detail, apply button
- GET /dashboard/marketplace — My templates (create, edit, publish)
- API: /api/marketplace/templates (GET list, POST create), /api/marketplace/templates/[id] (GET, PATCH), /api/marketplace/templates/[id]/apply (POST), publish/unpublish (POST)
