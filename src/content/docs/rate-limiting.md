---
title: Rate Limiting
description: Per-endpoint named throttles protecting the auth surface.
section: API Surface
order: 2
---

# Rate Limiting

Per-endpoint named rate limiters protect authentication flows from
brute-force and abuse. Driven entirely by `config/boilerplate.php` and
applied via Laravel's standard `throttle:` middleware.

## Endpoints covered

| Limiter | Routes | Default |
|---|---|---|
| `auth-login` | `POST /auth/{app,web}/login` | 10 / min |
| `auth-register` | `POST /auth/{app,web}/register` | 5 / min |
| `auth-otp_issue` | `POST /auth/{app,web}/otp` | 5 / min |
| `auth-otp_verify` | `POST /auth/{app,web}/otp/verify` | 10 / min |
| `auth-password_forgot` | `POST /auth/{app,web}/forgot-password` | 3 / min |
| `auth-social` | `POST /auth/{app,web}/social/{provider}/...` | 10 / min |
| `auth-email_verify_resend` | `POST /auth/email/verification-notification` | 6 / min |

App-token and Web-cookie routes share the same bucket per limiter — they're
the same logical operation.

## Bucket key

```
<limiter>|<user_id>     # when authenticated
<limiter>|<client_ip>   # otherwise
```

## Configuration

```php
'auth' => [
    'rate_limit' => [
        'enabled' => env('AUTH_RATE_LIMIT_ENABLED', true),
        'limits' => [
            'login' => ['max' => 10, 'per_minutes' => 1],
            'register' => ['max' => 5, 'per_minutes' => 1],
            'otp_issue' => ['max' => 5, 'per_minutes' => 1],
            // ...
        ],
    ],
],
```

`AUTH_RATE_LIMIT_ENABLED=false` bypasses every limiter at runtime — limits
are re-read per request, so it also works via `config()->set(...)` in tests.

## Throttle response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
Content-Type: application/json

{ "message": "Too many requests." }
```

The 429 envelope comes from the [API exception renderer](/docs/api-responses),
not the throttle middleware — so the message is configurable like any other
response.

## Adding a limiter

1. Register a limit in config:

   ```php
   'limits' => [
       'export_pdf' => ['max' => 2, 'per_minutes' => 5],
   ],
   ```

2. Apply the middleware:

   ```php
   Route::post('/exports/pdf', ...)->middleware('throttle:auth-export_pdf');
   ```

`RateLimitServiceProvider` auto-registers a limiter for every key, prefixed
`auth-`. For a fully custom limiter (e.g. by role), define it with
`RateLimiter::for(...)` in your own provider.
