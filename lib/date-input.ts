// Helpers for the reset dialog's text date field. All functions work on
// calendar dates (year, month, day) and never round-trip through a UTC
// instant, so the date the user sees is the date that gets saved in every
// timezone.

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

const DISPLAY_PATTERN = /^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})$/;
const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
const padYear = (n: number) => {
  if (n < 10) return `000${n}`;
  if (n < 100) return `00${n}`;
  if (n < 1000) return `0${n}`;
  return String(n);
};

function toIsoDate(year: number, month: number, day: number): string {
  return `${padYear(year)}-${pad(month)}-${pad(day)}`;
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (year < 1000 || month < 1 || month > 12 || day < 1) return false;
  // Day 0 of the next month is the last day of this month.
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

/** Today's date in the user's local timezone, as YYYY-MM-DD. */
export function todayIsoDate(now: Date = new Date()): string {
  return toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Formats YYYY-MM-DD as "MMM DD, YYYY" (e.g. "Jul 07, 2025"). */
export function formatDateDisplay(isoDate: string): string {
  const match = ISO_PATTERN.exec(isoDate);
  if (!match) return '';
  const [year, month, day] = match.slice(1).map(Number);
  if (!isRealDate(year, month, day)) return '';
  return `${MONTHS[month - 1]} ${pad(day)}, ${year}`;
}

/**
 * Strictly parses "MMM DD, YYYY" (comma optional, case-insensitive month)
 * or "YYYY-MM-DD" into YYYY-MM-DD. Returns '' for partial, ambiguous or
 * impossible dates such as "Jul 1", "5" or "Feb 30, 2025".
 */
export function parseDateInput(input: string): string {
  const value = input.trim();

  const iso = ISO_PATTERN.exec(value);
  if (iso) {
    const [year, month, day] = iso.slice(1).map(Number);
    return isRealDate(year, month, day) ? toIsoDate(year, month, day) : '';
  }

  const display = DISPLAY_PATTERN.exec(value);
  if (display) {
    const monthName = display[1].toLowerCase();
    const month = MONTHS.findIndex((m) => m.toLowerCase() === monthName) + 1;
    const day = Number(display[2]);
    const year = Number(display[3]);
    if (month === 0) return '';
    return isRealDate(year, month, day) ? toIsoDate(year, month, day) : '';
  }

  return '';
}
