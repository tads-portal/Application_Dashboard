/**
 * UI for Settings → Project Code Register → Field Configuration.
 * See docs/ARCHITECTURE.md section 3 for the rules this enforces (never
 * destroy data by disabling a field, system fields are protected, etc.).
 * All the actual rule enforcement lives in
 * js/services/configuration-service.js — this file is just UI.
 */

import * as configService from "../../js/services/configuration-service.js";
import { confirmAction } from "../../js/components/confirmation.js";
import { openModal, buildButton } from "../../js/components/modal.js";
import { showSuccess, showError } from "../../js/components/notification.js";
import { PROJECT_CODE_REGISTER_MODULE } from "../../data/seed-data.js";

function typeLabel(type) {
  const found = configService.FIELD_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
}

export async function renderFieldConfiguration(container) {
  container.innerHTML = "";

  const intro = document.createElement("p");
  intro.className = "text-muted";
  intro.textContent =
    "Fields you add here appear automatically on the Project form. Disabling a field hides it without deleting any data already saved under it.";

  const actions = document.createElement("div");
  actions.className = "page-actions";
  actions.style.marginBottom = "var(--space-4)";
  const addBtn = buildButton("+ Add Field", { variant: "primary", onClick: () => openFieldModal({ onSaved: refresh }) });
  actions.appendChild(addBtn);

  const listWrap = document.createElement("div");
  listWrap.className = "table-wrap";

  container.append(intro, actions, listWrap);

  async function refresh() {
    const fields = await configService.getFieldDefinitions(PROJECT_CODE_REGISTER_MODULE);
    renderList(listWrap, fields, refresh);
  }

  await refresh();
}

function renderList(container, fields, refresh) {
  container.innerHTML = "";

  const table = document.createElement("table");
  table.className = "data-table";

  const thead = document.createElement("thead");
  thead.innerHTML =
    "<tr><th>Order</th><th>Field</th><th>Type</th><th>Required</th><th>Enabled</th><th>Actions</th></tr>";
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  fields.forEach((field, index) => {
    const tr = document.createElement("tr");

    // Order controls
    const orderTd = document.createElement("td");
    const upBtn = buildButton("▲", {
      variant: "ghost",
      onClick: async () => {
        await moveField(fields, index, -1);
        refresh();
      },
    });
    upBtn.className = "icon-btn";
    upBtn.disabled = index === 0;
    const downBtn = buildButton("▼", {
      variant: "ghost",
      onClick: async () => {
        await moveField(fields, index, 1);
        refresh();
      },
    });
    downBtn.className = "icon-btn";
    downBtn.disabled = index === fields.length - 1;
    orderTd.append(upBtn, downBtn);

    // Field name / key
    const nameTd = document.createElement("td");
    const nameLine = document.createElement("div");
    nameLine.innerHTML = `<strong>${field.label}</strong>`;
    if (field.system) {
      const badge = document.createElement("span");
      badge.className = "badge badge-neutral";
      badge.style.marginLeft = "6px";
      badge.textContent = "System";
      nameLine.appendChild(badge);
    }
    const keyLine = document.createElement("div");
    keyLine.className = "text-muted";
    keyLine.style.fontSize = "var(--font-size-xs)";
    keyLine.textContent = field.fieldKey;
    nameTd.append(nameLine, keyLine);

    // Type
    const typeTd = document.createElement("td");
    typeTd.textContent = typeLabel(field.type);

    // Required toggle
    const requiredTd = document.createElement("td");
    const requiredCheckbox = document.createElement("input");
    requiredCheckbox.type = "checkbox";
    requiredCheckbox.checked = field.required;
    requiredCheckbox.disabled = field.system;
    requiredCheckbox.title = field.system ? "System fields are always managed automatically." : "";
    requiredCheckbox.addEventListener("change", async () => {
      try {
        await configService.setFieldRequired(field.id, requiredCheckbox.checked);
        showSuccess(`"${field.label}" is now ${requiredCheckbox.checked ? "required" : "optional"}.`);
      } catch (err) {
        showError(err.message);
        requiredCheckbox.checked = !requiredCheckbox.checked;
      }
    });
    requiredTd.appendChild(requiredCheckbox);

    // Enabled toggle
    const enabledTd = document.createElement("td");
    const enabledCheckbox = document.createElement("input");
    enabledCheckbox.type = "checkbox";
    enabledCheckbox.checked = field.enabled;
    enabledCheckbox.disabled = field.system;
    enabledCheckbox.title = field.system ? "System fields cannot be disabled." : "";
    enabledCheckbox.addEventListener("change", async () => {
      const turningOff = !enabledCheckbox.checked;
      if (turningOff) {
        const confirmed = await confirmAction({
          title: "Disable this field?",
          message: `"${field.label}" will be hidden from the Project form and register. Any data already saved under this field is kept and will reappear if you re-enable it.`,
          confirmLabel: "Disable",
          danger: true,
        });
        if (!confirmed) {
          enabledCheckbox.checked = true;
          return;
        }
      }
      try {
        await configService.setFieldEnabled(field.id, enabledCheckbox.checked);
        showSuccess(`"${field.label}" is now ${enabledCheckbox.checked ? "enabled" : "disabled"}.`);
        refresh();
      } catch (err) {
        showError(err.message);
        enabledCheckbox.checked = !enabledCheckbox.checked;
      }
    });
    enabledTd.appendChild(enabledCheckbox);

    // Actions
    const actionsTd = document.createElement("td");
    actionsTd.className = "col-actions";
    if (!field.system) {
      const editBtn = buildButton("Edit", {
        variant: "secondary",
        onClick: () => openFieldModal({ field, onSaved: refresh }),
      });
      editBtn.classList.add("btn-sm");
      actionsTd.appendChild(editBtn);
    } else {
      const lockedNote = document.createElement("span");
      lockedNote.className = "text-muted";
      lockedNote.style.fontSize = "var(--font-size-xs)";
      lockedNote.textContent = "Managed automatically";
      actionsTd.appendChild(lockedNote);
    }

    tr.append(orderTd, nameTd, typeTd, requiredTd, enabledTd, actionsTd);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

async function moveField(fields, index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= fields.length) return;
  const ids = fields.map((f) => f.id);
  const [moved] = ids.splice(index, 1);
  ids.splice(targetIndex, 0, moved);
  await configService.reorderFields(PROJECT_CODE_REGISTER_MODULE, ids);
}

function buildOptionsEditor(initialOptions) {
  const wrap = document.createElement("div");
  wrap.className = "form-field form-field--full";
  const label = document.createElement("div");
  label.className = "form-label";
  label.textContent = "Dropdown Options";
  wrap.appendChild(label);

  const rowsWrap = document.createElement("div");
  wrap.appendChild(rowsWrap);

  const state = (initialOptions || []).map((o) => ({ value: o.value, label: o.label }));

  function renderRows() {
    rowsWrap.innerHTML = "";
    state.forEach((opt, index) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap = "8px";
      row.style.marginBottom = "6px";

      const input = document.createElement("input");
      input.className = "input";
      input.value = opt.label;
      input.placeholder = "Option label";
      input.addEventListener("input", () => {
        state[index].label = input.value;
      });

      const removeBtn = buildButton("Remove", {
        variant: "ghost",
        onClick: () => {
          state.splice(index, 1);
          renderRows();
        },
      });
      removeBtn.classList.add("btn-sm");

      row.append(input, removeBtn);
      rowsWrap.appendChild(row);
    });
  }
  renderRows();

  const addOptionBtn = buildButton("+ Add Option", {
    variant: "ghost",
    onClick: () => {
      state.push({ value: "", label: "" });
      renderRows();
    },
  });
  addOptionBtn.classList.add("btn-sm");
  wrap.appendChild(addOptionBtn);

  return { element: wrap, getOptions: () => state.filter((o) => o.label.trim()) };
}

function openFieldModal({ field, onSaved }) {
  const isEdit = Boolean(field);

  const form = document.createElement("div");
  form.className = "form-grid";

  // Field name
  const nameField = document.createElement("div");
  nameField.className = "form-field form-field--full";
  nameField.innerHTML = '<label class="form-label">Field Name<span class="required-mark">*</span></label>';
  const nameInput = document.createElement("input");
  nameInput.className = "input";
  nameInput.value = field ? field.label : "";
  nameField.appendChild(nameInput);

  // Type
  const typeField = document.createElement("div");
  typeField.className = "form-field";
  typeField.innerHTML = '<label class="form-label">Field Type</label>';
  const typeSelect = document.createElement("select");
  typeSelect.className = "select";
  typeSelect.disabled = isEdit;
  for (const t of configService.FIELD_TYPES) {
    const opt = document.createElement("option");
    opt.value = t.value;
    opt.textContent = t.label;
    if (field && field.type === t.value) opt.selected = true;
    typeSelect.appendChild(opt);
  }
  typeField.appendChild(typeSelect);
  if (isEdit) {
    const help = document.createElement("div");
    help.className = "form-help";
    help.textContent = "Field type cannot be changed after creation.";
    typeField.appendChild(help);
  }

  // Required (create only — edit uses the list's Required toggle)
  const requiredField = document.createElement("div");
  requiredField.className = "form-field";
  const requiredCheckboxWrap = document.createElement("div");
  requiredCheckboxWrap.className = "checkbox-field";
  const requiredCheckbox = document.createElement("input");
  requiredCheckbox.type = "checkbox";
  const requiredLabel = document.createElement("label");
  requiredLabel.textContent = "Required field";
  requiredCheckboxWrap.append(requiredCheckbox, requiredLabel);
  requiredField.appendChild(requiredCheckboxWrap);

  // Help text
  const helpField = document.createElement("div");
  helpField.className = "form-field form-field--full";
  helpField.innerHTML = '<label class="form-label">Help Text (optional)</label>';
  const helpInput = document.createElement("input");
  helpInput.className = "input";
  helpInput.value = field ? field.helpText || "" : "";
  helpField.appendChild(helpInput);

  form.append(nameField, typeField);
  if (!isEdit) form.appendChild(requiredField);
  form.appendChild(helpField);

  // Options editor (dropdown only)
  let optionsEditor = null;
  const optionsSlot = document.createElement("div");
  optionsSlot.className = "form-field form-field--full";
  form.appendChild(optionsSlot);

  function syncOptionsEditor() {
    optionsSlot.innerHTML = "";
    if (typeSelect.value === "dropdown") {
      optionsEditor = buildOptionsEditor(field ? field.options : []);
      optionsSlot.appendChild(optionsEditor.element);
    } else {
      optionsEditor = null;
    }
  }
  typeSelect.addEventListener("change", syncOptionsEditor);
  syncOptionsEditor();

  const cancelBtn = buildButton("Cancel", { variant: "secondary", onClick: () => modalHandle.close() });
  const saveBtn = buildButton(isEdit ? "Save Changes" : "Add Field", {
    variant: "primary",
    onClick: async () => {
      const label = nameInput.value.trim();
      if (!label) {
        showError("Field name is required.");
        return;
      }
      if (typeSelect.value === "dropdown" && optionsEditor && optionsEditor.getOptions().length === 0) {
        showError("Add at least one dropdown option.");
        return;
      }

      saveBtn.disabled = true;
      try {
        if (isEdit) {
          await configService.updateFieldDetails(field.id, {
            label,
            helpText: helpInput.value,
          });
          if (field.type === "dropdown" && optionsEditor) {
            await configService.setDropdownOptions(field.id, optionsEditor.getOptions());
          }
          showSuccess(`"${label}" updated.`);
        } else {
          await configService.addField(PROJECT_CODE_REGISTER_MODULE, {
            label,
            type: typeSelect.value,
            required: requiredCheckbox.checked,
            helpText: helpInput.value,
            options: optionsEditor ? optionsEditor.getOptions() : [],
          });
          showSuccess(`"${label}" added.`);
        }
        modalHandle.close();
        if (onSaved) onSaved();
      } catch (err) {
        showError(err.message || "Could not save this field.");
      } finally {
        saveBtn.disabled = false;
      }
    },
  });

  const modalHandle = openModal({
    title: isEdit ? `Edit Field — ${field.label}` : "Add Field",
    body: form,
    size: "md",
    footerButtons: [cancelBtn, saveBtn],
  });
}
