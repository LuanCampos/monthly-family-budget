import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercentage,
  parseCurrencyInput,
  formatCurrencyInput,
  sanitizeCurrencyInput,
} from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly in BRL', () => {
      // Note: Intl.NumberFormat uses non-breaking space (U+00A0)
      expect(formatCurrency(100)).toMatch(/R\$\s*100,00/);
      expect(formatCurrency(1234.56)).toMatch(/R\$\s*1\.234,56/);
      expect(formatCurrency(0)).toMatch(/R\$\s*0,00/);
    });

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-100)).toMatch(/-R\$\s*100,00/);
    });

    it('should handle decimal precision', () => {
      expect(formatCurrency(10.999)).toMatch(/R\$\s*11,00/);
      expect(formatCurrency(10.001)).toMatch(/R\$\s*10,00/);
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages with 2 decimal places', () => {
      expect(formatPercentage(50)).toBe('50.00%');
      expect(formatPercentage(33.333)).toBe('33.33%');
      expect(formatPercentage(0)).toBe('0.00%');
      expect(formatPercentage(100)).toBe('100.00%');
    });

    it('should handle negative percentages', () => {
      expect(formatPercentage(-25.5)).toBe('-25.50%');
    });
  });

  describe('parseCurrencyInput', () => {
    it('should parse comma-separated values', () => {
      expect(parseCurrencyInput('100,00')).toBe(100);
      expect(parseCurrencyInput('1234,56')).toBe(1234.56);
    });

    it('should parse dot-separated values', () => {
      expect(parseCurrencyInput('100.00')).toBe(100);
      expect(parseCurrencyInput('1234.56')).toBe(1234.56);
    });

    it('should return 0 for invalid input', () => {
      expect(parseCurrencyInput('')).toBe(0);
      expect(parseCurrencyInput('abc')).toBe(0);
      expect(parseCurrencyInput('   ')).toBe(0);
    });
  });

  describe('formatCurrencyInput', () => {
    it('should format numbers for input fields', () => {
      expect(formatCurrencyInput(100)).toBe('100,00');
      expect(formatCurrencyInput(1234.56)).toBe('1234,56');
    });

    it('should return empty string for zero or negative', () => {
      expect(formatCurrencyInput(0)).toBe('');
      expect(formatCurrencyInput(-10)).toBe('');
    });
  });

  describe('sanitizeCurrencyInput', () => {
    it('should remove non-numeric characters except comma and minus', () => {
      expect(sanitizeCurrencyInput('R$ 100,00')).toBe('100,00');
      expect(sanitizeCurrencyInput('abc123,45def')).toBe('123,45');
    });

    it('should handle minus sign correctly', () => {
      expect(sanitizeCurrencyInput('-100,00')).toBe('-100,00');
      expect(sanitizeCurrencyInput('100-00')).toBe('-10000');
    });

    it('should preserve digits and comma', () => {
      expect(sanitizeCurrencyInput('1,234,567')).toBe('1,234,567');
    });

    it('should handle security payloads safely', () => {
      // XSS attempts - should only keep digits, comma, minus
      expect(sanitizeCurrencyInput('<script>alert(1)</script>')).toBe('1');
      expect(sanitizeCurrencyInput('100<img onerror=alert(1)>')).toBe('1001');
      
      // SQL injection attempts - minus is normalized (only one at start)
      // "'; DROP TABLE--" → after removing non-[0-9,-] → "--" → normalize → "-"
      expect(sanitizeCurrencyInput("'; DROP TABLE--")).toBe('-');
      
      // Path traversal attempts
      expect(sanitizeCurrencyInput('../../../etc/passwd')).toBe('');
      
      // Unicode attacks
      expect(sanitizeCurrencyInput('100\u0000,00')).toBe('100,00');
    });
  });

  describe('edge cases and robustness', () => {
    describe('formatCurrency edge cases', () => {
      it('should handle very large numbers', () => {
        const result = formatCurrency(999999999999.99);
        expect(result).toMatch(/R\$/);
        expect(result).toMatch(/999/);
      });

      it('should handle very small decimal numbers', () => {
        const result = formatCurrency(0.01);
        expect(result).toMatch(/R\$\s*0,01/);
      });

      it('should handle exact cents', () => {
        expect(formatCurrency(10.00)).toMatch(/R\$\s*10,00/);
        expect(formatCurrency(10.10)).toMatch(/R\$\s*10,10/);
      });
    });

    describe('parseCurrencyInput edge cases', () => {
      it('should handle basic comma to dot conversion', () => {
        expect(parseCurrencyInput('100,50')).toBe(100.5);
        expect(parseCurrencyInput('1234,56')).toBe(1234.56);
      });

      it('should handle whitespace correctly (parseFloat trims leading spaces)', () => {
        // parseFloat handles leading whitespace before the number
        expect(parseCurrencyInput('  100,00  ')).toBe(100); // leading spaces are ignored by parseFloat
        expect(parseCurrencyInput('100,00  ')).toBe(100); // trailing spaces after number are ignored
      });

      it('should return 0 for non-numeric inputs', () => {
        expect(parseCurrencyInput('abc')).toBe(0);
        expect(parseCurrencyInput('---')).toBe(0);
        expect(parseCurrencyInput('...')).toBe(0);
        expect(parseCurrencyInput(',')).toBe(0);
      });
    });

    describe('formatPercentage edge cases', () => {
      it('should handle percentages over 100%', () => {
        expect(formatPercentage(150)).toBe('150.00%');
        expect(formatPercentage(1000)).toBe('1000.00%');
      });

      it('should handle very small percentages', () => {
        expect(formatPercentage(0.01)).toBe('0.01%');
        expect(formatPercentage(0.001)).toBe('0.00%');
      });
    });

    describe('formatCurrencyInput edge cases', () => {
      it('should handle NaN gracefully', () => {
        expect(formatCurrencyInput(NaN)).toBe('');
      });

      it('should handle Infinity gracefully', () => {
        expect(formatCurrencyInput(Infinity)).toBe('');
        expect(formatCurrencyInput(-Infinity)).toBe('');
      });
    });

    describe('sanitizeCurrencyInput security', () => {
      it('should neutralize prototype pollution attempts', () => {
        expect(sanitizeCurrencyInput('__proto__')).toBe('');
        expect(sanitizeCurrencyInput('constructor')).toBe('');
        expect(sanitizeCurrencyInput('prototype')).toBe('');
      });

      it('should handle null byte injection', () => {
        expect(sanitizeCurrencyInput('100\x00,00')).toBe('100,00');
        expect(sanitizeCurrencyInput('\x00100')).toBe('100');
      });

      it('should handle unicode bypass attempts', () => {
        expect(sanitizeCurrencyInput('１００')).toBe(''); // Fullwidth digits
        expect(sanitizeCurrencyInput('100\u200B,00')).toBe('100,00'); // Zero-width space
        expect(sanitizeCurrencyInput('１２３,４５')).toBe(','); // Fullwidth digits
      });

      it('should handle multiple minus signs correctly', () => {
        expect(sanitizeCurrencyInput('--100')).toBe('-100');
        expect(sanitizeCurrencyInput('100--50')).toBe('-10050');
        expect(sanitizeCurrencyInput('---')).toBe('-');
      });

      it('should handle command injection patterns', () => {
        expect(sanitizeCurrencyInput('100; rm -rf /')).toBe('-100');
        expect(sanitizeCurrencyInput('100 | cat /etc/passwd')).toBe('100');
        expect(sanitizeCurrencyInput('`whoami`')).toBe('');
      });

      it('should handle CRLF injection patterns', () => {
        expect(sanitizeCurrencyInput('100\r\n200')).toBe('100200');
        expect(sanitizeCurrencyInput('100%0d%0a200')).toBe('10000200'); // % is stripped, digits remain
      });
    });
  });
});
