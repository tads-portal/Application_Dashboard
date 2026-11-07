# Architecture

This document explains how the TADS Phase 1 app is put together, and why,
in beginner-friendly terms.

## 1. Big picture: the layers

The most important rule in this codebase is: **the screen (UI) never talks
to the database directly.** Instead, there are four layers, each only
allowed to talk to the layer directly below it:

```
┌─────────────────────────────────────────┐
│  UI (modules/*, js/components/*)         │  <- HTML + DOM + event handlers
├─────────────────────────────────────────┤
│  Business logic (js/services/*)          │  <- rules: "how do project codes
│                                           │     get generated?", "can this
│                                           │     field be disabled?"
├─────────────────────────────────────────┤
│  Data service / repository (data-service)│  <- generic get/add/update/remove,
│                                           │     no business rules
├─────────────────────────────────────────┤
│  IndexedDB (js/db/indexeddb.js)          │  <- raw browser database calls
└─────────────────────────────────────────┘
```

**WHY this matters:** the plan is to eventually replace the bottom layer
(IndexedDB) with Supabase/PostgreSQL. Because the UI only ever calls
functions like `projectService.createProject(data)` — and never touches
IndexedDB directly — swapping the storage engine later should mean
rewriting `js/db/*` and the internals of `js/services/*`, **without
rewriting any screen.**

### What lives in each layer

| Layer | Folder | Responsibility |
|---|---|---|
| UI | `modules/*`, `js/components/*` | Render HTML, handle clicks/typing, call services |
| Business logic | `js/services/*` | Validation, project code generation, field-config rules, backup rules |
| Data service | `js/services/data-service.js` | Generic CRUD used by the other services |
| Storage | `js/db/indexeddb.js`, `js/db/migrations.js` | Talks to the browser's IndexedDB API |

## 2. No frameworks, on purpose

Phase 1 intentionally uses plain HTML/CSS/JavaScript instead of React,
Vue, or Angular. This keeps the learning curve gentle and avoids a build
step (no bundler is required to run the app). The app uses:

- A tiny hash-based **router** (`js/router.js`) that shows/hides "pages"
  (modules) based on the URL, e.g. `#/dashboard`, `#/projects`, `#/settings`.
- Plain DOM APIs to render content (small template-building helper
  functions inside each module, no virtual DOM).

If the project later grows enough to justify a framework, that is a real
architectural change and must be discussed first — it is not something to
introduce silently.

## 3. Field Configuration: why it's not hard-coded

The Project Code Register's fields (Customer, Project Type, Priority, ...)
are **not** hard-coded into the HTML form. Instead, they are data, stored
in the `fieldDefinitions` IndexedDB store and rendered dynamically by
`js/components/form.js` and `js/components/table.js`.

**WHY:** the business is still discovering what fields it actually needs.
Being able to add "Business Unit" as a dropdown field from Settings,
without a developer editing code, is the whole point. See
`docs/DATA-MODEL.md` for the exact shape of a field definition, and the
in-app Settings → Project Code Register → Field Configuration screen for
how this is used.

Disabling a field never deletes the data already stored in project
records under that field's key — it only stops the field from appearing
in forms/tables. Re-enabling it makes the historical values visible again.

## 4. Future role / authentication concept

Phase 1 has **no login system** — there's no need for one on a single
local device with no shared data. However, the codebase is structured so
that authentication can be added later without a rewrite:

- Services never assume "there is exactly one user." Every write records
  who/when in a way that could later be extended to `created_by` /
  `updated_by` user IDs.
- The future roles (Admin, Management, Other) will most naturally map to
  **PostgreSQL Row Level Security policies** once the app moves to
  Supabase — access control belongs in the data layer, not scattered
  through UI code. This repo does not implement fake login screens to
  simulate this; that would create false expectations.

## 5. Future Supabase / PostgreSQL migration

The intended future layered architecture is:

```
TADS UI
   ↓
Application Logic (same js/services/* functions, same signatures)
   ↓
Repository/Data Service  (same create/read/update/archive/search/filter API,
                           new implementation using Supabase's JS client)
   ↓
Supabase API
   ↓
PostgreSQL  +  Row Level Security  +  Supabase Auth
```

Planned future tables (not implemented in Phase 1, documented for
forward-planning only):

- `projects`
- `project_field_definitions`
- `project_field_options` (if dropdown options outgrow a JSON column)
- `users`
- `roles`
- `audit_logs`
- `application_settings`

Because the IndexedDB `projects` store and `fieldDefinitions` store are
already modeled as flat, well-typed records (see DATA-MODEL.md), the
migration mainly means:

1. Create matching PostgreSQL tables.
2. Rewrite `js/db/indexeddb.js`'s internals to call the Supabase client
   instead of `indexedDB.open(...)`, keeping the same exported function
   names/signatures used by `data-service.js`.
3. Add Supabase Auth + RLS policies for the role model.
4. The UI and `js/services/*` business-rule files should need little to
   no change, because they were never written against IndexedDB directly.

## 6. Offline / PWA behavior

- `manifest.json` makes the app installable.
- `service-worker.js` caches the app shell (HTML/CSS/JS/icons) using a
  cache-first strategy so the app still loads with no network connection.
- All actual data lives in IndexedDB, which already works fully offline —
  the service worker's job is only to cache the *application code*, not
  the data.
- The UI shows a simple online/offline indicator (see
  `js/components/notification.js` usage in `app.js`).

**Important:** offline support means the app keeps working without the
internet on **the same device**. It does not mean data syncs between
devices — see the README's "Important limitation" section.

## 7. Dependencies

Phase 1 deliberately has **zero runtime third-party JavaScript
dependencies**. CSV export is implemented by hand (it's a simple text
format). XLSX export was considered but deferred in favor of CSV, to
avoid pulling in a third-party library before it's clearly needed.
