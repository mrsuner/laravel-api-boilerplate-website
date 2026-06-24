---
title: The ApiKeyService API
description: create, resolve, revoke and rotate — the single public entry point, plus the CreatedKey value object.
section: Usage
order: 2
---

# The ApiKeyService API

`ApiKeyService` is the single public entry point, bound as a singleton. Resolve
it with `app(ApiKeyService::class)` or inject it.

```php
use Mrsuner\ApiKeys\Services\ApiKeyService;

$service = app(ApiKeyService::class);
```

## create

```php
$created = $service->create($user, [
    'name'        => 'Production server',
    'environment' => 'live',                          // default 'live'
    'abilities'   => ['read:orders', 'write:orders'], // null = superkey
    'rate_limit'  => ['max_attempts' => 1000, 'decay_seconds' => 3600],
    'expires_at'  => now()->addYear(),                // null = never
]);
```

Returns a `CreatedKey` value object:

```php
final class CreatedKey
{
    public string $plaintext;  // sk_live_… — show ONCE, never stored
    public ApiKey $model;      // the persisted row
}
```

The `plaintext` is the only time the full key exists in cleartext. Only its
SHA-256 hash is stored. `create()` emits an `api_key.created` audit event and
throws `InvalidArgumentException` when `environment` is not in the configured
list.

## resolve

```php
$key = $service->resolve($bearer);   // ?ApiKey
```

Parses the prefix and environment, hashes the token segment, and looks it up by
the unique `key_hash` index — a single indexed read with **no side effects**.
Returns `null` for an unknown key or a malformed string. Usability is the
caller's decision via `ApiKey::isUsable()`; the `api.key` middleware does this
for you.

## revoke

```php
$service->revoke($key, reason: 'leaked');
```

Sets `is_active = false` and `revoked_at = now()`, taking effect within the same
request. Emits `api_key.revoked` (the `reason` is recorded in metadata; the hash
never is).

## rotate

```php
// Immediate: the old key dies at once.
$new = $service->rotate($key);

// Overlap: the old key stays valid until the window closes.
$new = $service->rotate($key, overlapUntil: now()->addHour());
```

`rotate()` creates a new key inheriting the old one's name, environment,
abilities, rate limit and expiry, then either revokes the old key immediately or
sets its `revoked_at` to the future overlap timestamp (keeping it usable until
then). Returns the new `CreatedKey` and emits `api_key.rotated`.

> **The overlap window** lets clients migrate to a new key with zero downtime:
> deploy the new key, let traffic drain off the old one, and it self-revokes when
> the window passes — no second deploy needed.

## Audit events

| Event                   | Trigger                          |
| ----------------------- | -------------------------------- |
| `api_key.created`       | New key generated                |
| `api_key.revoked`       | Key revoked (user or service)    |
| `api_key.rotated`       | Key rotated                      |
| `api_key.updated`       | Key metadata updated             |
| `api_key.admin_revoked` | Admin revoked a user's key       |
| `api_key.expired`       | Pruning command found expired    |

Every event carries `key_prefix` in metadata. The `key_hash` and plaintext key
are never logged. Events are emitted through the host's `audit_log()` helper when
present, and are a no-op otherwise.

Continue with [User API & tracking](/packages/laravel-api-keys/user-api).
