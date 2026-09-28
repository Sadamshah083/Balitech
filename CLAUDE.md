@AGENTS.md

# BALITECH Website: Project Memory

This file is the single place for facts about the website: business details, architecture, conventions, deployment and known issues. When you learn something durable about the site (a new page, a changed phone number, a deploy change, a gotcha), update the matching section here in the same change.

## 1. Business facts (source of truth is in code, listed here for quick reference)

| Fact | Value | Lives in |
|---|---|---|
| Brand / legal name | BALITECH / Bali Tech Pvt. Ltd | `src/lib/seo.ts`, `src/lib/content.ts` |
| Domain | https://balitech.org (`NEXT_PUBLIC_APP_URL` overrides) | `src/lib/seo.ts` |
| Business | BPO / call center: inbound, outbound, lead gen, customer support | `SITE_DESCRIPTION` in `src/lib/seo.ts` |
| Founded | April 2022, 7 people, first setup of 40 agents | `src/lib/content.ts` |
| Headcount | `800+`, written **once** as `EMPLOYEE_COUNT` and reused everywhere | `src/lib/content.ts` |
| Tagline | "Together We Build Success." | `companyContent.tagline` |
| CEO | Sheraz Bali (`/ceo-muhammad-shiraz-bali.png`) | `companyContent.ceo` |
| Hours | Monday–Friday · 6:00 PM – 4:00 AM (US-shift operations, "24/5") | `src/lib/fallback-offices.ts` |
| Email / phones | info@balitech.org · general 0370 0585660 / 0327 1233435; each office has its own numbers, which the footer shows | DB `Office.phone` (admin), fallback in `src/lib/fallback-offices.ts` |
| Offices | Shamsabad (head office, Rawalpindi), Islamabad I-9/3, Commercial (Rawalpindi), Iran Road (Satellite Town, Rawalpindi) | DB `Office` table, fallback in `src/lib/fallback-offices.ts` |
| Brand colors | navy `#0d1a3a`, orange `#ed9129` | `src/lib/brand.ts`, `src/app/globals.css` |
| Fonts | Manrope (body), Sora (headings), Great Vibes subset (intro wordmark only) | `src/app/layout.tsx` |

Change a fact in its source file, not in the component that displays it. Content that admins edit (offices, blogs, campaigns, vacancies, media) lives in the **database**. The `fallback-*.ts` files are only used when the DB is unavailable.

## 2. Stack

- **Next.js 16.2 (App Router), React 19.2, TypeScript.** This is not the Next.js from training data: read `node_modules/next/dist/docs/` before using an API. Middleware is **`src/proxy.ts`** (exported `proxy` function), not `middleware.ts`.
- **Tailwind CSS 4** via `@tailwindcss/postcss`. `src/app/globals.css` is about 10k lines of custom CSS; the theme is handled by `ThemeProvider` plus `src/lib/theme.ts`.
- **Prisma 5 + MySQL** (XAMPP locally). Models: `Admin`, `Lead`, `Vacancy`, `Campaign`, `Blog`, `Office`, `MediaItem`. List-like columns (`Campaign.locations`, `Vacancy.branches`, `Blog.tags`, `Lead.flags/details/source`) are **JSON stored in strings**, so parse and stringify them.
- **GSAP** for animation, loaded lazily (`src/lib/use-lazy-gsap.ts`, `gsap-register.ts`, `on-idle.ts`, `on-interaction.ts`). Performance and LCP are a big focus (see the long comments in `layout.tsx`), so don't add eager heavy JS to the home page.
- Auth: `jose` JWT (HS256) + `bcryptjs`.

## 3. Commands

```bash
npm run dev            # local dev (http://localhost:3000)
npm run build          # prisma generate && next build
npm run lint           # eslint (currently 0 errors, 5 unused-var warnings)
npx tsc --noEmit       # type check (currently clean)
npm run db:push        # sync prisma schema to DB (no migrations folder, push-based)
npm run db:seed        # seed admin + default campaigns (prisma/seed.ts)
npm run optimize:media # re-encode media, re-subset intro font from media-src/
npm run build:live     # prod build reading LIVE DB over SSH tunnel, read-only
```


There is no test suite. `scripts/_*.js` are one-off local audit and debug tools (Lighthouse, LCP, contrast, screenshots via Chrome CDP). They are not part of the app.

## 4. Site map

Public pages (`src/app/`): `/` · `/services` · `/services/[slug]` (inbound, outbound, customer-support, lead-generation, sales-verification, medical-billing, b2b-outreach, defined in `src/lib/service-pages.ts`) · `/about` · `/our-team` (nav label "Growth") · `/gallery` · `/ceo-words` · `/our-offices` · `/blog`, `/blog/[slug]` · `/join-us` (careers + application form) · `/privacy-policy` · `/recruitment-privacy-notice`. Generated: `sitemap.ts`, `robots.ts`, `llms.txt/route.ts`. `/uploads/[...path]` serves uploaded files.

- Nav links: `src/lib/navigation.ts`.
- Legacy PHP URLs (`/contact.php`, `/careers`, and others) redirect in `next.config.ts`. Add new redirects there.
- Components are grouped by page area in `src/components/{landing,home,about,services,join-us,gallery,blog,admin,...}`.

Admin (`/admin/*`, guarded by `src/proxy.ts` → redirects to `/admin/login`): dashboard, leads (+ `/leads/[id]` detail, CSV export, CV download), campaigns, vacancies, blogs, offices, media, settings (admin users).

## 5. Key conventions

- **SEO:** every page uses `pageMetadata({ title, description, path })` from `src/lib/seo.ts`. Pass a **bare** title because the root layout template appends `| Bali Tech Pvt. Ltd`. Top-level pages also emit `breadcrumbSchema`. There are no `keywords` meta tags, on purpose.
- **API auth:** every mutating/admin API route calls `requireApiAuth(request)` from `src/lib/auth.ts`. It accepts the cookie `balitech_admin_token`, a Bearer JWT, or the static `CRM_API_TOKEN` (32+ chars, for CRM integration). Server pages use `requireAdmin()` from `src/lib/admin.ts`. Client admin code uses `adminFetch` (`src/lib/admin-token.ts`).
- **After any admin write**, call `refreshPublicPages()` (`src/lib/refresh-public-pages.ts`). Public pages are prerendered and otherwise stay stale until the next deploy. It also refreshes `/sitemap.xml` and `/llms.txt` (route handlers are not covered by the layout refresh), so a newly published blog is in the sitemap at once; the sitemap additionally rebuilds hourly.
- **Prisma:** import `prisma` from `src/lib/prisma.ts`. With `PRISMA_READONLY=1` (set by `build:live`), every write throws, so build-time code must be read-only.
- **Careers:** fixed choices (role groups, departments, positions) live in `src/lib/careers/catalog.ts`, shared by the public form, API and admin editor. An application becomes a `Lead` with `referenceId`, an idempotent `submissionKey`, `queue`, and duplicate/employee `flags`.
- **Media:** large videos are git-ignored (100MB GitHub limit) and hosted separately. Uploaded blog covers go in `public/blogs/`, media in `public/media/`, and CVs in `/uploads/`. All three are git-ignored. Keep masters in `media-src/`.

## 6. Environment variables (`.env`, template in `.env.example`)

`DATABASE_URL`, `JWT_SECRET` (required, throws if missing), `JWT_EXPIRES_IN`, `JWT_ISSUER`, `JWT_AUDIENCE`, `CRM_API_TOKEN`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` (seed only), `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_APP_URL`. Build-only: `PRISMA_READONLY`, `BALITECH_BUILD_DATA=live|local`, `BALITECH_SSH_HOST/USER/PASSWORD`.

## 7. Deployment and CI

There are **two deploy paths, and they disagree:**

1. **GitHub Actions** (`.github/workflows/deploy.yml`): on every push to `main`, it SSHes (password auth) into Hostinger, `cd /home/u296893178/domains/balitech.org/public_html`, then `git pull && npm install && npm run build && pm2 reload ecosystem.config.js`. Secrets: `SERVER_HOST`, `SERVER_USERNAME`, `SERVER_PASSWORD`, `SERVER_PORT`. **Pushing to main deploys to production.**
2. **Manual VPS scripts:** `npm run build:live` builds locally against the live DB through an SSH tunnel and writes `BUILD_SOURCE.json`. `deploy:live` then calls `scripts/deploy_live.js`, which is **git-ignored and local-only**. Target: `/var/www/balitech-app`, pm2 app `balitech-app`, port 3005 (see `scripts/deploy-config.js`).

`ecosystem.config.js` hardcodes `cwd: /var/www/balitech-app`, while the CI workflow runs from the Hostinger `public_html` path. Confirm which server is actually production before changing either. `server.js` (custom HTTP server) is not used by pm2, which runs `next start`.

CI runs **no lint, type-check or build verification** before deploying. A broken build is only discovered on the server.

## 8. Known issues / tech debt (keep updated)

- **Hardcoded passwords in local scripts.** `scripts/deploy-config.js` (root SSH password fallback), `scripts/deploy_new.js` and `scripts/test_ssh.js` (VPS user/password) contain credentials. They were removed from git before ever reaching GitHub and are now in `.gitignore`; never re-add them. The GitHub repo `Sadamshah083/Balitech` is **public**, so check any new script for credentials before committing. Moving these to `BALITECH_SSH_*` env vars is still to do.
- **`Admin.plainPassword`** stores admin passwords in plain text next to the bcrypt hash, and it is shown in Settings (`src/app/api/users/route.ts`, `SettingsManager.tsx`).
- `.env.example` default `ADMIN_PASSWORD="admin123"`: make sure production was seeded with something else.
- Stray backups are committed: `src/app/globals.css.bak`, `src/lib/hero-loader.ts.bak`.
- The workflow uses `actions/checkout@v3`, which is outdated and unnecessary because the job only SSHes.
- The `deploy:live` npm script depends on a git-ignored file, so it fails on a fresh clone.
- README still says "Next.js 16 + XAMPP" and lists only Leads/Campaigns admin features, which is out of date.

## 9. Git history (summary)

`6d745ad` create-next-app → `911671f` site + admin panel + CEO section → `ccad4e4`/`9c66ab1` content & navbar → `8afac77` admin CMS, gallery → `81b4246` prod build fixes → `d8f3a74` prod env + metadataBase → `1593a40` PM2 + GitHub Actions deploy → `20a9ae8` lead export, lead view, dashboard, SEO metadata → `13e961b` SEO pass, media optimisation, deploy scripts (298 files). Single author (Sadam Shah); commits go straight to `main`.
