// Offline storage using IndexedDB for robust local persistence
const DB_NAME = 'budget-offline-db';
const DB_VERSION = 2;

export interface OfflineFamily {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  isOffline: true;
  syncedAt?: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'family' | 'month' | 'expense' | 'recurring_expense' | 'subcategory' | 'category_goal' | 'family_member';
  action: 'insert' | 'update' | 'delete';
  data: any;
  createdAt: string;
  familyId: string;
}

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    // If an upgrade is blocked by another open tab, avoid hanging forever.
    request.onblocked = () => {
      reject(new Error('Banco local bloqueado por outra aba/janela. Feche outras abas e recarregue.'));
    };

    request.onsuccess = () => {
      db = request.result;

      // If another tab triggers an upgrade, close this connection cleanly.
      db.onversionchange = () => {
        try {
          db?.close();
        } finally {
          db = null;
        }
      };

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      const tx = (event.target as IDBOpenDBRequest).transaction;

      const ensureStore = (
        storeName: string,
        options: IDBObjectStoreParameters,
        ensureIndexes?: (store: IDBObjectStore) => void
      ) => {
        let store: IDBObjectStore;

        if (!database.objectStoreNames.contains(storeName)) {
          store = database.createObjectStore(storeName, options);
        } else {
          // Existing store: we can only access it via the upgrade transaction.
          store = (tx as IDBTransaction).objectStore(storeName);
        }

        ensureIndexes?.(store);
      };

      // Families store
      ensureStore('families', { keyPath: 'id' });

      // Months store
      ensureStore('months', { keyPath: 'id' }, (store) => {
        if (!store.indexNames.contains('family_id')) {
          store.createIndex('family_id', 'family_id', { unique: false });
        }
        // Back-compat (older builds)
        if (!store.indexNames.contains('familyId')) {
          store.createIndex('familyId', 'familyId', { unique: false });
        }
      });

      // Expenses store
      ensureStore('expenses', { keyPath: 'id' }, (store) => {
        if (!store.indexNames.contains('month_id')) {
          store.createIndex('month_id', 'month_id', { unique: false });
        }
        // Back-compat (older builds)
        if (!store.indexNames.contains('monthId')) {
          store.createIndex('monthId', 'monthId', { unique: false });
        }
      });

      // Recurring expenses store
      ensureStore('recurring_expenses', { keyPath: 'id' }, (store) => {
        if (!store.indexNames.contains('family_id')) {
          store.createIndex('family_id', 'family_id', { unique: false });
        }
        // Back-compat (older builds)
        if (!store.indexNames.contains('familyId')) {
          store.createIndex('familyId', 'familyId', { unique: false });
        }
      });

      // Subcategories store
      ensureStore('subcategories', { keyPath: 'id' }, (store) => {
        if (!store.indexNames.contains('family_id')) {
          store.createIndex('family_id', 'family_id', { unique: false });
        }
        // Back-compat (older builds)
        if (!store.indexNames.contains('familyId')) {
          store.createIndex('familyId', 'familyId', { unique: false });
        }
      });

      // Category goals store
      ensureStore('category_goals', { keyPath: 'id' }, (store) => {
        if (!store.indexNames.contains('family_id')) {
          store.createIndex('family_id', 'family_id', { unique: false });
        }
        // Back-compat (older builds)
        if (!store.indexNames.contains('familyId')) {
          store.createIndex('familyId', 'familyId', { unique: false });
        }
      });

      // Sync queue store
      ensureStore('sync_queue', { keyPath: 'id' }, (store) => {
        if (!store.indexNames.contains('familyId')) {
          store.createIndex('familyId', 'familyId', { unique: false });
        }
        // Back-compat (older builds)
        if (!store.indexNames.contains('family_id')) {
          store.createIndex('family_id', 'family_id', { unique: false });
        }
      });

      // User preferences store
      ensureStore('user_preferences', { keyPath: 'user_id' });
    };
  });
};

// Generic CRUD operations
export const offlineDB = {
  async getAll<T>(storeName: string): Promise<T[]> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllByIndex<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async put<T>(storeName: string, data: T): Promise<void> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName: string, id: string): Promise<void> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clear(storeName: string): Promise<void> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};

// Sync queue operations
export const syncQueue = {
  async add(item: Omit<SyncQueueItem, 'id' | 'createdAt'>): Promise<void> {
    const queueItem: SyncQueueItem = {
      ...item,
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    await offlineDB.put('sync_queue', queueItem);
  },

  async getAll(): Promise<SyncQueueItem[]> {
    return offlineDB.getAll<SyncQueueItem>('sync_queue');
  },

  async getByFamily(familyId: string): Promise<SyncQueueItem[]> {
    return offlineDB.getAllByIndex<SyncQueueItem>('sync_queue', 'familyId', familyId);
  },

  async remove(id: string): Promise<void> {
    await offlineDB.delete('sync_queue', id);
  },

  async clear(): Promise<void> {
    await offlineDB.clear('sync_queue');
  },
};

// Generate offline IDs
export const generateOfflineId = (prefix: string = 'offline'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Check if an ID is from offline (generated locally, not a UUID)
export const isOfflineId = (id: string): boolean => {
  // Offline IDs are generated with prefixes like 'offline-', 'family-', 'exp-', 'rec-', 'sub-'
  // followed by timestamp and random string. UUIDs have a different format.
  const offlinePrefixes = ['offline-', 'family-', 'exp-', 'rec-', 'sub-'];
  return offlinePrefixes.some(prefix => id.startsWith(prefix));
};
