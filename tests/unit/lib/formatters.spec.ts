import { test, expect } from '@playwright/test';
import {
  currencyFormatter,
  compactCurrencyFormatter,
  compactCurrencyFormatterWithDecimals,
  shortDateFormatter,
  fullDateFormatter,
  shortTimeFormatter
} from '../../../src/lib/formatters';

test.describe('Formatters', () => {
  test.describe('Currency Formatters', () => {
    test('currencyFormatter formats correctly', () => {
      // 1234567.89 -> $ 1.234.568 (with non-breaking space)
      const formatted = currencyFormatter.format(1234567.89);
      expect(formatted).toBe('$\xa01.234.568');

      const formattedZero = currencyFormatter.format(0);
      expect(formattedZero).toBe('$\xa00');
    });

    test('compactCurrencyFormatter formats correctly', () => {
      // 1234567.89 -> 1,2 M (with non-breaking space)
      const formatted = compactCurrencyFormatter.format(1234567.89);
      expect(formatted).toBe('1,2\xa0M');

      const formattedThousands = compactCurrencyFormatter.format(1500);
      expect(formattedThousands).toBe('1,5\xa0K');
    });

    test('compactCurrencyFormatterWithDecimals formats correctly', () => {
      // 1234567.89 -> 1,2 M (with non-breaking space)
      const formatted = compactCurrencyFormatterWithDecimals.format(1234567.89);
      expect(formatted).toBe('1,2\xa0M');

      const formattedThousands = compactCurrencyFormatterWithDecimals.format(1550);
      expect(formattedThousands).toBe('1,6\xa0K'); // Rounds up
    });
  });

  test.describe('Date/Time Formatters', () => {
    test('shortDateFormatter formats correctly', () => {
      // Create date at local noon to avoid timezone shift issues in simple formatters
      const date = new Date(2024, 4, 14, 12, 0, 0); // May 14
      // Since shortDateFormatter uses [] (browser default), its output depends on locale.
      // We will match the default 'en-US' locale in Playwright node tests.
      const formatted = shortDateFormatter.format(date);
      expect(formatted).toBe('May 14');
    });

    test('fullDateFormatter formats correctly', () => {
      const date = new Date(2024, 4, 14, 12, 0, 0);
      const formatted = fullDateFormatter.format(date);
      expect(formatted).toBe('05/14/2024');
    });

    test('shortTimeFormatter formats correctly', () => {
      const date = new Date(2024, 4, 14, 15, 30, 0);
      const formatted = shortTimeFormatter.format(date);
      // Playwright runs in UTC by default, but local timezone might affect this.
      // The output time might change depending on the machine timezone if no UTC explicitly set,
      // but typically we can test the pattern.
      expect(formatted).toMatch(/^\d{2}:\d{2}$/);
      expect(shortTimeFormatter.format(new Date('2024-01-01T15:30:00Z'))).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});
