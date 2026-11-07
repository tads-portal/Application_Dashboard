/**
 * Generic repository layer. Knows how to store/retrieve records by store
 * name, but has NO knowledge of projects, field configuration, or any
 * TADS business rule — that belongs in the other files under js/services/.
 *
 * Every other service is built on top of this one function set. If the
 * storage engine ever changes (see docs/ARCHITECTURE.md, future Supabase
 * migration), this is the layer that gets swapped out; the functions
 * below would keep the same names/signatures.
 */

import * as db from "../db/indexeddb.js";
import { STORES } from "../db/migrations.js";

export { STORES };

export function getAll(storeName) {
  return db.getAll(storeName);
}

export function getById(storeName, id) {
  return db.getById(storeName, id);
}

export function getAllByIndex(storeName, indexName, value) {
  return db.getByIndex(storeName, indexName, value);
}

export function create(storeName, record) {
  return db.put(storeName, record);
}

export function update(storeName, record) {
  return db.put(storeName, record);
}

export function remove(storeName, id) {
  return db.removeById(storeName, id);
}

export function replaceAll(storeName, records) {
  return db.replaceAll(storeName, records);
}

export function ready() {
  return db.openDatabase().then(() => true);
}
