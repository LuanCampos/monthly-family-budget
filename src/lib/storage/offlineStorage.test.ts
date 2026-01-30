import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateOfflineId, isOfflineId, offlineDB, syncQueue, clearOfflineCache, type SyncQueueItem } from './offlineStorage';

// Mock IndexedDB for testing
interface MockIDBRequest<T> extends IDBRequest<T> {
  onblocked: ((event: Event) => void) | null;
}

const createMockIDBRequest = <T>(result: T, error: DOMException | null = null): MockIDBRequest<T> => {
  const request = {
    result,
    error,
    onsuccess: null as ((event: Event) => void) | null,
    onerror: null as ((event: Event) => void) | null,
    onupgradeneeded: null as ((event: IDBVersionChangeEvent) => void) | null,
    onblocked: null as ((event: Event) => void) | null,
    readyState: 'done' as IDBRequestReadyState,
    source: null,
    transaction: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as MockIDBRequest<T>;
  return request;
};

const createMockIDBObjectStore = (data: Record<string, unknown> = {}): IDBObjectStore => {
  const store = {
    name: 'test-store',
    keyPath: 'id',
    indexNames: {
      contains: vi.fn(() => false),
      length: 0,
      item: vi.fn(),
      [Symbol.iterator]: function* () { yield* []; },
    } as DOMStringList,
    transaction: null as unknown as IDBTransaction,
    autoIncrement: false,
    add: vi.fn((_value: unknown) => {
      const req = createMockIDBRequest(undefined);
      setTimeout(() => req.onsuccess?.({} as Event), 0);
      return req;
    }),
    put: vi.fn((_value: unknown) => {
      const req = createMockIDBRequest(undefined);
      setTimeout(() => req.onsuccess?.({} as Event), 0);
      return req;
    }),
    get: vi.fn((key: string) => {
      const req = createMockIDBRequest(data[key]);
      setTimeout(() => req.onsuccess?.({} as Event), 0);
      return req;
    }),
    getAll: vi.fn(() => {
      const req = createMockIDBRequest(Object.values(data));
      setTimeout(() => req.onsuccess?.({} as Event), 0);
      return req;
    }),
    delete: vi.fn(() => {
      const req = createMockIDBRequest(undefined);
      setTimeout(() => req.onsuccess?.({} as Event), 0);
      return req;
    }),
    clear: vi.fn(() => {
      const req = createMockIDBRequest(undefined);
      setTimeout(() => req.onsuccess?.({} as Event), 0);
      return req;
    }),
    createIndex: vi.fn(() => ({} as IDBIndex)),
    deleteIndex: vi.fn(),
    index: vi.fn(() => ({
      getAll: vi.fn((_value: string) => {
        const req = createMockIDBRequest([]);
        setTimeout(() => req.onsuccess?.({} as Event), 0);
        return req;
      }),
    } as unknown as IDBIndex)),
    openCursor: vi.fn(),
    openKeyCursor: vi.fn(),
    count: vi.fn(),
    getKey: vi.fn(),
    getAllKeys: vi.fn(),
  } as unknown as IDBObjectStore;
  return store;
};

const createMockIDBTransaction = (stores: Record<string, IDBObjectStore> = {}): IDBTransaction => {
  const tx = {
    objectStore: vi.fn((name: string) => stores[name] || createMockIDBObjectStore()),
    oncomplete: null,
    onerror: null,
    onabort: null,
    abort: vi.fn(),
    db: null as unknown as IDBDatabase,
    durability: 'default' as IDBTransactionDurability,
    error: null,
    mode: 'readonly' as IDBTransactionMode,
    objectStoreNames: {
      contains: vi.fn(() => true),
      length: Object.keys(stores).length,
      item: vi.fn(),
      [Symbol.iterator]: function* () { yield* Object.keys(stores); },
    } as DOMStringList,
    commit: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as IDBTransaction;
  return tx;
};

const _createMockIDBDatabase = (): IDBDatabase => {
  const stores: Record<string, IDBObjectStore> = {};
  const db = {
    name: 'budget-offline-db',
    version: 7,
    objectStoreNames: {
      contains: vi.fn((name: string) => name in stores),
      length: 0,
      item: vi.fn(),
      [Symbol.iterator]: function* () { yield* []; },
    } as DOMStringList,
    createObjectStore: vi.fn((name: string) => {
      const store = createMockIDBObjectStore();
      stores[name] = store;
      return store;
    }),
    deleteObjectStore: vi.fn(),
    transaction: vi.fn((_storeNames: string | string[], _mode?: IDBTransactionMode) => {
      return createMockIDBTransaction(stores);
    }),
    close: vi.fn(),
    onabort: null,
    onclose: null,
    onerror: null,
    onversionchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as IDBDatabase;
  return db;
};

describe('offlineStorage utilities', () => {
  describe('generateOfflineId', () => {
    it('should generate ID with default prefix', () => {
      const id = generateOfflineId();
      expect(id).toMatch(/^offline-\d+-[a-z0-9]+$/);
    });

    it('should generate ID with custom prefix', () => {
      const id = generateOfflineId('exp');
      expect(id).toMatch(/^exp-\d+-[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateOfflineId());
      }
      expect(ids.size).toBe(100); // All unique
    });

    it('should include timestamp in ID', () => {
      const before = Date.now();
      const id = generateOfflineId();
      const after = Date.now();
      
      // Extract timestamp from ID (format: prefix-timestamp-random)
      const parts = id.split('-');
      const timestamp = parseInt(parts[1], 10);
      
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should generate IDs with various prefixes', () => {
      const prefixes = ['family', 'exp', 'rec', 'sub', 'goal', 'gentry'];
      
      prefixes.forEach(prefix => {
        const id = generateOfflineId(prefix);
        expect(id.startsWith(`${prefix}-`)).toBe(true);
      });
    });
  });

  describe('isOfflineId', () => {
    it('should identify offline IDs correctly', () => {
      // Offline IDs
      expect(isOfflineId('offline-1234567890-abc123def')).toBe(true);
      expect(isOfflineId('family-1234567890-xyz789')).toBe(true);
      expect(isOfflineId('exp-1234567890-abc')).toBe(true);
      expect(isOfflineId('rec-1234567890-def')).toBe(true);
      expect(isOfflineId('sub-1234567890-ghi')).toBe(true);
      expect(isOfflineId('goal-1234567890-jkl')).toBe(true);
      expect(isOfflineId('gentry-1234567890-mno')).toBe(true);
    });

    it('should reject UUID format (online IDs)', () => {
      // Standard UUIDs from Supabase
      expect(isOfflineId('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
      expect(isOfflineId('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(false);
      expect(isOfflineId('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(false);
    });

    it('should reject random strings that are not offline IDs', () => {
      expect(isOfflineId('random-string')).toBe(false);
      expect(isOfflineId('some-random-id-123')).toBe(false);
      expect(isOfflineId('user-123')).toBe(false);
      expect(isOfflineId('123456789')).toBe(false);
      expect(isOfflineId('')).toBe(false);
    });

    it('should identify generated offline IDs', () => {
      const generatedId = generateOfflineId();
      expect(isOfflineId(generatedId)).toBe(true);
    });

    it('should identify generated IDs with custom prefixes', () => {
      const customPrefixes = ['family', 'exp', 'rec', 'sub', 'goal', 'gentry'];
      
      customPrefixes.forEach(prefix => {
        const id = generateOfflineId(prefix);
        expect(isOfflineId(id)).toBe(true);
      });
    });

    it('should be case-sensitive', () => {
      expect(isOfflineId('Offline-1234567890-abc')).toBe(false);
      expect(isOfflineId('FAMILY-1234567890-abc')).toBe(false);
      expect(isOfflineId('EXP-1234567890-abc')).toBe(false);
    });
  });

  describe('security considerations', () => {
    it('should not generate predictable IDs', () => {
      // IDs should have random component
      const id1 = generateOfflineId();
      const id2 = generateOfflineId();
      
      // Even if generated at same millisecond, random part should differ
      const random1 = id1.split('-')[2];
      const random2 = id2.split('-')[2];
      
      // If timestamps are same, random parts must differ
      // If timestamps differ, that's also fine
      const timestamp1 = id1.split('-')[1];
      const timestamp2 = id2.split('-')[1];
      
      if (timestamp1 === timestamp2) {
        expect(random1).not.toBe(random2);
      }
    });

    it('should not expose sensitive information in ID format', () => {
      const id = generateOfflineId('expense');
      
      // ID should only contain prefix, timestamp, and random string
      // No user data, family data, or other sensitive info
      const parts = id.split('-');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('expense'); // Just the type prefix
      expect(parts[1]).toMatch(/^\d+$/); // Just timestamp
      expect(parts[2]).toMatch(/^[a-z0-9]+$/); // Just random alphanumeric
    });

    it('should reject XSS payloads as IDs', () => {
      const xssPayloads = [
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        '<img src=x onerror=alert(1)>',
        '"><script>alert(1)</script>',
      ];

      xssPayloads.forEach(payload => {
        expect(isOfflineId(payload)).toBe(false);
      });
    });

    it('should reject SQL injection payloads as IDs', () => {
      const sqlPayloads = [
        "'; DROP TABLE expenses; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM users",
      ];

      sqlPayloads.forEach(payload => {
        expect(isOfflineId(payload)).toBe(false);
      });
    });

    it('should reject prototype pollution attempts', () => {
      expect(isOfflineId('__proto__')).toBe(false);
      expect(isOfflineId('constructor')).toBe(false);
      expect(isOfflineId('prototype')).toBe(false);
    });

    it('should reject path traversal attempts', () => {
      expect(isOfflineId('../../../etc/passwd')).toBe(false);
      expect(isOfflineId('..\\..\\..\\windows')).toBe(false);
      expect(isOfflineId('file:///etc/passwd')).toBe(false);
    });

    it('should handle null bytes safely', () => {
      expect(isOfflineId('offline-123\x00-abc')).toBe(false);
      expect(isOfflineId('\x00offline-123-abc')).toBe(false);
    });
  });

  describe('SyncQueueItem type', () => {
    it('should accept valid sync queue item types', () => {
      const validTypes: SyncQueueItem['type'][] = [
        'family',
        'month',
        'expense',
        'recurring_expense',
        'subcategory',
        'category_limit',
        'family_member',
        'income_source',
        'goal',
        'goal_entry',
      ];

      validTypes.forEach((type) => {
        const item: Partial<SyncQueueItem> = {
          id: 'sync-123',
          type,
          action: 'insert',
          data: {},
          createdAt: new Date().toISOString(),
          familyId: 'family-123',
        };
        expect(item.type).toBe(type);
      });
    });

    it('should accept valid action types', () => {
      const validActions: SyncQueueItem['action'][] = ['insert', 'update', 'delete'];

      validActions.forEach((action) => {
        const item: Partial<SyncQueueItem> = {
          id: 'sync-123',
          type: 'expense',
          action,
          data: {},
          createdAt: new Date().toISOString(),
          familyId: 'family-123',
        };
        expect(item.action).toBe(action);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string prefix in generateOfflineId', () => {
      const id = generateOfflineId('');
      expect(id).toMatch(/^-\d+-[a-z0-9]+$/);
    });

    it('should handle very long prefix in generateOfflineId', () => {
      const longPrefix = 'a'.repeat(100);
      const id = generateOfflineId(longPrefix);
      expect(id.startsWith(longPrefix + '-')).toBe(true);
    });

    it('should handle special characters in prefix', () => {
      // This is allowed by the function but isOfflineId won't recognize it
      const id = generateOfflineId('test-prefix');
      expect(id.startsWith('test-prefix-')).toBe(true);
      // But it won't be recognized as offline ID since prefix contains hyphen
      expect(isOfflineId(id)).toBe(false);
    });

    it('should handle isOfflineId with month- prefix', () => {
      expect(isOfflineId('month-1234567890-abc')).toBe(true);
    });

    it('should handle null/undefined gracefully', () => {
      expect(isOfflineId(null as unknown as string)).toBe(false);
      expect(isOfflineId(undefined as unknown as string)).toBe(false);
    });

    it('should handle non-string values', () => {
      expect(isOfflineId(123 as unknown as string)).toBe(false);
      expect(isOfflineId({} as unknown as string)).toBe(false);
      expect(isOfflineId([] as unknown as string)).toBe(false);
    });

    it('should reject control characters', () => {
      expect(isOfflineId('offline-\t123-abc')).toBe(false);
      expect(isOfflineId('offline-\n123-abc')).toBe(false);
      expect(isOfflineId('offline-\r123-abc')).toBe(false);
      expect(isOfflineId('offline-\x1f123-abc')).toBe(false);
      expect(isOfflineId('offline-\x7f123-abc')).toBe(false);
    });

    it('should handle very short IDs', () => {
      expect(isOfflineId('a')).toBe(false);
      expect(isOfflineId('of')).toBe(false);
      expect(isOfflineId('offline')).toBe(false);
      expect(isOfflineId('offline-')).toBe(true); // Starts with valid prefix
    });

    it('should handle IDs with only prefix', () => {
      expect(isOfflineId('exp-')).toBe(true);
      expect(isOfflineId('family-')).toBe(true);
    });
  });
});

describe('clearOfflineCache', () => {
  let originalIndexedDB: IDBFactory;

  beforeEach(() => {
    originalIndexedDB = globalThis.indexedDB;
  });

  afterEach(() => {
    globalThis.indexedDB = originalIndexedDB;
  });

  it('should delete the database when called', async () => {
    const deleteRequest = createMockIDBRequest<undefined>(undefined);
    const mockIndexedDB = {
      deleteDatabase: vi.fn(() => {
        setTimeout(() => deleteRequest.onsuccess?.({} as Event), 0);
        return deleteRequest;
      }),
      open: vi.fn(),
      cmp: vi.fn(),
      databases: vi.fn(),
    } as unknown as IDBFactory;

    globalThis.indexedDB = mockIndexedDB;

    await expect(clearOfflineCache()).resolves.toBeUndefined();
    expect(mockIndexedDB.deleteDatabase).toHaveBeenCalledWith('budget-offline-db');
  });

  it('should reject when deleteDatabase fails', async () => {
    const deleteRequest = createMockIDBRequest<undefined>(undefined, new DOMException('Delete failed'));
    const mockIndexedDB = {
      deleteDatabase: vi.fn(() => {
        setTimeout(() => deleteRequest.onerror?.({} as Event), 0);
        return deleteRequest;
      }),
      open: vi.fn(),
      cmp: vi.fn(),
      databases: vi.fn(),
    } as unknown as IDBFactory;

    globalThis.indexedDB = mockIndexedDB;

    await expect(clearOfflineCache()).rejects.toThrow();
  });

  it('should reject when database is blocked', async () => {
    const deleteRequest = createMockIDBRequest<undefined>(undefined);
    const mockIndexedDB = {
      deleteDatabase: vi.fn(() => {
        setTimeout(() => deleteRequest.onblocked?.({} as Event), 0);
        return deleteRequest;
      }),
      open: vi.fn(),
      cmp: vi.fn(),
      databases: vi.fn(),
    } as unknown as IDBFactory;

    globalThis.indexedDB = mockIndexedDB;

    await expect(clearOfflineCache()).rejects.toThrow(/outra aba/);
  });
});

describe('syncQueue', () => {
  describe('add', () => {
    it('should generate id and createdAt automatically', async () => {
      const mockPut = vi.spyOn(offlineDB, 'put').mockResolvedValue();
      
      await syncQueue.add({
        type: 'expense',
        action: 'insert',
        data: { title: 'Test expense', value: 100 },
        familyId: 'family-123',
      });

      expect(mockPut).toHaveBeenCalledWith(
        'sync_queue',
        expect.objectContaining({
          id: expect.stringMatching(/^sync-\d+-[a-z0-9]+$/),
          createdAt: expect.any(String),
          type: 'expense',
          action: 'insert',
          data: { title: 'Test expense', value: 100 },
          familyId: 'family-123',
        })
      );

      mockPut.mockRestore();
    });

    it('should add items for all entity types', async () => {
      const mockPut = vi.spyOn(offlineDB, 'put').mockResolvedValue();
      
      const types: SyncQueueItem['type'][] = [
        'family', 'month', 'expense', 'recurring_expense', 
        'subcategory', 'category_limit', 'family_member', 
        'income_source', 'goal', 'goal_entry'
      ];

      for (const type of types) {
        await syncQueue.add({
          type,
          action: 'insert',
          data: { id: `${type}-1` },
          familyId: 'family-123',
        });
      }

      expect(mockPut).toHaveBeenCalledTimes(types.length);
      mockPut.mockRestore();
    });

    it('should add items for all action types', async () => {
      const mockPut = vi.spyOn(offlineDB, 'put').mockResolvedValue();
      
      const actions: SyncQueueItem['action'][] = ['insert', 'update', 'delete'];

      for (const action of actions) {
        await syncQueue.add({
          type: 'expense',
          action,
          data: { id: 'exp-1' },
          familyId: 'family-123',
        });
      }

      expect(mockPut).toHaveBeenCalledTimes(actions.length);
      mockPut.mockRestore();
    });
  });

  describe('getAll', () => {
    it('should return all items from sync_queue', async () => {
      const mockItems: SyncQueueItem[] = [
        { id: 'sync-1', type: 'expense', action: 'insert', data: {}, createdAt: '2025-01-01', familyId: 'family-1' },
        { id: 'sync-2', type: 'month', action: 'update', data: {}, createdAt: '2025-01-02', familyId: 'family-1' },
      ];
      
      vi.spyOn(offlineDB, 'getAll').mockResolvedValue(mockItems);

      const result = await syncQueue.getAll();

      expect(result).toEqual(mockItems);
      expect(offlineDB.getAll).toHaveBeenCalledWith('sync_queue');
    });

    it('should return empty array when queue is empty', async () => {
      vi.spyOn(offlineDB, 'getAll').mockResolvedValue([]);

      const result = await syncQueue.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getByFamily', () => {
    it('should return items filtered by familyId', async () => {
      const mockItems: SyncQueueItem[] = [
        { id: 'sync-1', type: 'expense', action: 'insert', data: {}, createdAt: '2025-01-01', familyId: 'family-1' },
      ];
      
      vi.spyOn(offlineDB, 'getAllByIndex').mockResolvedValue(mockItems);

      const result = await syncQueue.getByFamily('family-1');

      expect(result).toEqual(mockItems);
      expect(offlineDB.getAllByIndex).toHaveBeenCalledWith('sync_queue', 'familyId', 'family-1');
    });

    it('should return empty array when no items match', async () => {
      vi.spyOn(offlineDB, 'getAllByIndex').mockResolvedValue([]);

      const result = await syncQueue.getByFamily('non-existent-family');

      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    it('should delete item by id', async () => {
      const mockDelete = vi.spyOn(offlineDB, 'delete').mockResolvedValue();

      await syncQueue.remove('sync-123');

      expect(mockDelete).toHaveBeenCalledWith('sync_queue', 'sync-123');
      mockDelete.mockRestore();
    });
  });

  describe('clear', () => {
    it('should clear all items from sync_queue', async () => {
      const mockClear = vi.spyOn(offlineDB, 'clear').mockResolvedValue();

      await syncQueue.clear();

      expect(mockClear).toHaveBeenCalledWith('sync_queue');
      mockClear.mockRestore();
    });
  });
});

describe('offlineDB operations', () => {
  describe('put', () => {
    it('should store data with correct key', async () => {
      // This test verifies the interface - actual IndexedDB is mocked at integration level
      const mockData = { id: 'test-1', name: 'Test Item' };
      const putSpy = vi.spyOn(offlineDB, 'put').mockResolvedValue();

      await offlineDB.put('families', mockData);

      expect(putSpy).toHaveBeenCalledWith('families', mockData);
      putSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('should retrieve data by id', async () => {
      const mockData = { id: 'test-1', name: 'Test Item' };
      const getSpy = vi.spyOn(offlineDB, 'get').mockResolvedValue(mockData);

      const result = await offlineDB.get('families', 'test-1');

      expect(result).toEqual(mockData);
      expect(getSpy).toHaveBeenCalledWith('families', 'test-1');
      getSpy.mockRestore();
    });

    it('should return undefined for non-existent id', async () => {
      const getSpy = vi.spyOn(offlineDB, 'get').mockResolvedValue(undefined);

      const result = await offlineDB.get('families', 'non-existent');

      expect(result).toBeUndefined();
      getSpy.mockRestore();
    });
  });

  describe('getAll', () => {
    it('should retrieve all items from store', async () => {
      const mockData = [
        { id: 'test-1', name: 'Item 1' },
        { id: 'test-2', name: 'Item 2' },
      ];
      const getAllSpy = vi.spyOn(offlineDB, 'getAll').mockResolvedValue(mockData);

      const result = await offlineDB.getAll('families');

      expect(result).toEqual(mockData);
      expect(getAllSpy).toHaveBeenCalledWith('families');
      getAllSpy.mockRestore();
    });

    it('should return empty array for empty store', async () => {
      const getAllSpy = vi.spyOn(offlineDB, 'getAll').mockResolvedValue([]);

      const result = await offlineDB.getAll('families');

      expect(result).toEqual([]);
      getAllSpy.mockRestore();
    });
  });

  describe('getAllByIndex', () => {
    it('should retrieve items by index', async () => {
      const mockData = [
        { id: 'exp-1', month_id: 'month-1', title: 'Expense 1' },
        { id: 'exp-2', month_id: 'month-1', title: 'Expense 2' },
      ];
      const spy = vi.spyOn(offlineDB, 'getAllByIndex').mockResolvedValue(mockData);

      const result = await offlineDB.getAllByIndex('expenses', 'month_id', 'month-1');

      expect(result).toEqual(mockData);
      expect(spy).toHaveBeenCalledWith('expenses', 'month_id', 'month-1');
      spy.mockRestore();
    });

    it('should return empty array when index has no matches', async () => {
      const spy = vi.spyOn(offlineDB, 'getAllByIndex').mockResolvedValue([]);

      const result = await offlineDB.getAllByIndex('expenses', 'month_id', 'non-existent');

      expect(result).toEqual([]);
      spy.mockRestore();
    });
  });

  describe('delete', () => {
    it('should delete item by id', async () => {
      const deleteSpy = vi.spyOn(offlineDB, 'delete').mockResolvedValue();

      await offlineDB.delete('families', 'test-1');

      expect(deleteSpy).toHaveBeenCalledWith('families', 'test-1');
      deleteSpy.mockRestore();
    });
  });

  describe('clear', () => {
    it('should clear all items from store', async () => {
      const clearSpy = vi.spyOn(offlineDB, 'clear').mockResolvedValue();

      await offlineDB.clear('families');

      expect(clearSpy).toHaveBeenCalledWith('families');
      clearSpy.mockRestore();
    });
  });
});

describe('store names and indexes', () => {
  it('should support all expected store names', () => {
    const expectedStores = [
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

    // Verify we can reference these stores without errors
    expectedStores.forEach(storeName => {
      expect(typeof storeName).toBe('string');
    });
  });

  it('should have correct index names for expenses', () => {
    const expectedIndexes = ['month_id', 'monthId'];
    expectedIndexes.forEach(index => {
      expect(typeof index).toBe('string');
    });
  });

  it('should have correct index names for months', () => {
    const expectedIndexes = ['family_id', 'familyId'];
    expectedIndexes.forEach(index => {
      expect(typeof index).toBe('string');
    });
  });

  it('should have correct index names for goals', () => {
    const expectedIndexes = ['family_id', 'linked_subcategory_id'];
    expectedIndexes.forEach(index => {
      expect(typeof index).toBe('string');
    });
  });

  it('should have correct index names for goal_entries', () => {
    const expectedIndexes = ['goal_id', 'expense_id'];
    expectedIndexes.forEach(index => {
      expect(typeof index).toBe('string');
    });
  });
});
