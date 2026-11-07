/**
 * Renders a form dynamically from an array of active field definitions
 * (see docs/DATA-MODEL.md). This is what keeps the Project Code Register
 * form from having any field hard-coded into the HTML/JS.
 */

import { toDateInputValue } from "../utils/date-utils.js";

function fieldInputId(fieldKey) {
  return `field-${fieldKey}`;
}

function buildLabel(field) {
  const label = document.createElement("label");
  label.className = "form-label";
  label.setAttribute("for", fieldInputId(field.fieldKey));
  label.textContent = field.label;
  if (field.required) {
    const mark = document.createElement("span");
    mark.className = "required-mark";
    mark.textContent = "*";
    mark.setAttribute("aria-hidden", "true");
    label.appendChild(mark);
  }
  return label;
}

function buildInput(field, value) {
  const id = fieldInputId(field.fieldKey);

  if (field.type === "longtext") {
    const el = document.createElement("textarea");
    el.className = "textarea";
    el.id = id;
    el.name = field.fieldKey;
    el.value = value ?? "";
    return el;
  }

  if (field.type === "dropdown") {
    const el = document.createElement("select");
    el.className = "select";
    el.id = id;
    el.name = field.fieldKey;
    if (!field.required) {
      const emptyOpt = document.createElement("option");
      emptyOpt.value = "";
      emptyOpt.textContent = "— Select —";
      el.appendChild(emptyOpt);
    }
    for (const opt of field.options || []) {
      const optionEl = document.createElement("option");
      optionEl.value = opt.value;
      optionEl.textContent = opt.label;
      if (opt.value === value) optionEl.selected = true;
      el.appendChild(optionEl);
    }
    return el;
  }

  if (field.type === "checkbox") {
    const wrap = document.createElement("div");
    wrap.className = "checkbox-field";
    const el = document.createElement("input");
    el.type = "checkbox";
    el.id = id;
    el.name = field.fieldKey;
    el.checked = Boolean(value);
    wrap.appendChild(el);
    return wrap;
  }

  const el = document.createElement("input");
  el.className = "input";
  el.id = id;
  el.name = field.fieldKey;
  if (field.type === "date") {
    el.type = "date";
    el.value = toDateInputValue(value);
  } else if (field.type === "number") {
    el.type = "number";
    el.value = value ?? "";
  } else if (field.type === "email") {
    el.type = "email";
    el.value = value ?? "";
  } else {
    el.type = "text";
    el.value = value ?? "";
  }
  return el;
}

/**
 * @param {Array} fieldDefs - active, non-system field definitions, in display order
 * @param {Object} [values] - existing record values, keyed by fieldKey
 * @returns {HTMLFormElement}
 */
export function renderDynamicForm(fieldDefs, values = {}) {
  const form = document.createElement("form");
  form.className = "form-grid";
  form.noValidate = true;

  for (const field of fieldDefs) {
    const wrap = document.createElement("div");
    wrap.className = "form-field";
    if (field.type === "longtext" || field.type === "checkbox") {
      wrap.classList.add("form-field--full");
    }
    wrap.dataset.fieldKey = field.fieldKey;

    const rawValue = values[field.fieldKey] ?? field.defaultValue ?? "";

    if (field.type === "checkbox") {
      const inputWrap = buildInput(field, rawValue);
      const label = buildLabel(field);
      inputWrap.appendChild(label);
      wrap.appendChild(inputWrap);
    } else {
      wrap.appendChild(buildLabel(field));
      wrap.appendChild(buildInput(field, rawValue));
    }

    if (field.helpText) {
      const help = document.createElement("div");
      help.className = "form-help";
      help.textContent = field.helpText;
      wrap.appendChild(help);
    }

    const error = document.createElement("div");
    error.className = "form-error";
    error.dataset.errorFor = field.fieldKey;
    wrap.appendChild(error);

    form.appendChild(wrap);
  }

  return form;
}

/** Reads current values out of a form built by renderDynamicForm(). */
export function collectFormValues(form, fieldDefs) {
  const values = {};
  for (const field of fieldDefs) {
    const el = form.querySelector(`#${CSS.escape(fieldInputId(field.fieldKey))}`);
    if (!el) continue;
    if (field.type === "checkbox") {
      values[field.fieldKey] = el.checked;
    } else if (field.type === "number") {
      values[field.fieldKey] = el.value === "" ? "" : Number(el.value);
    } else {
      values[field.fieldKey] = el.value;
    }
  }
  return values;
}

/** Shows/clears validation errors produced by validateRecord(). */
export function applyFormErrors(form, errors = {}) {
  form.querySelectorAll("[data-error-for]").forEach((el) => {
    el.textContent = "";
  });
  form.querySelectorAll(".has-error").forEach((el) => el.classList.remove("has-error"));

  for (const [fieldKey, message] of Object.entries(errors)) {
    const errorEl = form.querySelector(`[data-error-for="${CSS.escape(fieldKey)}"]`);
    if (errorEl) errorEl.textContent = message;
    const inputEl = form.querySelector(`#${CSS.escape(fieldInputId(fieldKey))}`);
    if (inputEl) inputEl.classList.add("has-error");
  }
}
