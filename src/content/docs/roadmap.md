---
title: Roadmap
description: What's shipped, what's planned, and what's intentionally out of scope.
section: Project
order: 1
---

# Roadmap

The goal is a true "common project" starter: **every feature must be opt-in
via `config/boilerplate.php`** so downstream projects toggle what they need
without ripping code out.

## Guiding principles

1. **Configurable, not hard-wired.** Every module exposes enable/disable
   flags and tunable parameters.
2. **Optional dependencies.** A feature may `require` a third-party package,
   but must still be runtime-disable-able.
3. **Safe defaults.** Defaults match what most teams want on day one (rate
   limit on, audit on, 2FA off but wired).
4. **Documented in `.env.example`.** Every flag has an env counterpart with
   a one-line comment.

## Shipped

- Reusable API response helpers + global exception envelope
- Auth rate limiting, strong password policy, email verification
- Laratrust RBAC (migrations, seeder, middleware, default-role assignment)
- File upload module with TTL cleanup
- Audit / activity log with redaction and retention
- Queued auth-event email notifications
- Internal admin module — IP- and token-gated management API (users, roles,
  audit, health, runtime config)
- Dockerised dev + prod stack
- Consolidated AI agent rules

## Planned — Tier 1 (security & auth)

- **Two-factor auth (TOTP)** — secret + QR, backup codes,
  `/auth/{guard}/2fa` endpoints, optional per-role enforcement.
- **Login history & session management** — record attempts, list and revoke
  active sessions (`GET /me/sessions`, `DELETE /me/sessions/others`).
- **Account lockout** — lock after N failed attempts within a window,
  auto-unlock after cooldown.

## Planned — Tier 2 (common modules)

- Polymorphic attachments with image variants and signed URLs
- Notifications expansion: database channel + per-user preferences
- Soft deletes & restore endpoints
- i18n scaffolding (`en`, `zh_TW`) with locale detection middleware
- Public `/health` endpoint (an admin-scoped one already ships with the
  [admin module](/docs/admin))
- CORS hardening, request-id middleware, request/response logging

## Planned — Tier 3 & 4 (DX & docs)

- GitHub Actions CI (Pint, PHPStan/Larastan, PHPUnit matrix)
- Pre-commit hooks, IDE helper, Telescope (dev only)
- Demo data seeder, annotated `.env.example`
- Prompt library, ADRs, ER diagram, `CONTRIBUTING.md`

## Out of scope (intentionally)

Excluded as "not common enough" for a generic boilerplate — they can be
promoted if feedback shows they're routinely needed:

- Full admin dashboard UI (use Filament/Nova downstream)
- Full-text search / Scout
- Webhooks
- Feature flags (Pennant is one line to add when needed)
- GraphQL
- Multi-tenancy
