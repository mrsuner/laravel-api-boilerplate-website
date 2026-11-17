---
title: Node.js security patch and weekly dependency maintenance
description: A patched frontend build runtime and compatible Laravel, authentication, HTTP client and website dependency updates.
releasedAt: 2026-11-17
type: Security
projects:
  - laravel-api-boilerplate
  - laravel-api-keys
  - laravel-coupon
  - website
requiresAttention: true
---

## Build runtime security

Raised the Node.js build baseline from 22.23.4 to [22.23.5, the November 11 security release](https://nodejs.org/en/blog/release/v22.23.5). Both frontends now select it through `.nvmrc` and require it in their package engines; README instructions and the boilerplate's Docker asset stage match. Existing CI and Cloudflare Pages builds use the repository runtime selection.

Node.js is used to build static frontend assets in these projects. The boilerplate's production application runs on PHP-FPM, and the website is deployed as static files. The runtime update addresses upstream advisories; it does not indicate a confirmed application exploit. See the [upstream security notice](https://nodejs.org/en/blog/vulnerability/november-2026-security-releases) for affected features and release lines.

## Compatible dependency updates

- All three PHP projects: Laravel 13.40.0 → 13.42.0, Sanctum 4.3.3 → 4.4.0, PHPUnit 12.5.43 → 12.5.44, Guzzle 8.3.1 → 8.5.1 and its PSR-7 implementation 3.2.0 → 3.4.0.
- Boilerplate: Socialite 5.31.0 → 5.32.0, Tinker 3.0.2 → 3.1.0, Pail 1.2.7 → 1.3.0, Sail 1.69.0 → 1.70.0 and Pint 1.32.1 → 1.32.3, with compatible support-library updates.
- Both frontends: Vite 8.3.6 → 8.3.8. The boilerplate also updates Axios 1.21.0 → 1.21.1; the website updates Astro 7.4.7 → 7.4.12 and daisyUI 5.7.50 → 5.8.1.
- Preserved the existing PHP and Laravel support ranges. Reviewed existing Dependabot proposals and consolidated compatible updates without creating duplicate PRs.

Laratrust remains on 8.5.6. Version 9 introduces breaking changes and requires a separate review of configuration, permission/event APIs and admin-panel authorization against its [upgrade guide](https://laratrust.santigarcor.me/docs/9.x/upgrade.html).

## Verification

- All 417 PHP tests passed on PHP 8.4: 295 boilerplate tests, 70 API Keys tests and 52 Coupon tests, including existing authentication and authorization coverage.
- Both package suites passed on Laravel 12 / PHP 8.2 and Laravel 13 / PHP 8.3; the boilerplate suite also passed on PHP 8.3.
- Composer manifest, lockfile and platform checks and the boilerplate's Pint check passed. All three Composer audits and both npm audits reported zero known advisories on November 17, 2026; Composer reported no abandoned packages.
- Clean npm installs and production builds passed on Node.js 22.23.5 for both frontends. All internal links in the website's 36 generated pages resolved.
- Playwright verified desktop documentation, Roadmap and package navigation; the latest Changelog entry and permanent-link reload; and mobile reading and navigation, with no page errors.
- Docker production and development builds passed. The production container initialized configuration, route, view and event caches, started PHP-FPM and passed its configuration check.

The boilerplate update was tested in an isolated worktree to preserve ongoing feature work. No functional regressions were found within these checks.
