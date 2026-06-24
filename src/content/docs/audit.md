---
title: Audit Trail
description: Append-only audit log with redaction and retention pruning.
section: Operations
order: 2
---

# Audit Trail

An append-only audit log for domain and lifecycle events. It writes a row
to `audit_logs` describing **who did what, on which entity, when, with what
payload** — and rotates old rows out via a scheduled prune.

The module is **non-fatal by design**: when an audit write fails (DB down,
schema mismatch, queue offline) the failure is logged and `null` is
returned. Business code is never interrupted.

## Three ways to emit

1. **Helper** — `audit_log('event.name', $model, ['metadata' => [...]])`
   for cross-cutting events.
2. **Auditable trait** — opt-in per model; auto-captures `created`,
   `updated`, `deleted` with the attribute diff.
3. **Service directly** — `app(AuditLogger::class)->log(...)` for the typed
   API or to pass an explicit user.

## Defaults

| | |
|---|---|
| Module | enabled |
| Write mode | synchronous (`AUDIT_QUEUE=true` → queued) |
| Retention | 180 days, daily prune at 03:00 |
| Request context | captured (IP, UA, `X-Request-Id`) |
| Redacted keys | `password`, `*_token`, `secret`, `api_key`, … |
| Allow-list | none (every event recorded) |

## Configuration

```php
'audit' => [
    'enabled' => env('AUDIT_ENABLED', true),
    'connection' => env('AUDIT_DB_CONNECTION'),   // null = default
    'queue' => env('AUDIT_QUEUE', false),
    'capture_request_context' => env('AUDIT_CAPTURE_REQUEST_CONTEXT', true),
    'redact_keys' => ['password', 'token', 'secret', /* ... */],
    'events_allowlist' => null,   // null = allow all
    'prune' => [
        'enabled' => env('AUDIT_PRUNE_ENABLED', true),
        'days' => env('AUDIT_PRUNE_DAYS', 180),
    ],
],
```

`redact_keys` is case-insensitive and recursive, applied to `old_values`,
`new_values` and `metadata` before persistence.

## Helper usage

```php
audit_log('auth.login', $user, ['metadata' => ['method' => 'password']]);

audit_log('users.email_changed', $user, [
    'old' => ['email' => 'old@example.com'],
    'new' => ['email' => 'new@example.com'],
]);

// Override the acting user (e.g. system job)
audit_log('billing.invoice_voided', $invoice, [
    'user' => $admin,
    'metadata' => ['reason' => 'refund'],
]);
```

The acting user is auto-resolved from the request (falling back to the
`sanctum` guard) unless overridden.

## Auditable trait

```php
use App\Models\Concerns\Auditable;

class Order extends Model
{
    use Auditable;

    protected array $auditExclude = ['internal_notes'];
}
```

Event names follow `<snake_model>.<verb>` (`order.created`, …). `updated`
only fires when an attribute is actually dirty; `old_values` holds only
changed keys.

## Querying

```php
AuditLog::query()->forUser($user->id)->latest()->paginate(20);
AuditLog::query()->forEvent('auth.login')->between(now()->subDay(), now())->get();
AuditLog::query()->with('user')->latest()->paginate(20);
```

## Pruning

```bash
php artisan audit:prune                # per config.days
php artisan audit:prune --days=30
php artisan audit:prune --dry-run
```

Scheduled daily at 03:00. Deletes happen in chunked batches to keep the
transaction footprint small. The `created_at`-only schema is immutable —
there is no `updated_at`.

## Exposing to admins

The [Internal Admin Module](/docs/admin) ships read-only audit endpoints
(`GET /internal/admin/v1/audit-logs` with `user_id` / `event` / date-range
filters, plus per-user logs) built on these same scopes. For a custom surface,
the model, scopes and polymorphic relation are ready — build your own
controller returning paginated `AuditLog::query()` results.
