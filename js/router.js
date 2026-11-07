/**
 * Tiny hash-based router. Maps a URL hash (e.g. "#/projects") to a
 * module's render function. Modules are loaded lazily via dynamic
 * import() so the initial page load stays small.
 */

const ROUTES = [
  { path: "/dashboard", load: () => import("../modules/dashboard/dashboard.js") },
  { path: "/projects", load: () => import("../modules/project-code-register/project-code-register.js") },
  {
    path: "/settings/fields",
    load: () => import("../modules/settings/settings.js"),
    params: { tab: "fields" },
  },
  {
    path: "/settings/app",
    load: () => import("../modules/settings/settings.js"),
    params: { tab: "app" },
  },
  { path: "/backup", load: () => import("../modules/backup/backup.js") },
];

const DEFAULT_ROUTE = "/dashboard";

function currentPathAndQuery() {
  const hash = window.location.hash || "";
  const raw = hash.replace(/^#/, "") || DEFAULT_ROUTE;
  const [path, queryString] = raw.split("?");
  const query = Object.fromEntries(new URLSearchParams(queryString || ""));
  return { path: path || DEFAULT_ROUTE, query };
}

function matchRoute(path) {
  return ROUTES.find((r) => r.path === path) || null;
}

let activeToken = 0;

async function handleRouteChange(container) {
  const token = ++activeToken;
  const { path, query } = currentPathAndQuery();
  let route = matchRoute(path);

  if (!route) {
    window.location.hash = `#${DEFAULT_ROUTE}`;
    return;
  }

  container.innerHTML = '<div class="empty-state">Loading…</div>';

  try {
    const mod = await route.load();
    if (token !== activeToken) return; // a newer navigation happened while loading
    container.innerHTML = "";
    await mod.render(container, { ...(route.params || {}), ...query });
  } catch (err) {
    if (token !== activeToken) return;
    console.error("Failed to load module for route", path, err);
    container.innerHTML =
      '<div class="empty-state"><div class="table-empty__title">This page could not be loaded.</div>' +
      "<div>Please try reloading the app. If the problem continues, check the browser console for details.</div></div>";
  }
}

export function initRouter(container) {
  window.addEventListener("hashchange", () => handleRouteChange(container));
  if (!window.location.hash) {
    window.location.hash = `#${DEFAULT_ROUTE}`;
  } else {
    handleRouteChange(container);
  }
}
