import type { SyncQueueItem } from '@/lib/storage/offlineStorage';

export function makeMockPendingSyncItem(overrides: Partial<SyncQueueItem> = {}): SyncQueueItem {
  return {
    id: 'sync-1',
    action: 'insert',
    type: 'expense',
    familyId: 'family-1',
    data: {},
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}
