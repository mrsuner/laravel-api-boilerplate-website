---
title: Internal Admin Module
description: A self-contained, IP- and token-gated management API for internal tooling.
section: Internal Admin
order: 1
---

# Internal Admin Module

A self-contained set of management endpoints under `/internal/admin/v1/`,
designed to be consumed by a unified admin dashboard or any authorised
internal tooling. It reuses what the boilerplate already ships — the `users`
table, Sanctum tokens, Laratrust roles and the audit log — and adds **no new
identity tables**. A user is an admin when they hold the Laratrust `admin`
role.

The whole module is toggled from config: set `ADMIN_ENABLED=false` and every
route disappears (any request 404s) without touching application code.

## Two mandatory protections

Every endpoint sits behind two layers, applied in order:

1. **IP whitelist** — the request IP must fall inside one of the configured
   CIDR ranges (the [Tailscale](https://tailscale.com) CGNAT range
   `100.64.0.0/10` by default). Rejected requests get `403` and are written
   to the audit log.
2. **Admin-scoped Sanctum token** — every route except `auth/login` requires
   a bearer token carrying the `admin` ability. A missing token is `401`; a
   token without the ability is `403`.

There is intentionally **no role check on the protected routes** — admin
identity is proven once at login (which verifies the `admin` role before
issuing the token), and the token's `admin` ability gates everything after.

## Configuration

```php
// config/boilerplate.php
'admin' => [
    'enabled' => env('ADMIN_ENABLED', true),
    'ip_whitelist' => [
        'enabled' => env('ADMIN_IP_WHITELIST_ENABLED', true),
        // Comma-separated CIDRs; empty string allows all IPs.
        'cidrs' => array_filter(
            explode(',', env('ADMIN_ALLOWED_CIDRS', '100.64.0.0/10'))
        ),
    ],
    'token_ability' => 'admin',
    'token_ttl_hours' => env('ADMIN_TOKEN_TTL_HOURS', 8),
    // Runtime-toggleable keys exposed by the config endpoint.
    'config_whitelist' => [
        'auth.otp_auth_enabled',
        'auth.password_auth_enabled',
        'audit.enabled',
    ],
],
```

```dotenv
# .env
ADMIN_ENABLED=true
ADMIN_IP_WHITELIST_ENABLED=true
# Tailscale CGNAT range. Comma-separated. Leave empty to disable the IP check.
ADMIN_ALLOWED_CIDRS=100.64.0.0/10
ADMIN_TOKEN_TTL_HOURS=8
```

Set `ADMIN_IP_WHITELIST_ENABLED=false` for local development behind a
different network. Set `ADMIN_ALLOWED_CIDRS` to multiple ranges with commas,
e.g. `100.64.0.0/10,10.0.0.0/8`.

## Endpoints

All paths are prefixed with `/internal/admin/v1`. Every endpoint additionally
requires the internal IP whitelist; the **Token** column shows whether an
`admin`-scoped Sanctum token is also required.

| Method | Endpoint | Token | Description |
|---|---|---|---|
| POST | `/auth/login` | — | Authenticate an admin; returns an admin-scoped token |
| POST | `/auth/logout` | admin | Revoke the current session token |
| GET | `/auth/me` | admin | The authenticated admin's profile |
| GET | `/users` | admin | List users (filter by `search`, `is_active`, `role`) |
| GET | `/users/{user}` | admin | User detail + 10 most recent audit entries |
| PATCH | `/users/{user}/ban` | admin | Deactivate the account and revoke all its tokens |
| PATCH | `/users/{user}/unban` | admin | Reactivate the account |
| PUT | `/users/{user}/roles` | admin | Replace the user's full set of roles |
| POST | `/users/{user}/roles/{role}` | admin | Assign a single role |
| DELETE | `/users/{user}/roles/{role}` | admin | Revoke a single role |
| GET | `/users/{user}/audit-logs` | admin | Paginated audit logs for one user |
| GET | `/roles` | admin | All roles with their permissions |
| GET | `/permissions` | admin | All permissions |
| GET | `/audit-logs` | admin | List audit logs (filter by `user_id`, `event`, `from`, `to`) |
| GET | `/audit-logs/{log}` | admin | A single audit log entry |
| GET | `/health` | admin | Liveness probe for core dependencies |
| GET | `/config` | admin | Read the whitelisted runtime config |
| PUT | `/config` | admin | Toggle whitelisted runtime config |

Responses use the standard [API envelope](/docs/api-responses); paginated
lists return the `{ data, meta, links }` shape. The routes are throttled at
60 requests/minute.

## Login

```bash
curl -X POST https://your-app/internal/admin/v1/auth/login \
  -H 'Accept: application/json' \
  -d email=admin@example.com -d password=secret
```

```json
{
  "data": {
    "access_token": "12|xxxxxxxx...",
    "expires_at": "2026-06-24T18:00:00+00:00",
    "user": { "id": "...", "email": "admin@example.com", "roles": ["admin"] }
  }
}
```

Login is deliberately opaque: a wrong password and a non-admin account both
return the same `401 Invalid credentials.` — only an inactive admin account
is distinguished (`403 Account is inactive.`). Each login revokes any prior
`admin-session` tokens for that user, so a successful login is a fresh
session. The token expires after `token_ttl_hours`.

Use the returned token as a bearer token on every other call:

```bash
curl https://your-app/internal/admin/v1/auth/me \
  -H 'Accept: application/json' -H 'Authorization: Bearer 12|xxxxxxxx...'
```

## User management

`ban` flips `is_active` to `false` **and** deletes every Sanctum token the
user holds, immediately ending their sessions. Admins are protected: you
cannot ban another admin, cannot sync roles onto an admin, and cannot revoke
your own `admin` role — each returns `422`. Role names are validated against
the `roles` table; unknown roles are rejected (`422` on sync, `404` on
assign). Roles and permissions themselves are read-only here — manage them
via [RBAC](/docs/rbac) config and the seeder.

## Health

`GET /health` checks four dependencies and returns `200` when all pass or
`503` if any fail:

```json
{
  "data": {
    "status": "ok",
    "checks": {
      "database": "ok",
      "cache": "ok",
      "queue": "ok",
      "storage": "ok"
    },
    "timestamp": "2026-06-24T10:00:00+00:00"
  }
}
```

## Runtime config

`GET /config` returns the admin-safe subset of runtime config (the
`config_whitelist` keys); `PUT /config` toggles them. Only boolean,
explicitly-whitelisted keys are accepted — secrets are never exposed.

> **Note:** config changes are in-memory only and do **not** persist across
> restarts. Durable runtime config is intentionally out of scope for v1.

## Audit events

Every mutating action records an event via the [audit log](/docs/audit):

| Event | Trigger |
|---|---|
| `admin.login` | Successful admin login |
| `admin.logout` | Admin token revoked |
| `admin.ip_rejected` | Request blocked by the IP whitelist |
| `admin.user.banned` / `admin.user.unbanned` | User (de)activated |
| `admin.user.roles_synced` | Roles replaced |
| `admin.user.role_assigned` / `admin.user.role_revoked` | Single role changed |
| `admin.config.updated` | Runtime config changed |

## Out of scope (v1)

The admin **UI** lives in the external dashboard — this module is API-only.
Admin users are promoted by assigning the `admin` role, not created here, and
2FA for admin login is a separate roadmap item.
