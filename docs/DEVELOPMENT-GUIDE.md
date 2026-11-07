# Development Guide

This guide is for whoever works on the TADS Phase 1 code next (including
future-you). It assumes basic HTML/CSS/JS familiarity but explains the
project-specific conventions.

## Running it locally

```bash
python3 -m http.server 8080
# or: npx serve .
```

Then open `http://localhost:8080`. It must be served over HTTP — opening
`index.html` directly as a `file://` path will break the service worker
and some storage APIs.

There is no build step. Every `.js` file is loaded directly by the
browser as an ES module (`<script type="module">` in `index.html`), and
modules `import`/`export` between each other with relative paths.

## Folder guide

| Folder | Purpose |
|---|---|
| `css/` | Design tokens (`theme.css`), base layout (`global.css`), reusable UI patterns (`components.css`), and breakpoints (`responsive.css`) |
| `js/db/` | Raw IndexedDB access (`indexeddb.js`) and schema/versioning (`migrations.js`). Nothing here knows about "projects" |
| `js/services/` | All business logic. This is where rules live — see docs/ARCHITECTURE.md |
| `js/components/` | Generic, reusable UI building blocks (modal, table, form renderer, toasts, confirmation dialog, nav) used by every module |
| `js/utils/` | Small stateless helpers (dates, formatting, validation, id generation) |
| `modules/<name>/` | One folder per screen/feature. Each has an HTML fragment (not a full document — just the inner markup) and a `.js` file whose `render(container, params)` function injects and wires it up |
| `data/seed-data.js` | The default field definitions/settings/sequence used only the very first time the database is created |
| `docs/` | This documentation |

## How a module works

Every route in `js/router.js` lazy-loads a module via `import()` and
calls its exported `async function render(container, params)`. A
typical module:

```js
async function loadFragment(container) {
  const response = await fetch(new URL("./my-module.html", import.meta.url));
  container.innerHTML = await response.text();
}

export async function render(container, params) {
  await loadFragment(container);
  // query elements inside `container`, wire up event listeners,
  // call js/services/* to read/write data
}
```

To add a new module: create `modules/<name>/<name>.html` +
`modules/<name>/<name>.js`, add a route entry in `js/router.js`, and add
a nav link in `js/components/navigation.js`'s `NAV_STRUCTURE`. If it's a
placeholder ("Coming Soon"), just add it to `NAV_STRUCTURE` with
`comingSoon: true` and no route — see the existing BOM Log / Manufacturing
Cost entries.

## How IndexedDB works here

- `js/db/migrations.js` defines the database name/version and creates
  object stores inside `onupgradeneeded`. **Everything written during
  that event — including the initial seed data — must use the
  transaction IndexedDB already opened for the upgrade** (passed in as
  `transaction`). Opening a second transaction from inside
  `onupgradeneeded` throws `InvalidStateError`/aborts the upgrade — this
  bit the initial implementation once; see the code comments in
  `migrations.js`.
- `js/db/indexeddb.js` wraps the raw API in promises: `getAll`,
  `getById`, `put`, `removeById`, `replaceAll`, etc. It has zero
  knowledge of what a "project" is.
- `js/services/data-service.js` re-exports those functions plus
  `STORES` (the object store name constants) for the other services to
  use.
- To change the schema later: bump `DB_VERSION` in `migrations.js` and
  add a new `if (oldVersion < N) { ... }` block. **Never delete or
  rewrite an old block** — a browser that's several versions behind
  needs to walk through each step in order without losing data.

## Coding conventions

- Plain ES modules, no bundler, no framework.
- Business rules live in `js/services/*`, never inside a `modules/*`
  file or a component. If you're about to write an `if` that decides
  "is this allowed," it almost certainly belongs in a service.
- UI components (`js/components/*`) take plain data/callbacks in and
  return DOM nodes — they don't import services directly.
- Keep files focused. If a module's `.js` file is getting long, that's
  a sign a piece of it (e.g. a sub-form) wants to be its own file, the
  way `project-form.js` and `project-table.js` are split out from
  `project-code-register.js`.

## Regenerating brand assets

If the TADS logo changes, replace `assets/brand/tads-logo.webp` (any
common image format works — update the filename in
`js/components/navigation.js` if it's not `.webp`), then regenerate the
PWA icons at `assets/icons/icon-192.png`, `icon-512.png`, and
`icon-512-maskable.png` (square, logo centered on a white background,
with extra padding on the maskable one). Any image tool works; there's
nothing TADS-specific about that step.

## Testing approach used for Phase 1

Phase 1 was verified with a scripted browser walkthrough (Playwright)
covering: project create/edit/archive/restore, duplicate-code
prevention, search/filter/sort, required-field validation, adding a
custom field and confirming it appears on the form, disabling and
re-enabling a field with data preserved, reordering fields, editing
dropdown options, CSV export, full JSON backup export, restoring from a
valid backup (including project-code sequence reconciliation),
rejecting an invalid backup file, mobile/tablet responsive layout, and
an offline reload after the service worker had cached the app shell —
all with zero console/JS errors. See `tests/README.md` for the
assertion-based smoke test script checked into this repo.

## Future Supabase migration — where to start

See `docs/ARCHITECTURE.md` section 5 for the plan. In short: the file
to rewrite is `js/db/indexeddb.js` (swap its internals for Supabase
client calls while keeping the same exported function names), plus
`js/db/migrations.js` becomes a set of PostgreSQL migrations instead of
an `onupgradeneeded` handler. `js/services/*` and everything above it
should need little to no change.
