# kawaii

Website for **kawaiikaja.com**, built with [TinaCMS](https://tina.io) and Next.js 15 (App Router).
Content lives as MDX files in `content/` and is editable in the browser at `/admin`.

## Status

Scaffold only. The page shape, the editing setup and the build check are in place; there is no real
content, no design, and nothing is deployed yet.

| | |
|---|---|
| TinaCloud project | `kawaii` — https://app.tina.io |
| Client ID | `be9b3b32-6fcf-4d09-844d-dcf4e5dcc509` (public, ships to the browser) |
| Intended domain | `kawaiikaja.com` — **registered at DreamHost, not pointed anywhere yet** |
| Host | not chosen yet |

> [!NOTE]
> `kawaiikaja.com` still delegates to `ns1`–`ns3.dreamhost.com` and has no A or CNAME record, so the
> two site URLs configured in TinaCloud cannot resolve yet. Pick a host first, then point DNS at it.
>
> There is a second repository, `easingthemes/kawaii-kaja`, holding an untouched AEM Edge Delivery
> boilerplate for the same name. Only one of the two should end up serving the domain.

## Setup

Node v22 (see `.nvmrc`), pnpm.

```bash
pnpm install
cp .env.example .env     # then paste the real TINA_TOKEN into .env
pnpm dev
```

`.env.example` already carries the client ID, which is public. **`TINA_TOKEN` is the secret** — read
it from the TinaCloud project, keep it out of git, and set it in the host's environment variables
too, not only locally.

## Commands

```bash
pnpm dev          # tinacms dev (content API on :4001) + next dev --turbopack on :3000
pnpm build        # tinacms build (cloud) + next build — needs valid TinaCloud env vars
pnpm build-local  # build against local files, no cloud credentials needed
pnpm lint         # biome
pnpm dev:build    # next build only, skips tina codegen
npx tsc --noEmit  # typecheck
```

| URL | |
|---|---|
| http://localhost:3000 | the site |
| http://localhost:3000/admin | visual editing |
| http://localhost:4001/altair/ | GraphQL playground for the content API |

## Before pushing

There is no CI in this repo, so run the local check:

```bash
./scripts/preflight.sh   # 0 = safe, 1 = the change is broken, 2 = the machine is dirty
```

It installs, lints, then runs the full production build — schema validation, typecheck and a
prerender of every page. **Exit 2 means nothing was verified** (a busy port, a full disk); it says
nothing about your change, so do not push on a 2.

No TinaCloud credentials are needed: the script uses `tinacms build --local`, which serves a GraphQL
API over `content/` and is enough for `next build`. Everything it generates is gitignored.

## Structure

```
app/                      routes — every one split into page.tsx (server) + client-page.tsx (client)
  page.tsx                the home page, reads content/pages/home.mdx
  [...urlSegments]/       every other page
components/blocks/        one file per block: the component AND its Tina schema
content/pages/*.mdx       the pages themselves — frontmatter with a `blocks` array
tina/config.tsx           TinaCMS config
tina/collection/page.ts   the `page` collection, imports the block schemas
styles.css                all Tailwind v4 config — there is no tailwind.config.js
scripts/preflight.sh      the pre-push build check
```

`tina/__generated__/` and `public/admin/` are generated on every build. They are gitignored — never
edit them, never commit them.

## Adding a block

Three edits, always:

1. `components/blocks/<name>.tsx` — export the component **and** its `Template` schema from the same
   file (this is the core convention: schemas live with components, not the other way round).
2. `tina/collection/page.ts` — add the schema to `templates`.
3. `components/blocks/index.tsx` — add a `case` to the `Block` switch on `__typename`.

Restart `pnpm dev` afterwards so the generated types catch up.

Every element an editor should be able to click needs `data-tina-field={tinaField(parent, 'field')}`
— pass the parent object and a field name, never a string literal.
