# دانشپز (Daneshpaz)

> آشپزی کن، حتی اگه بلد نیستی!

Daneshpaz is a Persian (Farsi), RTL, mobile-first cooking assistant for students,
people living alone and beginner cooks. It helps users decide what to cook, see what
it costs and what to buy, and follow the recipe step by step.

**Status: v0.6.0.** Phase 5 (compact, mobile-first UI and completed journeys) is done, and the site now tells returning
visitors what changed after every update (see «What's new popup»). Backend, database and hosting were not changed;
the deployment-architecture decision and the admin editing screens are still open.

## Technologies

| Area | Choice |
|---|---|
| Framework | React 19 + Vite, JavaScript (no TypeScript) |
| Routing | React Router 6 (`createBrowserRouter`, lazy routes) |
| Styling | CSS Modules + design tokens as CSS custom properties |
| Font | Vazirmatn Variable via `@fontsource-variable/vazirmatn`, bundled locally (no CDN) |
| Icons | Lucide React |
| Backend | Node built-ins only: `node:http`, `node:sqlite`, `node:crypto` (no dependencies) |
| Tests | Vitest (utilities, cooking engine, backend over real HTTP) |

## Getting started

Requires **Node.js 22.13 or newer** (the backend uses the built-in `node:sqlite`).

```bash
npm install
npm run dev        # http://localhost:5173
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint |
| `npm test` | Run the unit tests once |
| `npm run test:watch` | Run tests in watch mode |

Open `/design-system` in the running app to review every shared component and the
Persian formatters on one page. Resize to 320 px wide to check the mobile layout.

> Hosting note: this is a single-page app. Configure your host to serve `index.html`
> for unknown paths, otherwise refreshing `/recipe/...` returns a 404.

## Project structure

```
src/
  app/            App.jsx, router.jsx (all routes), RouteError.jsx
  components/
    common/       Button, Input, Select, OptionGroup, Card, Badge, BottomSheet, Toast, Skeleton, EmptyState, ErrorState
    recipe/       RecipeCard, RecipeGrid, RecipeArt, ServingStepper, IngredientList, CostSummary, EquipmentList
    search/       FilterSheet, ActiveFilters
    help/         FeedbackBar
    cooking/      CookingHeader, StepCard, TimerPanel, TimerAlerts, CookingBar, PauseScreen/FinishScreen
    layout/       AppShell, Header, BottomNav, Footer, Logo, PageLoader, PlaceholderPage
  pages/          Home, Search, Recipe, Favorites, Help, HelpArticle, Cooking (placeholder), DesignSystem
  data/           Demo categories, ingredients, recipes, help articles (replaced by the API in Phase 4)
  services/       contentService.js (picks demoSource or apiSource), api.js
  admin/auth/     AuthContext, RequireAuth (UI guard only)
  store/          localStorage-backed store used by favorites, pantry and feedback
  admin/          AdminLayout and admin pages (placeholders until Phase 4–5)
  constants/      Navigation lists, breakpoints
  hooks/          usePageTitle, useAsync, useFavorites, usePantry, useCookingSession, useNow, useWakeLock
  utils/          Persian digits, currency, units/quantities, time (+ tests)
  styles/         tokens.css (design tokens), base.css (reset and globals)
```

## Backend folder (`server/`)
`index.js` (start), `app.js` (router, CSRF, auth, static), `routes/` (public, auth, admin), `repo.js` (all SQL),
`db.js` (schema + migrations), `schemas.js` + `validate.js` (input validation), `auth.js`, `seed.js`, `cli.js`.

## Routes

`/` · `/search` · `/recipe/:slug` · `/cook/:slug` (full-screen, no header/nav) · `/favorites` ·
`/help` · `/help/:slug` · `/design-system` · `/admin/login` · `/admin` · `/admin/recipes` ·
`/admin/recipes/new` · `/admin/recipes/:id/edit` · `/admin/ingredients` ·
`/admin/categories` · `/admin/questions` · `/admin/prices` · `/admin/media`

**Admin routes are not protected yet.** Authentication and server-side authorization arrive
with the backend in Phase 4. Until then the admin pages are non-functional placeholders and
hold no data.

## Design decisions

- **Mobile first.** Styles are written for phones, then enhanced at `768px` and `1024px`
  (mirrored in `src/constants/breakpoints.js`). Touch targets are at least 48 px, inputs use
  16 px+ text, and the bottom bar and header respect safe areas (`viewport-fit=cover`).
- **RTL by construction.** `lang="fa" dir="rtl"` on `<html>` and logical CSS properties
  (`margin-inline-*`, `inset-inline-*`, `border-start-*`). Lucide icons do not mirror
  automatically: "back" uses `ArrowRight`, "forward/next" uses `ArrowLeft`/`ChevronLeft`.
- **Colors.** The palette from the spec, plus `--color-danger` and `--color-accent-text`
  because plain terracotta and orange fail contrast for white or small text.
- **Native `<dialog>`** powers BottomSheet: focus trapping and Esc come from the browser.
- **Number formatting** is built on `en-US` formatting plus digit and separator mapping, so
  output is identical on every device regardless of installed locale data.
- **Code splitting.** Each route is a lazy chunk.
- **Honest placeholders.** Unbuilt screens say they are coming; nothing pretends to work.

## Phase 2 notes

**Demo content (not real):** 8 recipes, 10 categories (empty ones are hidden on the home page),
30 ingredients and 9 help articles live in `src/data/`. Prices are **made-up samples** and are labeled
«قیمت نمونه» everywhere they appear. Help articles are flagged as not reviewed by an expert.
Recipe images are placeholder tiles marked «تصویر نمونه». Cooking `steps` are empty until Phase 3.
The data spec asked for 20 recipes; the remaining 12 are still to be written.

**Data boundary:** pages read data only through `src/services/contentService.js`; Phase 4 swaps
that file for real API calls without touching components.

**Scaling** (`utils/scaling.js`): `linear`, `nonlinear` (exponent, for salt/oil/spices), `fixed`, `manual`
(linear estimate, flagged «تقریبی»). Amounts are rounded to measurable values.

**Cost** (`utils/cost.js`): two numbers are always shown. *Consumed* cost is the share of a package the
recipe uses; *purchase* cost is whole packages, minus items marked «دارم». Optional ingredients are
listed but excluded from totals; units that cannot be converted are reported, not guessed.

**Search** (`utils/search.js`, `utils/filters.js`): Persian-aware matching (ي/ك, ZWNJ, digits).
Filters live in the URL, so results are shareable: `q, cat, meal, diff, cost, prep, cook, total, ing, serv, equip, have, sort`.
"Most popular" sorting is intentionally absent until real popularity data exists.

**Saved in this browser only (localStorage):** `daneshpaz:favorites`, `daneshpaz:pantry` (items ticked «دارم»,
shared across recipes), `daneshpaz:feedback` (help feedback; reaching admins comes with the backend).

## What's new popup («تازه‌های دانشپز»)

After every update, the first time a **returning visitor** opens the site, a sheet lists what changed. It shows once per
release, can be reopened with the **«تازه‌ها»** button in the footer, and never appears during guided cooking.

**For every update you publish (this is the whole workflow):**
1. Bump `"version"` in `package.json` (e.g. `0.6.0` → `0.7.0`).
2. Add an entry at the **top** of `RELEASES` in `src/data/changelog.js` with the same number, a short title, and
   plain Persian sentences typed `new` (جدید), `improved` (بهبود) or `fixed` (رفع اشکال).
3. `npm test` fails if the newest changelog entry does not match `package.json`, so a release cannot go out without a note.

**Rules** (`src/utils/releases.js`): the browser remembers the last seen version in `localStorage`
(`daneshpaz:last-seen-release`). Someone behind by several versions sees every missed release (up to 3, newest first).
A visitor who has never seen a note and already has saved data (favorites, cooking progress...) sees the newest one.
A brand-new visitor sees nothing and is silently marked as up to date. A returning visitor who never saved anything is
indistinguishable from a new one, so they also see nothing. To preview it, open any page with `?whatsnew=1`.

## Phase 5: UX completion and compact UI

**Sizing is controlled by design tokens** (`src/styles/tokens.css`), so pages and components stay consistent:

| Token | Before | Now |
|---|---|---|
| Body text | 17 px | 15 px (`--text-base`); metadata 12–13 px |
| Page title / section heading | up to 40 px / 28 px | 20–26 px / 17–20 px (headings are bold, not extra-bold) |
| Default control height (buttons, inputs) | 48 px | 44 px (`--control-h`); dense controls 36 px; one primary action per screen 48 px |
| Header / bottom navigation (measured, incl. border) | 61 px / 69 px | 53 px / 57 px |
| Radii, shadows | large | smaller radii, lighter shadows |
| Page rhythm | 40 px between sections | 24 px (32 px from 768 px) via `--section-gap` |

Measured at 375 px (page height before → after): home 3,771 → 1,415 px (−62%), search 4,537 → 1,459 px (−68%),
help 2,134 → 1,489 px (−30%), guided cooking step 1,099 → 809 px (−26%). The recipe page went 3,120 → 2,702 px (−13%)
while gaining the steps and tips sections. Measured with a fallback font, so absolute heights will differ slightly with Vazirmatn.
Recipe cards are compact list rows on phones (5 rem thumbnail) and a vertical auto-fit grid from 600 px.

**Journey fixes and additions**
- Home: removed decoration, compact quick tiles, and a **«ادامه‌ی آشپزی» card** when a cook is in progress (dismissible).
- Recipe page: now shows **cooking steps**, **«نکات و اشتباه‌های رایج»** (collected from the existing step tips and
  warnings, nothing added), and a start/continue button that remembers the servings you cooked with.
- Saved cooking sessions expire after 12 h; a finished session never reopens as "finished".
- «با مواد موجود»: salt, oil, pepper, turmeric and sugar are assumed available (previously choosing eggs and
  tomatoes returned no recipes). Staples are still listed and priced.
- All localStorage stores validate their data: corrupt or wrong-shaped values fall back safely instead of crashing.
- Touch targets: nothing under 24 px; checkboxes 24 px.

## Phase 4: backend and admin

### Running it
```bash
cp .env.example .env              # then set VITE_CONTENT_SOURCE=api
npm run db:seed                   # loads the DEMO content (prices are samples)
ADMIN_PASSWORD='choose-a-long-password' npm run admin:create -- you@example.com
npm run server                    # API on http://localhost:8787
npm run dev                       # app on http://localhost:5173 (Vite proxies /api to the server)
```
Open `/admin/login`. `admin:create` accepts `--role=editor`. If `ADMIN_PASSWORD` is empty a random one is
printed once. `npm run db:seed -- --force` replaces all content (users are kept).

For a single-process deploy: set `VITE_CONTENT_SOURCE=api`, run `npm run build`, then `npm run server`;
if `dist/` exists the server also serves the frontend (SPA fallback, path-traversal safe).

### Why this backend (and what it costs)
The spec asked to verify Supabase for Iran before using it. I could not verify regional availability or run
it from the build environment, so I did not build on it. Options considered:

| Option | For | Against |
|---|---|---|
| Supabase | Auth, RLS, dashboard out of the box | Regional access/hosting for Iran unverified; external dependency; could not be tested here |
| Node + PostgreSQL (Express/Fastify) | Industry standard, scales well | Needs installed packages and a database server; could not be run or tested here |
| **Node built-ins + SQLite (chosen)** | Zero dependencies, one process, deploys on any VPS, **fully testable here** (122 tests) | `node:sqlite` is still marked experimental by Node; single-writer; in-memory rate limiter |

All SQL lives in `server/repo.js` and `server/db.js`, so moving to PostgreSQL later means rewriting those two
files; routes, validation and the frontend do not change. Please review this decision before production.

### Security design (all enforced on the server)
- Passwords: scrypt with per-user salt; sessions are random 256-bit tokens, only their SHA-256 is stored;
  HttpOnly + SameSite=Lax cookie (Secure in production); fixed 12 h expiry; logout deletes the session.
- Login: identical error for wrong password and unknown email, equalized timing, per-IP and per-account rate
  limits (HTTP 429 + `Retry-After`).
- Authorization on every request: signed-out → 401; **editors** can read, create and edit; only **admins** can
  delete. The UI guard (`RequireAuth`) is convenience only.
- CSRF: writes need a same-site `Origin`, JSON content type, and the `X-Requested-With: daneshpaz` header;
  no CORS headers are sent.
- Input: size limit (1 MB), strict schemas with Persian field errors, unknown keys dropped, parameterized SQL,
  help links must be `http(s)`; database CHECK/FOREIGN KEY constraints as a second line of defense.
- Content gate: a recipe can only be published if every step has completion cues.

### API
Public: `GET /api/catalog`, `/api/recipes/:slug`, `/api/help`, `/api/help/:slug`, `POST /api/feedback` (rate-limited),
`GET /api/health`. Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
Admin (session required): `GET /api/admin/summary`; CRUD for `/api/admin/recipes` (plus `PATCH …/:id/status`),
`/categories`, `/ingredients` (plus `…/:id/prices`), `/help`; `GET`/`PATCH /api/admin/feedback`.
Only published recipes and help articles are public.

### Not done yet (honest list)
- Admin editing screens (Phase 5). Media/image upload and its file restrictions (Phase 5). No user-management
  or password-change screen (CLI only), no password reset email, no two-factor login.
- Sessions have a fixed expiry; the rate limiter is per process (use a shared store if you run several).
- Demo prices and content are still samples; nothing here makes them real.
- Not verified in this environment: `npm install`/`vite build`, real PostgreSQL, HTTPS deployment.

## Phase 3 notes: guided cooking mode

Route `/cook/:slug?servings=N` is full-screen (no site header or bottom bar). Per step it shows the step
number, title, instructions, heat level, estimated duration, the step's ingredients **scaled to the chosen
servings**, warnings, tips (bottom sheet) and **«از کجا بفهمم آماده است؟»** completion cues written per step.
Controls: مرحله قبل، مرحله بعد، انجام شد، توقف، ادامه، تایمر، نکات، مشکلات رایج (links to help articles).

- **Timer** (`utils/timer.js`) stores an absolute end time, so it stays correct when the tab is throttled, the
  step changes, or the page reloads. Start, pause, resume, reset, «۱ دقیقه بیشتر». Timers belong to the
  session, so a timer keeps running while you move to other steps (chips jump back to that step).
- **When a timer ends:** in-page alert, three beeps and vibration (sound needs the earlier tap on «شروع تایمر»).
  Timers that ended while the page was closed alert once on return. **Limitation:** nothing can ring if the
  browser is closed; that needs push/PWA work in a later phase.
- **Pause** stops the screen and all running timers and reminds the cook to turn off the stove; **ادامه** resumes
  exactly the timers it paused.
- **Persistence** (`daneshpaz:cooking:<slug>` in localStorage): step, completed steps, servings and timers are
  restored after refresh. Saved data is validated on load; corrupt data falls back to a fresh start. Progress is
  kept only if the cook did something; otherwise `?servings=` wins.
- The screen is kept awake with the Wake Lock API where supported.
- **Food safety:** the chicken recipe's cues use the internal temperature (74 °C) and a cut-and-check, and warn
  not to rely on color. Steps are demo content and have **not** been reviewed by a food-safety expert.

## Tests

The what's-new feature has tests for its decision rules, its storage and the changelog itself. Phase 5 added tests for stored-data validation, resume/staleness logic, step-note collection and pantry staples.

`npm test` runs Vitest over `src/**/*.test.js`: Persian formatting, scaling, cost calculation,
search/filters/URL params, the backend over real HTTP (auth, CSRF, roles, rate limits, validation, round-trip of demo data), the cooking timer and session reducer (pause/resume, restore, corrupt data),
step ingredient scaling, and integrity tests for the demo data (valid references, every unit convertible,
every step has completion cues, chicken cues keep the temperature check).


