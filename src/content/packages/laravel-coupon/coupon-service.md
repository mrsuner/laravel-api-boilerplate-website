---
title: The CouponService API
description: generate, generateBulk, validate and redeem — the single public entry point.
section: Usage
order: 1
---

# The CouponService API

`CouponService` is the only entry point your application needs. It is bound as
a singleton, so resolve it from the container:

```php
use Mrsuner\Coupon\Services\CouponService;

$coupons = app(CouponService::class);
// or inject CouponService into a constructor / controller method
```

## generate()

Creates and persists a single coupon code. The `code` is auto-generated when
omitted (see [generation config](./configuration)).

```php
$coupon = $coupons->generate([
    'type'  => 'percent_off',          // free-form string; the package stores, never interprets it
    'value' => ['percent' => 20],      // effect payload
    'name'  => 'Launch promotion',     // optional admin label
    'restrictions' => [                // all optional
        'max_uses'   => 500,           // total redemptions across all users
        'per_user'   => 1,             // redemptions per unique redeemable
        'expires_at' => '2026-12-31T23:59:59Z',
        'min_amount' => 1000,          // minimum transaction value, in cents
    ],
]);
```

Throws `DuplicateCouponCodeException` (an `InvalidArgumentException`) when a
supplied custom `code` already exists.

## generateBulk()

Generates many unique codes sharing the same `type`, `value` and
`restrictions`. When provided, `code` is treated as a **prefix**
(`LAUNCH` → `LAUNCH-A3F9K2`).

```php
$codes = $coupons->generateBulk(50, [
    'code'  => 'LAUNCH',
    'type'  => 'free_months',
    'value' => ['months' => 1],
    'restrictions' => ['per_user' => 1],
]);

// returns Collection<CouponCode>
```

## validate()

Checks whether a code can be redeemed **without** recording anything. Returns
a `ValidationResult` value object.

```php
$result = $coupons->validate('LAUNCH20', $user);

if (! $result->valid) {
    // $result->error is one of the constants below
    // $result->coupon is the matched coupon (null when not found)
}
```

`ValidationResult` error constants:

| Constant | Value | Meaning |
|---|---|---|
| `NOT_FOUND` | `not_found` | No code matches |
| `INACTIVE` | `inactive` | `is_active` is false |
| `EXPIRED` | `expired` | Past `restrictions.expires_at` |
| `EXHAUSTED` | `exhausted` | `times_redeemed >= max_uses` |
| `USER_LIMIT` | `user_limit_reached` | The redeemable hit its `per_user` limit |

The error strings double as translation keys, e.g. `__('coupon.'.$result->error)`.

## redeem()

Validates, records the redemption and fires `CouponRedeemed` — atomically.

```php
$redemption = $coupons->redeem('LAUNCH20', $user, [
    'order_id' => $order->id,   // arbitrary context, stored on the redemption
]);
```

Internally `redeem()`:

1. Calls `validate($code, $redeemable)` and throws
   `CouponNotRedeemableException` if it fails.
2. In a database transaction (with a row lock to prevent overshooting
   `max_uses`): creates the `CouponRedemption` with a `snapshot` of the
   coupon's `type` + `value`, then increments `times_redeemed`.
3. Fires `new CouponRedeemed($coupon, $redeemable, $redemption)` **after** the
   transaction commits.

If the transaction rolls back, no event is fired and no counter moves.

## Exceptions

```text
Mrsuner\Coupon\Exceptions\
├── CouponNotRedeemableException   — thrown by redeem() on invalid code
│     ->getValidationResult(): ValidationResult
│     ->getMessage(): string       — one of the ValidationResult::* constants
└── DuplicateCouponCodeException   — thrown by generate() on code collision
```

Map them in `bootstrap/app.php` for custom HTTP responses:

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (CouponNotRedeemableException $e) {
        return response()->json(['message' => __('coupon.'.$e->getMessage())], 422);
    });
})
```

Next: [wire a redeem endpoint and react to redemptions](./redeeming).
