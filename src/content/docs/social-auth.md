---
title: Social Authentication
description: OAuth login and account linking via Laravel Socialite.
section: Authentication
order: 3
---

# Social Authentication

OAuth login and account linking via [Laravel Socialite](https://laravel.com/docs/socialite),
available for both token-based (`/auth/app/social/...`) and cookie-based
(`/auth/web/social/...`) flows.

## Built-in providers

Google, GitHub, Facebook and Twitter — each individually toggleable.
Adding another (LinkedIn, Apple, …) is a config + env change.

## Configuration

```php
'auth' => [
    'socialite_enabled' => env('SOCIALITE_ENABLED', true),
    'socialite_providers' => [
        'google'   => env('SOCIALITE_GOOGLE_ENABLED', false),
        'github'   => env('SOCIALITE_GITHUB_ENABLED', false),
        'facebook' => env('SOCIALITE_FACEBOOK_ENABLED', false),
        'twitter'  => env('SOCIALITE_TWITTER_ENABLED', false),
    ],
    'socialite_callback_url' => env('SOCIALITE_CALLBACK_URL', 'http://localhost:3000/auth/callback'),
],
```

Provider credentials live in `config/services.php`, already wired to env
vars per provider.

## Endpoints

For both `app` and `web`:

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/social/{provider}/redirect` | No | Get the OAuth redirect URL. |
| POST | `/social/{provider}/callback` | No | Exchange code, log the user in. |
| GET | `/social/accounts` | Yes | List linked accounts. |
| POST | `/social/{provider}/link` | Yes | Start the link flow. |
| POST | `/social/{provider}/link/callback` | Yes | Complete linking. |
| DELETE | `/social/{provider}/unlink` | Yes | Unlink. |

All redirect/callback/link endpoints share the `auth-social`
[rate limiter](/docs/rate-limiting).

## The flow

1. Client `POST`s `/redirect` and receives a `redirect_url`.
2. The user opens that URL and authorises with the provider.
3. The provider redirects back to your frontend with a `code`.
4. Client `POST`s the `code` to `/callback`.
5. The API exchanges the code, finds-or-creates the user, stores the
   `SocialAccount`, and issues a token (app) or session (web).

## Usage

```bash
# 1. Get redirect URL
curl -X POST http://localhost/api/v1/auth/app/social/github/redirect

# 2. Open it in a browser; provider redirects to <frontend>/auth/callback?code=ABC

# 3. Exchange the code
curl -X POST http://localhost/api/v1/auth/app/social/github/callback \
  -H "Content-Type: application/json" \
  -d '{ "code": "ABC", "device_name": "iPhone 15 Pro" }'
```

Web flows use the same paths under `/auth/web/social/...` with
`credentials: 'include'`; the callback sets a session cookie instead of
returning a token.

## Auto-linking by email

When the OAuth callback returns an email matching an existing local
account, the social account is **automatically attached** to that user —
no confirmation step. If you prefer explicit confirmation (to mitigate
account takeover via a compromised OAuth provider), edit
`HandlesSocialiteAuth::findOrCreateUser`.

## Social accounts table

Stores `provider`, `provider_id`, `provider_email`, display name, avatar,
and **encrypted** `access_token` / `refresh_token` with `token_expires_at`.

## Adding a provider

1. Toggle it in `socialite_providers` (config).
2. Add credentials in `config/services.php`.
3. Set the env vars.

If Socialite has no built-in driver, install a community package from
[socialiteproviders.com](https://socialiteproviders.com).
