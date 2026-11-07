import * as backupService from "../../js/services/backup-service.js";
import { confirmAction } from "../../js/components/confirmation.js";
import { showSuccess, showError } from "../../js/components/notification.js";

async function loadFragment(container) {
  const response = await fetch(new URL("./backup.html", import.meta.url));
  container.innerHTML = await response.text();
}

export async function render(container) {
  await loadFragment(container);

  const exportBtn = container.querySelector("#backup-export-btn");
  const fileInput = container.querySelector("#backup-file-input");
  const restoreBtn = container.querySelector("#backup-restore-btn");

  exportBtn.addEventListener("click", async () => {
    try {
      const payload = await backupService.exportBackup();
      showSuccess(`Backup downloaded: ${payload.data.projects.length} project(s) included.`);
    } catch (err) {
      showError(err.message || "Could not create the backup file.");
    }
  });

  fileInput.addEventListener("change", () => {
    restoreBtn.disabled = !fileInput.files.length;
  });

  restoreBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    let payload;
    try {
      const text = await backupService.readFileAsText(file);
      payload = backupService.parseBackupFile(text);
    } catch (err) {
      showError(err.message || "This file could not be used as a backup.");
      return;
    }

    const confirmed = await confirmAction({
      title: "Restore backup?",
      message: `This will replace ALL current local data with the backup from ${new Date(
        payload.exportedDate
      ).toLocaleString()} (${payload.data.projects.length} project(s)). A safety backup of your current data will be downloaded first. This cannot be undone from within the app.`,
      confirmLabel: "Restore & Replace Data",
      danger: true,
    });
    if (!confirmed) return;

    restoreBtn.disabled = true;
    try {
      await backupService.downloadSafetyBackup();
      const result = await backupService.restoreFromBackup(payload);
      showSuccess(
        `Restore complete: ${result.projects} project(s), ${result.fieldDefinitions} field definition(s). Reloading…`
      );
      setTimeout(() => window.location.reload(), 1800);
    } catch (err) {
      showError(err.message || "Restore failed. Your safety backup download can be used to recover.");
      restoreBtn.disabled = false;
    }
  });
}
