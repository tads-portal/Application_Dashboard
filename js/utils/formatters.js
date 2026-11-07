/** Small formatting helpers. */

export function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function titleCase(str) {
  if (!str) return "";
  return str.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

/** "projectName" -> "Project Name" (used as a fallback label if none is set). */
export function labelFromKey(key) {
  if (!key) return "";
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return titleCase(spaced);
}

export function pluralize(count, singular, plural) {
  const word = count === 1 ? singular : plural || `${singular}s`;
  return `${count} ${word}`;
}

export function truncate(str, maxLength = 80) {
  if (!str) return "";
  return str.length > maxLength ? `${str.slice(0, maxLength - 1)}…` : str;
}
