---
title: Docker
description: A dockerised stack for local development and production.
section: Operations
order: 3
---

# Docker

The application ships a dockerised stack for both local development and
production. The image is **role-agnostic** — every container runs the same
binary, and the compose file is the single source of truth for what each
container does.

## Topology

| Service | Image | Role |
|---|---|---|
| `caddy` | `caddy:2-alpine` | Web server; auto-TLS in prod, plain HTTP in dev |
| `app` | your image | PHP-FPM on `:9000` |
| `queue` | same | `php artisan queue:work` |
| `scheduler` | same | `php artisan schedule:work` (replaces cron) |
| `db` | `postgres:17-alpine` | Primary datastore |
| `redis` | `redis:8-alpine` | Cache, session, queue backend |

## Image layout

`docker/Dockerfile` is multi-stage:

| Stage | Purpose |
|---|---|
| `vendor` | `composer install --no-dev` for the prod vendor tree |
| `assets` | `npm run build` to populate `public/build` |
| `base` | PHP-FPM 8.4 + extensions + shared entrypoint |
| `dev` | Adds Xdebug (off by default), uses host bind mount |
| `prod` | Bakes app + vendor + assets, optimises autoload, runs as `www-data` |

The shared entrypoint (`docker/entrypoint/app.sh`) does role-independent
bootstrap, optionally caches config/routes and runs migrations (only when
`RUN_MIGRATIONS=1`, which is pinned off for `queue`/`scheduler` so workers
never race the schema), then `exec`s the compose `command`.

## Local development

```bash
cp .env.example .env
cp docker/.env.docker.example docker/.env.docker

make up        # build dev image, start the full stack
make migrate   # first time only
```

App at `http://localhost:8080`.

| Target | Action |
|---|---|
| `make up` / `make down` | Start / stop the stack |
| `make sh` | Shell into the `app` container |
| `make tinker` | `php artisan tinker` inside the container |
| `make migrate` / `make migrate-fresh` | Run migrations |
| `make test` | PHPUnit inside the container |
| `make pint` | Pint formatter on dirty files |

The dev container bind-mounts the project root, so host edits are picked up
immediately. Set `WWW_USER_ID`/`WWW_GROUP_ID` to your host `id -u`/`id -g`
to avoid file-ownership issues. Xdebug is opt-in:
`XDEBUG_MODE=debug,develop make restart`.

## Production

A multi-arch image can't be loaded back into the local docker store, so:

| Target | What it does |
|---|---|
| `make build` | Multi-arch build into buildx cache (CI validation) |
| `make push` | Multi-arch build + push — **produces the deployable artifact** |
| `make build-local` | Single-arch build loaded locally |

```bash
APP_IMAGE=ghcr.io/your-org/laravel-api-boilerplate \
  APP_IMAGE_TAG=2026.05.14 make push
```

The server never builds — `docker/docker-compose.prod.yml` only references
`image:`. Deploy loop:

```bash
git pull
make prod-pull   # docker compose pull
make prod-up     # recreate changed services
```

### Auto-TLS

Caddy reads `${APP_DOMAIN}` from `docker/.env.prod` and provisions a Let's
Encrypt certificate on first boot (point DNS at the server; open ports 80 +
443). Behind an existing TLS proxy? Replace `Caddyfile.prod` with a plain
`:80` block.

### Migrations

`app` runs `migrate --force` on boot when `RUN_MIGRATIONS=1` (the default).
For zero-downtime, set `RUN_MIGRATIONS=0` and run migrations as a one-shot
before swapping containers.

## Environment files

| File | Read by | Holds |
|---|---|---|
| `.env` | Laravel + dev compose | App config, mail, API keys |
| `docker/.env.docker` | Dev compose only | UID/GID, ports, dev DB/Redis creds |
| `docker/.env.prod` | Prod compose + Laravel | Everything + image coords, domain, ACME email |

Only the `*.example` siblings are committed; the real files are
`.gitignore`d.
