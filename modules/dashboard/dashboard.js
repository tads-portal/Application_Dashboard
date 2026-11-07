import { getDashboardStats, getRecentProjects } from "../../js/services/project-service.js";
import { formatDateTime } from "../../js/utils/date-utils.js";

async function loadFragment(container) {
  const response = await fetch(new URL("./dashboard.html", import.meta.url));
  container.innerHTML = await response.text();
}

function renderStatCard(value, label) {
  const card = document.createElement("div");
  card.className = "card stat-card";
  const valueEl = document.createElement("div");
  valueEl.className = "stat-card__value";
  valueEl.textContent = value;
  const labelEl = document.createElement("div");
  labelEl.className = "stat-card__label";
  labelEl.textContent = label;
  card.append(valueEl, labelEl);
  return card;
}

async function renderStats(container) {
  const stats = await getDashboardStats();
  const statsEl = container.querySelector("#dash-stats");
  statsEl.innerHTML = "";
  statsEl.append(
    renderStatCard(stats.total, "Total Projects"),
    renderStatCard(stats.active, "Active"),
    renderStatCard(stats.onHold, "On Hold"),
    renderStatCard(stats.completed, "Completed"),
    renderStatCard(stats.cancelled, "Cancelled"),
    renderStatCard(stats.archived, "Archived")
  );
}

async function renderRecent(container) {
  const recent = await getRecentProjects(5);
  const el = container.querySelector("#dash-recent");

  if (!recent.length) {
    el.innerHTML =
      '<div class="empty-state">No projects yet. Use "New Project" to create the first entry in the Project Code Register.</div>';
    return;
  }

  const list = document.createElement("div");
  recent.forEach((project, index) => {
    const row = document.createElement("div");
    row.className = "record-card__row";
    if (index === 0) row.style.borderTop = "none";

    const left = document.createElement("span");
    left.innerHTML = `<strong>${project.projectCode}</strong> &middot; ${project.projectName || "(untitled)"}`;

    const right = document.createElement("span");
    right.className = "text-muted";
    right.textContent = formatDateTime(project.lastModifiedDate);

    row.append(left, right);
    list.appendChild(row);
  });

  el.innerHTML = "";
  el.appendChild(list);
}

export async function render(container) {
  await loadFragment(container);
  await Promise.all([renderStats(container), renderRecent(container)]);
}
