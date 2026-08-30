---
title: Installation
description: Install the package, publish its config and run the migrations.
section: Overview
order: 2
---

# Installation

## Requirements

- PHP `^8.2`
- Laravel `^11.0 | ^12.0`
- `laravel/sanctum` — a resolved key authenticates through the Sanctum guard

The package works in any Laravel application. Installed on top of the Laravel
API Boilerplate it auto-wires into the existing admin stack and audit log.

## Install

```bash
composer require mrsuner/laravel-api-keys
php artisan vendor:publish --tag=api-keys-config   # optional
php artisan migrate
```

The service provider is auto-discovered. It binds the `ApiKeyService` singleton,
registers the migrations, mounts the user and admin routes, and registers the
`api.key` and `api.ability` middleware aliases — so you do **not** need to edit
`bootstrap/app.php`.

## What gets installed

Two migrations are published into your schema:

- `api_keys` — one row per key: its owner (`user_id`), `name`, the plaintext
  `key_prefix` for display, the `key_hash` (SHA-256 of the token), `environment`,
  `abilities`, an optional per-key `rate_limit`, `expires_at`, the `is_active`
  flag, `revoked_at`, usage counters (`last_used_at`, `last_used_ip`,
  `request_count`), timestamps and soft deletes.
- `api_key_usage_logs` — one row per request (when usage logging is enabled):
  `method`, normalized `endpoint`, `ip`, `status_code` and `response_time_ms`.

> The `user_id` column is a `foreignUlid` so it matches the boilerplate's
> ULID-keyed `users` table. On a standard integer-keyed app, point
> `api-keys.user_model` at your `User` model and adjust the column type to suit.

## Verify

```bash
php artisan migrate:status
```

You should see the two API-key migrations applied. Resolve the service anywhere
to confirm the binding:

```php
$keys = app(\Mrsuner\ApiKeys\Services\ApiKeyService::class);
```

Continue with [Configuration](./configuration).
