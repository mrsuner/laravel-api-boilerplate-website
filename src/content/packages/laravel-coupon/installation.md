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
- `laravel/sanctum` for the default admin-API authentication

The package works in any Laravel application. Installed on top of the Laravel
API Boilerplate it auto-wires into the existing admin stack.

## Install

```bash
composer require mrsuner/laravel-coupon
php artisan vendor:publish --tag=coupon-config
php artisan migrate
```

The service provider is auto-discovered. It registers the migrations, binds
the `CouponService` singleton, and mounts the admin API routes.

## What gets installed

Two migrations are published into your schema:

- `coupon_codes` — the redeemable codes, their effect (`type` + `value`),
  usage `restrictions`, a running `times_redeemed` counter, an `is_active`
  flag and soft deletes.
- `coupon_redemptions` — one row per successful redemption, with a polymorphic
  `redeemable`, a `snapshot` of the coupon at redemption time, and optional
  `context`.

> The `snapshot` column freezes the coupon's `type` and `value` at the moment
> of redemption, so historical records stay accurate even if the coupon is
> edited later.

## Verify

```bash
php artisan migrate:status
```

You should see the two coupon migrations applied. Resolve the service anywhere
to confirm the binding:

```php
$coupons = app(\Mrsuner\Coupon\Services\CouponService::class);
```

Continue with [Configuration](/packages/laravel-coupon/configuration).
