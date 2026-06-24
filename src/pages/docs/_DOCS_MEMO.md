# Docs Site — Build Memo

> Reference notes for this website. Kept at `src/pages/docs/_DOCS_MEMO.md`.
> The leading underscore makes Astro skip it during routing, so it is NOT a
> published page — it's an internal memo only.

## What this site is

Marketing + documentation site for the **Laravel API Boilerplate**
(`../laravel-api-boilerplate/`). Built in this session.

- **Location:** `laravel-api-starter/website/` (standalone, sibling to the
  boilerplate — not inside it).
- **Stack:** Astro 5 + Tailwind v4 (`@tailwindcss/vite`) + DaisyUI v5.
- **Language:** English. Design: clean light / docs-oriented.
- **Code highlighting:** Shiki `github-light` (set in `astro.config.mjs`).
- Docs content is **rewritten for the web**, not copied verbatim from the
  boilerplate's `docs/*.md` (Mermaid diagrams turned into prose/lists,
  repo-internal "Key Files" tables trimmed, intros + cross-links added).

## Project layout

```
website/
  astro.config.mjs            # site URL + Shiki theme + tailwind vite plugin
  src/
    content.config.ts         # `docs` collection (glob loader + zod schema)
    content/docs/*.md         # ALL doc pages live here (the real content)
    data/nav.ts               # SECTION_ORDER + getDocNav() sidebar builder
    layouts/
      BaseLayout.astro        # html shell, Navbar + Footer
      DocsLayout.astro        # sidebar + prose + prev/next
    components/
      Navbar.astro  Footer.astro  DocsSidebar.astro
    pages/
      index.astro             # landing page
      docs/index.astro        # redirect -> /docs/introduction
      docs/[...slug].astro    # renders every entry in content/docs
    styles/global.css         # Tailwind import, DaisyUI plugin, .prose styles
```

Key point: **doc pages are NOT in `src/pages/`.** They are Markdown files
in `src/content/docs/` rendered through the `[...slug].astro` route.

## Frontmatter schema (required on every doc)

Defined in `src/content.config.ts`:

```yaml
---
title: string          # H1 + sidebar label + <title>
description: string     # meta description
section: string         # MUST match an entry in SECTION_ORDER
order: number           # sort within the section (ascending)
---
```

`section` valid values (and sidebar order) live in
`src/data/nav.ts` → `SECTION_ORDER`:

1. `Getting Started`
2. `Authentication`
3. `API Surface`
4. `Operations`
5. `Project`

A section only renders if it has at least one doc. To add a new section,
append it to `SECTION_ORDER` (order in that array = order in the sidebar).

## How to add a new module's docs (the repeatable recipe)

1. Read the source doc in `../laravel-api-boilerplate/docs/<module>.md`
   (and `docs/README.md` for where it fits).
2. Create `src/content/docs/<slug>.md`. The filename (minus `.md`) is the
   URL slug → `/docs/<slug>`.
3. Add frontmatter with the right `section` and the next free `order`
   number in that section.
4. Rewrite for the web, matching the established voice:
   - Lead with a 1–2 sentence "what this is".
   - Keep config blocks, endpoint tables, curl/code examples.
   - Convert Mermaid diagrams to numbered steps or short prose.
   - Trim heavy repo-internal "Key Files" tables to a sentence or drop.
   - Cross-link related docs as `/docs/<slug>`.
5. If it's a brand-new area, add the section to `SECTION_ORDER` first.
6. Update cross-links / the landing page feature list in
   `src/pages/index.astro` if the module deserves a feature card.
7. Build + verify (below).

## Build & verify

```bash
cd website
npm install        # first time only
npm run build      # must succeed; prints page count
npm run dev        # local dev server for visual check
npm run preview    # serves the production build
```

Quick smoke check after a build (preview running on :4321):

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/docs/<slug>/
```

## Docs currently shipped (17)

| Section | Slugs (in order) |
|---|---|
| Getting Started | introduction, installation, configuration |
| Authentication | authentication, otp, social-auth, email-verification, password-policy |
| API Surface | api-responses, rate-limiting, rbac, files, admin |
| Operations | notifications, audit, docker |
| Project | roadmap |

Source docs in the boilerplate that map 1:1 to the above:
`docs/{authentication,otp,social-auth,email-verification,password-policy,
api-responses,rate-limiting,rbac,files,notifications,audit,docker}.md` plus
`docs/devlog/2026-05-10-boilerplate-roadmap.md` → `roadmap.md`.

## Known placeholders / TODO for later

- `astro.config.mjs` → `site:` is a placeholder domain.
- Navbar + Footer GitHub links point to `https://github.com` (placeholder).
- No dark-mode toggle yet (DaisyUI `dark` theme is configured in
  `global.css` and respects `prefers-color-scheme`, but there's no manual
  switch).
- No in-page table of contents (TOC) or search.
- Roadmap "Planned" items, when shipped in the boilerplate, will each need
  a new doc added via the recipe above (e.g. 2FA, login history, account
  lockout, attachments, health endpoint, i18n).

## Conventions to keep consistent when extending

- Voice: concise, second person, practical. Match existing docs.
- Every doc must have all 4 frontmatter fields and a single `# H1` that
  equals `title`.
- Endpoint tables use Method / Endpoint / Auth / Description columns.
- Config examples are real PHP/env snippets from the boilerplate, trimmed.
- Prefer `/docs/<slug>` internal links (relative to site root).
