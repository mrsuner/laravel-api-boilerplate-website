---
title: Introduction
description: Developer API key management for Laravel — prefix-routed keys, rotation, per-key rate limits and usage tracking, layered over Sanctum.
section: Overview
order: 1
---

# laravel-api-keys

Developer API key management for Laravel. It issues Stripe-style, prefix-routed
keys (`sk_live_…`), supports rotation with an overlap window, enforces per-key
rate limits and abilities, and tracks usage asynchronously — all **layered over
Sanctum** rather than replacing it.

A resolved key authenticates the request through the existing `auth:sanctum`
stack, so every route, policy and response envelope keeps working unchanged. The
package runs standalone on any Laravel 11/12 app and auto-wires into the Laravel
API Boilerplate when present.

## Why not just Sanctum tokens?

Sanctum's `personal_access_tokens` are designed for session-style tokens.
Developer API keys have different semantics:

| Concern          | Sanctum token          | Developer API key             |
| ---------------- | ---------------------- | ----------------------------- |
| Format           | Opaque hash, no prefix | `sk_live_XXXX` prefix-routed  |
| Rate limit       | Global throttle only   | Configurable per key          |
| Rotation         | Delete + recreate      | Rotate with overlap window    |
| Usage tracking   | `last_used_at` only    | IP + endpoint + request count |
| Admin visibility | Token list by user     | Revoke + per-key usage stats  |

## Architecture: layer over Sanctum, don't replace it

The package does **not** introduce a new authentication guard. Keys live in
their own `api_keys` table, but authentication still flows through Sanctum: the
`api.key` middleware resolves an incoming key to its owning user and sets that
user on the request, then `auth:sanctum` sees an authenticated user and lets the
request through.

That means:

- Existing `auth:sanctum` middleware keeps working unchanged.
- The same route can accept **both** a Sanctum token and an API key — a bearer
  token that doesn't match the key prefix simply falls through to Sanctum.
- The boilerplate's audit log, RBAC and response envelope are all available
  after resolution.

## Key format

Keys use a prefix-separated format inspired by Stripe:

```
sk_live_A3F9K2MNPQRSTUVWXYZ23
└┬┘ └┬─┘ └─────────┬─────────┘
 │    │            └── random token (base58, configurable length)
 │    └─────────────── environment tag (live | test)
 └──────────────────── product prefix (config: api-keys.key_prefix)
```

Only a SHA-256 hash of the **token** segment is stored (`key_hash`). The
plaintext key is returned **exactly once**, at creation and rotation, and is
never persisted. A plaintext `key_prefix` (`sk_live_A3F9K2MN`) is kept for
display so admin UIs can identify a key without ever holding the secret. The
token uses the base58 alphabet — no `0`, `O`, `I` or `l` — to avoid visual
ambiguity in screenshots.

## At a glance

- `ApiKeyService` — the single entry point: `create`, `resolve`, `revoke`,
  `rotate`.
- `api.key` / `api.ability` middleware — auto-registered, no `bootstrap/app.php`
  edits needed.
- Per-key rate limits with a `429` + `Retry-After` response.
- Async `TrackApiKeyUsage` job — usage never adds latency to the response.
- User-facing and admin HTTP APIs.
- `api-keys:prune` scheduled command for expiry and log retention.

Continue with [Installation](/packages/laravel-api-keys/installation).
