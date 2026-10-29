---
title: Dependency security refresh and runtime alignment
description: Security updates, reproducible development dependencies, and verified runtime compatibility across the boilerplate, packages, and website.
releasedAt: 2026-10-29
type: Maintenance
projects:
  - laravel-api-boilerplate
  - laravel-api-keys
  - laravel-coupon
  - website
requiresAttention: true
---

## Dependencies

- Updated all three PHP projects to Laravel 13.39.0, Symfony 7.4.22 HTTP Foundation, MIME and YAML components, and PHPUnit 12.5.42.
- Updated the boilerplate's transitive dependencies, including Guzzle 8.3.1 and phpseclib 4.0.2.
- Updated frontend tooling to Vite 8.3.5, Axios 1.21.0, and Concurrently 10.0.6.
- Updated the website to Astro 7.4.4, Sharp 0.35.5, and daisyUI 5.7.50.
- Removed the unused `spatie/laravel-data` dependency and its published configuration. Existing API Resources continue to shape responses.

## Configuration and compatibility

- Standardized the frontend Node.js baseline on 22.23.4 through `.nvmrc`, package engine requirements, GitHub Actions, and the boilerplate Docker asset build.
- Changed the boilerplate setup script to use `npm ci` for reproducible frontend installs.
- Declared the complete Laravel Framework dependency in both extension packages, with supported ranges `^12.69 | ^13.30`.
- Added committed development lock files targeting PHP 8.3 and Laravel 13. Downstream applications continue to resolve their own dependencies.
- Updated package CI to audit committed lock files before resolving current dependencies, and to match dependency resolution to each PHP version in the compatibility matrix.

## Verification

All 417 existing PHP tests passed:

| Project | Tests | Assertions |
| --- | ---: | ---: |
| Laravel API Boilerplate | 295 | 784 |
| Laravel API Keys | 70 | 157 |
| Laravel Coupon | 52 | 126 |

- Both package suites also passed on Laravel 12 / PHP 8.2 and Laravel 13 / PHP 8.3. The boilerplate suite additionally passed on PHP 8.3.
- The boilerplate Vite build and the website's 36-page static build passed. All website internal links resolved.
- A clean website install and build passed on Node.js 22.23.4 in Linux, matching the CI baseline.
- Both production and development Docker images built successfully. Production container configuration, route, view and event cache initialization, and the PHP-FPM configuration check passed.
- All three Composer audits and both npm audits reported zero known security advisories as of October 29, 2026.

No functional regressions were found within these tests and build checks.

> Upgrade note: Use Node.js 22.23.4 or newer for frontend builds. Applications that use Laravel Data should retain it as an explicit dependency when adopting the boilerplate changes. The package development lock files require PHP 8.3; Laravel 12 consumers remain supported on PHP 8.2.
