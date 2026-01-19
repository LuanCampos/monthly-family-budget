import { describe, it, expect } from 'vitest';
import { offlineAdapter } from './offlineAdapter';

describe('offlineAdapter', () => {
  describe('generateOfflineId', () => {
    it('should generate IDs that pass isOfflineId check', () => {
      const id = offlineAdapter.generateOfflineId();
      expect(offlineAdapter.isOfflineId(id)).toBe(true);
    });

    it('should generate IDs with custom prefix', () => {
      const expenseId = offlineAdapter.generateOfflineId('expense');
      const monthId = offlineAdapter.generateOfflineId('month');
      const goalId = offlineAdapter.generateOfflineId('goal');
      
      expect(expenseId.startsWith('expense-')).toBe(true);
      expect(monthId.startsWith('month-')).toBe(true);
      expect(goalId.startsWith('goal-')).toBe(true);
    });

    it('should generate unique IDs even when called rapidly', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(offlineAdapter.generateOfflineId());
      }
      // All 1000 IDs should be unique
      expect(ids.size).toBe(1000);
    });

    it('should generate IDs with sufficient entropy', () => {
      const id = offlineAdapter.generateOfflineId();
      // ID should have at least 10 characters after the prefix
      expect(id.length).toBeGreaterThan(12);
    });
  });

  describe('isOfflineId', () => {
    it('should correctly identify generated offline IDs with default prefix', () => {
      expect(offlineAdapter.isOfflineId(offlineAdapter.generateOfflineId())).toBe(true);
    });

    it('should identify offline IDs with known prefixes', () => {
      // These are the known offline prefixes used in the app
      expect(offlineAdapter.isOfflineId(offlineAdapter.generateOfflineId('offline'))).toBe(true);
      expect(offlineAdapter.isOfflineId(offlineAdapter.generateOfflineId('family'))).toBe(true);
      expect(offlineAdapter.isOfflineId(offlineAdapter.generateOfflineId('exp'))).toBe(true);
      expect(offlineAdapter.isOfflineId(offlineAdapter.generateOfflineId('month'))).toBe(true);
      expect(offlineAdapter.isOfflineId(offlineAdapter.generateOfflineId('goal'))).toBe(true);
    });

    it('should NOT identify IDs with unknown prefixes as offline', () => {
      // Custom prefixes that are not in the known list should NOT be identified as offline
      // This is by design - only known prefixes are trusted
      expect(offlineAdapter.isOfflineId(offlineAdapter.generateOfflineId('test'))).toBe(false);
      expect(offlineAdapter.isOfflineId(offlineAdapter.generateOfflineId('random'))).toBe(false);
    });

    it('should identify offline IDs with common prefixes', () => {
      expect(offlineAdapter.isOfflineId('offline-123456-abc')).toBe(true);
      expect(offlineAdapter.isOfflineId('family-123456-abc')).toBe(true);
      expect(offlineAdapter.isOfflineId('exp-123456-abc')).toBe(true);
      expect(offlineAdapter.isOfflineId('month-1704067200000-x9k2m')).toBe(true);
    });

    it('should reject UUIDs (online IDs from Supabase)', () => {
      // Standard UUID v4 formats
      expect(offlineAdapter.isOfflineId('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
      expect(offlineAdapter.isOfflineId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(false);
      expect(offlineAdapter.isOfflineId('00000000-0000-0000-0000-000000000000')).toBe(false);
    });

    it('should handle edge cases gracefully', () => {
      // Empty/null/undefined should return false
      expect(offlineAdapter.isOfflineId('')).toBe(false);
      expect(offlineAdapter.isOfflineId(null as unknown as string)).toBe(false);
      expect(offlineAdapter.isOfflineId(undefined as unknown as string)).toBe(false);
      
      // Very short strings
      expect(offlineAdapter.isOfflineId('a')).toBe(false);
      expect(offlineAdapter.isOfflineId('abc')).toBe(false);
    });

    it('should not be fooled by malicious inputs', () => {
      // These should not crash and should return false
      expect(offlineAdapter.isOfflineId('<script>alert(1)</script>')).toBe(false);
      expect(offlineAdapter.isOfflineId('__proto__')).toBe(false);
      expect(offlineAdapter.isOfflineId('constructor')).toBe(false);
    });
  });

  // Note: sync queue operations require IndexedDB which is not available in unit tests.
  // These tests are covered in integration/e2e tests.
});
