/**
 * Shared date formatting utilities
 * Format: M.D.YY (e.g., 1.1.26 for January 1, 2026)
 */

/**
 * Format a date string to compact format: M.D.YY
 * @param dateString - ISO date string or date string
 * @returns Formatted date string like "1.1.26"
 */
export function formatDateCompact(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return "";
  }

  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate(); // 1-31
  const year = date.getFullYear() % 100; // Last 2 digits of year

  return `${month}.${day}.${year}`;
}
