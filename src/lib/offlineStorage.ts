// Offline storage using IndexedDB for robust local persistence
const DB_NAME = 'budget-offline-db';
const DB_VERSION = 1;

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
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Families store
      if (!database.objectStoreNames.contains('families')) {
        database.createObjectStore('families', { keyPath: 'id' });
      }

      // Months store
      if (!database.objectStoreNames.contains('months')) {
        const monthStore = database.createObjectStore('months', { keyPath: 'id' });
        monthStore.createIndex('family_id', 'family_id', { unique: false });
      }

      // Expenses store
      if (!database.objectStoreNames.contains('expenses')) {
        const expenseStore = database.createObjectStore('expenses', { keyPath: 'id' });
        expenseStore.createIndex('month_id', 'month_id', { unique: false });
      }

      // Recurring expenses store
      if (!database.objectStoreNames.contains('recurring_expenses')) {
        const recurringStore = database.createObjectStore('recurring_expenses', { keyPath: 'id' });
        recurringStore.createIndex('family_id', 'family_id', { unique: false });
      }

      // Subcategories store
      if (!database.objectStoreNames.contains('subcategories')) {
        const subStore = database.createObjectStore('subcategories', { keyPath: 'id' });
        subStore.createIndex('family_id', 'family_id', { unique: false });
      }

      // Category goals store
      if (!database.objectStoreNames.contains('category_goals')) {
        const goalStore = database.createObjectStore('category_goals', { keyPath: 'id' });
        goalStore.createIndex('family_id', 'family_id', { unique: false });
      }

      // Sync queue store
      if (!database.objectStoreNames.contains('sync_queue')) {
        const syncStore = database.createObjectStore('sync_queue', { keyPath: 'id' });
        syncStore.createIndex('familyId', 'familyId', { unique: false });
      }

      // User preferences store
      if (!database.objectStoreNames.contains('user_preferences')) {
        database.createObjectStore('user_preferences', { keyPath: 'user_id' });
      }
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
