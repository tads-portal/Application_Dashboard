/**
 * Renders the TADS header brand and the left navigation sidebar, and
 * keeps the "active" link in sync with the current route. Future
 * modules plug in by adding an entry to NAV_STRUCTURE.
 */

const LOGO_PATH = "assets/brand/tads-logo.webp";

export const NAV_STRUCTURE = [
  {
    label: "",
    items: [{ label: "Dashboard", route: "#/dashboard" }],
  },
  {
    label: "Applications",
    items: [
      { label: "Project Code Register", route: "#/projects" },
      { label: "BOM Log", comingSoon: true },
      { label: "Manufacturing Cost", comingSoon: true },
      { label: "Vendor Management", comingSoon: true },
      { label: "Document Management", comingSoon: true },
      { label: "Project Management", comingSoon: true },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Field Configuration", route: "#/settings/fields" },
      { label: "Application Settings", route: "#/settings/app" },
    ],
  },
  {
    label: "",
    items: [{ label: "Backup & Restore", route: "#/backup" }],
  },
];

function buildBrand() {
  const brand = document.createElement("div");
  brand.className = "brand";

  const img = document.createElement("img");
  img.src = LOGO_PATH;
  img.alt = "TADS logo";
  img.onerror = () => {
    img.style.display = "none";
  };

  const textWrap = document.createElement("div");
  const name = document.createElement("span");
  name.className = "brand-name";
  name.textContent = "TADS";
  const subtitle = document.createElement("span");
  subtitle.className = "brand-subtitle";
  subtitle.textContent = "Techmizers Automation and Design Solutions";
  textWrap.append(name, subtitle);

  brand.append(img, textWrap);
  return brand;
}

function buildNavLink(item) {
  if (item.comingSoon) {
    const el = document.createElement("div");
    el.className = "nav-link is-disabled";
    const label = document.createElement("span");
    label.textContent = item.label;
    const badge = document.createElement("span");
    badge.className = "badge badge-coming-soon";
    badge.textContent = "Coming Soon";
    el.append(label, badge);
    return el;
  }

  const el = document.createElement("a");
  el.className = "nav-link";
  el.href = item.route;
  el.dataset.route = item.route;
  el.textContent = item.label;
  return el;
}

function buildSidebarContent() {
  const frag = document.createDocumentFragment();
  for (const group of NAV_STRUCTURE) {
    const groupEl = document.createElement("div");
    groupEl.className = "nav-group";
    if (group.label) {
      const labelEl = document.createElement("div");
      labelEl.className = "nav-group__label";
      labelEl.textContent = group.label;
      groupEl.appendChild(labelEl);
    }
    for (const item of group.items) {
      groupEl.appendChild(buildNavLink(item));
    }
    frag.appendChild(groupEl);
  }
  return frag;
}

function updateActiveLink(sidebarEl) {
  const currentRoute = window.location.hash || "#/dashboard";
  sidebarEl.querySelectorAll(".nav-link[data-route]").forEach((link) => {
    const route = link.dataset.route;
    const isActive = currentRoute === route || (route !== "#/dashboard" && currentRoute.startsWith(route));
    link.classList.toggle("is-active", isActive);
  });
}

export function initNavigation({ headerBrandSlot, sidebarEl, navToggleBtn, sidebarScrimEl }) {
  headerBrandSlot.appendChild(buildBrand());
  sidebarEl.appendChild(buildSidebarContent());
  updateActiveLink(sidebarEl);

  window.addEventListener("hashchange", () => updateActiveLink(sidebarEl));

  function closeSidebar() {
    sidebarEl.classList.remove("is-open");
    sidebarScrimEl.classList.remove("is-visible");
  }

  if (navToggleBtn && sidebarScrimEl) {
    navToggleBtn.addEventListener("click", () => {
      sidebarEl.classList.toggle("is-open");
      sidebarScrimEl.classList.toggle("is-visible");
    });
    sidebarScrimEl.addEventListener("click", closeSidebar);
    sidebarEl.addEventListener("click", (e) => {
      if (e.target.closest("a.nav-link")) closeSidebar();
    });
  }
}
