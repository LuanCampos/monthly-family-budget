import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSecureStorageItem,
  setSecureStorageItem,
  removeSecureStorageItem,
  clearSecureStorage,
  validateStoredValues,
} from './secureStorage';

describe('secureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getSecureStorageItem', () => {
    it('should return null for non-existent key', () => {
      expect(getSecureStorageItem('non-existent')).toBeNull();
    });

    it('should return valid stored value', () => {
      localStorage.setItem('budget-app-theme', 'dark');
      expect(getSecureStorageItem('budget-app-theme')).toBe('dark');
    });

    it('should validate theme values', () => {
      localStorage.setItem('budget-app-theme', 'dark');
      expect(getSecureStorageItem('budget-app-theme')).toBe('dark');
      
      localStorage.setItem('budget-app-theme', 'light');
      expect(getSecureStorageItem('budget-app-theme')).toBe('light');
    });

    it('should return default for invalid theme value', () => {
      localStorage.setItem('budget-app-theme', 'invalid-theme');
      // Should return default 'dark' and remove invalid value
      const result = getSecureStorageItem('budget-app-theme');
      expect(result).toBe('dark');
    });

    it('should validate language values', () => {
      localStorage.setItem('budget-app-language', 'pt');
      expect(getSecureStorageItem('budget-app-language')).toBe('pt');
      
      localStorage.setItem('budget-app-language', 'en');
      expect(getSecureStorageItem('budget-app-language')).toBe('en');
    });

    it('should return default for invalid language value', () => {
      localStorage.setItem('budget-app-language', 'fr');
      const result = getSecureStorageItem('budget-app-language');
      expect(result).toBe('pt'); // Default
    });

    it('should validate currency values', () => {
      localStorage.setItem('budget-app-currency', 'BRL');
      expect(getSecureStorageItem('budget-app-currency')).toBe('BRL');
      
      localStorage.setItem('budget-app-currency', 'USD');
      expect(getSecureStorageItem('budget-app-currency')).toBe('USD');
    });

    it('should return default for invalid currency value', () => {
      localStorage.setItem('budget-app-currency', 'EUR');
      const result = getSecureStorageItem('budget-app-currency');
      expect(result).toBe('BRL'); // Default
    });

    it('should validate family ID format', () => {
      localStorage.setItem('current-family-id', 'abc-123_def');
      expect(getSecureStorageItem('current-family-id')).toBe('abc-123_def');
    });

    it('should reject invalid family ID', () => {
      localStorage.setItem('current-family-id', '<script>alert(1)</script>');
      expect(getSecureStorageItem('current-family-id')).toBeNull();
    });
  });

  describe('setSecureStorageItem', () => {
    it('should store valid values', () => {
      expect(setSecureStorageItem('budget-app-theme', 'dark')).toBe(true);
      expect(localStorage.getItem('budget-app-theme')).toBe('dark');
    });

    it('should reject invalid values', () => {
      expect(setSecureStorageItem('budget-app-language', 'invalid')).toBe(false);
      expect(localStorage.getItem('budget-app-language')).toBeNull();
    });

    it('should store valid family ID', () => {
      expect(setSecureStorageItem('current-family-id', 'valid-id-123')).toBe(true);
      expect(localStorage.getItem('current-family-id')).toBe('valid-id-123');
    });

    it('should reject family ID with XSS attempts', () => {
      expect(setSecureStorageItem('current-family-id', '<script>alert(1)</script>')).toBe(false);
      expect(localStorage.getItem('current-family-id')).toBeNull();
    });

    it('should store all valid theme variants', () => {
      const themes = ['dark', 'light', 'nord', 'dracula', 'solarized', 'gruvbox', 'catppuccin', 'solarizedLight'];
      themes.forEach(theme => {
        expect(setSecureStorageItem('budget-app-theme', theme)).toBe(true);
        expect(localStorage.getItem('budget-app-theme')).toBe(theme);
      });
    });
  });

  describe('removeSecureStorageItem', () => {
    it('should remove existing item', () => {
      localStorage.setItem('budget-app-theme', 'dark');
      expect(removeSecureStorageItem('budget-app-theme')).toBe(true);
      expect(localStorage.getItem('budget-app-theme')).toBeNull();
    });

    it('should return true even if item does not exist', () => {
      expect(removeSecureStorageItem('non-existent')).toBe(true);
    });
  });

  describe('clearSecureStorage', () => {
    it('should clear all known secure storage keys', () => {
      localStorage.setItem('budget-app-theme', 'dark');
      localStorage.setItem('budget-app-language', 'pt');
      localStorage.setItem('budget-app-currency', 'BRL');
      localStorage.setItem('current-family-id', 'fam-123');
      localStorage.setItem('other-key', 'should-remain');

      expect(clearSecureStorage()).toBe(true);

      // Known keys should be cleared
      expect(localStorage.getItem('budget-app-theme')).toBeNull();
      expect(localStorage.getItem('budget-app-language')).toBeNull();
      expect(localStorage.getItem('budget-app-currency')).toBeNull();
      expect(localStorage.getItem('current-family-id')).toBeNull();

      // Other keys should remain
      expect(localStorage.getItem('other-key')).toBe('should-remain');
    });
  });

  describe('validateStoredValues', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should keep valid values', () => {
      localStorage.setItem('budget-app-theme', 'dark');
      localStorage.setItem('budget-app-language', 'en');

      validateStoredValues();

      expect(localStorage.getItem('budget-app-theme')).toBe('dark');
      expect(localStorage.getItem('budget-app-language')).toBe('en');
    });

    it('should remove invalid values during validation', () => {
      localStorage.setItem('budget-app-theme', 'invalid-theme');
      localStorage.setItem('budget-app-language', 'invalid-lang');

      validateStoredValues();

      expect(localStorage.getItem('budget-app-theme')).toBeNull();
      expect(localStorage.getItem('budget-app-language')).toBeNull();
    });

    it('should handle mixed valid and invalid values', () => {
      localStorage.setItem('budget-app-theme', 'nord'); // valid
      localStorage.setItem('budget-app-language', 'xyz'); // invalid
      localStorage.setItem('budget-app-currency', 'USD'); // valid

      validateStoredValues();

      expect(localStorage.getItem('budget-app-theme')).toBe('nord');
      expect(localStorage.getItem('budget-app-language')).toBeNull();
      expect(localStorage.getItem('budget-app-currency')).toBe('USD');
    });
  });

  describe('security - XSS prevention', () => {
    it('should reject script injection in family ID', () => {
      const xssPayloads = [
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        '"><img src=x onerror=alert(1)>',
        "'; DROP TABLE users; --",
        '<img/src=x onerror=alert(1)>',
      ];

      xssPayloads.forEach(payload => {
        localStorage.setItem('current-family-id', payload);
        expect(getSecureStorageItem('current-family-id')).toBeNull();
      });
    });

    it('should only accept safe characters in family ID', () => {
      // Valid patterns
      expect(setSecureStorageItem('current-family-id', 'abc123')).toBe(true);
      expect(setSecureStorageItem('current-family-id', 'abc-123')).toBe(true);
      expect(setSecureStorageItem('current-family-id', 'abc_123')).toBe(true);
      expect(setSecureStorageItem('current-family-id', 'ABC-123_xyz')).toBe(true);

      // Invalid patterns
      expect(setSecureStorageItem('current-family-id', 'abc 123')).toBe(false); // space
      expect(setSecureStorageItem('current-family-id', 'abc.123')).toBe(false); // dot
      expect(setSecureStorageItem('current-family-id', 'abc@123')).toBe(false); // special char
    });
  });

  describe('dynamic key patterns', () => {
    it('should validate month-expenses-sort pattern', () => {
      const validSortValue = '{"sortType":"createdAt","sortDirection":"asc"}';
      localStorage.setItem('month-expenses-sort:month-123', validSortValue);
      expect(getSecureStorageItem('month-expenses-sort:month-123')).toBe(validSortValue);
    });

    it('should reject invalid sort pattern', () => {
      const invalidSortValue = '{"sortType":"invalid","sortDirection":"asc"}';
      localStorage.setItem('month-expenses-sort:month-123', invalidSortValue);
      expect(getSecureStorageItem('month-expenses-sort:month-123')).toBeNull();
    });

    it('should accept all valid sort types', () => {
      const sortTypes = ['createdAt', 'category', 'value', 'dueDate'];
      const directions = ['asc', 'desc'];

      sortTypes.forEach(type => {
        directions.forEach(dir => {
          const value = `{"sortType":"${type}","sortDirection":"${dir}"}`;
          localStorage.setItem('month-expenses-sort:test', value);
          expect(getSecureStorageItem('month-expenses-sort:test')).toBe(value);
        });
      });
    });
  });
});