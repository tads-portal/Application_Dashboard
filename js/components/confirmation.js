/**
 * Confirmation dialog. Used before any archive/restore/destructive-ish
 * action, per the project's "no silent destructive actions" rule.
 */

import { openModal, buildButton } from "./modal.js";

/**
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.message
 * @param {string} [options.confirmLabel]
 * @param {string} [options.cancelLabel]
 * @param {boolean} [options.danger]
 * @returns {Promise<boolean>} resolves true if confirmed, false if cancelled/dismissed
 */
export function confirmAction({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false }) {
  return new Promise((resolve) => {
    const body = document.createElement("p");
    body.className = "mt-0";
    body.textContent = message;

    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const cancelBtn = buildButton(cancelLabel, {
      variant: "secondary",
      onClick: () => {
        settle(false);
        modalHandle.close();
      },
    });
    const confirmBtn = buildButton(confirmLabel, {
      variant: danger ? "danger" : "primary",
      onClick: () => {
        settle(true);
        modalHandle.close();
      },
    });

    const modalHandle = openModal({
      title,
      body,
      size: "sm",
      footerButtons: [cancelBtn, confirmBtn],
      onClose: () => settle(false),
    });
  });
}
