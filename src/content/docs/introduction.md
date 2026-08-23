---
title: Introduction
description: What the Laravel API Boilerplate is and the philosophy behind it.
section: Getting Started
order: 1
---

# Introduction

The **Laravel API Boilerplate** is a production-ready starter template for
building RESTful APIs with Laravel 13. It comes pre-wired with the things
every real API eventually needs — authentication, roles and permissions,
file uploads, auditing, rate limiting and a Docker stack — so you can skip
the plumbing and start on your domain.

## Why this exists

BaaS platforms like Firebase, Supabase and PocketBase are great for getting
a prototype off the ground. But their advantages fade once a project grows:
you eventually hit platform limits, opaque pricing, or vendor lock-in.

With AI accelerating day-to-day development, scaffolding a backend from a
clean base is no longer the bottleneck it once was. Laravel gives you
readable, maintainable syntax, native scalability, and full ownership of
your data and infrastructure. This boilerplate is for any developer
comfortable with Laravel who wants a best-practices API foundation without
assembling it by hand each time.

## Design principles

- **Configurability first.** Every feature exposes its knobs through
  `config/boilerplate.php` with matching env vars. If you can't toggle it
  from config, treat that as a bug.
- **One response envelope.** Intentional responses and thrown exceptions go
  through the same JSON shape, so clients only learn one dialect.
- **Boilerplate, not a framework.** Controllers, mailables, Blade views and
  config defaults are starting points — they are meant to be edited per
  project.
- **Tests are the source of truth.** Each module ships with feature tests
  that document its real behaviour.

## What's inside

| Area | Highlights |
|---|---|
| Authentication | Dual token + cookie auth, password / OTP / OAuth, email verification |
| Access control | Laratrust roles & permissions, default-role assignment |
| API surface | Standard envelope, global exception renderer, per-endpoint rate limits |
| Storage | Two-phase file uploads with TTL cleanup (local or S3) |
| Observability | Append-only audit log with redaction and retention |
| Delivery | Dockerised stack, Scribe API docs, PHPUnit, Pint |

Continue to [Installation](/docs/installation) to get a local environment
running, then explore each module from the sidebar.
