/**
 * Minimal modal dialog. Build the body yourself and pass it in as a DOM
 * node — this component only handles the overlay/frame/open/close
 * mechanics, not any particular form's content.
 */

/**
 * @param {Object} options
 * @param {string} options.title
 * @param {HTMLElement} options.body
 * @param {"sm"|"md"|"lg"} [options.size]
 * @param {HTMLElement[]} [options.footerButtons]
 * @param {() => void} [options.onClose]
 * @returns {{ close: () => void, overlay: HTMLElement, bodyEl: HTMLElement }}
 */
export function openModal({ title, body, size = "md", footerButtons = [], onClose }) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = `modal${size === "sm" ? " modal--sm" : ""}${size === "lg" ? " modal--lg" : ""}`;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  if (title) modal.setAttribute("aria-label", title);

  const header = document.createElement("div");
  header.className = "modal-header";
  const titleEl = document.createElement("h3");
  titleEl.textContent = title || "";
  const closeBtn = document.createElement("button");
  closeBtn.className = "icon-btn";
  closeBtn.setAttribute("aria-label", "Close dialog");
  closeBtn.textContent = "×";
  header.append(titleEl, closeBtn);

  const bodyWrap = document.createElement("div");
  bodyWrap.className = "modal-body";
  bodyWrap.appendChild(body);

  modal.append(header);
  modal.appendChild(bodyWrap);

  if (footerButtons.length) {
    const footer = document.createElement("div");
    footer.className = "modal-footer";
    footer.append(...footerButtons);
    modal.appendChild(footer);
  }

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  function close() {
    overlay.remove();
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    if (onClose) onClose();
  }

  function onKeydown(e) {
    if (e.key === "Escape") close();
  }

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", onKeydown);

  return { close, overlay, bodyEl: bodyWrap };
}

export function buildButton(label, { variant = "secondary", onClick, type = "button" } = {}) {
  const btn = document.createElement("button");
  btn.type = type;
  btn.className = `btn btn-${variant}`;
  btn.textContent = label;
  if (onClick) btn.addEventListener("click", onClick);
  return btn;
}
