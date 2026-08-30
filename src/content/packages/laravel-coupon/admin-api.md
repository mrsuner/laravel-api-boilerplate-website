---
title: Admin API
description: IP- and token-gated CRUD for coupon codes and redemption lists.
section: Admin API
order: 1
---

# Admin API

The package mounts a management API under `/internal/admin/v1/`, behind the
[boilerplate admin stack](../../../docs/admin) when it's present (or a
Sanctum-authenticated stack on a plain Laravel app — see
[Configuration](./configuration)). No routes need to be
added by hand.

## Endpoints

All paths are prefixed with `/internal/admin/v1`.

| Method | Endpoint | Name | Description |
|---|---|---|---|
| GET | `/coupons` | `admin.coupons.index` | List coupons (`type`, `is_active`, `search`, `per_page`) |
| POST | `/coupons` | `admin.coupons.store` | Create a coupon |
| POST | `/coupons/bulk` | `admin.coupons.bulk` | Bulk-generate codes |
| GET | `/coupons/{coupon}` | `admin.coupons.show` | Coupon detail + `redemptions_count` |
| PATCH | `/coupons/{coupon}` | `admin.coupons.update` | Update `name`, `is_active`, `restrictions` |
| DELETE | `/coupons/{coupon}` | `admin.coupons.destroy` | Soft-delete (see force rule below) |
| PATCH | `/coupons/{coupon}/activate` | `admin.coupons.activate` | Set `is_active = true` |
| PATCH | `/coupons/{coupon}/deactivate` | `admin.coupons.deactivate` | Set `is_active = false` |
| GET | `/coupons/{coupon}/redemptions` | `admin.coupons.redemptions` | Redemptions for one coupon |
| GET | `/coupon-redemptions` | `admin.coupon-redemptions.index` | Global redemption list |

Responses use the standard [API envelope](../../../docs/api-responses); paginated lists
return the `{ data, meta, links }` shape.

## Create a coupon

```bash
curl -X POST https://your-app/internal/admin/v1/coupons \
  -H 'Accept: application/json' -H 'Authorization: Bearer <admin-token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "code": "LAUNCH20",
    "name": "Launch promotion — 20% off",
    "type": "percent_off",
    "value": { "percent": 20 },
    "restrictions": { "max_uses": 500, "per_user": 1, "expires_at": "2026-12-31T23:59:59Z" }
  }'
```

`code` is optional — omit it to auto-generate. Returns `201` with the coupon
resource.

## Bulk generation

```bash
curl -X POST https://your-app/internal/admin/v1/coupons/bulk \
  -H 'Authorization: Bearer <admin-token>' -H 'Content-Type: application/json' \
  -d '{ "quantity": 50, "prefix": "LAUNCH", "type": "free_months", "value": { "months": 1 } }'
```

Returns `201` with an array of the created code strings (not full resources, to
keep the payload small).

## Immutability & deletion rules

- **`type` and `value` are immutable** after creation. `PATCH` only accepts
  `name`, `is_active` and `restrictions` — this preserves the integrity of the
  redemption [snapshot](./installation).
- **Deletion is soft.** Deleting a coupon that has redemptions requires
  `?force=true`; without it the endpoint returns `422`. Redemption history is
  always preserved.

## Audit events

When the host provides the boilerplate's `audit_log()` helper, admin mutations
are recorded:

| Event | Trigger |
|---|---|
| `admin.coupon.created` | Single coupon created |
| `admin.coupon.bulk_created` | Bulk generation completed (quantity in metadata) |
| `admin.coupon.updated` | Coupon fields updated |
| `admin.coupon.deleted` | Coupon soft-deleted |
| `admin.coupon.activated` / `admin.coupon.deactivated` | `is_active` toggled |

On a standalone app without the helper, these calls are silently skipped.
