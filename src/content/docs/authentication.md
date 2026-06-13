---
title: Authentication
description: Dual token and cookie authentication sharing one set of controllers.
section: Authentication
order: 1
---

# Authentication

The auth module exposes **two route trees that share controllers and
config** but issue different credentials:

- **App** — `/api/v1/auth/app/*` — Sanctum bearer tokens for native
  mobile / desktop clients.
- **Web** — `/api/v1/auth/web/*` — Sanctum cookie / session for browser
  SPAs (`statefulApi()` middleware).

Both expose the same operations: register, login, password reset, change
password, OTP, OAuth and logout. Pick the tree that matches your client;
the behaviour and config are identical.

## Sub-features

| Topic | Page |
|---|---|
| Passwordless email codes | [OTP](/docs/otp) |
| OAuth / social login | [Social Auth](/docs/social-auth) |
| Signed-URL email verification | [Email Verification](/docs/email-verification) |
| Strong-password rules | [Password Policy](/docs/password-policy) |
| Brute-force throttling | [Rate Limiting](/docs/rate-limiting) |
| Roles & permissions | [RBAC](/docs/rbac) |

## Route reference

### App authentication (token-based)

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/v1/auth/app/register` | No |
| POST | `/api/v1/auth/app/login` | No |
| POST | `/api/v1/auth/app/otp` | No |
| POST | `/api/v1/auth/app/otp/verify` | No |
| POST | `/api/v1/auth/app/forgot-password` | No |
| POST | `/api/v1/auth/app/reset-password` | No |
| POST | `/api/v1/auth/app/logout` | Yes |
| POST | `/api/v1/auth/app/change-password` | Yes |

### Web authentication (session-based)

Identical, with `/auth/web/*` instead of `/auth/app/*`. Logout destroys the
session rather than revoking a token.

### Shared

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/me` | Authenticated user identity | Yes |

## Configuration

All auth knobs live under `auth` in `config/boilerplate.php`:

```php
'auth' => [
    'password_auth_enabled' => true,
    'otp_auth_enabled' => true,

    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
    'password_reset_url' => env('PASSWORD_RESET_URL', '/reset-password'),
    'password_reset_expiry_minutes' => 60,

    'socialite_enabled' => env('SOCIALITE_ENABLED', true),
    // ... password, otp, email_verification, rate_limit, notifications
],
```

## Usage

### Register (token)

```bash
curl -X POST http://localhost/api/v1/auth/app/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "password_confirmation": "Password123"
  }'
```

```json
{
  "data": {
    "access_token": "1|abc123...",
    "token_type": "Bearer",
    "user": { "id": 1, "name": "John Doe", "email": "john@example.com" }
  }
}
```

### Authenticated request

```bash
curl http://localhost/api/v1/me \
  -H "Authorization: Bearer 1|abc123..."
```

### Web (SPA) login

```javascript
await fetch('/api/v1/auth/web/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'john@example.com', password: 'Password123' }),
});

// Subsequent requests include the session cookie automatically.
const me = await fetch('/api/v1/me', { credentials: 'include' });
```

## User schema

| Column | Notes |
|---|---|
| `email` | Unique |
| `email_verified_at` | Set by email verification or OTP login |
| `password` | Bcrypt-hashed via Eloquent's `hashed` cast |
| `avatar_url` | Nullable |
| `is_active` | Inactive accounts cannot log in |
| `last_login_at` | Updated on every login |

## Security model

| Concern | Handling |
|---|---|
| Password storage | Bcrypt via `hashed` cast |
| Sanctum tokens | Hashed in the database |
| OAuth tokens | Encrypted at rest |
| Inactive accounts | Login blocked when `is_active = false` |
| Brute force | Per-endpoint throttles ([rate limiting](/docs/rate-limiting)) |
| Weak passwords | `Password::defaults()` ([password policy](/docs/password-policy)) |
| Email ownership | [Email verification](/docs/email-verification) — required-for-login is a flag |

## Customising

- **User creation:** override `findOrCreateUser` in the social concern, or
  extend the controller `register()` methods.
- **Validation:** form requests live in `app/Http/Requests/Auth/` — follow
  the existing `authorize() + rules() + messages()` pattern.
