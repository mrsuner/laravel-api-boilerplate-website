---
title: Configuration
description: Key prefix, environments, rate limits, usage logging, queue, per-user limits and route wiring.
section: Overview
order: 3
---

# Configuration

Publish the config to override any default:

```bash
php artisan vendor:publish --tag=api-keys-config
```

Every value also has an `.env` override.

## Keys & format

```php
'key_prefix'   => env('API_KEY_PREFIX', 'sk'),     // "sk" → sk_live_…
'environments' => ['live', 'test'],                 // allowed env tags
'token_length' => (int) env('API_KEY_TOKEN_LENGTH', 24),
'user_model'   => env('API_KEY_USER_MODEL', \App\Models\User::class),
```

The middleware only intercepts bearer tokens that begin with `{key_prefix}_`, so
Sanctum's own prefix-less tokens always fall through untouched.

## Rate limiting

```php
'rate_limit' => [
    'default' => [
        'max_attempts'  => (int) env('API_KEY_RATE_LIMIT', 1000),
        'decay_seconds' => (int) env('API_KEY_RATE_DECAY', 3600),
    ],
],
```

This is the global default applied to every key. A key may override it with its
own `rate_limit` column — see [Authentication](/packages/laravel-api-keys/authentication).

## Usage logging

```php
'usage_log' => [
    'enabled'        => (bool) env('API_KEY_USAGE_LOG', true),
    'retention_days' => (int) env('API_KEY_LOG_RETENTION_DAYS', 90),
],
'queue' => env('API_KEY_QUEUE', 'default'),
```

When `enabled` is false, only the aggregate counters on the key row are updated
and no per-request rows are written. `retention_days` is honoured by the
[`api-keys:prune`](/packages/laravel-api-keys/user-api) command. The async
tracking job runs on the configured `queue`.

## Limits

```php
'max_keys_per_user' => env('API_KEY_MAX_PER_USER', 10), // null = unlimited
```

Enforced when a user creates a key through the user-facing API.

## Route wiring

```php
'user_route' => [
    'enabled'    => true,
    'prefix'     => 'v1/api-keys',
    'name'       => 'api-keys.',
    'middleware' => ['auth:sanctum'],
],

'admin_route' => [
    'enabled'    => true,
    'prefix'     => 'internal/admin/v1',
    'name'       => 'admin.api-keys.',
    'middleware' => null,   // null = auto-detect
],
```

`admin_route.middleware` is `null` by default, which **auto-detects** the host:
when the boilerplate's `App\Http\Middleware\InternalIpWhitelist` is present the
full admin stack (`throttle` + IP whitelist + `auth:sanctum` + `ability:admin`)
is applied; otherwise it falls back to `['auth:sanctum']` so the package works on
any Laravel app. Provide an explicit array to take full control.

The admin routes also respect the host's `boilerplate.admin.enabled` master
switch when defined.

Continue with [Authenticating requests](/packages/laravel-api-keys/authentication).
