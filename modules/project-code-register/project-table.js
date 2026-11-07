import { renderTable } from "../../js/components/table.js";
import { formatDate } from "../../js/utils/date-utils.js";
import { truncate } from "../../js/utils/formatters.js";

const STATUS_BADGE_CLASS = {
  new: "badge-neutral",
  active: "badge-success",
  "on-hold": "badge-warning",
  completed: "badge-info",
  cancelled: "badge-danger",
};

function renderCell(field, row) {
  const value = row[field.fieldKey];
  if (value === null || value === undefined || value === "") return "";

  if (field.fieldKey === "projectStatus") {
    const option = (field.options || []).find((o) => o.value === value);
    const badge = document.createElement("span");
    badge.className = `badge ${STATUS_BADGE_CLASS[value] || "badge-neutral"}`;
    badge.textContent = option ? option.label : value;
    return badge;
  }

  if (field.type === "date") return formatDate(value);
  if (field.type === "checkbox") return value ? "Yes" : "No";
  if (field.type === "dropdown") {
    const option = (field.options || []).find((o) => o.value === value);
    return option ? option.label : value;
  }
  if (field.type === "longtext") return truncate(String(value), 60);
  return String(value);
}

function buildColumns(fieldDefs) {
  return fieldDefs
    .filter((f) => f.fieldKey !== "id")
    .map((field) => ({
      key: field.fieldKey,
      label: field.label,
      primary: field.fieldKey === "projectCode",
      sortable: ["text", "date", "dropdown", "number", "email"].includes(field.type),
      render: (row) => renderCell(field, row),
    }));
}

/**
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {Array} options.fieldDefs - enabled field definitions (table columns)
 * @param {Array} options.projects
 * @param {string} options.sortBy
 * @param {"asc"|"desc"} options.sortDir
 * @param {(key: string) => void} options.onSortChange
 * @param {(project: Object) => void} options.onEdit
 * @param {(project: Object) => void} options.onArchive
 * @param {(project: Object) => void} options.onRestore
 */
export function renderProjectTable(container, options) {
  const { fieldDefs, projects, sortBy, sortDir, onSortChange, onEdit, onArchive, onRestore } = options;
  const columns = buildColumns(fieldDefs);

  renderTable(container, {
    columns,
    rows: projects,
    sortBy,
    sortDir,
    onSortChange,
    getRowClass: (row) => (row.archived ? "is-archived" : ""),
    getActions: (row) => {
      const actions = [{ label: "Open", variant: "secondary", onClick: () => onEdit(row) }];
      if (row.archived) {
        actions.push({ label: "Restore", variant: "primary", onClick: () => onRestore(row) });
      } else {
        actions.push({ label: "Archive", variant: "danger", onClick: () => onArchive(row) });
      }
      return actions;
    },
    emptyTitle: "No projects match your filters",
    emptyMessage: 'Try clearing search/filters, or click "New Project" to add one.',
  });
}
