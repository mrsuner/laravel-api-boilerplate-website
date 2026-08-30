---
title: Introduction
description: Coupon lifecycle management for Laravel — decoupled from billing via a single event.
section: Overview
order: 1
---

# laravel-coupon

**`mrsuner/laravel-coupon`** is an official companion package for the Laravel
API Boilerplate. It owns the **coupon lifecycle** — generation, validation and
redemption recording — and nothing else. It has no knowledge of your billing
system, subscription engine or application-specific business logic.

The boundary is enforced by a single architectural rule:

> **The package fires `CouponRedeemed` and stops. Your application listens and acts.**

This means:

- No dependency on `laravel/cashier`, `laravel/cashier-paddle` or any billing package.
- No dependency on your `Order`, `Subscription` or `Credit` models.
- Any SaaS — on the boilerplate or a plain Laravel app — can install it
  regardless of its billing stack.

What connects the package to your business logic is **one event class**
([`CouponRedeemed`](./redeeming)) and **one public
service** ([`CouponService`](./coupon-service)).
Everything else is internal.

## Works standalone or with the boilerplate

The core — `CouponService`, the models and the `CouponRedeemed` event — is
plain Laravel and runs in any application. The admin API auto-wires into the
boilerplate's [Internal Admin](../../../docs/admin) stack when it detects it, and
falls back to a Sanctum-authenticated stack on a vanilla Laravel app. See
[Configuration](./configuration).

## What it does

| Concern | Detail |
|---|---|
| Code generation | Random codes, bulk generation, configurable prefix/suffix/length |
| Code validation | Expiry, max uses, per-user limit, active flag |
| Redemption recording | Writes a redemption row, increments the counter, fires an event |
| Admin API | Full CRUD for codes + redemption lists under `/internal/admin/v1/` |
| `CouponRedeemed` event | Fired after a committed redemption; carries the coupon and redeemer |
| `CouponService` | `generate()`, `generateBulk()`, `validate()`, `redeem()` |

## What it deliberately leaves to you

| Concern | Why |
|---|---|
| Discount application | Business-specific — handled by your event listener |
| Stripe / Paddle integration | Your responsibility, decoupled via the event |
| Order / invoice modification | Outside the package boundary |
| User-facing redeem endpoint | You wire `CouponService::redeem()` into your own controller |

## Next steps

- [Installation](./installation)
- [Configuration](./configuration)
- [The CouponService API](./coupon-service)
- [Redeeming & reacting to redemptions](./redeeming)
- [Admin API](./admin-api)
