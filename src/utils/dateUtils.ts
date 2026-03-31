/**
 * Converts a Date to a local-timezone 'YYYY-MM-DD' key.
 * Uses local date parts (not UTC) so the key matches the user's calendar day.
 */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
