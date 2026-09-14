# Setting up a TinaCMS site end to end

Every step from an empty repo to an editable site on a custom domain, with production deploying from
`main` and a preview URL per branch. Written from what was actually done for `tatjanizza.com`; this
is the same flow to follow for `kawaiikaja.com`.

Nothing here is specific to this repo — the same order works for any Tina + Next.js + Vercel site.

**Do the steps in order.** Several of them fail in confusing ways if an earlier one is missing: a
build with no env vars, a TinaCloud project with no `tina-lock.json`, a domain added before a host
exists.

---

## The short version

| # | Step | Where | Leaves behind |
|---|---|---|---|
| 1 | Create the GitHub repo | GitHub | — |
| 2 | Add the Tina + Next.js code | repo | `tina/`, `app/`, `content/` |
| 3 | Create the TinaCloud project, connect the repo | app.tina.io | a Client ID and a token |
| 4 | Generate and commit `tina/tina-lock.json` | local → repo | the file TinaCloud indexes from |
| 5 | Create the Vercel project from the repo | Vercel | production deploys on `main` |
| 6 | Add env vars | **Vercel** (and local `.env`) | builds that work |
| 7 | Add the domain to the Vercel project | Vercel | the DNS values you need next |
| 8 | Point the domain | DreamHost | a working custom domain |
| 9 | Set the TinaCloud Site URLs | app.tina.io | working "Edit with TinaCMS" links |
| 10 | Decide preview access | Vercel | previews your family can actually open |

---

## 1. Create the repo

A normal GitHub repo. It must be on GitHub — TinaCloud reads and writes content by committing to it
through a GitHub App, so GitLab/Bitbucket are not an option for TinaCloud.

It can be private. TinaCloud gets access through the app install, not through the repo being public.

## 2. Add the Tina + Next.js code

The shape that matters (see [CLAUDE.md](../CLAUDE.md) for why each piece exists):

```
tina/config.tsx           clientId, token, branch, media, build, schema
tina/collection/*.ts      collections; import block schemas from components/
app/…/page.tsx            server component — runs the query
app/…/client-page.tsx     'use client' — useTina() and render
content/pages/*.mdx       the content itself
```

In `package.json`, the build script **must** run `tinacms build` before `next build`:

```json
"build": "tinacms build && next build"
```

Without it `/admin` is never generated and the editor 404s in production.

In `tina/config.tsx`, the branch must fall back rather than be hardcoded — this is what makes preview
branches editable later:

```ts
branch:
  process.env.NEXT_PUBLIC_TINA_BRANCH! ||          // explicit override
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF! || // Vercel sets this per deployment
  process.env.HEAD!,                                // Netlify
```

At this point `pnpm build-local` should already pass — that needs no credentials at all.

## 3. Create the TinaCloud project

At **https://app.tina.io** → new project → connect GitHub → pick the repo.

Then collect two values from the project:

| Value | Tab | Secret? |
|---|---|---|
| **Client ID** | Overview | **No.** It ships to the browser as `NEXT_PUBLIC_TINA_CLIENT_ID`. Safe to commit in `.env.example`. |
| **Token** | Tokens | **Yes.** Read/write access to the content in your repo. Never commit it. |

> [!NOTE]
> Nothing is pasted into the code here. The Client ID goes into environment variables, not into
> `tina/config.tsx` — the config reads it from `process.env`.

## 4. Commit `tina/tina-lock.json`

This is the step that is easy to miss, and TinaCloud will not index your content without it.

```bash
pnpm dev      # generates tina/tina-lock.json
# stop it, then:
git add tina/tina-lock.json && git commit -m "chore: add tina lock file"
```

`tina/__generated__/` and `public/admin/` are **generated and gitignored** — do not commit those.
`tina-lock.json` is the exception: it is generated *and* committed. Regenerate and re-commit it
whenever the schema changes.

## 5. Create the Vercel project

Vercel → Add New → Project → import the repo. Framework detection picks up Next.js.

Defaults are right: production deploys from `main`, and **every other branch automatically gets a
preview deployment** at `https://<project>-git-<branch>-<team>.vercel.app` (slashes in the branch
name become dashes; long names get truncated with a hash). No configuration and no GitHub Actions
workflow are needed for that — Vercel builds on push.

## 6. Environment variables — Vercel, not GitHub

> [!IMPORTANT]
> **Env vars go in the Vercel project, not in GitHub.** GitHub secrets are for GitHub Actions, and
> there is no Actions workflow here. Vercel does the building, so Vercel needs the values.
> They also go in your local `.env`, which is gitignored.

Vercel → Project → Settings → Environment Variables:

| Variable | Value | Which environments |
|---|---|---|
| `NEXT_PUBLIC_TINA_CLIENT_ID` | the Client ID | All |
| `TINA_TOKEN` | the token | All |
| `NEXT_PUBLIC_TINA_BRANCH` | `main` | **Production only** |

> [!WARNING]
> `NEXT_PUBLIC_TINA_BRANCH` must be scoped to **Production**, not "All". If it is set for Preview
> too, it wins over the fallback chain in step 2 and every preview branch edits content on `main` —
> so editing a draft on a branch quietly writes to the live site. Leave it unset for Preview and
> Vercel's own `NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF` fills in the actual branch.

These are read at **build time**, so after changing any of them you must redeploy — editing the value
alone changes nothing on the running site.

## 7. Add the domain in Vercel *before* touching DNS

Vercel → Project → Settings → Domains. Add both:

- `www.example.com` — the real site
- `example.com` — set to **redirect to `www`** (308)

Vercel then shows, under *DNS configuration*, the exact records that domain needs.

> [!WARNING]
> Read those values from **your** project every time. Vercel issues per-project targets and its
> anycast IPs rotate. The values you will find by googling (`76.76.21.21`,
> `cname.vercel-dns.com`) are legacy and will silently point at the wrong place. Never copy the IPs
> out of another project's docs — including this repo's.

## 8. Point the domain (DreamHost)

Two ways. Pick one; do not mix them.

### A. Delegate the whole zone to Vercel — what `tatjanizza.com` does

DreamHost panel → Domains → **Registrations** → the domain → DNS / nameservers → custom nameservers:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

That is the **only** change made in DreamHost. No records are created there. Once the delegation
lands, Vercel creates the A records, the CAA records and the TLS certificate by itself.

- DreamHost stays the **registrar** — renewals and transfers are still its job.
- DreamHost is no longer the **DNS host** — records added in its panel do nothing, and its `dns-*`
  API cannot touch this domain any more.
- Anything else on the domain (email/MX, verification TXT) must be recreated **in Vercel DNS**.

### B. Keep DNS at DreamHost

DreamHost panel → Manage Domains → DNS → add the apex `A` record and the `www` `CNAME` exactly as
Vercel's *DNS configuration* panel lists them. Never add both an `A` and a `CNAME` for the same
hostname, and the apex must be an `A` — a CNAME is not legal at a zone apex.

Only this option is scriptable: DreamHost's surviving API is `dns-add_record` /
`dns-remove_record` / `dns-list_records` (there is no update — remove, then add). Every registrar
operation, **the nameserver change in option A included, is panel-only** — DreamHost removed those
API commands.

### Either way

Propagation is hours, not minutes. Vercel issues the certificate on its own once it can see the
records; re-adding the domain repeatedly does not speed anything up and usually confuses it.

## 9. Set the TinaCloud Site URLs

app.tina.io → project → **Site URLs** → Configure. Add:

- `http://localhost:3000`
- `https://www.example.com`
- `https://example.com`

These power the "Edit with TinaCMS" links. They cannot work before step 8 has propagated — if the
domain does not resolve, the link opens nothing.

## 10. Preview access — the part that bit us

By default Vercel puts **Vercel Authentication** in front of preview deployments: opening a preview
URL redirects to a Vercel login, and the visitor needs a Vercel account *with access to the team*.
That is fine for developers and useless for anyone else — a family member or a client just sees a
login wall they cannot get past, even after signing up, because their new account is not on the team.

Vercel → Project → Settings → **Deployment Protection**. The options:

| Option | Effect | Availability |
|---|---|---|
| Vercel Authentication | Team members only. The default. | all plans |
| Password Protection | One shared password | **paid plans only** |
| Shareable Link | A per-deployment bypass link | all plans |
| **Off** | Anyone with the URL can open the preview | all plans |

On the Hobby plan, password protection is not offered, so the realistic choices are a shareable link
per deployment or turning protection off. **For `tatjanizza` it is off**, so the preview URL can just
be sent to whoever needs to look at it.

What that does and does not mean:

- The preview is public to anyone **who has the URL**. The URLs are long and not listed anywhere, but
  treat them as unlisted, not private. Do not put anything confidential in a preview.
- It is **not** indexed by search engines: Vercel sends `x-robots-tag: noindex` on preview
  deployments automatically. (Verified: `curl -I` on the current preview returns it.)
- Production is unaffected — this setting only governs preview URLs.
- `/admin` is still protected on every deployment. That is TinaCloud's own login, not Vercel's, so
  turning this off does not let a stranger edit the site.

## Which login is which

Four separate systems, four separate permissions. Most "I can't get in" problems are a mix-up
between them.

| To do this | You need | Granted by |
|---|---|---|
| Push code | GitHub access to the repo | GitHub |
| Let TinaCloud commit content | the TinaCloud GitHub App installed on the repo | done during step 3 |
| Edit content at `/admin` | a **TinaCloud** account invited to the project | app.tina.io → Collaborators |
| See Vercel builds, logs, settings | a **Vercel** account on the team | Vercel → Team → Members |
| Open a protected preview URL | a Vercel account on the team, *or* protection off | Vercel → Deployment Protection |

An editor who only writes content needs **only** the TinaCloud invite. Do not add them to the Vercel
team or GitHub for that — it grants far more than they need and does not help them edit.

---

## Checking it worked

```bash
# 1. nameservers — should be your DNS host, whichever you chose in step 8
curl -s -H 'accept: application/dns-json' \
  'https://dns.google/resolve?name=example.com&type=NS'

# 2. apex redirects to www, www serves the site
curl -sS -o /dev/null -w '%{http_code} -> %{redirect_url}\n' https://example.com/
curl -sS -o /dev/null -w '%{http_code}\n' https://www.example.com/

# 3. a preview URL opens without a login (200, not 401/307-to-vercel.com)
curl -sS -o /dev/null -w '%{http_code}\n' https://<project>-git-<branch>-<team>.vercel.app/
```

Then by hand:

- [ ] `https://www.example.com/admin` loads and asks for a TinaCloud login
- [ ] an edit made in `/admin` appears as a commit on the expected branch
- [ ] pushing to `main` triggers a production deploy (~1–3 min)
- [ ] pushing to any other branch produces a preview URL
- [ ] a preview's `/admin` edits **that branch**, not `main` (this is the step-6 trap)

## When it goes wrong

| Symptom | Cause |
|---|---|
| `/admin` 404s in production | build command is missing `tinacms build &&` |
| Build fails on Vercel, passes locally | env vars missing in Vercel, or set for the wrong environment |
| Changing an env var changed nothing | they are read at build time — redeploy |
| TinaCloud shows no content | `tina/tina-lock.json` not committed, or stale after a schema change |
| Editing a preview changes the live site | `NEXT_PUBLIC_TINA_BRANCH` scoped to All instead of Production |
| Domain still not live after an hour | nameserver changes take hours; check the NS record actually changed |
| Records added in DreamHost do nothing | the zone was delegated to Vercel (option A) — edit it in Vercel |
| Someone cannot open a preview | Deployment Protection — see step 10 |
| Editor cannot log in to `/admin` | they need a TinaCloud invite, not a Vercel or GitHub account |
