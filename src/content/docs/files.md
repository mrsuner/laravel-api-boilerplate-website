---
title: File Uploads
description: Two-phase uploads with TTL-based cleanup, local or S3.
section: API Surface
order: 4
---

# File Uploads

A two-phase upload module with TTL-based cleanup, built for headless API
clients that upload first, then commit the file id to a parent record.
Defaults to private visibility on the `local` disk; works unchanged with
`s3` or any Laravel filesystem.

## How it works

1. Client uploads → the API returns a record with `expires_at` set in the
   future.
2. Client persists the id on a parent record (e.g. `user.avatar_file_id`).
3. The app calls `FileService::claim($id)` to clear `expires_at`, marking
   the file persistent.
4. Files left unclaimed past their TTL are deleted by the hourly
   `files:cleanup` command.

## Defaults

| | |
|---|---|
| Disk | `local` (use `s3` for production) |
| Visibility | `private` |
| TTL | 24 h (1440 min) |
| Anonymous upload | disabled |
| Max size | 10 MB |
| Cleanup | hourly |
| Rate limit | 60/min authenticated, 5 / 5 min anonymous |

## Configuration

```php
'files' => [
    'enabled' => env('FILES_ENABLED', true),
    'disk' => env('FILES_DISK', 'local'),
    'visibility' => env('FILES_DEFAULT_VISIBILITY', 'private'),
    'path_template' => env('FILES_PATH_TEMPLATE', 'uploads/{Y}/{m}'),
    'allow_anonymous_upload' => env('FILES_ALLOW_ANONYMOUS_UPLOAD', false),
    'default_expires_after_minutes' => env('FILES_DEFAULT_EXPIRES_AFTER_MINUTES', 1440),
    'max_size_kb' => env('FILES_MAX_SIZE_KB', 10240),
    'allowed_mime_types' => null,   // null = allow all
    'allowed_extensions' => null,
    'cleanup' => ['enabled' => env('FILES_CLEANUP_ENABLED', true)],
],
```

`default_expires_after_minutes = 0` skips TTL entirely. `enabled = false`
makes all file routes return `404`.

## Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/files` | optional* | Upload; returns `{ id, expires_at, ... }`. |
| GET | `/files/{file}` | required | Metadata (uploader-only for private). |
| GET | `/files/{file}/download` | required | Stream the file. |
| DELETE | `/files/{file}` | required | Soft-delete + remove from disk. |
| GET | `/me/files` | required | List files owned by the caller. |

\* Anonymous uploads only when `allow_anonymous_upload` is true. Such files
are write-only over HTTP — operate on them server-side via `FileService`.

### `GET /me/files` query params

`claimed` (default `true`), `visibility`, `q` (matches `client_name`),
`sort` (`-created_at` default, `size`), `per_page` (1–100), `page`.
Returns the standard paginated envelope.

### Upload example

```bash
curl -X POST http://localhost/api/v1/files \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/photo.jpg" \
  -F "visibility=private"
```

```json
{
  "data": {
    "id": "01HXABCD...",
    "client_name": "photo.jpg",
    "mime_type": "image/jpeg",
    "size": 248123,
    "is_claimed": false,
    "expires_at": "2026-05-11T05:00:00+00:00",
    "download_url": "http://localhost/api/v1/files/01HXABCD.../download"
  }
}
```

## Claim / release

```php
$file->claim();      // expires_at = null (persistent)
$file->release();    // re-attach TTL
$file->isClaimed();

// Via the service
$files = app(\App\Services\Files\FileService::class);
$files->claim('01HX...');
$files->claimMany(['01H...', $model]);
$files->delete($file);
```

Typical controller flow: claim the new file, release the old one (cron
removes it later), persist the new id.

## Cleanup

```bash
php artisan files:cleanup            # delete expired
php artisan files:cleanup --dry-run  # preview
```

Scheduled hourly. It scans rows where `expires_at <= now()`, removes the
file from disk (idempotent), and force-deletes the row. Claimed files
(`expires_at = null`) are never touched.

## S3

Add an `s3` disk in `config/filesystems.php`, then set `FILES_DISK=s3`.
`Storage::download()` proxies through the app — safe and simple. For
direct-to-S3 distribution, return a `Storage::temporaryUrl(...)` redirect
from `FileController::download()`.
