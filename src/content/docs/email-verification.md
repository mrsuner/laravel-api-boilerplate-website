---
title: Email Verification
description: Signed-URL email verification with an optional login gate.
section: Authentication
order: 4
---

# Email Verification

Signed-URL email verification with optional login enforcement and automatic
verification on OTP login.

## How it works

1. Registration fires `Registered`, which triggers
   `sendEmailVerificationNotification()`.
2. The user receives an email containing a **signed verify URL**.
3. Clicking it hits `GET /auth/email/verify/{id}/{hash}`.
4. The address is marked verified and the `Verified` event fires.

OTP verification **also** marks the email verified — the user just proved
they own the address.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/auth/email/verify/{id}/{hash}` | Signed URL only | Verify the address. |
| POST | `/api/v1/auth/email/verification-notification` | Required | Resend the email. |

Verify is intentionally unauthenticated so the link works from any device.
Security comes from the signed URL plus a `sha1(email)` hash segment.

## Configuration

```php
'auth' => [
    'email_verification' => [
        'enabled' => env('AUTH_EMAIL_VERIFICATION_ENABLED', true),
        'required_for_login' => env('AUTH_EMAIL_VERIFICATION_REQUIRED_FOR_LOGIN', false),
        'expire_minutes' => env('AUTH_EMAIL_VERIFICATION_EXPIRE_MINUTES', 60),
        'redirect_url' => env('AUTH_EMAIL_VERIFICATION_REDIRECT_URL'),
    ],
],
```

| Key | Effect |
|---|---|
| `enabled` | When false, no verification emails are sent on registration. |
| `required_for_login` | When true, password login refuses unverified accounts with `403`. OTP login is unaffected (it auto-verifies). |
| `expire_minutes` | Validity window of the signed link. |
| `redirect_url` | When set, verify redirects to `<url>?status=success` (or `?status=failure&reason=invalid`) instead of returning JSON. |

## Behaviour summary

| Scenario | Result |
|---|---|
| Valid signed link clicked | Email verified, `Verified` dispatched. |
| Tampered query string | `403` (signed middleware rejects). |
| Wrong `hash` segment | `404` "Verification link is invalid." |
| Expired link | `403`. |
| Resend by verified user | `200` "Email already verified." (no email). |
| Resend without auth | `401`. |
| Resend over the limit | `429` (`auth-email_verify_resend`). |
| Password login, unverified, `required_for_login=true` | `403`. |
| OTP verify (any user) | Email marked verified. |

## Frontend redirect

With `AUTH_EMAIL_VERIFICATION_REDIRECT_URL` set, after a click the user
lands on `…?status=success` or `…?status=failure&reason=invalid`. Your
frontend reads the query string and renders the right state. Without a
redirect URL the endpoint returns JSON — fine for API-only setups, poor UX
for browser clicks.

## Customising the email

The mailable is `App\Mail\VerifyEmail` with view
`resources/views/emails/verify-email.blade.php`. Edit the Blade for
branding, or swap the mailable for a Notification class.
