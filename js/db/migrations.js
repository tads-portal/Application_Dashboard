/**
 * IndexedDB schema definition and version upgrade logic.
 *
 * To change the schema in the future: bump DB_VERSION and add a new
 * `if (oldVersion < N)` block below. Never remove old blocks — a
 * long-time user's browser needs to walk through every step in order.
 * This is what "the local database must evolve without destroying
 * existing data" (see project brief) means in practice.
 */

import { buildDefaultFieldDefinitions, buildDefaultSettings, buildDefaultSequences } from "../../data/seed-data.js";

export const DB_NAME = "tads_phase1_db";
export const DB_VERSION = 1;

export const STORES = {
  PROJECTS: "projects",
  FIELD_DEFINITIONS: "fieldDefinitions",
  SETTINGS: "settings",
  SEQUENCES: "sequences",
};

/**
 * `transaction` is the versionchange transaction IndexedDB already has
 * open for this upgrade (from request.transaction in onupgradeneeded).
 * All schema AND seed-data writes must reuse it — opening a second
 * transaction here is not allowed while the versionchange transaction
 * is still active.
 */
export function runMigrations(db, oldVersion, transaction) {
  if (oldVersion < 1) {
    const projects = db.createObjectStore(STORES.PROJECTS, { keyPath: "id" });
    projects.createIndex("projectCode", "projectCode", { unique: true });
    projects.createIndex("projectStatus", "projectStatus", { unique: false });
    projects.createIndex("archived", "archived", { unique: false });

    const fieldDefinitions = db.createObjectStore(STORES.FIELD_DEFINITIONS, { keyPath: "id" });
    fieldDefinitions.createIndex("module", "module", { unique: false });
    fieldDefinitions.createIndex("order", "order", { unique: false });

    db.createObjectStore(STORES.SETTINGS, { keyPath: "key" });
    db.createObjectStore(STORES.SEQUENCES, { keyPath: "name" });

    seedInitialData(transaction);
  }

  // Future upgrades go here, e.g.:
  // if (oldVersion < 2) { ... }
}

function seedInitialData(transaction) {
  const fieldStore = transaction.objectStore(STORES.FIELD_DEFINITIONS);
  for (const fieldDef of buildDefaultFieldDefinitions()) {
    fieldStore.add(fieldDef);
  }

  const settingsStore = transaction.objectStore(STORES.SETTINGS);
  for (const setting of buildDefaultSettings()) {
    settingsStore.add(setting);
  }

  const sequencesStore = transaction.objectStore(STORES.SEQUENCES);
  for (const sequence of buildDefaultSequences()) {
    sequencesStore.add(sequence);
  }
}
