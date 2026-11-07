import { getActiveFieldDefinitions } from "../../js/services/configuration-service.js";
import { listProjects, archiveProject, restoreProject } from "../../js/services/project-service.js";
import { buildProjectsCsv, downloadCsv } from "../../js/services/export-service.js";
import { confirmAction } from "../../js/components/confirmation.js";
import { showSuccess, showError } from "../../js/components/notification.js";
import { renderProjectTable } from "./project-table.js";
import { openProjectForm } from "./project-form.js";
import { PROJECT_CODE_REGISTER_MODULE } from "../../data/seed-data.js";

async function loadFragment(container) {
  const response = await fetch(new URL("./project-code-register.html", import.meta.url));
  container.innerHTML = await response.text();
}

export async function render(container, params = {}) {
  await loadFragment(container);

  const state = {
    search: "",
    status: "",
    archived: "active",
    sortBy: "projectCode",
    sortDir: "desc",
  };

  const searchInput = container.querySelector("#pcr-search");
  const statusFilter = container.querySelector("#pcr-status-filter");
  const archivedFilter = container.querySelector("#pcr-archived-filter");
  const tableContainer = container.querySelector("#pcr-table-container");
  const newProjectBtn = container.querySelector("#pcr-new-project");
  const exportBtn = container.querySelector("#pcr-export-csv");

  let activeFieldDefs = [];
  let lastProjects = [];

  async function loadFieldDefsAndStatusOptions() {
    activeFieldDefs = await getActiveFieldDefinitions(PROJECT_CODE_REGISTER_MODULE);
    const statusField = activeFieldDefs.find((f) => f.fieldKey === "projectStatus");
    statusFilter.innerHTML = '<option value="">All statuses</option>';
    for (const opt of statusField ? statusField.options : []) {
      const optEl = document.createElement("option");
      optEl.value = opt.value;
      optEl.textContent = opt.label;
      statusFilter.appendChild(optEl);
    }
  }

  async function refresh() {
    lastProjects = await listProjects(state);
    renderProjectTable(tableContainer, {
      fieldDefs: activeFieldDefs,
      projects: lastProjects,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      onSortChange: (key) => {
        if (state.sortBy === key) {
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.sortBy = key;
          state.sortDir = "asc";
        }
        refresh();
      },
      onEdit: async (project) => {
        const saved = await openProjectForm(project);
        if (saved) refresh();
      },
      onArchive: async (project) => {
        const confirmed = await confirmAction({
          title: "Archive project?",
          message: `${project.projectCode} — ${project.projectName || ""} will be archived. Its data and project code are preserved and it can be restored later.`,
          confirmLabel: "Archive",
          danger: true,
        });
        if (!confirmed) return;
        try {
          await archiveProject(project.id);
          showSuccess(`${project.projectCode} archived.`);
          refresh();
        } catch (err) {
          showError(err.message || "Could not archive the project.");
        }
      },
      onRestore: async (project) => {
        const confirmed = await confirmAction({
          title: "Restore project?",
          message: `${project.projectCode} will be restored to the active register.`,
          confirmLabel: "Restore",
        });
        if (!confirmed) return;
        try {
          await restoreProject(project.id);
          showSuccess(`${project.projectCode} restored.`);
          refresh();
        } catch (err) {
          showError(err.message || "Could not restore the project.");
        }
      },
    });
  }

  let searchDebounce;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      state.search = searchInput.value;
      refresh();
    }, 200);
  });

  statusFilter.addEventListener("change", () => {
    state.status = statusFilter.value;
    refresh();
  });

  archivedFilter.addEventListener("change", () => {
    state.archived = archivedFilter.value;
    refresh();
  });

  newProjectBtn.addEventListener("click", async () => {
    const saved = await openProjectForm();
    if (saved) refresh();
  });

  exportBtn.addEventListener("click", () => {
    if (!lastProjects.length) {
      showError("There are no projects to export for the current filters.");
      return;
    }
    const csv = buildProjectsCsv(lastProjects, activeFieldDefs);
    downloadCsv(csv, `tads-project-register-${new Date().toISOString().slice(0, 10)}.csv`);
  });

  await loadFieldDefsAndStatusOptions();
  await refresh();

  if (params.new === "1") {
    const saved = await openProjectForm();
    if (saved) refresh();
  }
}
