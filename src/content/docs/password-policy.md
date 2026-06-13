---
title: Password Policy
description: Configurable strong-password rules applied everywhere a password is set.
section: Authentication
order: 5
---

# Password Policy

Configurable strong-password rules applied via Laravel's
`Password::defaults()` to **every** form that accepts a new password.

## Forms affected

| Form Request | Endpoint |
|---|---|
| `RegisterRequest` | `POST /auth/{app,web}/register` |
| `ResetPasswordRequest` | `POST /auth/{app,web}/reset-password` |
| `ChangePasswordRequest` | `POST /auth/{app,web}/change-password` |

These use `Password::defaults()` instead of an inline `min:` rule — change
config once and every form picks it up.

## Configuration

```php
'auth' => [
    'password' => [
        'min_length' => env('AUTH_PASSWORD_MIN_LENGTH', 8),
        'require_mixed_case' => env('AUTH_PASSWORD_REQUIRE_MIXED_CASE', true),
        'require_numbers' => env('AUTH_PASSWORD_REQUIRE_NUMBERS', true),
        'require_symbols' => env('AUTH_PASSWORD_REQUIRE_SYMBOLS', false),
        'uncompromised' => env('AUTH_PASSWORD_UNCOMPROMISED', false),
    ],
],
```

`uncompromised` checks the password against haveibeenpwned.com. It needs
HTTP egress — leave it off in dev / CI and enable it only where the app can
reach the internet.

## How it's composed

The rule chain is built in `AppServiceProvider::boot()` from config, and
each form request rebuilds it when validation runs — so config changes take
effect without rebooting.

## Per-form overrides

When one form needs different behaviour, use the rule directly:

```php
public function rules(): array
{
    return [
        'password' => ['required', Password::min(12)->symbols(), 'confirmed'],
    ];
}
```

## Validation errors

Failures use the standard [response envelope](/docs/api-responses):

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "password": [
      "The password must contain at least one uppercase and one lowercase letter.",
      "The password must contain at least one number."
    ]
  }
}
```
