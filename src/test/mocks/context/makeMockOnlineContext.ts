// src/test/mocks/context/makeMockOnlineContext.ts
import { vi } from 'vitest';
export function makeMockOnlineContext(overrides = {}) {
  return {
    syncFamily: vi.fn().mockResolvedValue({ newFamilyId: null, error: null }),
    isSyncing: false,
    syncProgress: null,
    isOnline: true,
    ...overrides,
  };
}
