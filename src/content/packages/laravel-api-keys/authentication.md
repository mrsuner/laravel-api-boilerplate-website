---
title: Authenticating requests
description: The api.key and api.ability middleware, abilities, per-key rate limits and the Sanctum fall-through.
section: Usage
order: 1
---

# Authenticating requests

## The middleware

Add `api.key` ahead of `auth:sanctum`. The package registers both aliases
automatically, so routes can opt in with no `bootstrap/app.php` changes:

```php
use Illuminate\Support\Facades\Route;

Route::middleware(['api.key', 'auth:sanctum'])->group(function () {
    Route::get('/orders', OrderController::class)
        ->middleware('api.ability:read:orders');
});
```

`api.key` resolves the incoming bearer key, checks that it is usable, applies the
per-key rate limit, then sets the owning user on the request. `auth:sanctum`
then sees an authenticated user and lets the request continue.

## Coexisting with Sanctum tokens

`api.key` only acts on bearer tokens that start with your configured prefix
(`sk_`). Anything else — including Sanctum's own personal access tokens — falls
straight through to the next middleware. The same route can therefore serve both
credential types:

```
Authorization: Bearer sk_live_A3F9K2…   → resolved as an API key
Authorization: Bearer 7|abcdef…          → handled by auth:sanctum
```

## Abilities

Abilities mirror Sanctum's `tokenCan()` semantics. The `api.ability` middleware
checks the resolved key:

```php
Route::get('/orders', OrderController::class)
    ->middleware(['api.key', 'api.ability:read:orders']);
```

- A key with `abilities = null` is a **superkey** — every ability passes.
- A key whose abilities include `*` also passes everything.
- An insufficient key returns `403`.
- If the request was authenticated by Sanctum (no resolved API key), the check
  is skipped — so a route shared with Sanctum tokens still works.

Inside a controller the resolved key is available for inspection:

```php
$key = $request->attributes->get('api_key');   // Mrsuner\ApiKeys\Models\ApiKey
$key->can('write:orders');
```

## Per-key rate limits

Each key carries an effective rate limit — its own `rate_limit` column, or the
global default from config. When the limit is exceeded the middleware responds
`429` with a `Retry-After` header:

```json
{ "message": "Rate limit exceeded." }
```

Set a per-key override at creation time:

```php
$service->create($user, [
    'name'       => 'CI pipeline',
    'rate_limit' => ['max_attempts' => 100, 'decay_seconds' => 60],
]);
```

## Usability rules

A key authenticates only when **all** of the following hold (`ApiKey::isUsable()`):

- `is_active` is true, and
- it has not expired (`expires_at` is null or in the future), and
- it is not past revocation — `revoked_at` is null **or in the future**.

The "or in the future" clause is what powers the rotation overlap window: a key
whose `revoked_at` is set to a future timestamp is still usable until then. See
[The ApiKeyService API](./api-key-service).

Continue with [The ApiKeyService API](./api-key-service).
