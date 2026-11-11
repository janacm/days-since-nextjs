/**
 * Format a Date object as YYYY-MM-DD using local timezone.
 *
 * Unlike `date.toISOString().split('T')[0]` which uses UTC, this function
 * preserves the local calendar date. The UTC approach can shift the date by
 * one day (late evening in UTC− zones, early morning in UTC+ zones).
 */
export function formatDateForInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
