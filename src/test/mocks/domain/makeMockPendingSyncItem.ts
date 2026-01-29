import type { PendingSyncItem } from '@/types/budget';

export function makeMockPendingSyncItem(overrides: Partial<PendingSyncItem> = {}): PendingSyncItem {
  return {
    id: 'sync-1',
    action: 'insert',
    type: 'expense',
    familyId: 'family-1',
    data: {},
    createdAt: '2025-01-01',
    ...overrides,
  };
}
