/**
 * Business rules for dynamic Field Configuration (see docs/DATA-MODEL.md
 * section 2 and docs/ARCHITECTURE.md section 3).
 *
 * Golden rule enforced here: disabling or reconfiguring a field must
 * NEVER destroy data already stored under that field's key on existing
 * project records. Hard deletion of a field definition is intentionally
 * not offered in Phase 1.
 */

import * as dataService from "./data-service.js";
import { generateId } from "../utils/id-generator.js";
import { nowIso } from "../utils/date-utils.js";
import { isValidFieldKey } from "../utils/validation.js";

const STORE = dataService.STORES.FIELD_DEFINITIONS;

export const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "longtext", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "email", label: "Email" },
];

function sortByOrder(list) {
  return [...list].sort((a, b) => a.order - b.order);
}

export async function getFieldDefinitions(module) {
  const all = await dataService.getAllByIndex(STORE, "module", module);
  return sortByOrder(all);
}

export async function getActiveFieldDefinitions(module) {
  const all = await getFieldDefinitions(module);
  return all.filter((f) => f.enabled);
}

export async function getFieldDefinition(id) {
  return dataService.getById(STORE, id);
}

function slugToCamelCase(label) {
  const words = label
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "";
  const [first, ...rest] = words;
  return (
    first.toLowerCase() +
    rest.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("")
  );
}

async function generateUniqueFieldKey(module, label) {
  const existing = await getFieldDefinitions(module);
  const existingKeys = new Set(existing.map((f) => f.fieldKey));
  let base = slugToCamelCase(label) || "field";
  if (!isValidFieldKey(base)) base = `field${base.replace(/[^a-zA-Z0-9]/g, "")}`;
  if (!isValidFieldKey(base)) base = "customField";

  let key = base;
  let suffix = 2;
  while (existingKeys.has(key)) {
    key = `${base}${suffix}`;
    suffix += 1;
  }
  return key;
}

/**
 * Adds a brand-new custom field. `type: "dropdown"` requires a non-empty
 * `options` array. Never call this for system fields — those are seeded
 * once and never re-created (see data/seed-data.js).
 */
export async function addField(module, input) {
  const label = (input.label || "").trim();
  if (!label) {
    throw new Error("Field name is required.");
  }
  if (!FIELD_TYPES.some((t) => t.value === input.type)) {
    throw new Error("Please choose a valid field type.");
  }
  if (input.type === "dropdown" && (!input.options || input.options.length === 0)) {
    throw new Error("Dropdown fields need at least one option.");
  }

  const existing = await getFieldDefinitions(module);
  const maxOrder = existing.reduce((max, f) => Math.max(max, f.order), 0);
  const fieldKey = await generateUniqueFieldKey(module, label);
  const now = nowIso();

  const fieldDef = {
    id: generateId(),
    module,
    fieldKey,
    label,
    type: input.type,
    enabled: true,
    required: Boolean(input.required),
    system: false,
    order: maxOrder + 10,
    defaultValue: input.defaultValue ?? "",
    options: input.type === "dropdown" ? normalizeOptions(input.options) : [],
    helpText: input.helpText || "",
    createdDate: now,
    lastModifiedDate: now,
  };

  await dataService.create(STORE, fieldDef);
  return fieldDef;
}

function normalizeOptions(options) {
  const seen = new Set();
  const normalized = [];
  for (const opt of options) {
    const value = String(opt.value || opt.label || "").trim();
    const label = String(opt.label || opt.value || "").trim();
    if (!value || !label) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    normalized.push({ value, label });
  }
  return normalized;
}

async function requireField(id) {
  const field = await dataService.getById(STORE, id);
  if (!field) throw new Error("Field not found.");
  return field;
}

/** Edits label, help text, and default value. Not for type/key/system-protected properties. */
export async function updateFieldDetails(id, changes) {
  const field = await requireField(id);
  if (changes.label !== undefined) {
    const label = String(changes.label).trim();
    if (!label) throw new Error("Field name cannot be empty.");
    field.label = label;
  }
  if (changes.helpText !== undefined) field.helpText = changes.helpText;
  if (changes.defaultValue !== undefined) field.defaultValue = changes.defaultValue;
  field.lastModifiedDate = nowIso();
  await dataService.update(STORE, field);
  return field;
}

export async function setFieldEnabled(id, enabled) {
  const field = await requireField(id);
  if (field.system) {
    throw new Error(`"${field.label}" is a system field and cannot be disabled.`);
  }
  field.enabled = Boolean(enabled);
  field.lastModifiedDate = nowIso();
  await dataService.update(STORE, field);
  return field;
}

export async function setFieldRequired(id, required) {
  const field = await requireField(id);
  if (field.system) {
    throw new Error(`"${field.label}" is a system field and its required status cannot be changed.`);
  }
  field.required = Boolean(required);
  field.lastModifiedDate = nowIso();
  await dataService.update(STORE, field);
  return field;
}

export async function setDropdownOptions(id, options) {
  const field = await requireField(id);
  if (field.type !== "dropdown") {
    throw new Error(`"${field.label}" is not a dropdown field.`);
  }
  const normalized = normalizeOptions(options);
  if (normalized.length === 0) {
    throw new Error("A dropdown field needs at least one option.");
  }
  field.options = normalized;
  field.lastModifiedDate = nowIso();
  await dataService.update(STORE, field);
  return field;
}

/** Persists a new display order. `orderedIds` is the full list of field ids for the module, in the desired order. */
export async function reorderFields(module, orderedIds) {
  const fields = await getFieldDefinitions(module);
  const byId = new Map(fields.map((f) => [f.id, f]));
  const now = nowIso();

  const updated = orderedIds
    .map((id, index) => {
      const field = byId.get(id);
      if (!field) return null;
      field.order = (index + 1) * 10;
      field.lastModifiedDate = now;
      return field;
    })
    .filter(Boolean);

  for (const field of updated) {
    // eslint-disable-next-line no-await-in-loop
    await dataService.update(STORE, field);
  }
  return getFieldDefinitions(module);
}
