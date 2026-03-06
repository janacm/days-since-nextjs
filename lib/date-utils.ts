/**
 * Format a Date object as YYYY-MM-DD using local timezone.
 *
 * Unlike `date.toISOString().split('T')[0]` which uses UTC, this function
 * preserves the local date so that late-evening dates are not shifted to
 * the next day for users in UTC+ timezones.
 */
export function formatDateForInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
