# Changelog

All notable changes to the TADS Phase 1 (local-first) app are recorded here.

## [1.0.0] - 2026-09-22 — Initial Phase 1 release

### Added

- Project scaffold, layered architecture (UI → services → data-service →
  IndexedDB), and full documentation set (README, ARCHITECTURE,
  DATA-MODEL, USER-GUIDE, DEVELOPMENT-GUIDE).
- TADS visual theme (blue/red industrial palette derived from the TADS
  logo) with reusable buttons, cards, badges, forms, and table styles.
- IndexedDB storage layer with versioned schema/migrations
  (`tads_phase1_db`), covering `projects`, `fieldDefinitions`,
  `settings`, and `sequences` stores.
- **TADS Dashboard**: live project counts (total/active/on-hold/
  completed/cancelled/archived) computed from real data, application
  cards (Project Code Register live; BOM Log, Manufacturing Cost,
  Vendor Management, Document Management, Project Management marked
  "Coming Soon"), recent activity feed, and quick actions.
- **Project Code Register**: create/edit projects through a dynamic
  form, automatic sequential project codes (`PC-0001`, ...) that are
  never reused, search/filter/sort, and archive/restore (soft-delete —
  projects and their codes are never physically deleted).
- **Dynamic Field Configuration** (Settings → Project Code Register):
  add custom fields (Text/Long Text/Number/Date/Dropdown/Checkbox/
  Email), enable/disable fields without losing existing data, toggle
  required/optional, reorder fields, and edit dropdown options. System
  fields (Project ID, Project Code, Created/Modified/Archived Date) are
  protected from unsafe changes.
- **Backup & Restore**: full JSON export of all local data; restore
  with file validation, version checking, a confirmation step, and an
  automatic safety backup download before any destructive restore.
- **CSV Export** for the Project Code Register.
- **PWA / offline support**: manifest, service worker (cache-first app
  shell with runtime caching), and an offline status indicator.
- Responsive layout for desktop, tablet, and mobile, including a
  card-based table fallback and an off-canvas mobile navigation drawer.

### Known limitations / deferred

- XLSX export was evaluated and deferred for Phase 1 (CSV covers the
  human-readable export requirement without adding a third-party
  dependency); JSON remains the authoritative backup format.
- No authentication/roles (not required for Phase 1 — see
  ARCHITECTURE.md section 4 for the future plan).
- Phase 1 is single-device/local-only; no cross-device sync (planned
  for the future Supabase/PostgreSQL migration — see ARCHITECTURE.md
  section 5).

### Fixed

- Initial database seeding failed on first load (`AbortError: Version
  change transaction was aborted`) because the migration tried to open
  a second IndexedDB transaction from inside `onupgradeneeded` to seed
  default field definitions. Fixed by reusing the existing versionchange
  transaction for the seed writes (see `js/db/migrations.js`).
- New dropdown options (e.g. custom field options, added Priority
  options) were silently dropped when saved, because the option
  normalization logic used `??` to fall back an empty-string `value` to
  the option's label, and `??` does not treat `""` as missing. Fixed by
  using `||` so an empty string correctly falls back to the label
  (`js/services/configuration-service.js`).

## [Unreleased]

### Changed

- Project relocated to `tads-portal/Application_Dashboard`.
