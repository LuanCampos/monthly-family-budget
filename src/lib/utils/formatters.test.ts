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
  });
});
