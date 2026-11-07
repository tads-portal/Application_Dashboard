# Tests

Phase 1 has no unit-test framework wired in yet (there's no build step to
run one through). What's here is a scripted **browser smoke test**
(Playwright) that exercises the real app end-to-end in a headless
Chromium browser — the same way a person would click through it — and
fails loudly (non-zero exit code + thrown error) if anything breaks.

## Running it

Requires Node.js and the `playwright` package with Chromium available.

```bash
npm install playwright   # if you don't already have it globally
node tests/e2e/smoke-test.js
```

The script starts its own local static server on port 8099 (to avoid
clashing with anything you already have running on 8080) and shuts it
down when finished.

## What it covers

- Dashboard loads with zero real projects, then with real data, with
  correct live stats
- Creating, editing, searching, filtering, sorting projects
- Sequential, non-duplicating project code generation (`PC-0001`, ...)
- Required-field validation
- Archiving and restoring a project (soft-delete; code/data preserved)
- Field Configuration: adding a custom dropdown field, confirming it
  appears on the Project form, disabling it (data preserved), and
  re-enabling it (data reappears)
- CSV export triggers a real download
- Full JSON backup export/restore, including rejecting an invalid file
  and reconciling the project-code sequence after a restore
- Responsive layout at mobile width (card list + off-canvas nav)
- Offline reload after the service worker has cached the app shell
- Zero unexpected browser console/JS errors throughout

## When to run it

Run it after any change to `js/services/*`, `js/db/*`, or any
`modules/*` file, before considering that change done. It's also a good
first thing to run if something in the app "feels broken" but you're
not sure where — the section that fails narrows it down quickly.
