---
title: Installation
description: Get a local development environment running in a few minutes.
section: Getting Started
order: 2
---

# Installation

You can run the boilerplate directly with PHP and your own database, or use
the bundled Docker stack. Both paths are first-class.

## Requirements

- PHP **8.2+**
- Composer
- Node.js & npm
- A database (SQLite, MySQL or PostgreSQL)

## Local setup

```bash
# 1. Clone
git clone <repository-url>
cd laravel-api-boilerplate

# 2. Install dependencies
composer install
npm install

# 3. Environment
cp .env.example .env
php artisan key:generate

# 4. Database — configure credentials in .env, then:
php artisan migrate --seed
```

The `--seed` flag runs the roles & permissions seeder so RBAC works out of
the box.

## Running the app

Start everything (server, queue, logs, Vite) with one command:

```bash
composer run dev
```

Or just the HTTP server:

```bash
php artisan serve
```

## Docker

Prefer containers? The repo ships a full stack (Caddy, PHP-FPM, queue,
scheduler, Postgres, Redis):

```bash
cp .env.example .env
cp docker/.env.docker.example docker/.env.docker

make up        # build + start the dev stack
make migrate   # first run only
```

The app is then reachable at `http://localhost:8080`. See the
[Docker guide](/docs/docker) for the full topology and production flow.

## Verifying

```bash
php artisan test          # run the PHPUnit suite
php artisan scribe:generate  # build browsable API docs
./vendor/bin/pint         # fix code style
```

Next: review [Configuration](/docs/configuration) to understand how every
module is toggled from a single file.
