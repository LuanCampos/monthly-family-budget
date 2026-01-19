import { describe, it, expect } from 'vitest';
import { offlineAdapter } from './offlineAdapter';

describe('offlineAdapter', () => {
  describe('structure', () => {
    it('should expose all required methods', () => {
      expect(typeof offlineAdapter.getAll).toBe('function');
      expect(typeof offlineAdapter.getAllByIndex).toBe('function');
      expect(typeof offlineAdapter.get).toBe('function');
      expect(typeof offlineAdapter.put).toBe('function');
      expect(typeof offlineAdapter.delete).toBe('function');
      expect(typeof offlineAdapter.clear).toBe('function');
    });

    it('should expose sync queue methods', () => {
      expect(typeof offlineAdapter.sync.add).toBe('function');
      expect(typeof offlineAdapter.sync.getAll).toBe('function');
      expect(typeof offlineAdapter.sync.getByFamily).toBe('function');
      expect(typeof offlineAdapter.sync.remove).toBe('function');
      expect(typeof offlineAdapter.sync.clear).toBe('function');
    });

    it('should expose utility methods', () => {
      expect(typeof offlineAdapter.generateOfflineId).toBe('function');
      expect(typeof offlineAdapter.isOfflineId).toBe('function');
    });
  });

  describe('generateOfflineId', () => {
    it('should generate valid offline IDs', () => {
      const id = offlineAdapter.generateOfflineId();
      expect(offlineAdapter.isOfflineId(id)).toBe(true);
    });

    it('should generate IDs with custom prefix', () => {
      const id = offlineAdapter.generateOfflineId('expense');
      expect(id.startsWith('expense-')).toBe(true);
    });

    it('should generate unique IDs', () => {
      const id1 = offlineAdapter.generateOfflineId();
      const id2 = offlineAdapter.generateOfflineId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('isOfflineId', () => {
    it('should correctly identify offline IDs', () => {
      expect(offlineAdapter.isOfflineId('offline-123456-abc')).toBe(true);
      expect(offlineAdapter.isOfflineId('family-123456-abc')).toBe(true);
      expect(offlineAdapter.isOfflineId('exp-123456-abc')).toBe(true);
    });

    it('should reject online (UUID) IDs', () => {
      expect(offlineAdapter.isOfflineId('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
      expect(offlineAdapter.isOfflineId('random-string')).toBe(false);
    });
  });
});
