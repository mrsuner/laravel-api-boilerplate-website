---
title: Laravel 13 and Astro 7 maintenance release
description: Framework, package, frontend, security, and CI maintenance across the complete Laravel API Starter workspace.
releasedAt: 2026-08-23
type: Maintenance
version: "2026.08"
projects:
  - laravel-api-boilerplate
  - laravel-api-keys
  - laravel-coupon
  - website
requiresAttention: true
---

## Framework and runtime

- Upgraded the boilerplate to Laravel 13.26.1 and raised the minimum PHP version to 8.3.
- Updated Laravel Boost to 2.5, Tinker to 3.0, and PHPUnit to 12.5.
- Updated Sanctum's CSRF middleware to Laravel 13's `PreventRequestForgery` implementation.
- Switched new installations to JSON session serialization.

## Package compatibility

- Added Laravel 13 support to `laravel-api-keys` and `laravel-coupon`.
- Both packages now support Laravel 12 and 13 through dedicated Testbench and PHPUnit matrices.
- Laravel 11 is no longer included in the supported Composer constraints.

## Dependencies and delivery

- Cleared all known Composer and npm security advisories across the workspace.
- Upgraded the website from Astro 5 to Astro 7.
- Added reproducible npm installs to the boilerplate Docker build with `package-lock.json` and `npm ci`.
- Added GitHub Actions and Dependabot configuration to all four repositories.

## Verification

The maintenance release passed 417 PHP tests across the three PHP projects. It also passed clean database migrations, route and scheduler discovery, Scribe generation, a production Docker build, and the 35-page website build.

> Deployment note: JSON session serialization invalidates existing cookie sessions, so users will need to sign in again. Applications using OAuth or FCM should also complete a staging smoke test with real provider credentials.
