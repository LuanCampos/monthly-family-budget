// src/test/mocks/context/makeMockFamilyContext.ts
import { vi } from 'vitest';
export function makeMockFamilyContext(overrides = {}) {
  return {
    currentFamily: {
      id: 'family-1',
      name: 'Test Family',
      isOffline: false,
    },
    families: [
      {
        id: 'family-1',
        name: 'Test Family',
        isOffline: false,
      },
    ],
    selectFamily: vi.fn(),
    createFamily: vi.fn().mockResolvedValue({ error: null }),
    members: [
      { id: 'member-1', userId: 'user-1', role: 'owner', email: 'test@example.com', displayName: 'Test User' },
    ],
    pendingInvitations: [],
    myPendingInvitations: [],
    userRole: 'owner',
    inviteMember: vi.fn().mockResolvedValue({ error: null }),
    cancelInvitation: vi.fn().mockResolvedValue({ error: null }),
    acceptInvitation: vi.fn().mockResolvedValue({ error: null }),
    rejectInvitation: vi.fn().mockResolvedValue({ error: null }),
    updateMemberRole: vi.fn().mockResolvedValue({ error: null }),
    removeMember: vi.fn().mockResolvedValue({ error: null }),
    updateFamilyName: vi.fn().mockResolvedValue({ error: null }),
    deleteFamily: vi.fn().mockResolvedValue({ error: null }),
    leaveFamily: vi.fn().mockResolvedValue({ error: null }),
    refreshFamilies: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
