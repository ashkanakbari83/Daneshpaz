# دانشپز (Daneshpaz)

> آشپزی کن، حتی اگه بلد نیستی!

Daneshpaz is a Persian (Farsi), RTL, mobile-first cooking assistant for students,
people living alone and beginner cooks. It helps users decide what to cook, see what
it costs and what to buy, and follow the recipe step by step.

**Status: Phase 2 (public UI) done, cooking mode and backend not started.**
Home, search with filters, recipe page (serving calculator, ingredient scaling, cost),
favorites and the help center work against **bundled demo data**. Guided cooking mode (Phase 3),
the backend and the admin panel (Phases 4–5) are still placeholders that say so.

## Technologies

| Area | Choice |
|---|---|
| Framework | React 19 + Vite, JavaScript (no TypeScript) |
| Routing | React Router 6 (`createBrowserRouter`, lazy routes) |
| Styling | CSS Modules + design tokens as CSS custom properties |
| Font | Vazirmatn Variable via `@fontsource-variable/vazirmatn`, bundled locally (no CDN) |
| Icons | Lucide React |
| Tests | Vitest (pure utilities) |

## Getting started

Requires Node.js 18.18 or newer.

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
    layout/       AppShell, Header, BottomNav, Footer, Logo, PageLoader, PlaceholderPage
  pages/          Home, Search, Recipe, Favorites, Help, HelpArticle, Cooking (placeholder), DesignSystem
  data/           Demo categories, ingredients, recipes, help articles (replaced by the API in Phase 4)
  services/       contentService.js: the only place pages get data from
  store/          localStorage-backed store used by favorites, pantry and feedback
  admin/          AdminLayout and admin pages (placeholders until Phase 4–5)
  constants/      Navigation lists, breakpoints
  hooks/          usePageTitle, useAsync, useFavorites, usePantry
  utils/          Persian digits, currency, units/quantities, time (+ tests)
  styles/         tokens.css (design tokens), base.css (reset and globals)
```

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

## Tests

`npm test` runs Vitest over `src/**/*.test.js`: Persian formatting, scaling, cost calculation,
search/filters/URL params, and an integrity test for the demo data (unique slugs, valid references,
every unit convertible for pricing).

## Roadmap

1. Foundation (done)
2. Public UI: home content, search and filters, recipe page, favorites, help center (done, demo data)
3. Cooking engine: steps, timer, completion cues, saved progress
4. Backend and database, admin authentication
5. Admin dashboard
6. PWA and offline
7. Testing, performance, accessibility, deployment
