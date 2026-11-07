/** Date helpers used across services and UI. All storage uses ISO strings (UTC). */

export function nowIso() {
  return new Date().toISOString();
}

/** "2026-09-22T10:00:00.000Z" or "2026-09-22" -> "Sep 22, 2026" */
export function formatDate(isoValue) {
  if (!isoValue) return "";
  const d = new Date(isoValue);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** "2026-09-22T10:00:00.000Z" -> "Sep 22, 2026, 10:00 AM" */
export function formatDateTime(isoValue) {
  if (!isoValue) return "";
  const d = new Date(isoValue);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** For <input type="date"> which needs "YYYY-MM-DD". */
export function toDateInputValue(isoValue) {
  if (!isoValue) return "";
  const d = new Date(isoValue);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function relativeTimeFromNow(isoValue) {
  if (!isoValue) return "";
  const d = new Date(isoValue);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = d.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const abs = Math.abs(diffMinutes);

  if (abs < 1) return "just now";
  if (abs < 60) return rtf(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  return rtf(diffDays, "day");
}

function rtf(value, unit) {
  if (typeof Intl !== "undefined" && Intl.RelativeTimeFormat) {
    return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(value, unit);
  }
  return `${Math.abs(value)} ${unit}${Math.abs(value) === 1 ? "" : "s"} ${value < 0 ? "ago" : "from now"}`;
}
