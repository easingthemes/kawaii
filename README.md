# kawaii

Journalist-blog site that pulls content from a Google Drive folder tree.

```
Drive root folder
├── events
│   ├── concerts
│   │   ├── Festival in Kyoto.gdoc        →  /events/concerts/festival-in-kyoto/
│   │   └── Underground Tokyo.gdoc        →  /events/concerts/underground-tokyo/
│   └── conferences
│       └── DevDay Recap.gdoc             →  /events/conferences/devday-recap/
├── interviews
│   └── Yumi Sato.gdoc                    →  /interviews/yumi-sato/
└── _drafts                                ←  ignored (any folder/file starting with `_`)
```

## How it works

1. Authors write articles in Google Docs inside the shared root folder.
2. They click **Kawaii → Publish to site** in the Docs menu.
3. The Apps Script fires a GitHub `repository_dispatch`.
4. GitHub Actions runs `scripts/sync-docs.mjs`, which converts each Doc to
   Markdown + frontmatter, downloads inline images, commits to `main`, builds
   the Astro site, and deploys to GitHub Pages.

A nightly cron also runs the sync as a safety net.

## Stack

- **Astro 5** — static site, renders the markdown content collection.
- **Google Drive API + Google Docs API** — sync source.
- **Apps Script** — adds the Publish menu in Docs.
- **GitHub Actions + GitHub Pages** — build & host.

## Local setup

```sh
npm install
cp .env.example .env       # then fill in
npm run sync:dry           # see what would be pulled, no writes
npm run sync:docs          # actually pull
npm run dev                # http://localhost:4321
```

Required env:

| Var | Where |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Raw JSON key. Service account must have **Drive API** + **Docs API** enabled, and the root folder must be shared with its email (Viewer is enough). |
| `ROOT_FOLDER_ID` | The folder ID from the Drive URL: `https://drive.google.com/drive/folders/<ID>` |

## Authoring rules

### Categories

Folder path = category. Subfolders nest. Folder names are kebab-cased.

### Status / drafts

Three ways to keep a doc out of the live site:

1. Put the doc (or its parent folder) under a name starting with `_`
   (`_drafts/`, `_scratch/`).
2. In Drive, right-click the doc → **File details**, set the description to:
   ```yaml
   draft: true
   ```
3. Set `status: review` to deploy to a preview branch only (CI passes
   `--include-review` for the preview job).

### Frontmatter overrides via Drive description

The Drive **description** field (right-click doc → File details → Description)
is parsed as YAML and merges into the article's frontmatter. Everything is
optional.

```yaml
title: Custom display title (default: doc name)
slug: custom-url-slug
summary: One-sentence dek shown on listings.
tags: [festival, kyoto, photo-essay]
location: Kyoto, Japan
eventDate: 2026-04-12
publishedAt: 2026-04-15
cover: /images/custom-cover.jpg
status: published          # or `review`
```

### What we pull from each Doc

| Source | Used for |
|---|---|
| Doc title (file name) | `title`, default `slug` |
| Drive folder path | `category` |
| Drive description (YAML) | Frontmatter overrides |
| `createdTime` | Default `publishedAt` |
| `modifiedTime` | `updatedAt` |
| `lastModifyingUser.emailAddress` | Default `author` |
| Body content | Markdown body |
| Inline images | Downloaded to `public/images/articles/<slug>/`, paths rewritten |
| First non-heading paragraph | Default `summary` |
| Headings (H1/H2/H3) | Markdown headings |
| Bold / italic / strikethrough / links / monospace | Inline markdown |
| Bulleted & numbered lists | Markdown lists |
| Tables | Markdown tables |
| Comments / suggestions | Skipped (only accepted text) |

## Production setup

### 1. GitHub repo secrets

Settings → Secrets and variables → Actions:

- `GOOGLE_SERVICE_ACCOUNT_JSON` — raw JSON
- `ROOT_FOLDER_ID` — Drive folder ID

…and **variables**:

- `SITE_URL` — e.g. `https://easingthemes.github.io`
- `BASE_PATH` — e.g. `/kawaii/` (or `/` for a custom domain / user pages)

### 2. GitHub Pages

Settings → Pages → Source: **GitHub Actions**.

### 3. Apps Script publish button

See `apps-script/publish.gs` — paste it into a script bound to the root
folder (or `script.google.com` → New project), set three Script Properties
(`GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_TOKEN`), reload any doc inside the
folder, and a **Kawaii** menu appears next to **Help**.

The PAT only needs **Actions: Read and write** scope on this single repo.
