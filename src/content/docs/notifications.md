---
title: Email Notifications
description: Queued email notifications attached to Laravel's auth events.
section: Operations
order: 1
---

# Email Notifications

Email notifications wired to Laravel's built-in auth events. Each one is
**queued** and **individually toggleable** via config — turn on only what
your project needs.

## Supported events

| Event | Listener | Email |
|---|---|---|
| `Registered` | `SendWelcomeEmail` | Welcome email |
| `Login` | `SendLoginNotification` | Login alert |
| `Logout` | `SendLogoutNotification` | Logout notification |
| `PasswordReset` | `SendPasswordResetConfirmation` | Password change confirmation |
| `Verified` | (none — wire your own) | — |

OTP verification dispatches `Registered` for first-time users (welcome
email fires) followed by `Login` (login alert fires).

## Configuration

```php
'auth' => [
    'notifications' => [
        'welcome_email_enabled' => env('AUTH_WELCOME_EMAIL_ENABLED', true),
        'login_notification_enabled' => env('AUTH_LOGIN_NOTIFICATION_ENABLED', true),
        'logout_notification_enabled' => env('AUTH_LOGOUT_NOTIFICATION_ENABLED', false),
        'password_reset_confirmation_enabled' => env('AUTH_PASSWORD_RESET_CONFIRMATION_ENABLED', true),
    ],
],
```

Each listener checks its flag at the start of `handle()`, so toggling at
runtime takes effect for the next dispatched event without rebooting.

## Customising templates

Blade templates live in `resources/views/emails/`:

| Template | Used by |
|---|---|
| `welcome.blade.php` | Welcome email |
| `login-notification.blade.php` | Login alert |
| `logout-notification.blade.php` | Logout notification |
| `password-reset-confirmation.blade.php` | Password change confirmation |
| `password-reset.blade.php` | Reset link email |
| `login-otp.blade.php` | OTP code email |
| `verify-email.blade.php` | Email verification link |

Edit the Blade for branding, or swap the mailable for a Notification class
if you need database / Slack / SMS channels.

## Adding a listener

1. `php artisan make:listener SendCustomNotification`
2. Implement `handle()` with a config gate:

   ```php
   public function handle(MyEvent $event): void
   {
       if (! config('boilerplate.auth.notifications.my_thing_enabled', false)) {
           return;
       }
       Mail::to($event->user)->send(new MyMail);
   }
   ```

Listeners in `app/Listeners/` are auto-discovered by Laravel — no manual
registration. Every listener implements `ShouldQueue`; run a queue worker
in production (`QUEUE_CONNECTION=sync` runs them inline in tests).
