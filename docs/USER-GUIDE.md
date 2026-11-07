# User Guide

This guide covers day-to-day use of the TADS Phase 1 app. It assumes no
prior web app experience.

## Getting started

1. Start a local server in the project folder (see README.md for the
   exact command) and open the app in your browser.
2. The first time you open it, TADS creates its local database in your
   browser automatically — there's nothing to set up.
3. Everything you do is saved **only in this browser, on this device**.
   Use **Backup & Restore** regularly if you want a copy you can move
   elsewhere or recover from.

## The Dashboard

The Dashboard is the home screen. It shows:

- Live counts: total projects, and how many are Active / On Hold /
  Completed / Cancelled / Archived. These numbers come directly from
  your real data — they update as soon as you create, edit, or archive
  a project.
- Application cards — **Project Code Register** is the only one that's
  built so far; the rest say "Coming Soon."
- **Recent Activity** — your 5 most recently created/edited projects.
- Quick buttons for New Project, the Project Register, Backup &
  Restore, and Settings.

## Project Code Register

### Creating a project

Click **+ New Project** (from the Dashboard or the Register page). Fill
in the form — fields marked with a red `*` are required. Click **Create
Project**. TADS automatically assigns the next project code (e.g.
`PC-0007`) — you never type this yourself, and it's permanent.

### Editing a project

Click **Open** on any row (desktop table or mobile card) to edit it.

### Archiving and restoring

Projects are **never permanently deleted** by normal use. Click
**Archive** to remove a project from the active register — you'll be
asked to confirm. Archived projects keep their project code and all
their data forever, and are hidden from the default "Active projects"
view. Switch the filter dropdown to "Archived projects" (or "All
projects") to find one, then click **Restore** to bring it back.

### Search, filter, sort

- The search box matches project code, name, customer, manager, type,
  and remarks/description text.
- The status dropdown filters to one status at a time.
- The archived dropdown switches between Active / Archived / All.
- Click any column heading to sort by it; click again to reverse the
  direction.

### Exporting to CSV

Click **Export CSV** to download the currently filtered/sorted list as
a spreadsheet-friendly CSV file (opens directly in Excel/Google
Sheets). This is for reading/sharing — for a file you can *restore*
from later, use Backup & Restore instead (see below).

## Field Configuration (Settings → Field Configuration)

This is where you control what fields appear on the Project form and
Register, without needing a developer.

- **Add Field**: click **+ Add Field**, name it, pick a type (Text,
  Long Text, Number, Date, Dropdown, Checkbox, or Email), mark it
  Required if needed, and for Dropdown fields add its option list. It
  appears on the Project form immediately.
- **Disable Field**: uncheck "Enabled" on any non-system field. You'll
  be asked to confirm. The field disappears from the form and table,
  but **any data already saved under it is kept** — nothing is deleted.
- **Re-enable Field**: check "Enabled" again — previously entered data
  reappears exactly as it was.
- **Required / Optional**: toggle the "Required" checkbox at any time.
- **Reorder**: use the ▲ / ▼ buttons to move a field up or down; this
  changes its position on both the form and the register table.
- **Edit dropdown options**: click **Edit** on a dropdown field to add,
  remove, or rename its choices.
- **System fields** (Project ID, Project Code, Created/Modified/Archived
  Date) are managed automatically by the app and can't be disabled,
  deleted, or reordered into disabled state — they're marked "System"
  and greyed out on purpose.

## Backup & Restore

- **Download Backup (JSON)**: saves every project, field definition,
  and setting to one JSON file. Do this regularly and keep the file
  somewhere safe (cloud drive, USB, etc.) — it's your only way to
  recover data or move it to another computer.
- **Restore from Backup**: choose a previously downloaded JSON file and
  click **Restore from Backup**. TADS validates the file first (you'll
  get a clear error if it's not a real TADS backup). If it's valid,
  you'll be asked to confirm — restoring **replaces all current local
  data**. A safety backup of what's currently on this device downloads
  automatically first, just in case.

## Working offline

Once you've loaded the app in your browser at least once, it keeps
working without an internet connection — an "Offline" indicator appears
in the header when you lose connectivity. Your data is always local
anyway, so day-to-day use (creating/editing projects) works offline
from the start.

**Important:** offline just means "works without internet on this
device." It does **not** mean your data syncs to any other device or
computer — see the README's "Important limitation" note.

## Settings → Application Settings

Shows read-only application info (local schema version, the next
project code that will be assigned, and an estimate of how much browser
storage TADS is using) plus a shortcut to Backup & Restore.
