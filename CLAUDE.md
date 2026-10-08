@AGENTS.md

# BALITECH Website: Project Memory

This file is the single place for facts about the website: business details, architecture, conventions, deployment and known issues. When you learn something durable about the site (a new page, a changed phone number, a deploy change, a gotcha), update the matching section here in the same change.

## 1. Business facts (source of truth is in code, listed here for quick reference)

| Fact | Value | Lives in |
|---|---|---|
| Brand / legal name | BALITECH / Bali Tech | `src/lib/seo.ts`, `src/lib/content.ts` |
| Domain | https://balitech.org (`NEXT_PUBLIC_APP_URL` overrides) | `src/lib/seo.ts` |
| Business | BPO / call center: inbound, outbound, lead gen, customer support | `SITE_DESCRIPTION` in `src/lib/seo.ts` |
| Founded | April 2022, 7 people, first setup of 40 agents | `src/lib/content.ts` |
| Headcount | `900+`, written **once** as `EMPLOYEE_COUNT` and reused everywhere | `src/lib/content.ts` |
| Tagline | "Together We Build Success." | `companyContent.tagline` |
| CEO | Sheraz Bali (`/ceo-muhammad-shiraz-bali.png`) | `companyContent.ceo` |
| Hours | Monday–Friday · 6:00 PM – 4:00 AM (US-shift operations, "24/5") | `src/lib/fallback-offices.ts` |
| Email / phones | humanresource@balitech.org · general 0370 0585660 / 0327 1233435; each office has its own numbers, which the footer shows | DB `Office.phone` (admin), fallback in `src/lib/fallback-offices.ts` |
| Offices | Shamsabad (head office, Rawalpindi), Islamabad I-9/3, Commercial (Rawalpindi), Iran Road (Satellite Town, Rawalpindi) | DB `Office` table, fallback in `src/lib/fallback-offices.ts` |
| Brand colors | navy `#0d1a3a`, orange `#ed9129` | `src/lib/brand.ts`, `src/app/globals.css` |
| Fonts | Manrope (body), Sora (headings), Great Vibes subset (intro wordmark only) | `src/app/layout.tsx` |

Change a fact in its source file, not in the component that displays it. Content that admins edit (offices, blogs, campaigns, vacancies, media) lives in the **database**. The `fallback-*.ts` files are only used when the DB is unavailable.

## 2. Stack

- **Next.js 16.2 (App Router), React 19.2, TypeScript.** This is not the Next.js from training data: read `node_modules/next/dist/docs/` before using an API. Middleware is **`src/proxy.ts`** (exported `proxy` function), not `middleware.ts`.
- **Tailwind CSS 4** via `@tailwindcss/postcss`. `src/app/globals.css` is about 10k lines of custom CSS; the theme is handled by `ThemeProvider` plus `src/lib/theme.ts`.
- **Prisma 5 + MySQL** (XAMPP locally). Models: `Admin`, `Lead`, `Vacancy`, `Campaign`, `Blog`, `BlogCategory`, `BlogTag`, `BlogCategoryTag`, `BlogTagOnBlog`, `BlogCategoryRedirect`, `Office`, `MediaItem`. List-like columns (`Campaign.locations`, `Vacancy.branches`, `Blog.tags` legacy JSON, `Lead.flags/details/source`) are **JSON stored in strings**, so parse and stringify them. Blog taxonomy is relational; `Blog.tags` is kept in sync for older readers.
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

Public pages (`src/app/`): `/` · `/services` · `/services/[slug]` (inbound, outbound, customer-support, lead-generation, sales-verification, medical-billing, b2b-outreach, defined in `src/lib/service-pages.ts`) · `/about` · `/our-team` (nav label "Growth") · `/gallery` · `/ceo-words` · `/our-offices` · `/blog`, `/blog/[slug]`, `/blog/category/[slug]`, `/blog/tag/[slug]` · `/career` (public job board from admin Vacancies; Apply → `/join-us`) · `/join-us` (application form + benefits; unchanged by the career board) · `/privacy-policy` · `/recruitment-privacy-notice`. Generated: `sitemap.ts`, `robots.ts`, `llms.txt/route.ts`. `/uploads/[...path]` serves uploaded files (including `blog-categories`). Home (`/`) keeps the campaign openings rail (`HomeCareers`), then admin vacancy cards (`HomeOpenVacancies`) before AudiencePaths, and recent blog cards (`HomeRecentBlogs`) above the footer.

- Nav **Careers** CTA → `/career` (`careerHref` in `src/lib/navigation.ts`). Legacy `/careers` redirects to `/career`.

- Nav links: `src/lib/navigation.ts`.
- Legacy PHP URLs (`/contact.php`, `/careers`, and others) redirect in `next.config.ts`. Add new redirects there.
- Components are grouped by page area in `src/components/{landing,home,about,services,join-us,gallery,blog,admin,...}`.

Admin (`/admin/*`, guarded by `src/proxy.ts` → redirects to `/admin/login`): dashboard, leads (+ `/leads/[id]` detail, CSV export, CV download), campaigns, vacancies, blogs (Categories / Tags / Blogs tabs), offices, media, settings (admin users). Blog category images upload to `/uploads/blog-categories`. Default categories (SEO title/description, body copy, recommended tags, slugs) live in `DEFAULT_BLOG_CATEGORIES` (`src/lib/blog-taxonomy.ts`). Admin “Sync default categories” upserts them and links tags; `technology-crm` redirects to `technology`. Live-only seed: `node scripts/_seed_default_categories_live.js` (categories/tags only). Assign posts to categories on live: `node scripts/_assign_blog_categories_live.js` (updates `Blog.categoryId` only). Public blog UI shows categories, not tags; tags stay in admin.

## 5. Key conventions

- **SEO:** every page uses `pageMetadata({ title, description, path })` from `src/lib/seo.ts`. Pass a **bare** title because the root layout template appends `| Bali Tech`. Top-level pages also emit `breadcrumbSchema`. There are no `keywords` meta tags, on purpose.
- **API auth:** every mutating/admin API route calls `requireApiAuth(request)` from `src/lib/auth.ts`. It accepts the cookie `balitech_admin_token`, a Bearer JWT, or the static `CRM_API_TOKEN` (32+ chars, for CRM integration). Server pages use `requireAdmin()` from `src/lib/admin.ts`. Client admin code uses `adminFetch` (`src/lib/admin-token.ts`).
- **After any admin write**, call `refreshPublicPages()` (`src/lib/refresh-public-pages.ts`). It revalidates `/`, `/blog`, and `/career` as **layouts** (so nested slug/category pages refresh too), plus `/sitemap.xml` and `/llms.txt`. Home + blog routes also use `revalidate = 60` as a safety net so a missed invalidate still shows a new post within a minute. The sitemap additionally rebuilds hourly.
- **Footer join-us QRs** (`FooterWebsiteQr`, PNGs from `npm run optimize:media`): **Join Us QR** → `https://balitech.org/join-us` (shows “How did you hear about this opportunity?”). **Direct Apply QR** → `https://balitech.org/join-us?source=qr` (hides that question; `hasKnownSource` treats `source`/`utm_source` as a known channel).
- **Prisma:** import `prisma` from `src/lib/prisma.ts`. With `PRISMA_READONLY=1` (set by `build:live`), every write throws, so build-time code must be read-only.
- **CV downloads:** the admin "Download New CVs" ZIP includes only leads with `cvDownloadedAt = null` and stamps them once the ZIP has been fully sent, so each download holds only CVs that arrived since the last one. A lead's own page can always fetch its single CV again. The Excel export works the same way with `Lead.exportedAt` ("Download New Leads"), plus a "Download all again" link (`?all=1`) that re-exports everything without marking. Lead status is no longer shown on the Leads list; its column shows each lead's Lead/CV download state instead.
- **Blog SEO fields:** categories have `metaTitle` / `metaDescription` (admin Categories form); blogs have cover `imageAlt` (public pages fall back to meta description → excerpt → title).
- **Schema changes need the live DB first.** `deploy:live` never touches the database, so a new column must be added on the live DB *before* deploying code that uses it, or every query on that model fails (this took down lead listing and job applications once).
- **Careers:** `/career` lists active `Vacancy` rows from admin (Sales & Marketing maps from department `operations`; campaign badges use `Vacancy.campaign`). Apply links deep-link to `/join-us?position=…#apply` without changing the join-us page. Admin Vacancies has campaign role templates (Verifier/Closer/Team Lead) and management presets. Fixed choices (role groups, departments, positions) live in `src/lib/careers/catalog.ts`. An application becomes a `Lead` with `referenceId` (`BT-{OFFICE}-{ID}-{DATE}`, e.g. `BT-ISM-DHRTD-260930` — office codes MAIN/ISM/COM/IRRD, then unique id, then apply date YYMMDD), an idempotent `submissionKey`, `queue`, and duplicate/employee `flags`. Candidate confirmation + HR alert go through `src/lib/mail.ts`.
- **Media:** large videos are git-ignored (100MB GitHub limit) and hosted separately. Uploaded blog covers go in `public/blogs/`, media in `public/media/`, and CVs in `/uploads/`. All three are git-ignored. Keep masters in `media-src/`.

## 6. Environment variables (`.env`, template in `.env.example`)

`DATABASE_URL`, `JWT_SECRET` (required, throws if missing), `JWT_EXPIRES_IN`, `JWT_ISSUER`, `JWT_AUDIENCE`, `CRM_API_TOKEN`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` (seed only), `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID` (default `1528153738658754`), `NEXT_PUBLIC_APP_URL`. Titan SMTP (optional but used in prod for HR alerts): `SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM`/`SMTP_TO` — see `.env.example`; password must never be committed. Build-only: `PRISMA_READONLY`, `BALITECH_BUILD_DATA=live|local`, `BALITECH_SSH_HOST/USER/PASSWORD`. Meta Pixel loads only in production (`src/components/seo/MetaPixel.tsx`).

New join-us applications email the candidate a confirmation (branch contact + HR), and also notify `SMTP_TO` (default `humanresource@balitech.org`) via `src/lib/mail.ts`. Public contact/inquiry leads notify HR only. Mail failures are logged and never fail the form submission.

## 7. Deployment and CI

**Current production target (Oct 2026):** KVM guest reached via `ssh -p 2233 ubuntu@203.215.164.70` (see `scripts/deploy-config.js`). App path `/var/www/balitech-app`, pm2 `balitech-app` on port **3005**, nginx on guest port **80** proxies to it. Guest LAN IP is typically `192.168.122.30` — the public IP’s ports 80/443 currently hit the **host** (not this guest) unless the hypervisor DNAT forwards them. After DNS A records for `balitech.org` / `www` point at `203.215.164.70`, the host must forward **80→guest:80** and **443→guest:443**, then run certbot on the guest.

Live MySQL on the guest: database `balitech_db`, user `balitech_user` (credentials in remote `.env` only). Deploy scripts must never copy the local XAMPP database onto this server.

There are still **two older deploy paths** that may disagree with the above:

1. **GitHub Actions** (`.github/workflows/deploy.yml`): on every push to `main`, it SSHes into Hostinger `public_html`. Secrets: `SERVER_HOST`, `SERVER_USERNAME`, `SERVER_PASSWORD`, `SERVER_PORT`. Update those secrets if Actions should target the new server.
2. **Manual scripts:** `npm run build:live` + `deploy:live` use `scripts/deploy-config.js` (new server host/port/user). Prefer building on the server against its own DB when the SSH tunnel is flaky.

`ecosystem.config.js` hardcodes `cwd: /var/www/balitech-app`. `server.js` is not used by pm2 (`next start`).

Avoid concurrent `next build` runs on the server (corrupts `.next`). Cap Node heap if RAM is tight (`NODE_OPTIONS=--max-old-space-size=3072` works on the ~6 GB guest).

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
