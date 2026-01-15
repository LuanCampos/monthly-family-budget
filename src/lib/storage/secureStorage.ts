/**
 * Secure Storage Utilities
 * 
 * Provides safe access to localStorage with validation and sanitization
 * to prevent XSS attacks and data tampering.
 */

import { logger } from '../logger';

// Validation patterns for different storage keys
const VALIDATION_PATTERNS: Record<string, RegExp> = {
  'current-family-id': /^[a-zA-Z0-9-_]+$/,
  'budget-app-theme': /^(light|dark|system|[a-z-]+)$/,  // Extended for custom themes
  'budget-app-language': /^(pt|en)$/,
  'budget-app-currency': /^(BRL|USD)$/,
};

// Pattern for dynamic keys (prefix-based)
const DYNAMIC_KEY_PATTERNS: Record<string, RegExp> = {
  'month-expenses-sort:': /^\{"sortType":"(createdAt|category|value|dueDate)","sortDirection":"(asc|desc)"\}$/,
};

// Default values for known keys
const DEFAULT_VALUES: Record<string, string | null> = {
  'budget-app-theme': 'dark',
  'budget-app-language': 'pt',
  'budget-app-currency': 'BRL',
};

/**
 * Get validation pattern for a key (handles dynamic keys with prefixes)
 */
const getValidationPattern = (key: string): RegExp | undefined => {
  // Check exact match first
  if (VALIDATION_PATTERNS[key]) {
    return VALIDATION_PATTERNS[key];
  }
  // Check dynamic key patterns (prefix-based)
  for (const [prefix, pattern] of Object.entries(DYNAMIC_KEY_PATTERNS)) {
    if (key.startsWith(prefix)) {
      return pattern;
    }
  }
  return undefined;
};

/**
 * Safely get a value from localStorage with validation
 * Returns null if value is invalid or doesn't exist
 */
export const getSecureStorageItem = (key: string): string | null => {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;

    // If we have a validation pattern for this key, validate the value
    const pattern = getValidationPattern(key);
    if (pattern && !pattern.test(value)) {
      logger.warn('secureStorage.invalidValue', { key, value: value.substring(0, 50) });
      // Remove invalid value
      localStorage.removeItem(key);
      return DEFAULT_VALUES[key] ?? null;
    }

    return value;
  } catch (error) {
    logger.error('secureStorage.getItem.failed', { key, error });
    return null;
  }
};

/**
 * Safely set a value in localStorage with validation
 * Returns true if successful, false otherwise
 */
export const setSecureStorageItem = (key: string, value: string): boolean => {
  try {
    // Validate value if we have a pattern
    const pattern = getValidationPattern(key);
    if (pattern && !pattern.test(value)) {
      logger.warn('secureStorage.setItem.invalidValue', { key });
      return false;
    }

    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    logger.error('secureStorage.setItem.failed', { key, error });
    return false;
  }
};

/**
 * Safely remove a value from localStorage
 */
export const removeSecureStorageItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    logger.error('secureStorage.removeItem.failed', { key, error });
    return false;
  }
};

/**
 * Clear all secure storage items
 */
export const clearSecureStorage = (): boolean => {
  try {
    // Only clear known keys, not all localStorage
    Object.keys(VALIDATION_PATTERNS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    logger.error('secureStorage.clear.failed', { error });
    return false;
  }
};

/**
 * Validate all stored values and remove any that are invalid
 * Call this on app startup
 */
export const validateStoredValues = (): void => {
  Object.entries(VALIDATION_PATTERNS).forEach(([key, pattern]) => {
    try {
      const value = localStorage.getItem(key);
      if (value && !pattern.test(value)) {
        logger.warn('secureStorage.validate.removingInvalid', { key });
        localStorage.removeItem(key);
      }
    } catch (error) {
      logger.error('secureStorage.validate.failed', { key, error });
    }
  });
};
