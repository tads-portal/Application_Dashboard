import { renderFieldConfiguration } from "./field-configuration.js";
import * as dataService from "../../js/services/data-service.js";

async function loadFragment(container) {
  const response = await fetch(new URL("./settings.html", import.meta.url));
  container.innerHTML = await response.text();
}

async function renderAppSettings(container) {
  container.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card card-body";

  const [settings, sequences] = await Promise.all([
    dataService.getAll(dataService.STORES.SETTINGS),
    dataService.getAll(dataService.STORES.SEQUENCES),
  ]);
  const schemaVersion = settings.find((s) => s.key === "schemaVersion");
  const pcSequence = sequences.find((s) => s.name === "PC");

  const info = document.createElement("div");
  info.innerHTML = `
    <h3 class="mt-0">Application Information</h3>
    <p class="text-muted">TADS Phase 1 — local-first. All data below lives only in this browser on this device.</p>
    <div class="record-card__row"><span class="record-card__label">Local schema version</span><span>${schemaVersion ? schemaVersion.value : "1"}</span></div>
    <div class="record-card__row"><span class="record-card__label">Next project code</span><span>${
      pcSequence ? `PC-${String(pcSequence.nextNumber).padStart(4, "0")}` : "PC-0001"
    }</span></div>
  `;
  card.appendChild(info);

  const storageInfo = document.createElement("div");
  storageInfo.style.marginTop = "var(--space-5)";
  storageInfo.innerHTML = '<h3>Local Storage Usage</h3>';
  const storageDetail = document.createElement("p");
  storageDetail.className = "text-muted";
  storageDetail.textContent = "Checking…";
  storageInfo.appendChild(storageDetail);
  card.appendChild(storageInfo);

  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(({ usage, quota }) => {
      const toMb = (bytes) => (bytes / (1024 * 1024)).toFixed(1);
      storageDetail.textContent = `Using approximately ${toMb(usage)} MB of an estimated ${toMb(
        quota
      )} MB available in this browser.`;
    });
  } else {
    storageDetail.textContent = "Storage usage details are not available in this browser.";
  }

  const backupNote = document.createElement("div");
  backupNote.style.marginTop = "var(--space-5)";
  backupNote.innerHTML =
    '<h3>Backup &amp; Restore</h3><p class="text-muted">Manage full data backups from the <a href="#/backup">Backup &amp; Restore</a> page.</p>';
  card.appendChild(backupNote);

  container.appendChild(card);
}

export async function render(container, params = {}) {
  await loadFragment(container);

  const tab = params.tab === "app" ? "app" : "fields";
  const fieldsTabBtn = container.querySelector("#settings-tab-fields");
  const appTabBtn = container.querySelector("#settings-tab-app");
  const contentEl = container.querySelector("#settings-tab-content");

  fieldsTabBtn.classList.toggle("btn-primary", tab === "fields");
  fieldsTabBtn.classList.toggle("btn-secondary", tab !== "fields");
  appTabBtn.classList.toggle("btn-primary", tab === "app");
  appTabBtn.classList.toggle("btn-secondary", tab !== "app");

  if (tab === "app") {
    await renderAppSettings(contentEl);
  } else {
    await renderFieldConfiguration(contentEl);
  }
}
