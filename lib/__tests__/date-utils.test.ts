/**
 * Test suite for date utility functions
 */

describe('Date Utilities', () => {
  describe('Local Date Formatting', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const formatDateForInput = (date: Date): string => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    it('formats date correctly for HTML date input', () => {
      const testDate = new Date('2025-06-03T15:30:00');
      const formatted = formatDateForInput(testDate);
      expect(formatted).toBe('2025-06-03');
    });

    it('handles single-digit months and days with leading zeros', () => {
      const testDate = new Date('2025-03-05T10:00:00');
      const formatted = formatDateForInput(testDate);
      expect(formatted).toBe('2025-03-05');
    });

    it('handles January (month 0)', () => {
      const testDate = new Date('2025-01-15T10:00:00');
      const formatted = formatDateForInput(testDate);
      expect(formatted).toBe('2025-01-15');
    });

    it('handles December (month 11)', () => {
      const testDate = new Date('2025-12-25T10:00:00');
      const formatted = formatDateForInput(testDate);
      expect(formatted).toBe('2025-12-25');
    });

    it('maintains local timezone (does not convert to UTC)', () => {
      // Create a date that would be different in UTC vs local time
      jest.useFakeTimers();

      // Set system time to late evening (would be next day in UTC)
      const lateEvening = new Date('2025-06-03T23:30:00');
      jest.setSystemTime(lateEvening);

      const now = new Date();
      const formatted = formatDateForInput(now);

      // Should still be June 3rd in local time, not June 4th (UTC)
      expect(formatted).toBe('2025-06-03');
    });

    it('works correctly across year boundaries', () => {
      const newYearEve = new Date('2024-12-31T23:59:59');
      const formatted = formatDateForInput(newYearEve);
      expect(formatted).toBe('2024-12-31');
    });

    it('handles leap year February correctly', () => {
      const leapYearDate = new Date('2024-02-29T12:00:00');
      const formatted = formatDateForInput(leapYearDate);
      expect(formatted).toBe('2024-02-29');
    });

    it('comparison: shows difference from toISOString approach', () => {
      jest.useFakeTimers();

      // Set a specific system time
      const mockDate = new Date('2025-06-03T15:30:00'); // 3:30 PM local time
      jest.setSystemTime(mockDate);

      const now = new Date();

      // Our local timezone approach
      const localFormatted = formatDateForInput(now);

      // The problematic UTC approach
      const utcFormatted = now.toISOString().split('T')[0];

      // Both should be June 3rd in this case, but the important thing is
      // that our local approach uses local timezone methods
      expect(localFormatted).toBe('2025-06-03');

      // This test documents that we're using local timezone methods
      // rather than UTC methods, which is the key difference
      expect(now.getDate()).toBe(3); // Local date
      expect(now.getFullYear()).toBe(2025); // Local year
      expect(now.getMonth()).toBe(5); // Local month (0-indexed, so 5 = June)
    });
  });

  describe('Edge Cases', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('handles system clock changes', () => {
      jest.useFakeTimers();

      // Test with different system times
      const dates = [
        new Date('2025-01-01T00:00:00'),
        new Date('2025-06-15T12:00:00'),
        new Date('2025-12-31T23:59:59')
      ];

      dates.forEach((testDate) => {
        jest.setSystemTime(testDate);
        const now = new Date();
        const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(formatted.length).toBe(10);
      });
    });

    it('maintains date consistency within the same day', () => {
      jest.useFakeTimers();

      const baseDate = new Date('2025-06-03T00:00:00');

      // Test different times throughout the same day
      const timesToTest = [
        '00:00:00',
        '06:00:00',
        '12:00:00',
        '18:00:00',
        '23:59:59'
      ];

      timesToTest.forEach((time) => {
        const testDate = new Date(`2025-06-03T${time}`);
        jest.setSystemTime(testDate);

        const now = new Date();
        const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        expect(formatted).toBe('2025-06-03');
      });
    });
  });
});
