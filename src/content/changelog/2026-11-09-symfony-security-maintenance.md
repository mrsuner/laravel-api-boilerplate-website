---
title: Symfony security patches and weekly dependency maintenance
description: Symfony advisory fixes and compatible Laravel, build-tool, and documentation updates across all four projects.
releasedAt: 2026-11-09
type: Security
projects:
  - laravel-api-boilerplate
  - laravel-api-keys
  - laravel-coupon
  - website
requiresAttention: true
---

## Security maintenance

Updated Symfony components from 7.4.22 to 7.4.23 in all three PHP lockfiles. The previous locks matched seven upstream advisories published on November 4:

- [HEAD method matching](https://symfony.com/cve-2026-118514) and [compiled host matching](https://symfony.com/cve-2026-118516) could weaken method- or path-based access rules in affected Symfony integrations.
- [Script-name path parsing](https://github.com/symfony/symfony/security/advisories/GHSA-3h27-hjv7-fqjx) and [base URL handling](https://github.com/symfony/symfony/security/advisories/GHSA-5mx8-mwrp-5693) could disagree with external path rules or produce client-controlled URL authorities under specific web-server rewrites.
- [Trusted proxy shortcuts](https://github.com/symfony/symfony/security/advisories/GHSA-xg2q-4rrq-657q) and [inline fragments](https://github.com/symfony/symfony/security/advisories/GHSA-wg5q-m2ww-f3c9) could accept forwarded request metadata under their documented proxy conditions.
- [YAML parsing](https://github.com/symfony/symfony/security/advisories/GHSA-hwfg-qwvh-2wfx) could consume excessive processing time for crafted documents.

These are dependency-version matches, not confirmed application exploits. The reviewed application does not configure Symfony Firewall rules, inline fragments, the `private_ranges` proxy shortcut, host-placeholder routes, or request-supplied YAML parsing. The bundled Caddy configuration serves `public/` directly through PHP-FPM. External CDN rules, custom rewrites and package consumers require their own deployment assessment. Existing installations should refresh their Composer locks to receive the patched components.

## Compatible updates

- Laravel 13.39.0 → 13.40.0 and PHPUnit 12.5.42 → 12.5.43 across all three PHP projects; related URI, console, error-handler and Symfony contract dependencies refreshed within existing constraints.
- Boilerplate: Vite 8.3.5 → 8.3.6, Laravel Vite Plugin 3.2.0 → 3.2.1 and Concurrently 10.0.6 → 10.0.7.
- Website: Astro 7.4.4 → 7.4.7, with compatible Markdown, highlighting and bundler dependency updates.
- Both frontends: Tailwind CSS and its Vite integration 4.3.3 → 4.3.5.
- PHP and Node.js support baselines and application API contracts remain unchanged. Existing Dependabot proposals were checked before consolidating these updates; no duplicate update PRs were created.

## Verification

- All 417 PHP tests passed: 295 boilerplate, 70 API Keys and 52 Coupon tests.
- Both package suites passed on Laravel 12 / PHP 8.2 and Laravel 13 / PHP 8.3; the boilerplate suite also passed on PHP 8.3.
- Six focused checks confirmed the patched request behavior for script-name prefixes, URL authorities, HEAD matching and mapped-address proxy trust. These component checks do not establish application exploitability.
- Composer manifest, lockfile, platform and formatting checks passed. Three Composer audits and both npm audits reported zero known advisories on November 9, 2026.
- Both frontends passed clean npm installs and production builds. All internal links in the website's 36 generated pages resolved.
- Playwright verified desktop documentation, Roadmap and package navigation; the new Changelog entry and permanent link; and mobile reading and navigation without page errors.
- Docker production and development images built. The production container initialized configuration, route, view and event caches, started PHP-FPM and passed its configuration check.

The boilerplate update was tested in an isolated worktree, preserving ongoing feature development. No functional regressions were found within these checks.
