# TADS Internal Application Platform — Phase 1 (Local-First)

**TADS – Techmizers Automation and Design Solutions**

This is the Phase 1 implementation of the TADS internal application platform.
It is a **local-first**, offline-capable web application built with plain
HTML, CSS, and JavaScript — no frameworks, no backend, no server database.

Phase 1 exists to let TADS learn how the platform should work in practice
before committing to a full Supabase/PostgreSQL backend. Everything you do
in this app — projects you create, fields you configure — lives in your
browser's local database (IndexedDB) on this one computer.

## What's included in Phase 1

- **TADS Dashboard** — live counts and recent activity from your real data
- **Project Code Register** — the first fully working module: create,
  edit, search, filter, sort, archive and restore projects with
  auto-generated project codes (`PC-0001`, `PC-0002`, ...)
- **Dynamic Field Configuration** — add, disable, reorder and configure
  the fields on the Project Code Register without editing code
- **Settings** — application preferences and field configuration
- **Backup & Restore** — full JSON export/import of all local data
- **CSV Export** — human-readable export of the project register
- **Offline / PWA support** — works without an internet connection once
  loaded once
- **Responsive design** — usable on desktop, tablet, and phone

Other modules (BOM Log, Manufacturing Cost, Vendor Management, etc.)
appear on the Dashboard as **"Coming Soon"** placeholders only.

## Running the app

This app must be served over HTTP (not opened as a `file://` path), because
service workers and some browser storage APIs require it.

Any static file server works. For example, from the project root:

```bash
# Option 1: Python (already available on most systems)
python3 -m http.server 8080

# Option 2: Node (if you have it installed)
npx serve .
```

Then open `http://localhost:8080` in your browser.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the app is put together, and why
- [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) — what data is stored and how
- [`docs/USER-GUIDE.md`](docs/USER-GUIDE.md) — how to use the app day-to-day
- [`docs/DEVELOPMENT-GUIDE.md`](docs/DEVELOPMENT-GUIDE.md) — how to work on the code
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — what changed and when

## Branding

The application uses the TADS logo at `assets/brand/tads-logo.webp`. If you
need to replace it with an updated version, place the new file at that same
path (any common image format works; update the reference in
`index.html` / `js/components/navigation.js` if you change the filename).

## Important limitation

Phase 1 is a **local, single-device** system. Data you enter on one
computer/browser does **not** automatically appear on another computer.
Multi-device sync will only exist after the future Supabase/PostgreSQL
migration (see `docs/ARCHITECTURE.md`).
