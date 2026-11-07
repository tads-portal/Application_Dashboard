/**
 * Human-readable CSV export for the Project Code Register.
 * JSON (backup-service.js) remains the authoritative Phase 1 backup
 * format — this is for opening in Excel/Sheets, not for restoring data.
 */

import { escapeCsvValue } from "../utils/formatters.js";
import { formatDate } from "../utils/date-utils.js";

function formatValueForCsv(field, rawValue) {
  if (rawValue === null || rawValue === undefined || rawValue === "") return "";

  switch (field.type) {
    case "date":
      return formatDate(rawValue);
    case "checkbox":
      return rawValue ? "Yes" : "No";
    case "dropdown": {
      const option = (field.options || []).find((o) => o.value === rawValue);
      return option ? option.label : rawValue;
    }
    default:
      return String(rawValue);
  }
}

/**
 * @param {Array} projects
 * @param {Array} fieldDefs - the field definitions to use as columns (order preserved)
 */
export function buildProjectsCsv(projects, fieldDefs) {
  const columns = fieldDefs.filter((f) => f.fieldKey !== "id");
  const header = columns.map((f) => escapeCsvValue(f.label));
  header.push("Archived");

  const rows = projects.map((project) => {
    const cells = columns.map((field) => escapeCsvValue(formatValueForCsv(field, project[field.fieldKey])));
    cells.push(escapeCsvValue(project.archived ? "Yes" : "No"));
    return cells;
  });

  return [header, ...rows].map((row) => row.join(",")).join("\r\n");
}

export function downloadCsv(csvContent, filename) {
  // Leading BOM keeps Excel from mangling non-ASCII characters.
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
