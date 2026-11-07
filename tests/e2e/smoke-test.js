/**
 * Browser smoke test for TADS Phase 1. See tests/README.md.
 *
 * Starts its own static file server (no external dependencies besides
 * Node's built-ins) and drives the real app with Playwright/Chromium.
 * Throws (non-zero exit code) on the first failed assertion.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8099;
const ROOT = path.resolve(__dirname, "..", "..");
const BASE_URL = `http://localhost:${PORT}`;

function loadPlaywright() {
  try {
    return require("playwright");
  } catch {
    // Common fallback location in CI/sandbox images with a global Node install.
    return require("/opt/node22/lib/node_modules/playwright");
  }
}

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    let filePath = path.join(ROOT, urlPath === "/" ? "index.html" : urlPath);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

async function main() {
  const { chromium } = loadPlaywright();
  const server = await startServer();
  console.log(`Static server running at ${BASE_URL}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => msg.type() === "error" && consoleErrors.push(msg.text()));
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  try {
    console.log("1. Dashboard loads with no data");
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "networkidle" });
    await page.waitForSelector("#dash-stats .stat-card");
    const initialTotal = await page.locator("#dash-stats .stat-card__value").first().innerText();
    assert(initialTotal === "0", `expected 0 projects initially, got ${initialTotal}`);

    console.log("2. Create two projects, codes are sequential");
    await page.click('a.nav-link[data-route="#/projects"]');
    await page.waitForSelector("#pcr-table-container");

    await page.click("#pcr-new-project");
    await page.waitForSelector(".modal");
    await page.fill("#field-projectName", "Test Automation Cell");
    await page.fill("#field-customer", "Acme Corp");
    await page.selectOption("#field-projectStatus", "active");
    await page.click('.modal-footer button:has-text("Create Project")');
    await page.waitForSelector(".modal", { state: "detached" });
    assert((await page.locator("text=PC-0001").count()) > 0, "PC-0001 should exist after first create");

    await page.click("#pcr-new-project");
    await page.waitForSelector(".modal");
    await page.fill("#field-projectName", "Vendor Portal Rebuild");
    await page.selectOption("#field-projectStatus", "new");
    await page.click('.modal-footer button:has-text("Create Project")');
    await page.waitForSelector(".modal", { state: "detached" });
    assert((await page.locator("text=PC-0002").count()) > 0, "PC-0002 should exist after second create");

    console.log("3. Required-field validation blocks empty save");
    await page.click("#pcr-new-project");
    await page.waitForSelector(".modal");
    await page.click('.modal-footer button:has-text("Create Project")');
    await page.waitForTimeout(300);
    const errorText = await page.locator('[data-error-for="projectName"]').innerText();
    assert(errorText.includes("required"), `expected a required-field error, got "${errorText}"`);
    await page.click('.modal-footer button:has-text("Cancel")');
    await page.waitForSelector(".modal", { state: "detached" });

    console.log("4. Archive then restore preserves the project code");
    await page.click('.data-table tbody tr:has-text("PC-0002") button:has-text("Archive")');
    await page.waitForSelector(".modal");
    await page.click('.modal-footer button:has-text("Archive")');
    await page.waitForSelector(".modal", { state: "detached" });
    await page.waitForTimeout(200);
    assert((await page.locator(".data-table tbody tr").count()) === 1, "only 1 active project should remain");

    await page.selectOption("#pcr-archived-filter", "archived");
    await page.waitForTimeout(200);
    await page.click('.data-table tbody tr:has-text("PC-0002") button:has-text("Restore")');
    await page.waitForSelector(".modal");
    await page.click('.modal-footer button:has-text("Restore")');
    await page.waitForSelector(".modal", { state: "detached" });
    await page.selectOption("#pcr-archived-filter", "active");
    await page.waitForTimeout(200);
    assert((await page.locator(".data-table tbody tr").count()) === 2, "both projects should be active again");

    console.log("5. Add a custom dropdown field, confirm it appears on the form");
    await page.click('a.nav-link[data-route="#/settings/fields"]');
    await page.waitForSelector("#settings-tab-content table");
    await page.click('button:has-text("+ Add Field")');
    await page.waitForSelector(".modal");
    await page.locator(".modal-body input.input").first().fill("Business Unit");
    await page.selectOption(".modal select.select", "dropdown");
    await page.click('.modal-body button:has-text("+ Add Option")');
    await page.fill('.modal-body input[placeholder="Option label"]', "Automation");
    await page.click('.modal-footer button:has-text("Add Field")');
    await page.waitForSelector(".modal", { state: "detached" });

    await page.click('a.nav-link[data-route="#/projects"]');
    await page.waitForSelector("#pcr-table-container");
    await page.click("#pcr-new-project");
    await page.waitForSelector(".modal");
    assert((await page.locator("#field-businessUnit").count()) === 1, "new field should appear on the form");
    await page.selectOption("#field-businessUnit", "Automation");
    await page.fill("#field-projectName", "BU Field Test");
    await page.selectOption("#field-projectStatus", "active");
    await page.click('.modal-footer button:has-text("Create Project")');
    await page.waitForSelector(".modal", { state: "detached" });

    console.log("6. Disabling a field hides it; data is preserved on re-enable");
    await page.click('a.nav-link[data-route="#/settings/fields"]');
    await page.waitForSelector("#settings-tab-content table");
    let buRow = page.locator('tr:has-text("Business Unit")');
    await buRow.locator('input[type="checkbox"]').nth(1).click();
    await page.waitForSelector(".modal");
    await page.click('.modal-footer button:has-text("Disable")');
    await page.waitForTimeout(200);

    await page.click('a.nav-link[data-route="#/projects"]');
    await page.waitForSelector("#pcr-table-container");
    assert(
      (await page.locator('th:has-text("Business Unit")').count()) === 0,
      "Business Unit column should be hidden while disabled"
    );

    await page.click('a.nav-link[data-route="#/settings/fields"]');
    await page.waitForSelector("#settings-tab-content table");
    buRow = page.locator('tr:has-text("Business Unit")');
    await buRow.locator('input[type="checkbox"]').nth(1).click();
    await page.waitForTimeout(200);

    await page.click('a.nav-link[data-route="#/projects"]');
    await page.waitForSelector("#pcr-table-container");
    const buRowText = await page.locator('.data-table tbody tr:has-text("BU Field Test")').innerText();
    assert(buRowText.includes("Automation"), "Business Unit value should have reappeared after re-enabling");

    console.log("7. CSV export triggers a download");
    const [csvDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.click("#pcr-export-csv"),
    ]);
    assert(csvDownload.suggestedFilename().endsWith(".csv"), "CSV export should download a .csv file");

    console.log("8. Backup export, then invalid-file restore is rejected");
    const [backupDownload] = await Promise.all([
      page.waitForEvent("download"),
      (async () => {
        await page.click('a.nav-link[data-route="#/backup"]');
        await page.waitForSelector("#backup-export-btn");
        await page.click("#backup-export-btn");
      })(),
    ]);
    const backupPath = path.join(require("os").tmpdir(), "tads-smoke-test-backup.json");
    await backupDownload.saveAs(backupPath);

    const badPath = path.join(require("os").tmpdir(), "tads-smoke-test-bad.json");
    fs.writeFileSync(badPath, JSON.stringify({ notABackup: true }));
    await page.setInputFiles("#backup-file-input", badPath);
    await page.click("#backup-restore-btn");
    await page.waitForTimeout(300);
    const toastText = await page.locator(".toast-danger").first().innerText();
    assert(toastText.includes("not a TADS"), `expected an invalid-backup error toast, got "${toastText}"`);

    console.log("9. Restoring a valid backup reconciles the project-code sequence");
    await page.setInputFiles("#backup-file-input", backupPath);
    await page.click("#backup-restore-btn");
    await page.waitForSelector(".modal");
    await page.click('.modal-footer button:has-text("Restore & Replace Data")');
    await page.waitForTimeout(2500);
    await page.waitForLoadState("networkidle");

    await page.goto(`${BASE_URL}/index.html#/projects`, { waitUntil: "networkidle" });
    await page.waitForSelector("#pcr-table-container");
    await page.click("#pcr-new-project");
    await page.waitForSelector(".modal");
    await page.fill("#field-projectName", "Post-Restore Project");
    await page.selectOption("#field-projectStatus", "new");
    await page.click('.modal-footer button:has-text("Create Project")');
    await page.waitForSelector(".modal", { state: "detached" });
    assert(
      (await page.locator("text=PC-0004").count()) > 0,
      "post-restore project should continue the sequence (PC-0004), not collide"
    );

    console.log("10. Mobile layout: off-canvas nav + card list");
    await page.setViewportSize({ width: 375, height: 800 });
    await page.click("#nav-toggle");
    await page.waitForSelector("#app-sidebar.is-open");
    await page.click('a.nav-link[data-route="#/projects"]');
    await page.waitForSelector("#pcr-table-container");
    await page.waitForTimeout(200);
    assert(await page.locator(".record-cards.is-active").first().isVisible(), "mobile card list should be visible");
    await page.setViewportSize({ width: 1280, height: 900 });

    console.log("11. Offline reload after service worker caching");
    await page.waitForTimeout(1500);
    await context.setOffline(true);
    await page.reload({ waitUntil: "networkidle", timeout: 8000 });
    assert((await page.locator("#header-brand-slot").count()) > 0, "app shell should still load while offline");
    await context.setOffline(false);

    assert(consoleErrors.length === 0, `unexpected console/JS errors: ${JSON.stringify(consoleErrors)}`);

    console.log("\nALL SMOKE TESTS PASSED");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error("\nSMOKE TEST FAILED:", err.message);
  process.exit(1);
});
