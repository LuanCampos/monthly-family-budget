/**
 * Secure Storage Utilities
 * 
 * Provides safe access to localStorage with validation and sanitization
 * to prevent XSS attacks and data tampering.
 */

import { logger } from '../logger';

// Reserved words that could be used for prototype pollution attacks
const RESERVED_WORDS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf',
]);

// Validation patterns for different storage keys
// Note: family-id limited to 255 chars to prevent buffer overflow attacks
const VALIDATION_PATTERNS: Record<string, RegExp> = {
  'current-family-id': /^[a-zA-Z0-9-_]{1,255}$/,
  'budget-app-theme': /^(dark|light|nord|dracula|solarized|gruvbox|catppuccin|solarizedLight)$/,
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
 * Check if a value contains reserved words (prototype pollution prevention)
 */
const containsReservedWord = (value: string): boolean => {
  return RESERVED_WORDS.has(value) || RESERVED_WORDS.has(value.toLowerCase());
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

    // Check for prototype pollution attempts in ID fields
    if (key === 'current-family-id' && containsReservedWord(value)) {
      logger.warn('secureStorage.reservedWord', { key, value: value.substring(0, 50) });
      localStorage.removeItem(key);
      return null;
    }

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
    // Check for prototype pollution attempts in ID fields
    if (key === 'current-family-id' && containsReservedWord(value)) {
      logger.warn('secureStorage.setItem.reservedWord', { key });
      return false;
    }

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
