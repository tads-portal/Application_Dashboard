/**
 * Full JSON backup and restore for all local data (see docs/DATA-MODEL.md
 * section 5 for the exact file format).
 *
 * This service only handles reading/writing the data itself. Confirming
 * with the user ("this will replace your local data, continue?") is a UI
 * concern and happens in modules/backup.
 */

import * as dataService from "./data-service.js";
import { reconcileSequenceAfterImport } from "./project-service.js";
import { nowIso } from "../utils/date-utils.js";

export const BACKUP_FORMAT = "tads-phase1-backup";
export const BACKUP_VERSION = 1;
const SUPPORTED_BACKUP_VERSIONS = [1];

const { STORES } = dataService;

async function buildBackupPayload() {
  const [projects, fieldDefinitions, settings, sequences] = await Promise.all([
    dataService.getAll(STORES.PROJECTS),
    dataService.getAll(STORES.FIELD_DEFINITIONS),
    dataService.getAll(STORES.SETTINGS),
    dataService.getAll(STORES.SEQUENCES),
  ]);

  return {
    backupFormat: BACKUP_FORMAT,
    backupVersion: BACKUP_VERSION,
    exportedDate: nowIso(),
    schemaVersion: 1,
    data: { projects, fieldDefinitions, settings, sequences },
  };
}

function triggerJsonDownload(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function timestampForFilename() {
  return nowIso().replace(/[:.]/g, "-");
}

/** Exports every store as a downloaded JSON file. Returns the payload for callers that want counts. */
export async function exportBackup() {
  const payload = await buildBackupPayload();
  triggerJsonDownload(payload, `tads-backup-${timestampForFilename()}.json`);
  return payload;
}

/** Used internally before a restore, so the user always has a way back. */
export async function downloadSafetyBackup() {
  const payload = await buildBackupPayload();
  triggerJsonDownload(payload, `tads-pre-restore-safety-backup-${timestampForFilename()}.json`);
  return payload;
}

/** Parses and validates a backup file's text content. Throws a clear Error if it's not usable. */
export function parseBackupFile(fileText) {
  let payload;
  try {
    payload = JSON.parse(fileText);
  } catch {
    throw new Error("This file is not valid JSON and cannot be used as a TADS backup.");
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("This file does not contain a recognizable TADS backup.");
  }
  if (payload.backupFormat !== BACKUP_FORMAT) {
    throw new Error("This file is not a TADS Phase 1 backup file.");
  }
  if (!SUPPORTED_BACKUP_VERSIONS.includes(payload.backupVersion)) {
    throw new Error(
      `This backup was created with format version ${payload.backupVersion}, which this version of the app does not support.`
    );
  }
  if (!payload.data || typeof payload.data !== "object") {
    throw new Error("This backup file is missing its data section.");
  }
  for (const key of ["projects", "fieldDefinitions", "settings", "sequences"]) {
    if (!Array.isArray(payload.data[key])) {
      throw new Error(`This backup file is missing or has corrupted "${key}" data.`);
    }
  }

  return payload;
}

/**
 * Replaces ALL local data with the contents of a validated backup payload.
 * Callers must already have user confirmation before calling this — it is
 * destructive to current local data (a safety backup should be offered
 * first via downloadSafetyBackup()).
 */
export async function restoreFromBackup(payload) {
  const { projects, fieldDefinitions, settings, sequences } = payload.data;

  await Promise.all([
    dataService.replaceAll(STORES.PROJECTS, projects),
    dataService.replaceAll(STORES.FIELD_DEFINITIONS, fieldDefinitions),
    dataService.replaceAll(STORES.SETTINGS, settings),
    dataService.replaceAll(STORES.SEQUENCES, sequences),
  ]);

  // Guards against an older/partial backup leaving the code sequence
  // behind the highest project code actually present.
  await reconcileSequenceAfterImport();

  return {
    projects: projects.length,
    fieldDefinitions: fieldDefinitions.length,
    settings: settings.length,
    sequences: sequences.length,
  };
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("Could not read the selected file."));
    reader.readAsText(file);
  });
}
