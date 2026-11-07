/**
 * Toast notifications. Call showToast() from anywhere after the DOM is ready.
 */

let stackEl = null;

function ensureStack() {
  if (stackEl && document.body.contains(stackEl)) return stackEl;
  stackEl = document.createElement("div");
  stackEl.className = "toast-stack";
  stackEl.setAttribute("aria-live", "polite");
  document.body.appendChild(stackEl);
  return stackEl;
}

/**
 * @param {string} message
 * @param {"info"|"success"|"warning"|"danger"} [type]
 * @param {number} [duration] milliseconds; 0 = stays until dismissed
 */
export function showToast(message, type = "info", duration = 4000) {
  const stack = ensureStack();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.className = "icon-btn";
  closeBtn.style.float = "right";
  closeBtn.style.marginLeft = "8px";
  closeBtn.setAttribute("aria-label", "Dismiss");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => toast.remove());
  toast.prepend(closeBtn);

  stack.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => toast.remove(), duration);
  }

  return toast;
}

export function showSuccess(message, duration) {
  return showToast(message, "success", duration);
}

export function showError(message, duration = 6000) {
  return showToast(message, "danger", duration);
}

export function showWarning(message, duration) {
  return showToast(message, "warning", duration);
}
