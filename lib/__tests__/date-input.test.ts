import {
  formatDateDisplay,
  parseDateInput,
  todayIsoDate
} from '@/lib/date-input';

describe('date-input helpers', () => {
  describe('parseDateInput', () => {
    it.each([
      ['Jul 07, 2025', '2025-07-07'],
      ['jul 7, 2025', '2025-07-07'],
      ['Jul 7 2025', '2025-07-07'],
      ['  Dec 25, 2023  ', '2023-12-25'],
      ['2023-12-25', '2023-12-25'],
      ['Feb 29, 2024', '2024-02-29']
    ])('parses %p as %p', (input, expected) => {
      expect(parseDateInput(input)).toBe(expected);
    });

    it.each([
      '',
      'Jul 1',
      '5',
      'Feb 30, 2025',
      'Feb 29, 2025',
      '2025-02-30',
      '2025-13-01',
      'Foo 01, 2025',
      'July 07, 2025',
      '07/07/2025',
      'Feb 29, 0024',
      '0024-02-29',
      '0001-01-01',
      'Jan 01, 0999',
      '0999-01-01'
    ])('rejects %p', (input) => {
      expect(parseDateInput(input)).toBe('');
    });
  });

  describe('formatDateDisplay', () => {
    it('formats ISO dates as MMM DD, YYYY', () => {
      expect(formatDateDisplay('2025-07-07')).toBe('Jul 07, 2025');
      expect(formatDateDisplay('2023-12-25')).toBe('Dec 25, 2023');
    });

    it('round-trips with parseDateInput', () => {
      expect(parseDateInput(formatDateDisplay('2024-02-29'))).toBe(
        '2024-02-29'
      );
    });

    it('returns an empty string for invalid input', () => {
      expect(formatDateDisplay('')).toBe('');
      expect(formatDateDisplay('2025-02-30')).toBe('');
    });
  });

  describe('todayIsoDate', () => {
    it('uses the local calendar day, not the UTC day', () => {
      // 11:30 pm local time on Jul 7. In any timezone west of UTC this is
      // already Jul 8 in UTC, which toISOString() would have returned.
      const lateEvening = new Date(2025, 6, 7, 23, 30);
      expect(todayIsoDate(lateEvening)).toBe('2025-07-07');
    });

    it('uses the local calendar day just after midnight', () => {
      const justAfterMidnight = new Date(2025, 6, 7, 0, 15);
      expect(todayIsoDate(justAfterMidnight)).toBe('2025-07-07');
    });
  });
});
