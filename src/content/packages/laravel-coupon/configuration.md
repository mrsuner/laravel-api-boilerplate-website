---
title: Configuration
description: Code generation, table names, admin route wiring and middleware auto-detection.
section: Overview
order: 3
---

# Configuration

Everything lives in the published `config/coupon.php`.

## Code generation

Used by `CouponService::generate()` / `generateBulk()` when no explicit code is
supplied. The default charset omits ambiguous characters (`O`, `0`, `I`, `1`).

```php
'generation' => [
    'length'  => (int) env('COUPON_CODE_LENGTH', 8),
    'prefix'  => (string) env('COUPON_CODE_PREFIX', ''),
    'suffix'  => (string) env('COUPON_CODE_SUFFIX', ''),
    'charset' => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
],
```

## Table names

Override if these collide with your schema.

```php
'table_names' => [
    'coupon_codes'       => 'coupon_codes',
    'coupon_redemptions' => 'coupon_redemptions',
],
```

## Redeemable morph map

If your app registers a morph map, set the alias for your redeemable model
(e.g. `User`). `null` uses the fully-qualified class name (default Laravel
behaviour).

```php
'redeemable_morph_map' => null,
```

## Admin route wiring

```php
'route' => [
    'enabled'    => true,
    'prefix'     => 'internal/admin/v1',
    'name'       => 'admin.',
    'middleware' => null, // null = auto-detect
],
```

### Middleware auto-detection

When `route.middleware` is `null` (the default), the package picks a stack at
boot:

- If the boilerplate's `App\Http\Middleware\InternalIpWhitelist` class exists,
  it uses the **full boilerplate admin stack**:
  `throttle:60,1` + `InternalIpWhitelist` + `auth:sanctum` + `ability:admin`.
- Otherwise (a plain Laravel app) it falls back to `['auth:sanctum']`.

Provide an explicit array to take full control. The package always appends the
framework's route-model-binding middleware automatically, so implicit binding
works regardless of how the stack is wired.

```php
// Explicit override example
'middleware' => ['auth:sanctum', 'ability:admin'],
```

### Route gate

Admin routes are skipped entirely — every endpoint returns `404` — when:

- `config('coupon.route.enabled')` is `false`, **or**
- the host defines `config('boilerplate.admin.enabled')` and sets it to `false`.

This double gate means a boilerplate install honours its global admin switch,
while a standalone app uses the package's own switch.

## Environment variables

```dotenv
COUPON_CODE_LENGTH=8
COUPON_CODE_PREFIX=
COUPON_CODE_SUFFIX=
```
