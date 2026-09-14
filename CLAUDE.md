# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.
Read [README.md](./README.md) first — setup, commands and the block-adding steps are there and are
not repeated here.

## What this repo is

A TinaCMS + Next.js 15 (App Router) site for **kawaiikaja.com**. Content is Markdown/MDX and JSON in
`content/`, read through Tina's generated GraphQL client. **There is no database.**

It is a scaffold: two blocks, two placeholder pages, no design, not deployed. Treat anything here as
a starting shape to build on, not as finished work worth preserving.

## Never push a broken build

There is no CI. Run the check before every push, on any branch:

```bash
./scripts/preflight.sh   # 0 = safe, 1 = the change is broken, 2 = the machine is dirty
```

Exit 2 means the check could not run (a leftover process on a port, a full disk) and says **nothing**
about the change — do not push on a 2. The script picks free ports itself, because Tina's default
4001 is also `pnpm dev`'s, and when that port is taken Tina does not fail loudly: it prints "server
listening", the client talks to whatever is squatting there, and the build dies with
`HeadersTimeoutError` and "Failed to collect page data", which names no port.

`NODE_ENV=production` is set explicitly inside the script — without it Next prerenders `/404` with
the dev pages runtime and dies on `<Html> should not be imported outside of pages/_document`, an
error unrelated to your change.

## Architecture

### Server/client split (every route)

Routes are two files:

- `page.tsx` — server. `await client.queries.X()` from `@/tina/__generated__/client`, then spreads
  the whole query result into the client page (`<ClientPage {...data} />`). Also exports
  `revalidate = 300` and, for the catch-all, `generateStaticParams()` — which must page through the
  `pageConnection` cursors, not just read the first batch.
- `client-page.tsx` — `'use client'`, calls `useTina({ query, data, variables })` and renders.

`useTina` returns only `data` — no loading or error state — so **all error handling belongs in the
server component**. That is why the catch-all wraps the query in try/catch and calls `notFound()`.

Import path is `@/tina/__generated__/client` (default export), not `@/tina/client`.

### Block-based pages

`content/pages/*.mdx` holds a `blocks` array in frontmatter; `components/blocks/index.tsx` switches
on `block.__typename` (`PageBlocksHero`, `PageBlocksContent`, …) to pick a component. Adding a block
touches three files — see README.

**Schema co-location is the convention:** `tina/collection/*.ts` imports from `components/`, never
the reverse. Collection files stay thin.

### Generated code

`tina/__generated__/` and `public/admin/` are written by `tinacms dev` / `tinacms build` and are
gitignored. Never edit or commit them. After changing a schema, restart `pnpm dev` so the types and
the GraphQL client regenerate — a stale generated type is the usual cause of a confusing build error.

## Conventions

- **Tailwind v4, configured entirely in `styles.css`** via `@theme inline` + CSS custom properties
  (oklch). There is no `tailwind.config.js` and adding one would be wrong.
- Import alias `@/*` → repo root.
- Biome does lint and format: single quotes, single-quoted JSX attributes, 2-space indent,
  **line width 160**, semicolons always, ES5 trailing commas. `noExplicitAny` and
  `noUnusedVariables` are off.
- Files kebab-case, components PascalCase. Generated types are `PageQuery` / `PageConnectionQuery`
  from `@/tina/__generated__/types`.
- Every editable DOM element needs `data-tina-field={tinaField(parentObject, 'fieldName')}` — the
  parent object and a field name, never a string literal or a computed value. A missing attribute
  means the editor cannot click that element to edit it.
- `public/uploads/` is the media store root.

## Secrets

`NEXT_PUBLIC_TINA_CLIENT_ID` is public and is committed in `.env.example`. **`TINA_TOKEN` is not** —
it is a read/write token for the content repo. Never commit it, never paste it into a file in this
repo, never echo it into a log. It belongs in a local `.env` and in the host's environment settings.

## Domain and hosting — not set up

`kawaiikaja.com` is registered at DreamHost and still delegates to `ns1`–`ns3.dreamhost.com` with no
A or CNAME record, so nothing resolves. No host has been chosen for this repo yet.

Do not assume a deploy target, invent DNS records, or copy values from the sibling `tatjanizza`
project — its IPs are per-project and rotate. When a host is picked, read the required records from
that host and write them down here.

`app/layout.tsx` hardcodes `metadataBase` to `https://www.kawaiikaja.com` so OpenGraph image paths
resolve absolutely — update it there if the domain changes.
