import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { OnlineProvider, useOnline } from './OnlineContext';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    session: { user: { id: 'user-123', email: 'test@example.com' } },
  })),
}));

vi.mock('@/lib/adapters/offlineAdapter', () => ({
  offlineAdapter: {
    isOfflineId: vi.fn((id: string) => id?.startsWith('offline-')),
    sync: {
      getAll: vi.fn(() => Promise.resolve([])),
      getByFamily: vi.fn(() => Promise.resolve([])),
      remove: vi.fn(() => Promise.resolve()),
    },
    get: vi.fn(() => Promise.resolve(null)),
    getAll: vi.fn(() => Promise.resolve([])),
    getAllByIndex: vi.fn(() => Promise.resolve([])),
    delete: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@/lib/services/familyService', () => ({
  insertFamily: vi.fn(),
  insertFamilyMember: vi.fn(),
  insertSubcategoryForSync: vi.fn(),
  insertRecurringForSync: vi.fn(),
  insertMonthWithId: vi.fn(),
  insertExpenseForSync: vi.fn(),
  insertIncomeSourceForSync: vi.fn(),
  insertCategoryLimitForSync: vi.fn(),
  deleteByIdFromTable: vi.fn(),
  deleteMembersByFamily: vi.fn(),
  deleteFamily: vi.fn(),
  insertToTable: vi.fn(),
  updateInTable: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';
import { offlineAdapter } from '@/lib/adapters/offlineAdapter';

describe('OnlineContext', () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    vi.clearAllMocks();
    originalOnLine = navigator.onLine;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: originalOnLine, writable: true });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <OnlineProvider>{children}</OnlineProvider>
  );

  describe('useOnline hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useOnline());
      }).toThrow('useOnline must be used within an OnlineProvider');

      consoleSpy.mockRestore();
    });

    it('should provide initial state', async () => {
      const { result } = renderHook(() => useOnline(), { wrapper });

      await waitFor(() => {
        expect(result.current.syncProgress).toBeNull();
      });

      expect(typeof result.current.isOnline).toBe('boolean');
      expect(typeof result.current.isSyncing).toBe('boolean');
      expect(typeof result.current.pendingSyncCount).toBe('number');
    });
  });

  describe('online/offline events', () => {
    it('should update state when going offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

      const { result } = renderHook(() => useOnline(), { wrapper });

      // Simulate going offline
      await act(async () => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);
      expect(toast.warning).toHaveBeenCalled();
    });
  });

  describe('pendingSyncCount', () => {
    it('should count pending sync items', async () => {
      vi.mocked(offlineAdapter.sync.getAll).mockResolvedValue([
        { id: '1', action: 'insert', type: 'expense', familyId: 'family-1', data: {} },
        { id: '2', action: 'update', type: 'expense', familyId: 'family-1', data: {} },
      ]);

      const { result } = renderHook(() => useOnline(), { wrapper });

      await waitFor(() => {
        expect(result.current.pendingSyncCount).toBe(2);
      });
    });
  });

  describe('syncNow', () => {
    it('should not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const { result } = renderHook(() => useOnline(), { wrapper });

      await act(async () => {
        await result.current.syncNow();
      });

      expect(result.current.isSyncing).toBe(false);
    });
  });

  describe('syncFamily', () => {
    it('should return error when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const { result } = renderHook(() => useOnline(), { wrapper });

      await act(async () => {
        const response = await result.current.syncFamily('offline-family-123');
        expect(response.error).toBeInstanceOf(Error);
        expect(response.error?.message).toContain('offline');
      });
    });
  });
});
