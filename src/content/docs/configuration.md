---
title: Configuration
description: How config/boilerplate.php drives every feature in the project.
section: Getting Started
order: 3
---

# Configuration

Every module in the boilerplate is controlled from a single file —
`config/boilerplate.php` — with matching environment variables in
`.env.example`. This is the central design rule: **if a behaviour can't be
changed from config, that's considered a bug.**

## The shape

`config/boilerplate.php` is grouped by domain:

```php
return [
    'auth'      => [ /* password, OTP, email verification, rate limit, ... */ ],
    'rbac'      => [ /* roles, permissions, default role */ ],
    'files'     => [ /* disk, TTL, cleanup, rate limit */ ],
    'audit'     => [ /* retention, redaction, queue */ ],
    'responses' => [ /* default messages */ ],
    'exceptions'=> [ /* API rendering toggles */ ],
];
```

Each section is documented in its own page — follow the sidebar.

## Runtime re-reads

Most toggles are read **per request**, not cached at boot. That means:

- You can flip a feature with `config()->set(...)` inside a test without
  rebooting the app.
- Changing an env var in production takes effect on the next request (after
  clearing config cache if you use `config:cache`).

For example, `AUTH_RATE_LIMIT_ENABLED=false` disables every auth throttle
immediately, and the password policy chain is rebuilt from config each time
a form request validates.

## Environment variables

Prefer env vars for anything environment-specific (credentials, URLs,
feature flags). The config file already maps them — never call `env()`
outside config files; use `config('boilerplate....')` in application code.

## Where to go next

| To configure... | See |
|---|---|
| Login, register, tokens vs cookies | [Authentication](/docs/authentication) |
| Passwordless email codes | [OTP](/docs/otp) |
| Google / GitHub / etc. | [Social Auth](/docs/social-auth) |
| Roles & permissions | [RBAC](/docs/rbac) |
| Uploads & cleanup | [File Uploads](/docs/files) |
| Audit log retention | [Audit Trail](/docs/audit) |
