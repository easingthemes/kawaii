# kawaii

Website for **Kawaii**, with all content editable through a visual CMS rather than by editing code.

The setup is a clone of [easingthemes/tatjanizza](https://github.com/easingthemes/tatjanizza) —
Next.js + TinaCMS, content stored as files in the repo, no database. The code is complete; the
content in `content/` is still placeholder and the theme in `styles.css` is still the one inherited
from that site.

| | |
|---|---|
| Site | https://kawaii.vercel.app *(Vercel project not created yet — see Deployment)* |
| Content editing | https://kawaii.vercel.app/admin |

## Stack

- **[Next.js 15](https://nextjs.org)** App Router, React 18, TypeScript
- **[TinaCMS](https://tina.io)** — content lives as Markdown/MDX/JSON in `content/`, queried through
  Tina's generated GraphQL client. There is no database.
- **Tailwind CSS v4** configured entirely in `styles.css` (no `tailwind.config.js`), with
  [shadcn/ui](https://ui.shadcn.com) primitives in `components/ui/`
- **Biome** for lint and formatting
- **Vercel** for hosting

## Quick start

Requires Node 22 (see `.nvmrc`) and pnpm.

```bash
pnpm install
cp .env.example .env   # then fill in the values below
pnpm dev
```

`.env` needs credentials from your [TinaCloud](https://app.tina.io) project:

```
NEXT_PUBLIC_TINA_CLIENT_ID=
TINA_TOKEN=
NEXT_PUBLIC_TINA_BRANCH=main
```

Local development works without them: `pnpm build-local` and `./scripts/preflight.sh` build against
the filesystem content. TinaCloud is only needed for `/admin` on a deployed site.

### Local URLs

| URL | |
|---|---|
| http://localhost:3000 | the site |
| http://localhost:3000/admin | visual editing |
| http://localhost:3000/exit-admin | log out of TinaCloud |
| http://localhost:4001/altair/ | GraphQL playground for the content API |

## Documentation

| Document | For |
|---|---|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | developing: commands, adding blocks, conventions, gotchas |
| [docs/editing-content.md](./docs/editing-content.md) | editing the site's words and images — no code |
| [CLAUDE.md](./CLAUDE.md) | architecture notes, also read by AI coding assistants |

## Setup still to do

This repo carries working code but has never been deployed. Before it is a live site:

1. **Create the Vercel project** and point it at this repo. Production deploys from `main`; every
   branch gets a preview at `https://kawaii-git-<branch>-<team>.vercel.app`.
2. **Create the TinaCloud project** and set `NEXT_PUBLIC_TINA_CLIENT_ID`, `TINA_TOKEN` and
   `NEXT_PUBLIC_TINA_BRANCH` in the Vercel project settings, not only in local `.env`.
3. **Set the real domain** in `lib/seo.ts` (`SITE_URL`, `SITE_NAME`, `SITE_DESCRIPTION`) —
   `metadataBase` and all OpenGraph paths are built from it.
4. **Replace the placeholder content** in `content/pages/` and `content/global/index.json`, and the
   site mark in `components/icon.tsx`.
5. **Retune the theme** in `styles.css` — the palette and fonts are inherited, not chosen for Kawaii.

## Deployment

Hosted on **Vercel**, deployed automatically from `main`. Pushing to `main` triggers a production
deploy — there is no CI workflow in this repo and no manual step. A push is not instant: Vercel needs
roughly **one to three minutes** to build. Every branch gets its own public preview deployment; see
[CONTRIBUTING.md](./CONTRIBUTING.md#previews) for the URL pattern.

> [!NOTE]
> Vercel is a deliberate choice over GitHub Pages. Static export (`output: 'export'`) would work —
> this app has no API routes, middleware, or server actions — but it would disable `next/image`
> optimization, drop ISR in favour of a full rebuild on every content save, and silently ignore the
> `rewrites()` and `headers()` config in `next.config.ts`. Don't convert to a static export without
> revisiting those tradeoffs.

## Credits & licence

Built from the [Tina Cloud Starter](https://github.com/tinacms/tina-cloud-starter) by SSW, via
[easingthemes/tatjanizza](https://github.com/easingthemes/tatjanizza). The inherited starter code is
under the [Apache 2.0 licence](./LICENSE); see [NOTICE](./NOTICE) for the original attribution, which
Apache 2.0 requires be kept.

Site content — writing, images and artwork — is **not** covered by that licence.

### Useful references

- [TinaCMS documentation](https://tina.io/docs/)
- [VS Code GraphQL extension](https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql)
  for autocompletion against the generated schema
