# Data Model

All Phase 1 data lives in one IndexedDB database in your browser, named
`tads_phase1_db`. It has four **object stores** (think: four tables).
Keeping them separate — instead of one big JSON blob — is what lets each
piece evolve independently and map cleanly to PostgreSQL tables later.

## 1. `projects` store

One record per project. **Never physically deleted** by normal app
operation — cancelled/on-hold/completed projects stay forever; "deleting"
a project always means setting `archived: true`, never removing the row.

Keyed by `id` (a generated UUID). Indexed on `projectCode` (unique),
`status`, and `archived` for fast lookups/filters.

| Field | System? | Type | Notes |
|---|---|---|---|
| `id` | yes | string (UUID) | Primary key, never shown to users |
| `projectCode` | yes | string | e.g. `PC-0001`. Unique, permanent, never reused |
| `archived` | yes | boolean | Soft-delete flag |
| `archivedDate` | yes | string (ISO date) or `null` | Set when archived |
| `createdDate` | yes | string (ISO date) | Set once, on creation |
| `lastModifiedDate` | yes | string (ISO date) | Updated on every save |
| `projectName` | no | text | |
| `customer` | no | text | |
| `projectType` | no | text | |
| `projectDescription` | no | long text | |
| `projectManager` | no | text | |
| `projectStatus` | no | dropdown | Values: `new`, `active`, `on-hold`, `completed`, `cancelled` by default |
| `startDate` | no | date | |
| `targetCompletionDate` | no | date | |
| `actualCompletionDate` | no | date | |
| `priority` | no | dropdown | e.g. Low / Medium / High |
| `remarks` | no | long text | |

Everything in the "no" rows above is **configurable, not hard-coded** —
see section 2. If someone adds a new field (say `businessUnit`) through
Settings → Field Configuration, its value is simply stored as an extra
`businessUnit` property on the project record, alongside the built-in
ones. Disabling a field later does **not** remove that property from
existing records — it just stops the UI from showing it.

## 2. `fieldDefinitions` store

Describes every field that can appear on a project record, and how it
should behave in the UI. This is what makes the Project Code Register
form and table dynamic instead of hard-coded.

Keyed by `id` (UUID). Indexed on `module` (so other future modules can
reuse this same mechanism) and `order`.

| Field | Meaning |
|---|---|
| `id` | Primary key |
| `module` | Which module owns this field, e.g. `"project-code-register"` |
| `fieldKey` | The property name used on the record, e.g. `"customer"` |
| `label` | Human-readable name shown in the UI |
| `type` | One of: `text`, `longtext`, `number`, `date`, `dropdown`, `checkbox`, `email` |
| `enabled` | If false, hidden from forms/table, but data is preserved |
| `required` | If true, form validation requires a value |
| `system` | If true, this is a built-in structural field (Project ID, Project Code, Created/Modified/Archived Date). System fields cannot be disabled, deleted, or have their key changed |
| `order` | Display order (lower = earlier) |
| `defaultValue` | Optional value pre-filled on new records |
| `options` | Array of `{ value, label }`, used only when `type` is `dropdown` |
| `helpText` | Optional short description shown under the field |
| `createdDate` / `lastModifiedDate` | Bookkeeping timestamps |

Phase 1 ships with the fields listed in section 1 pre-seeded (see
`data/seed-data.js`). `projectStatus` and `priority` are ordinary dropdown
fields with pre-seeded options — not special-cased — so their choices can
be edited the same way as any other dropdown.

## 3. `settings` store

A plain key/value table for small application-level preferences. Keyed by
`key`.

Examples used by Phase 1:

- `{ key: "schemaVersion", value: 1 }` — local database schema version
- `{ key: "appPreferences", value: { theme: "light" } }`

This is intentionally separate from `fieldDefinitions` and `projects` —
it's app configuration, not business data.

## 4. `sequences` store

Holds the counters used to generate project codes safely. Keyed by
`name`.

- `{ name: "PC", nextNumber: 4 }` means the next generated code will be
  `PC-0004`.

The counter only ever increases. It survives app restarts because it's
stored in IndexedDB, not in memory. See `docs/ARCHITECTURE.md` and
`js/services/project-service.js` for how restore-from-backup reconciles
this counter safely (it's set to `max(existing codes) + 1`, never reset
lower, so restoring an older backup can never cause a duplicate code).

## 5. JSON backup file format

`js/services/backup-service.js` exports a single JSON file shaped like:

```json
{
  "backupFormat": "tads-phase1-backup",
  "backupVersion": 1,
  "exportedDate": "2026-09-22T10:00:00.000Z",
  "schemaVersion": 1,
  "data": {
    "projects": [ /* full projects store */ ],
    "fieldDefinitions": [ /* full fieldDefinitions store */ ],
    "settings": [ /* full settings store */ ],
    "sequences": [ /* full sequences store */ ]
  }
}
```

`backupFormat` and `backupVersion` are checked before any restore is
attempted, so an unrelated JSON file or an incompatible future format is
rejected with a clear message rather than silently corrupting local data.

## 6. Why this shape maps well to PostgreSQL later

- `projects` → a `projects` table. Built-in columns map 1:1; any
  fully-custom fields a user adds can live in a `custom_fields JSONB`
  column, or get promoted to real columns during migration.
- `fieldDefinitions` → a `project_field_definitions` table.
- `settings` → an `application_settings` table.
- `sequences` → generation logic becomes a PostgreSQL sequence or a
  small counters table guarded by a transaction.

No part of the Phase 1 schema requires a redesign to move to Postgres —
see `docs/ARCHITECTURE.md` section 5 for the full migration plan.
