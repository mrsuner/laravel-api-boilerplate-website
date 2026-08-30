---
title: One-Time Password (OTP)
description: Email-based passwordless authentication with swappable storage drivers.
section: Authentication
order: 2
---

# One-Time Password (OTP)

Email-based **passwordless authentication**. The user requests a code,
receives it by email, and exchanges it for a token (app) or session (web).
New users are auto-created on first verify.

## Storage drivers

OTP storage sits behind an `OtpService` contract with two interchangeable
drivers — pick whichever fits your infrastructure without touching the rest
of the auth code.

### Database driver (default)

Stores codes in the `otps` table. Best for simple deployments without
Redis, OTP auditing, and local development.

```bash
OTP_DRIVER=database
```

### Cache driver

Stores codes in Laravel's cache (Redis, Memcached, …). Best for
high-throughput production with an existing Redis stack — TTL expiry is
automatic, no cleanup job needed.

```bash
OTP_DRIVER=cache
OTP_CACHE_STORE=redis
```

## Configuration

```php
'auth' => [
    'otp_auth_enabled' => true,
    'otp_length' => 6,
    'otp_expiry_minutes' => 10,
    'otp_driver' => env('OTP_DRIVER', 'database'),
    'otp_cache_store' => env('OTP_CACHE_STORE'),
],
```

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/{app,web}/otp` | No | Send a code to the email. |
| POST | `/api/v1/auth/{app,web}/otp/verify` | No | Exchange the code for a token / session. |

Both are throttled (`auth-otp_issue`, `auth-otp_verify`) — see
[rate limiting](./rate-limiting).

## What a successful verify does

1. Creates the user if the email isn't registered (fires `Registered`).
2. Marks the email **verified** — OTP delivery already proves ownership.
3. Updates `last_login_at`.
4. Fires the `Login` event.
5. Issues a Sanctum token (app) or logs in the session (web).

## Usage

```bash
# Request a code
curl -X POST http://localhost/api/v1/auth/app/otp \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'

# Verify it
curl -X POST http://localhost/api/v1/auth/app/otp/verify \
  -H "Content-Type: application/json" \
  -d '{ "email": "john@example.com", "token": "123456", "device_name": "iPhone 15 Pro" }'
```

## OTP table

| Column | Description |
|---|---|
| `identifier` | Email address |
| `token` | OTP code |
| `expires_at` | Expiration timestamp |

Only used by the database driver; the cache driver stores nothing in SQL.
