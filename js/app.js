/**
 * Application entry point: wires up navigation, the online/offline
 * indicator, opens the local database, registers the service worker,
 * and starts the router. See docs/ARCHITECTURE.md for the overall
 * layering this file sits on top of.
 */

import { initNavigation } from "./components/navigation.js";
import { initRouter } from "./router.js";
import { showError } from "./components/notification.js";
import * as dataService from "./services/data-service.js";

function initOfflineIndicator() {
  const indicator = document.getElementById("offline-indicator");
  function update() {
    indicator.classList.toggle("is-visible", !navigator.onLine);
  }
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  });
}

async function main() {
  initNavigation({
    headerBrandSlot: document.getElementById("header-brand-slot"),
    sidebarEl: document.getElementById("app-sidebar"),
    navToggleBtn: document.getElementById("nav-toggle"),
    sidebarScrimEl: document.getElementById("sidebar-scrim"),
  });

  initOfflineIndicator();
  registerServiceWorker();

  try {
    await dataService.ready();
  } catch (err) {
    console.error("Failed to open local database:", err);
    showError(
      "TADS could not open its local database. Your browser may be blocking storage, or you may be in a private/incognito window."
    );
  }

  initRouter(document.getElementById("app-main"));
}

main();
