export function normalizeCity(s: unknown): string {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}