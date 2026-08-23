# Laravel API Boilerplate — Website

Marketing and documentation site for the **[Laravel API Boilerplate](../laravel-api-boilerplate/)**, a production-ready Laravel 13 starter for building RESTful APIs.

Built with **Astro 7**, **Tailwind CSS v4**, and **DaisyUI v5**. The landing page sells the boilerplate; the `/docs` section is a sidebar-driven documentation system rendered from Markdown.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | [Astro 7](https://astro.build) (static output) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite` |
| Components | [DaisyUI v5](https://daisyui.com) |
| Code highlighting | Shiki (`github-light` theme, set in `astro.config.mjs`) |
| Content | Astro content collections (`glob` loader + Zod schema) |
| Language | TypeScript (`astro/tsconfigs/strict`) |

## Getting started

```bash
npm install        # install dependencies (first time only)
npm run dev        # start the dev server at http://localhost:4321
```

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local dev server with HMR |
| `npm run build` | Build the production site to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run astro` | Run the Astro CLI directly |

## Project structure

```
website/
  astro.config.mjs            # site URL, Shiki theme, Tailwind vite plugin
  src/
    content.config.ts         # `docs` collection (glob loader + Zod schema)
    content/docs/*.md         # all documentation pages (the real content)
    data/nav.ts               # SECTION_ORDER + getDocNav() sidebar builder
    layouts/
      BaseLayout.astro        # html shell, Navbar + Footer
      DocsLayout.astro        # sidebar + prose + prev/next nav
    components/
      Navbar.astro
      Footer.astro
      DocsSidebar.astro
    pages/
      index.astro             # landing page
      docs/index.astro        # redirect -> /docs/introduction
      docs/[...slug].astro    # renders every entry in content/docs
    styles/global.css         # Tailwind import, DaisyUI plugin, .prose styles
  public/                     # static assets (favicon, etc.)
```

> **Note:** Documentation pages are **not** in `src/pages/`. They are Markdown
> files in `src/content/docs/` rendered through the catch-all `[...slug].astro`
> route. See `src/pages/docs/_DOCS_MEMO.md` for detailed build notes.

## Documentation system

Each doc is a Markdown file in `src/content/docs/`. The filename (minus `.md`)
becomes the URL slug — `installation.md` → `/docs/installation`.

### Required frontmatter

Validated by the Zod schema in `src/content.config.ts`:

```yaml
---
title: string          # H1 + sidebar label + <title>
description: string    # meta description
section: string        # must match an entry in SECTION_ORDER
order: number          # sort order within the section (ascending)
---
```

### Sections

The sidebar order is defined by `SECTION_ORDER` in `src/data/nav.ts`:

1. Getting Started
2. Authentication
3. API Surface
4. Operations
5. Project

A section only renders when it contains at least one doc. To add a new section,
append it to `SECTION_ORDER` (array order = sidebar order).

### Adding a doc page

1. Create `src/content/docs/<slug>.md`.
2. Add the four frontmatter fields, using the correct `section` and the next
   free `order` number in that section.
3. Write the content. If it warrants a homepage feature card, also update the
   `features` list in `src/pages/index.astro`.
4. Run `npm run build` to verify it compiles.

## Building & deploying

```bash
npm run build      # outputs static site to dist/
```

The output in `dist/` is fully static and can be hosted on any static host
(Netlify, Vercel, Cloudflare Pages, GitHub Pages, etc.).

> Before deploying, update the placeholder `site` URL in `astro.config.mjs` and
> the GitHub links in `Navbar.astro` / `Footer.astro`.

## License

MIT
