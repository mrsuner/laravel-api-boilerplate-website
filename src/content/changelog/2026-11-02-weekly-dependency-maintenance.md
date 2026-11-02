---
title: Weekly dependency maintenance
description: Compatible PHP and frontend dependency updates across the boilerplate, companion packages, and website.
releasedAt: 2026-11-02
type: Maintenance
projects:
  - laravel-api-boilerplate
  - laravel-api-keys
  - laravel-coupon
  - website
requiresAttention: false
---

## PHP dependencies

- Updated CommonMark from 2.10.4 to 2.10.7, Composer Semver from 3.5.2 to 3.6.0, and Whoops from 2.18.7 to 2.19.1 in all three PHP projects.
- Reused the existing Boost Dependabot update to move the boilerplate from Laravel Boost 2.10.3 to 2.10.4.
- Updated the boilerplate's Google Auth to 1.55.3, GAX to 1.51.2, and gRPC GCP support to 0.5.0 within the SDK's declared constraints.
- Kept Laravel 13.39.0, Symfony 7.4.22, and the existing PHP support baselines.

## Frontend dependencies

- Updated Rolldown from 1.2.15 to 1.2.16 and refreshed compatible parser, source type, and TypeScript helper dependencies in both frontend lock files.
- Kept Astro 7.4.4, Vite 8.3.5, Tailwind CSS 4.3.3, and the Node.js 22.23.4 baseline.

## Compatibility note

Boost 2.10.4 removes the development-only `application-info` MCP tool. The application and packages do not reference that tool; external AI workflows that call it should review the [upstream Boost release notes](https://github.com/laravel/boost/releases/tag/v2.10.4). Application API routes and response contracts are unchanged by this maintenance update.

## Verification

- All 417 existing PHP tests passed: 295 boilerplate tests, 70 API Keys tests, and 52 Coupon tests.
- Both package suites passed on Laravel 12 / PHP 8.2 and Laravel 13 / PHP 8.3. The boilerplate suite also passed on PHP 8.3.
- Composer manifest, lockfile, platform and formatting checks passed. Three Composer audits and both npm audits reported zero known security advisories on November 2, 2026.
- Both frontends passed clean npm installs and production builds. All internal links in the website's 36 generated pages resolved.
- Playwright verified desktop navigation through documentation, Roadmap and package pages; the latest Changelog entry and permanent-link reload; and mobile reading and navigation, with no page errors.
- Docker production and development images built successfully. The production container completed configuration, route, view and event cache initialization, and its PHP-FPM configuration check passed.

The boilerplate changes were validated in an isolated worktree so ongoing application feature work was preserved. No functional regressions were found within these checks.
