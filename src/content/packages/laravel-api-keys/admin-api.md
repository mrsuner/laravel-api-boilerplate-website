---
title: Admin API
description: IP- and ability-gated endpoints to list, inspect and revoke any user's keys.
section: Admin API
order: 1
---

# Admin API

The admin endpoints operate across **all** users' keys. They mount under the
configured prefix (default `internal/admin/v1`) and the admin middleware stack.

| Method & path                                       | Action                   |
| --------------------------------------------------- | ------------------------ |
| `GET    /internal/admin/v1/api-keys`                | List all keys            |
| `GET    /internal/admin/v1/api-keys/{key}`          | Key detail + usage stats |
| `DELETE /internal/admin/v1/api-keys/{key}`          | Revoke any key           |
| `GET    /internal/admin/v1/users/{user}/api-keys`   | All keys for a user      |

## Middleware stack

The stack is resolved from `api-keys.admin_route.middleware`. With its default
`null` value the package **auto-detects** the host:

- **On the boilerplate** — when `App\Http\Middleware\InternalIpWhitelist` is
  present, the full stack is applied: `throttle:60,1` + IP whitelist +
  `auth:sanctum` + `ability:admin`. Requests from outside
  `ADMIN_ALLOWED_CIDRS` get `403`.
- **Standalone** — falls back to `['auth:sanctum']`.

Provide an explicit array to take full control, and toggle the whole group with
`api-keys.admin_route.enabled` (also gated by the host's
`boilerplate.admin.enabled` switch when defined).

## Secrets are never exposed

Admin endpoints return only `key_prefix`, metadata and usage stats — never the
plaintext key or `key_hash`. The hash lives in the model's `$hidden` array and
appears in no resource, response body or audit entry.

## Detail + usage

```json
GET /internal/admin/v1/api-keys/{key}
{
  "data": {
    "api_key": { /* ApiKeyResource — masked */ },
    "usage": {
      "request_count": 14832,
      "last_used_at": "2026-06-24T10:00:00Z",
      "last_used_ip": "100.64.0.10",
      "top_endpoints": [ { "endpoint": "/v1/orders", "count": 9200 } ],
      "recent_logs": [ /* last 20 entries */ ]
    }
  }
}
```

## Revocation

```
DELETE /internal/admin/v1/api-keys/{key}   → 204 No Content
```

Admin revocation calls `ApiKeyService::revoke($key, reason: 'admin_revoked')` and
additionally emits an `api_key.admin_revoked` audit event recording the acting
admin's id alongside the key's `key_prefix`.
