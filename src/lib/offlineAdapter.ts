import { offlineDB, syncQueue, generateOfflineId, isOfflineId } from './offlineStorage';

// Adapter layer to abstract the offline storage implementation. Use this when
// interacting with local persistence or the sync queue so the rest of the code
//base can be mocked or swapped later.

export const offlineAdapter = {
  getAll: <T,>(storeName: string) => offlineDB.getAll<T>(storeName),
  getAllByIndex: <T,>(storeName: string, indexName: string, value: string) => offlineDB.getAllByIndex<T>(storeName, indexName, value),
  get: <T,>(storeName: string, id: string) => offlineDB.get<T>(storeName, id),
  put: <T,>(storeName: string, data: T) => offlineDB.put<T>(storeName, data),
  delete: (storeName: string, id: string) => offlineDB.delete(storeName, id),
  clear: (storeName: string) => offlineDB.clear(storeName),
  sync: {
    add: (item: any) => syncQueue.add(item),
    getAll: () => syncQueue.getAll(),
    getByFamily: (familyId: string) => syncQueue.getByFamily(familyId),
    remove: (id: string) => syncQueue.remove(id),
    clear: () => syncQueue.clear(),
  },
  generateOfflineId,
  isOfflineId,
};

export type OfflineAdapter = typeof offlineAdapter;
