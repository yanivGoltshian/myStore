# חשמל חנקין — Electro Hankin

The production storefront **and** self-hosted admin CMS for **חשמל חנקין (Electro Hankin)**,
a Hebrew / RTL home-appliance and lighting retailer in Holon, Israel.

- **Live site:** https://electro-hankin.vercel.app
- **Catalog:** ~565 appliance products across 89 categories, plus a ~7,000-item lighting
  (תאורה) catalog — all editable through the admin panel.
- **Hosting cost:** **~$0 / month** (static export on free CDN + free serverless admin).

It is a fast **static export** with **no database**: all content lives as **JSON files in
this repo**, and the admin panel writes content by **committing back to the repo via the
GitHub API**, which triggers a rebuild. Free, versioned, and trivially backed up.

---

## How it works (the core trick)

```
                         ┌─────────────────────────────────────────┐
                         │              This Git repo               │
                         │  src/data/*.json   (the "database")      │
                         │  public/images/**  (product/banner files)│
                         └───────▲───────────────────────┬──────────┘
        commit content          │                        │ push triggers builds
        via GitHub API          │                        │
                         ┌───────┴────────┐      ┌────────▼─────────┐   ┌──────────────┐
   admin user  ───────▶  │ Admin CMS +    │      │  Public site CI  │   │ Public site  │
   (Google login)        │ write API      │      │  (static build)  │──▶│ Vercel (CDN) │
                         │ (Azure Funcs)  │      └──────────────────┘   └──────────────┘
                         └────────────────┘
```

Two deploy targets, both on **free tiers**:

1. **Public site** — static export served by **Vercel** (free). Pure HTML/JS/images, no
   server. This is what customers hit: https://electro-hankin.vercel.app
2. **Admin + write API** — the same export **plus** tiny Azure Functions, hosted on
   **Azure Static Web Apps Free tier** (`jolly-bush-07bb10a03.7.azurestaticapps.net`). The
   `/admin/` panel lives here; the API verifies the admin and commits JSON/images to GitHub.

> The admin lives at `/admin/` on the Azure host and is `noindex`. If you open the admin on
> the public Vercel URL, a guard bounces you to the Azure (OAuth-authorized, API-backed) host.

---

## Tech stack

- **Next.js (App Router) static export** (`output: "export"`), React, TypeScript, Tailwind.
- **Data as JSON** in `src/data/` imported at build time → fully static pages.
- **Azure Functions (Node, ESM `.mjs`)** under `/api` for admin writes.
- **Google Identity Services** for admin login; the server verifies the ID token + an email
  allowlist.
- **PWA**: web manifest + hand-written service worker, installable (A2HS).

---

## Running locally

```bash
npm install          # first time only

npm run dev:full     # ⭐ storefront + admin together → http://localhost:8787/
                     #    admin panel at http://localhost:8787/admin/

npm run dev          # storefront only             → http://localhost:3000
npm run build        # static export               → ./out
npm run preview      # serve the built ./out + admin → http://localhost:8787/
```

**Recommended: `npm run dev:full`** — one command that starts the Next dev server (`:3000`,
hot reload) **and** the zero-dependency admin harness (`:8787`) together. Open
`http://localhost:8787/` and the whole site works, **admin included**.

Why not plain `npm run dev`? It runs only Next, which does **not** serve `/api/*` (those are
Azure Functions in production), so the admin panel 404s on its own. Use `dev:full` for any
admin work.

| Command           | What it does                                              |
|-------------------|----------------------------------------------------------|
| `npm run dev:full`| ⭐ Storefront **+ admin** together (`http://localhost:8787/`) |
| `npm run dev`     | Storefront dev server only (`http://localhost:3000`)     |
| `npm run dev:api` | Admin harness alone — needs `npm run dev` already running (`:8787/admin/`) |
| `npm run build`   | Static export to `./out` (runs the prebuild search index)|
| `npm run preview` | Serve the built `./out` + admin harness (`:8787`)        |
| `npm run start`   | Serve the production build                               |
| `npm run lint`    | ESLint                                                   |

`tools/admin-local.mjs` (used by `dev:full` / `dev:api` / `preview`) serves the `/api/*`
write API against your **local filesystem** and proxies the Next site, so the full admin
works **offline**. With `ADMIN_DEV=1` Google login is bypassed locally and edits write to
the real repo JSON/images and hot-reload instantly — no cloud setup needed to test.

---

## Editing content (admin panel)

Open `http://localhost:8787/admin/` locally, or the live admin on the Azure host. Tabs:

- **עמוד הבית (Homepage)** — hero banner image, promo tiles, seasonal carousels. Saves use
  **merge-on-save** so editing one region never clobbers another.
- **מוצרים (Products)** — create / edit / delete appliance products and the full lighting
  (תאורה) catalog: name, model, price, **sale price (מבצע)**, categories, image, stock,
  rich-text (WYSIWYG) description. Rows are clickable to edit.
- **קטגוריות (Categories)** — create / rename / delete; keeps `categories`, `nav` and
  `descendants` in sync.
- **מותג ופרטים (Brand & details)** — store name, logo (image + alt), **theme color picker**
  (drives the brand color, PWA `theme_color`, `<meta theme-color>` site-wide), **favicon
  uploader**, contact details, opening hours.
- **עמודים (Legal pages)** — edit מדיניות פרטיות / תקנון האתר / ביטולים והחזרות / הצהרת נגישות.
- **ייבוא/ייצוא (Import/Export)** — export the whole catalog (sorted by category) to **Excel**,
  edit prices/details in a spreadsheet, and import back. Empty state exports a template with
  dummy rows + Hebrew instructions.

Images are **resized/recompressed in the browser** (Canvas → JPEG/PNG) before upload, so the
function stays dependency-free and `out/` stays under the host's 250 MB cap.

**Publish latency:** an admin save commits JSON/images to `main`, which triggers CI and a
rebuild/redeploy on both hosts — content goes live in **~2–3 minutes**.

---

## Configuring authentication

Admin login is **Google Sign-In** restricted to an **email allowlist**.

1. **Google OAuth client** — project `electro-hankin`, app in *Testing* mode. The Client ID
   lives in `public/admin-auth.json` (`googleClientId`). Authorized JS origins must include
   the Azure admin host + `http://localhost:8787` + `http://localhost:3000`. Only the
   approved test-user Gmails (the `ADMIN_EMAILS` allowlist) can sign in.
2. **GitHub token (admin saves)** — a fine-grained PAT with **Contents: Read & write** on
   this repo only, set as the Azure app setting **`GITHUB_TOKEN`** (never committed). The
   API commits content changes back to the repo with it.

> The Google ID token is sent in a custom **`X-Admin-Token`** header (Azure SWA overwrites
> `Authorization` on managed-function calls). The server verifies it against Google +
> `ADMIN_EMAILS`.

---

## Deployment

Two targets build from `main` automatically on every push:

### Public site — Vercel (free)
Static export. `.vercelignore` excludes `/api`, `staticwebapp.config.json`, `/.github`,
`/out`. Canonical/OG/sitemap/robots all point at `https://electro-hankin.vercel.app`.
Vercel CLI deploys must use **`--archive=tgz`** (the repo has >5,000 files → per-file upload
rate limit otherwise).

### Admin + API — Azure Static Web Apps (free)
`.github/workflows/azure-static-web-apps.yml` builds the export **and** the `/api` Functions
and deploys to SWA Free. Headers/CSP are enforced in `staticwebapp.config.json`.

### Environment variables / secrets (Azure app settings — never commit real values)

| Name                               | Purpose                                            |
|------------------------------------|----------------------------------------------------|
| `GITHUB_TOKEN`                     | Fine-grained PAT, Contents R/W on this repo — admin commits |
| `GITHUB_REPO`                      | `yanivGoltshian/myStore`                           |
| `GITHUB_BRANCH`                    | `main`                                             |
| `GOOGLE_CLIENT_ID`                 | OAuth client ID (admin login)                      |
| `ADMIN_EMAILS`                     | Comma-separated admin allowlist                    |
| `AZURE_STATIC_WEB_APPS_API_TOKEN`  | Repo secret — SWA deploy token (GitHub Actions)    |
| `ADMIN_DEV=1`                      | **Local only** — bypass Google login in the harness|

Public, non-secret runtime config lives in `public/admin-auth.json` (`googleClientId`) and
`src/data/site.json` (store name, URLs, hours, social).

---

## Project structure

```
src/
  app/           Next.js App Router pages (home, category, product, lighting, cart,
                 legal, contact, admin SPA, manifest route)
  components/    storefront + admin/ UI components
  data/          *.json — the "database" (products, categories, nav, homepage, site, pages)
  lib/           data loaders, cart context
public/
  images/        product, lighting, brand assets
  lighting/      cat-*.json — the ~7k lighting catalog (runtime-loaded)
api/             Azure Functions (ESM): lib/{auth,http,backend,github,store}.mjs + functions/*
tools/           admin-local.mjs (offline admin harness), dev-full.mjs, image scripts
scripts/         gen-search-index.mjs (prebuild)
```

---

## Related

- **Template:** a genericized, publishable version of this exact architecture lives in
  **`EcomStoreTemplate`** — clone that to spin up a brand-new store.
- **Skill:** both were built with the **`low-cost-static-storefront`** GitHub Copilot CLI
  skill, a reusable playbook that encodes this architecture (JSON-as-database, the
  GitHub-backed write API, browser-side image optimization, the auth/CSP gotchas, and the
  $0 deploy model) so a new store can be scaffolded in minutes.

> This is a **private** repo holding live store content. Never commit secrets (`.env`,
> `api/local.settings.json`, tokens) — they belong in Azure app settings / GitHub secrets.
