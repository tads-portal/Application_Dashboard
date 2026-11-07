/**
 * Generic, responsive data table. Renders a normal <table> for
 * desktop/tablet and a stacked card list for mobile (CSS decides which
 * is visible — see css/responsive.css) from the exact same data, so
 * there is only one source of truth per row.
 */

/**
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {Array<{key: string, label: string, sortable?: boolean, primary?: boolean, render?: (row) => (string|Node)}>} options.columns
 * @param {Array<Object>} options.rows
 * @param {string} [options.sortBy]
 * @param {"asc"|"desc"} [options.sortDir]
 * @param {(key: string) => void} [options.onSortChange]
 * @param {(row: Object) => Array<{label: string, variant?: string, onClick: () => void}>} [options.getActions]
 * @param {(row: Object) => string} [options.getRowClass]
 * @param {string} [options.emptyTitle]
 * @param {string} [options.emptyMessage]
 */
export function renderTable(container, options) {
  const {
    columns,
    rows,
    sortBy,
    sortDir = "asc",
    onSortChange,
    getActions,
    getRowClass,
    emptyTitle = "No records found",
    emptyMessage = "Try adjusting your filters or search.",
  } = options;

  container.innerHTML = "";

  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "table-empty";
    const title = document.createElement("div");
    title.className = "table-empty__title";
    title.textContent = emptyTitle;
    const msg = document.createElement("div");
    msg.textContent = emptyMessage;
    empty.append(title, msg);
    container.appendChild(empty);
    return;
  }

  container.appendChild(buildDesktopTable(columns, rows, { sortBy, sortDir, onSortChange, getActions, getRowClass }));
  container.appendChild(buildCardList(columns, rows, { getActions }));
}

function cellContent(col, row) {
  const value = col.render ? col.render(row) : row[col.key];
  return value === null || value === undefined ? "" : value;
}

function appendCellContent(el, value) {
  if (value instanceof Node) el.appendChild(value);
  else el.textContent = String(value);
}

function buildDesktopTable(columns, rows, { sortBy, sortDir, onSortChange, getActions, getRowClass }) {
  const wrap = document.createElement("div");
  wrap.className = "table-wrap responsive-cards";

  const table = document.createElement("table");
  table.className = "data-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const col of columns) {
    const th = document.createElement("th");
    th.textContent = col.label;
    if (col.sortable) {
      th.classList.add("sortable");
      if (sortBy === col.key) {
        const indicator = document.createElement("span");
        indicator.className = "sort-indicator";
        indicator.textContent = sortDir === "asc" ? "▲" : "▼";
        th.appendChild(indicator);
      }
      th.addEventListener("click", () => onSortChange && onSortChange(col.key));
    }
    headRow.appendChild(th);
  }
  if (getActions) {
    const th = document.createElement("th");
    th.textContent = "Actions";
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);

  const tbody = document.createElement("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    if (getRowClass) {
      const cls = getRowClass(row);
      if (cls) tr.className = cls;
    }
    for (const col of columns) {
      const td = document.createElement("td");
      appendCellContent(td, cellContent(col, row));
      tr.appendChild(td);
    }
    if (getActions) {
      const td = document.createElement("td");
      td.className = "col-actions";
      for (const action of getActions(row)) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `btn btn-sm btn-${action.variant || "secondary"}`;
        btn.textContent = action.label;
        btn.addEventListener("click", action.onClick);
        td.appendChild(btn);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  table.append(thead, tbody);
  wrap.appendChild(table);
  return wrap;
}

function buildCardList(columns, rows, { getActions }) {
  const list = document.createElement("div");
  list.className = "record-cards is-active";

  const primaryCol = columns.find((c) => c.primary) || columns[0];
  const secondaryCols = columns.filter((c) => c !== primaryCol);

  for (const row of rows) {
    const card = document.createElement("div");
    card.className = "record-card";

    const top = document.createElement("div");
    top.className = "record-card__top";
    const title = document.createElement("div");
    title.className = "record-card__title";
    appendCellContent(title, cellContent(primaryCol, row));
    top.appendChild(title);
    card.appendChild(top);

    for (const col of secondaryCols) {
      const value = cellContent(col, row);
      if (value === "") continue;
      const rowEl = document.createElement("div");
      rowEl.className = "record-card__row";
      const label = document.createElement("span");
      label.className = "record-card__label";
      label.textContent = col.label;
      const val = document.createElement("span");
      appendCellContent(val, value);
      rowEl.append(label, val);
      card.appendChild(rowEl);
    }

    if (getActions) {
      const actionsWrap = document.createElement("div");
      actionsWrap.className = "record-card__actions";
      for (const action of getActions(row)) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `btn btn-sm btn-${action.variant || "secondary"}`;
        btn.textContent = action.label;
        btn.addEventListener("click", action.onClick);
        actionsWrap.appendChild(btn);
      }
      card.appendChild(actionsWrap);
    }

    list.appendChild(card);
  }

  return list;
}
