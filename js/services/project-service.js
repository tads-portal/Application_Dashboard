/**
 * Business logic for the Project Code Register: project codes, creating
 * and editing projects, archiving/restoring, searching, filtering,
 * sorting, and Dashboard statistics.
 *
 * This file is the only place that knows the rules "how is a project
 * code generated" and "what counts as active vs. archived" — the UI
 * modules never compute this themselves.
 */

import * as dataService from "./data-service.js";
import * as configService from "./configuration-service.js";
import { generateId } from "../utils/id-generator.js";
import { nowIso } from "../utils/date-utils.js";
import { validateRecord } from "../utils/validation.js";
import { PROJECT_CODE_REGISTER_MODULE } from "../../data/seed-data.js";

const PROJECTS_STORE = dataService.STORES.PROJECTS;
const SEQUENCES_STORE = dataService.STORES.SEQUENCES;
const SEQUENCE_NAME = "PC";
const CODE_PREFIX = "PC-";
const CODE_PADDING = 4;

// Serializes project-code generation within this browser tab so two
// rapid "New Project" clicks can never be handed the same number.
let codeGenerationChain = Promise.resolve();

function formatCode(number) {
  return `${CODE_PREFIX}${String(number).padStart(CODE_PADDING, "0")}`;
}

async function nextProjectCode() {
  const sequence = (await dataService.getById(SEQUENCES_STORE, SEQUENCE_NAME)) || {
    name: SEQUENCE_NAME,
    nextNumber: 1,
  };
  const code = formatCode(sequence.nextNumber);
  await dataService.update(SEQUENCES_STORE, { name: SEQUENCE_NAME, nextNumber: sequence.nextNumber + 1 });
  return code;
}

function generateProjectCode() {
  const result = codeGenerationChain.then(() => nextProjectCode());
  // Keep the chain alive even if this particular call fails.
  codeGenerationChain = result.catch(() => {});
  return result;
}

/**
 * After a backup restore (or any bulk import), makes sure the sequence
 * counter is at least one past the highest project code already present,
 * so a restored (possibly older) backup can never cause a duplicate code.
 */
export async function reconcileSequenceAfterImport() {
  const projects = await dataService.getAll(PROJECTS_STORE);
  let maxNumber = 0;
  for (const project of projects) {
    const match = /^PC-(\d+)$/.exec(project.projectCode || "");
    if (match) {
      maxNumber = Math.max(maxNumber, parseInt(match[1], 10));
    }
  }
  const sequence = (await dataService.getById(SEQUENCES_STORE, SEQUENCE_NAME)) || {
    name: SEQUENCE_NAME,
    nextNumber: 1,
  };
  const nextNumber = Math.max(sequence.nextNumber, maxNumber + 1);
  await dataService.update(SEQUENCES_STORE, { name: SEQUENCE_NAME, nextNumber });
}

function buildRecordFromForm(fieldDefs, formValues, base) {
  const record = { ...base };
  for (const field of fieldDefs) {
    if (field.system) continue;
    if (Object.prototype.hasOwnProperty.call(formValues, field.fieldKey)) {
      record[field.fieldKey] = formValues[field.fieldKey];
    }
  }
  return record;
}

export async function validateProjectForm(formValues) {
  const activeFields = await configService.getActiveFieldDefinitions(PROJECT_CODE_REGISTER_MODULE);
  const editableFields = activeFields.filter((f) => !f.system);
  return validateRecord(editableFields, formValues);
}

export async function createProject(formValues) {
  const validation = await validateProjectForm(formValues);
  if (!validation.valid) {
    const error = new Error("Please correct the highlighted fields.");
    error.fieldErrors = validation.errors;
    throw error;
  }

  const allFields = await configService.getFieldDefinitions(PROJECT_CODE_REGISTER_MODULE);
  const now = nowIso();
  const projectCode = await generateProjectCode();

  const base = {
    id: generateId(),
    projectCode,
    archived: false,
    archivedDate: null,
    createdDate: now,
    lastModifiedDate: now,
  };

  const record = buildRecordFromForm(allFields, formValues, base);
  await dataService.create(PROJECTS_STORE, record);
  return record;
}

export async function updateProject(id, formValues) {
  const existing = await dataService.getById(PROJECTS_STORE, id);
  if (!existing) throw new Error("Project not found.");

  const validation = await validateProjectForm(formValues);
  if (!validation.valid) {
    const error = new Error("Please correct the highlighted fields.");
    error.fieldErrors = validation.errors;
    throw error;
  }

  const allFields = await configService.getFieldDefinitions(PROJECT_CODE_REGISTER_MODULE);
  const record = buildRecordFromForm(allFields, formValues, existing);
  record.lastModifiedDate = nowIso();
  await dataService.update(PROJECTS_STORE, record);
  return record;
}

export async function getProject(id) {
  return dataService.getById(PROJECTS_STORE, id);
}

export async function archiveProject(id) {
  const project = await dataService.getById(PROJECTS_STORE, id);
  if (!project) throw new Error("Project not found.");
  project.archived = true;
  project.archivedDate = nowIso();
  project.lastModifiedDate = nowIso();
  await dataService.update(PROJECTS_STORE, project);
  return project;
}

export async function restoreProject(id) {
  const project = await dataService.getById(PROJECTS_STORE, id);
  if (!project) throw new Error("Project not found.");
  project.archived = false;
  project.archivedDate = null;
  project.lastModifiedDate = nowIso();
  await dataService.update(PROJECTS_STORE, project);
  return project;
}

export async function setProjectStatus(id, status) {
  const project = await dataService.getById(PROJECTS_STORE, id);
  if (!project) throw new Error("Project not found.");
  project.projectStatus = status;
  project.lastModifiedDate = nowIso();
  await dataService.update(PROJECTS_STORE, project);
  return project;
}

const SEARCHABLE_FIELDS = [
  "projectCode",
  "projectName",
  "customer",
  "projectManager",
  "projectType",
  "remarks",
  "projectDescription",
];

/**
 * @param {Object} options
 * @param {string} [options.search]
 * @param {string} [options.status] - a projectStatus value, or "" for all
 * @param {"active"|"archived"|"all"} [options.archived]
 * @param {string} [options.sortBy]
 * @param {"asc"|"desc"} [options.sortDir]
 */
export async function listProjects(options = {}) {
  const { search = "", status = "", archived = "active", sortBy = "createdDate", sortDir = "desc" } = options;

  let projects = await dataService.getAll(PROJECTS_STORE);

  if (archived === "active") {
    projects = projects.filter((p) => !p.archived);
  } else if (archived === "archived") {
    projects = projects.filter((p) => p.archived);
  }

  if (status) {
    projects = projects.filter((p) => p.projectStatus === status);
  }

  if (search.trim()) {
    const term = search.trim().toLowerCase();
    projects = projects.filter((p) =>
      SEARCHABLE_FIELDS.some((key) => String(p[key] ?? "").toLowerCase().includes(term))
    );
  }

  projects.sort((a, b) => {
    const av = a[sortBy] ?? "";
    const bv = b[sortBy] ?? "";
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  return projects;
}

/**
 * Dashboard counts. Archived projects are counted only in `archived`,
 * never double-counted into the status buckets, so the numbers stay easy
 * to reason about. See docs/DATA-MODEL.md.
 */
export async function getDashboardStats() {
  const projects = await dataService.getAll(PROJECTS_STORE);
  const nonArchived = projects.filter((p) => !p.archived);

  const countByStatus = (statusValue) => nonArchived.filter((p) => p.projectStatus === statusValue).length;

  return {
    total: projects.length,
    active: countByStatus("active"),
    completed: countByStatus("completed"),
    onHold: countByStatus("on-hold"),
    cancelled: countByStatus("cancelled"),
    archived: projects.filter((p) => p.archived).length,
  };
}

export async function getRecentProjects(limit = 5) {
  const projects = await dataService.getAll(PROJECTS_STORE);
  return projects
    .sort((a, b) => new Date(b.lastModifiedDate) - new Date(a.lastModifiedDate))
    .slice(0, limit);
}
