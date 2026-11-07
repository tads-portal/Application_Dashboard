/**
 * Thin, promise-based wrapper around the raw IndexedDB API.
 *
 * This file knows nothing about projects, fields, or any business rule —
 * it only knows how to open the database and move records in and out of
 * named object stores. All business logic lives in js/services/*.
 *
 * This is the ONE file that would be replaced (along with migrations.js)
 * if Phase 1 ever moves to Supabase/PostgreSQL. See docs/ARCHITECTURE.md.
 */

import { DB_NAME, DB_VERSION, runMigrations } from "./migrations.js";

let dbPromise = null;

/** Opens (and if needed, creates/upgrades) the database. Cached after first call. */
export function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("This browser does not support IndexedDB, which TADS requires for local storage."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      runMigrations(request.result, event.oldVersion, request.transaction);
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        // Another tab upgraded the schema; close so it can proceed.
        db.close();
      };
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open the local database."));
    };

    request.onblocked = () => {
      reject(new Error("The local database is blocked by another open tab. Close other TADS tabs and reload."));
    };
  });

  return dbPromise;
}

function withStore(storeName, mode, work) {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        let result;
        try {
          result = work(store);
        } catch (err) {
          reject(err);
          return;
        }
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error || new Error(`Transaction failed on ${storeName}.`));
        tx.onabort = () => reject(tx.error || new Error(`Transaction aborted on ${storeName}.`));
      })
  );
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getAll(storeName) {
  return withStore(storeName, "readonly", (store) => requestToPromise(store.getAll())).then((p) => p);
}

export function getById(storeName, key) {
  return withStore(storeName, "readonly", (store) => requestToPromise(store.get(key))).then((p) => p);
}

export function getByIndex(storeName, indexName, value) {
  return withStore(storeName, "readonly", (store) =>
    requestToPromise(store.index(indexName).getAll(value))
  ).then((p) => p);
}

export function put(storeName, value) {
  return withStore(storeName, "readwrite", (store) => requestToPromise(store.put(value))).then(() => value);
}

export function putMany(storeName, values) {
  return withStore(storeName, "readwrite", (store) => {
    for (const value of values) store.put(value);
  });
}

export function removeById(storeName, key) {
  return withStore(storeName, "readwrite", (store) => requestToPromise(store.delete(key)));
}

export function clearStore(storeName) {
  return withStore(storeName, "readwrite", (store) => requestToPromise(store.clear()));
}

/** Replaces the entire contents of a store atomically (used by restore). */
export function replaceAll(storeName, values) {
  return withStore(storeName, "readwrite", (store) => {
    store.clear();
    for (const value of values) store.put(value);
  });
}
