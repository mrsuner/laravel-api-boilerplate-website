---
title: User API & tracking
description: The self-service endpoints, one-time plaintext, async usage tracking and the prune command.
section: Usage
order: 3
---

# User API & tracking

These endpoints let a user manage **their own** keys. They mount under the
configured prefix (default `v1/api-keys`) and the `auth:sanctum` guard.

| Method & path                       | Action                                  |
| ----------------------------------- | --------------------------------------- |
| `GET    /v1/api-keys`               | List own keys (masked)                  |
| `POST   /v1/api-keys`               | Create key — returns plaintext **once** |
| `GET    /v1/api-keys/{key}`         | Show key detail (never the secret)      |
| `PATCH  /v1/api-keys/{key}`         | Update name / abilities / rate_limit    |
| `POST   /v1/api-keys/{key}/rotate`  | Rotate (`overlap_minutes`, default 0)   |
| `DELETE /v1/api-keys/{key}`         | Revoke                                  |
| `GET    /v1/api-keys/{key}/usage`   | Usage stats + recent log entries        |

A user can only act on their own keys; touching another user's key returns
`403`.

## Creating a key

```json
POST /v1/api-keys
{
  "name": "Production server",
  "environment": "live",
  "abilities": ["read:orders", "write:orders"],
  "expires_at": "2027-01-01T00:00:00Z"
}
```

```json
201 Created
{
  "data": {
    "key": "sk_live_A3F9K2MNPQRSTUVWXYZ23",
    "message": "Store this key securely. It will not be shown again.",
    "api_key": { /* ApiKeyResource — masked, no secret */ }
  }
}
```

The `key` field appears **only** in this response and in the rotate response.
Every other endpoint returns `ApiKeyResource`, which exposes the masked
`key_prefix` (`sk_live_A3F9K2MN••••••••`) and never the secret or the hash.

`environment` is immutable after creation, and the `max_keys_per_user` limit is
enforced here (`422` when exceeded).

## Rotating a key

```json
POST /v1/api-keys/{key}/rotate
{ "overlap_minutes": 60 }
```

`overlap_minutes` is optional (`0` = immediate revocation of the old key). The
response has the same shape as creation and returns the new plaintext key once.

## Usage stats

```json
GET /v1/api-keys/{key}/usage
{
  "data": {
    "request_count": 14832,
    "last_used_at": "2026-06-24T10:00:00Z",
    "last_used_ip": "100.64.0.10",
    "top_endpoints": [
      { "endpoint": "/v1/orders", "count": 9200 }
    ],
    "recent_logs": [ /* last 20 entries */ ]
  }
}
```

## Async usage tracking

Usage is recorded in the middleware's `terminate()` hook via the queued
`TrackApiKeyUsage` job, so it **never adds latency to the response**. Each
tracked request:

- updates the key's aggregate counters (`last_used_at`, `last_used_ip`,
  `request_count`), and
- when `api-keys.usage_log.enabled` is true, writes a normalized row to
  `api_key_usage_logs`.

Endpoints are normalized before storage — `/v1/orders/42` becomes
`/v1/orders/{id}` — to keep log cardinality bounded.

## Pruning

Register the prune command in your scheduler:

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('api-keys:prune')->daily();
```

It soft-deletes keys whose `expires_at` has passed, deletes usage logs older
than `api-keys.usage_log.retention_days`, prints a summary, and emits an
`api_key.expired` audit event.

Continue with the [Admin API](./admin-api).
