/**
 * Default data used to initialize a brand-new local database. This is
 * only ever used once, the first time the app runs on a given browser
 * (see js/db/migrations.js). After that, everything comes from the
 * user's own IndexedDB data.
 */

import { generateId } from "../js/utils/id-generator.js";
import { nowIso } from "../js/utils/date-utils.js";

export const PROJECT_CODE_REGISTER_MODULE = "project-code-register";

/** Field definitions that ship with a fresh install of the Project Code Register. */
export function buildDefaultFieldDefinitions() {
  const now = nowIso();
  const base = (overrides) => ({
    id: generateId(),
    module: PROJECT_CODE_REGISTER_MODULE,
    enabled: true,
    required: false,
    system: false,
    defaultValue: "",
    options: [],
    helpText: "",
    createdDate: now,
    lastModifiedDate: now,
    ...overrides,
  });

  return [
    base({
      fieldKey: "id",
      label: "Project ID",
      type: "text",
      system: true,
      order: 0,
      helpText: "Internal system identifier. Not shown on forms.",
    }),
    base({
      fieldKey: "projectCode",
      label: "Project Code",
      type: "text",
      system: true,
      order: 10,
      helpText: "Generated automatically, e.g. PC-0001. Never reused.",
    }),
    base({
      fieldKey: "projectName",
      label: "Project Name",
      type: "text",
      required: true,
      order: 20,
    }),
    base({
      fieldKey: "customer",
      label: "Customer",
      type: "text",
      order: 30,
    }),
    base({
      fieldKey: "projectType",
      label: "Project Type",
      type: "text",
      order: 40,
      helpText: "Free text for now — convert to a dropdown later if a fixed list emerges.",
    }),
    base({
      fieldKey: "projectDescription",
      label: "Project Description",
      type: "longtext",
      order: 50,
    }),
    base({
      fieldKey: "projectManager",
      label: "Project Manager / Owner",
      type: "text",
      order: 60,
    }),
    base({
      fieldKey: "projectStatus",
      label: "Project Status",
      type: "dropdown",
      required: true,
      defaultValue: "new",
      order: 70,
      options: [
        { value: "new", label: "New" },
        { value: "active", label: "Active" },
        { value: "on-hold", label: "On Hold" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ],
      helpText: "The Dashboard's status counts expect these default values.",
    }),
    base({
      fieldKey: "startDate",
      label: "Project Start Date",
      type: "date",
      order: 80,
    }),
    base({
      fieldKey: "targetCompletionDate",
      label: "Target Completion Date",
      type: "date",
      order: 90,
    }),
    base({
      fieldKey: "actualCompletionDate",
      label: "Actual Completion Date",
      type: "date",
      order: 100,
    }),
    base({
      fieldKey: "priority",
      label: "Priority",
      type: "dropdown",
      defaultValue: "medium",
      order: 110,
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ],
    }),
    base({
      fieldKey: "remarks",
      label: "Remarks",
      type: "longtext",
      order: 120,
    }),
    base({
      fieldKey: "createdDate",
      label: "Created Date",
      type: "date",
      system: true,
      order: 130,
    }),
    base({
      fieldKey: "lastModifiedDate",
      label: "Last Modified Date",
      type: "date",
      system: true,
      order: 140,
    }),
    base({
      fieldKey: "archivedDate",
      label: "Archived Date",
      type: "date",
      system: true,
      order: 150,
    }),
  ];
}

export function buildDefaultSettings() {
  return [
    { key: "schemaVersion", value: 1 },
    { key: "appPreferences", value: { theme: "light" } },
  ];
}

export function buildDefaultSequences() {
  return [{ name: "PC", nextNumber: 1 }];
}
