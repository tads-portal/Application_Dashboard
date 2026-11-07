/**
 * App-shell cache for offline use. Strategy: cache-first, falling back to
 * the network, and opportunistically caching whatever the network
 * returns for next time. This means every page/module you actually
 * visit while online becomes available offline afterward — you don't
 * need to visit every screen before going offline, but visiting a
 * screen for the first time still requires a connection.
 *
 * Bump CACHE_NAME whenever you want returning users to pick up new
 * app-shell files instead of stale cached ones.
 */

const CACHE_NAME = "tads-phase1-cache-v1";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/theme.css",
  "./css/global.css",
  "./css/components.css",
  "./css/responsive.css",
  "./js/app.js",
  "./js/router.js",
  "./js/db/indexeddb.js",
  "./js/db/migrations.js",
  "./js/services/data-service.js",
  "./js/services/project-service.js",
  "./js/services/configuration-service.js",
  "./js/services/backup-service.js",
  "./js/services/export-service.js",
  "./js/components/navigation.js",
  "./js/components/modal.js",
  "./js/components/table.js",
  "./js/components/form.js",
  "./js/components/notification.js",
  "./js/components/confirmation.js",
  "./js/utils/validation.js",
  "./js/utils/date-utils.js",
  "./js/utils/id-generator.js",
  "./js/utils/formatters.js",
  "./data/seed-data.js",
  "./modules/dashboard/dashboard.html",
  "./modules/dashboard/dashboard.js",
  "./modules/project-code-register/project-code-register.html",
  "./modules/project-code-register/project-code-register.js",
  "./modules/project-code-register/project-form.js",
  "./modules/project-code-register/project-table.js",
  "./modules/settings/settings.html",
  "./modules/settings/settings.js",
  "./modules/settings/field-configuration.js",
  "./modules/backup/backup.html",
  "./modules/backup/backup.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return undefined;
        });
    })
  );
});
