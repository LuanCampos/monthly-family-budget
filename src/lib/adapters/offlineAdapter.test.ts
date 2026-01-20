import { describe, it, expect, vi, beforeEach } from 'vitest';
import { offlineAdapter } from './offlineAdapter';

// Mock the offlineStorage module
vi.mock('../storage/offlineStorage', () => ({
  offlineDB: {
    getAll: vi.fn(),
    getAllByIndex: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  },
  syncQueue: {
    add: vi.fn(),
    getAll: vi.fn(),
    getByFamily: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
  generateOfflineId: vi.fn((prefix = 'offline') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
  isOfflineId: vi.fn((id: string) => {
    if (!id || typeof id !== 'string') return false;
    const offlinePrefixes = ['offline-', 'family-', 'exp-', 'rec-', 'sub-', 'goal-', 'gentry-', 'month-'];
    return offlinePrefixes.some(prefix => id.startsWith(prefix));
  }),
}));

import { offlineDB, syncQueue } from '../storage/offlineStorage';

describe('offlineAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  describe('CRUD operations delegation', () => {
    it('should delegate getAll to offlineDB', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      vi.mocked(offlineDB.getAll).mockResolvedValue(mockData);

      const result = await offlineAdapter.getAll('families');

      expect(offlineDB.getAll).toHaveBeenCalledWith('families');
      expect(result).toEqual(mockData);
    });

    it('should delegate getAllByIndex to offlineDB', async () => {
      const mockData = [{ id: 'exp-1', month_id: 'month-1' }];
      vi.mocked(offlineDB.getAllByIndex).mockResolvedValue(mockData);

      const result = await offlineAdapter.getAllByIndex('expenses', 'month_id', 'month-1');

      expect(offlineDB.getAllByIndex).toHaveBeenCalledWith('expenses', 'month_id', 'month-1');
      expect(result).toEqual(mockData);
    });

    it('should delegate get to offlineDB', async () => {
      const mockData = { id: '1', name: 'Test Family' };
      vi.mocked(offlineDB.get).mockResolvedValue(mockData);

      const result = await offlineAdapter.get('families', '1');

      expect(offlineDB.get).toHaveBeenCalledWith('families', '1');
      expect(result).toEqual(mockData);
    });

    it('should delegate put to offlineDB', async () => {
      const mockData = { id: '1', name: 'Test Family' };
      vi.mocked(offlineDB.put).mockResolvedValue(undefined);

      await offlineAdapter.put('families', mockData);

      expect(offlineDB.put).toHaveBeenCalledWith('families', mockData);
    });

    it('should delegate delete to offlineDB', async () => {
      vi.mocked(offlineDB.delete).mockResolvedValue(undefined);

      await offlineAdapter.delete('families', '1');

      expect(offlineDB.delete).toHaveBeenCalledWith('families', '1');
    });

    it('should delegate clear to offlineDB', async () => {
      vi.mocked(offlineDB.clear).mockResolvedValue(undefined);

      await offlineAdapter.clear('families');

      expect(offlineDB.clear).toHaveBeenCalledWith('families');
    });
  });

  describe('sync queue operations delegation', () => {
    it('should delegate sync.add to syncQueue', async () => {
      vi.mocked(syncQueue.add).mockResolvedValue(undefined);

      const item = { type: 'expense' as const, action: 'insert' as const, data: {}, familyId: 'family-1' };
      await offlineAdapter.sync.add(item);

      expect(syncQueue.add).toHaveBeenCalledWith(item);
    });

    it('should delegate sync.getAll to syncQueue', async () => {
      const mockItems = [
        { id: 'sync-1', type: 'expense' as const, action: 'insert' as const, data: {}, createdAt: '2025-01-01', familyId: 'family-1' },
      ];
      vi.mocked(syncQueue.getAll).mockResolvedValue(mockItems);

      const result = await offlineAdapter.sync.getAll();

      expect(syncQueue.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockItems);
    });

    it('should delegate sync.getByFamily to syncQueue', async () => {
      const mockItems = [
        { id: 'sync-1', type: 'expense' as const, action: 'insert' as const, data: {}, createdAt: '2025-01-01', familyId: 'family-1' },
      ];
      vi.mocked(syncQueue.getByFamily).mockResolvedValue(mockItems);

      const result = await offlineAdapter.sync.getByFamily('family-1');

      expect(syncQueue.getByFamily).toHaveBeenCalledWith('family-1');
      expect(result).toEqual(mockItems);
    });

    it('should delegate sync.remove to syncQueue', async () => {
      vi.mocked(syncQueue.remove).mockResolvedValue(undefined);

      await offlineAdapter.sync.remove('sync-1');

      expect(syncQueue.remove).toHaveBeenCalledWith('sync-1');
    });

    it('should delegate sync.clear to syncQueue', async () => {
      vi.mocked(syncQueue.clear).mockResolvedValue(undefined);

      await offlineAdapter.sync.clear();

      expect(syncQueue.clear).toHaveBeenCalled();
    });
  });

  describe('offline adapter type', () => {
    it('should expose all expected methods', () => {
      expect(typeof offlineAdapter.getAll).toBe('function');
      expect(typeof offlineAdapter.getAllByIndex).toBe('function');
      expect(typeof offlineAdapter.get).toBe('function');
      expect(typeof offlineAdapter.put).toBe('function');
      expect(typeof offlineAdapter.delete).toBe('function');
      expect(typeof offlineAdapter.clear).toBe('function');
      expect(typeof offlineAdapter.generateOfflineId).toBe('function');
      expect(typeof offlineAdapter.isOfflineId).toBe('function');
    });

    it('should expose sync namespace with all methods', () => {
      expect(typeof offlineAdapter.sync.add).toBe('function');
      expect(typeof offlineAdapter.sync.getAll).toBe('function');
      expect(typeof offlineAdapter.sync.getByFamily).toBe('function');
      expect(typeof offlineAdapter.sync.remove).toBe('function');
      expect(typeof offlineAdapter.sync.clear).toBe('function');
    });
  });

  describe('store name handling', () => {
    it('should work with all supported store names', async () => {
      const storeNames = [
        'families',
        'months',
        'expenses',
        'recurring_expenses',
        'subcategories',
        'income_sources',
        'goals',
        'goal_entries',
        'sync_queue',
        'user_preferences',
        'category_limits',
      ];

      vi.mocked(offlineDB.getAll).mockResolvedValue([]);

      for (const storeName of storeNames) {
        await offlineAdapter.getAll(storeName);
        expect(offlineDB.getAll).toHaveBeenCalledWith(storeName);
      }
    });
  });

  describe('error handling', () => {
    it('should propagate errors from offlineDB.getAll', async () => {
      const error = new Error('IndexedDB error');
      vi.mocked(offlineDB.getAll).mockRejectedValue(error);

      await expect(offlineAdapter.getAll('families')).rejects.toThrow('IndexedDB error');
    });

    it('should propagate errors from offlineDB.put', async () => {
      const error = new Error('Write failed');
      vi.mocked(offlineDB.put).mockRejectedValue(error);

      await expect(offlineAdapter.put('families', { id: '1' })).rejects.toThrow('Write failed');
    });

    it('should propagate errors from syncQueue.add', async () => {
      const error = new Error('Queue error');
      vi.mocked(syncQueue.add).mockRejectedValue(error);

      await expect(offlineAdapter.sync.add({
        type: 'expense',
        action: 'insert',
        data: {},
        familyId: 'family-1',
      })).rejects.toThrow('Queue error');
    });
  });
});
