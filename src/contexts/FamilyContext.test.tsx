import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { FamilyProvider, useFamily } from './FamilyContext';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123', email: 'test@example.com' },
    loading: false,
  })),
}));

vi.mock('@/lib/services/familyService', () => ({
  getFamiliesByUser: vi.fn(() => Promise.resolve({ data: [], error: null })),
  getMembersByFamily: vi.fn(() => Promise.resolve({ data: [], error: null })),
  getInvitationsByEmail: vi.fn(() => Promise.resolve({ data: [], error: null })),
  getInvitationsByEmailSimple: vi.fn(() => Promise.resolve({ data: [], error: null })),
  getInvitationsByFamily: vi.fn(() => Promise.resolve({ data: [], error: null })),
  insertFamily: vi.fn(),
  insertFamilyMember: vi.fn(),
  updateFamilyName: vi.fn(),
  deleteFamily: vi.fn(),
  deleteMemberByFamilyAndUser: vi.fn(),
  insertInvitation: vi.fn(),
  updateInvitationStatus: vi.fn(),
  deleteInvitation: vi.fn(),
  updateMemberRole: vi.fn(),
  deleteMember: vi.fn(),
  getFamilyNamesByIds: vi.fn(() => Promise.resolve({ data: [], error: null })),
}));

vi.mock('@/lib/services/userService', () => ({
  getCurrentFamilyPreference: vi.fn(() => Promise.resolve({ data: null, error: null })),
  updateCurrentFamily: vi.fn(() => Promise.resolve({ error: null })),
  getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'user-123', email: 'test@example.com' } } } })),
}));

vi.mock('@/lib/adapters/offlineAdapter', () => ({
  offlineAdapter: {
    isOfflineId: vi.fn((id: string) => id?.startsWith('offline-')),
    generateOfflineId: vi.fn((prefix: string) => `offline-${prefix}-123`),
    getAll: vi.fn(() => Promise.resolve([])),
    getAllByIndex: vi.fn(() => Promise.resolve([])),
    get: vi.fn(() => Promise.resolve(null)),
    put: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
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

// Import mocked modules
import { useAuth } from '@/contexts/AuthContext';
import * as familyService from '@/lib/services/familyService';
import { offlineAdapter } from '@/lib/adapters/offlineAdapter';

describe('FamilyContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FamilyProvider>{children}</FamilyProvider>
  );

  describe('useFamily hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useFamily());
      }).toThrow('useFamily must be used within a FamilyProvider');

      consoleSpy.mockRestore();
    });

    it('should provide initial state', async () => {
      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.families).toEqual([]);
      expect(result.current.currentFamily).toBeNull();
      expect(result.current.currentFamilyId).toBeNull();
      expect(result.current.members).toEqual([]);
    });
  });

  describe('createOfflineFamily', () => {
    it('should create an offline family', async () => {
      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.createOfflineFamily('Test Family');
        expect(response.error).toBeNull();
        expect(response.family).toBeDefined();
        expect(response.family?.name).toBe('Test Family');
        expect(response.family?.isOffline).toBe(true);
      });

      expect(offlineAdapter.put).toHaveBeenCalledWith(
        'families',
        expect.objectContaining({ name: 'Test Family', isOffline: true })
      );
    });

    it('should create offline family even without user', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.createOfflineFamily('Offline Family');
        expect(response.error).toBeNull();
        expect(response.family?.isOffline).toBe(true);
      });
    });
  });

  describe('createFamily', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        loading: false,
      } as ReturnType<typeof useAuth>);
    });

    it('should create cloud family when online and authenticated', async () => {
      const mockFamily = { id: 'cloud-family-123', name: 'Cloud Family', created_by: 'user-123', created_at: new Date().toISOString() };
      vi.mocked(familyService.insertFamily).mockResolvedValue({ data: mockFamily, error: null });
      vi.mocked(familyService.insertFamilyMember).mockResolvedValue({ data: {}, error: null });
      
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.createFamily('Cloud Family');
        expect(response.error).toBeNull();
      });

      expect(familyService.insertFamily).toHaveBeenCalledWith('Cloud Family', 'user-123');
    });

    it('should fallback to offline family when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.createFamily('Offline Family');
        expect(response.error).toBeNull();
        expect(response.family?.isOffline).toBe(true);
      });
    });
  });

  describe('updateFamilyName', () => {
    it('should update offline family name', async () => {
      const offlineFamily = { id: 'offline-family-123', name: 'Old Name', isOffline: true };
      vi.mocked(offlineAdapter.get).mockResolvedValue(offlineFamily);

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.updateFamilyName('offline-family-123', 'New Name');
        expect(response.error).toBeNull();
      });

      expect(offlineAdapter.put).toHaveBeenCalledWith(
        'families',
        expect.objectContaining({ name: 'New Name' })
      );
    });

    it('should update cloud family name', async () => {
      vi.mocked(familyService.updateFamilyName).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.updateFamilyName('cloud-family-123', 'New Name');
        expect(response.error).toBeNull();
      });

      expect(familyService.updateFamilyName).toHaveBeenCalledWith('cloud-family-123', 'New Name');
    });
  });

  describe('deleteFamily', () => {
    it('should delete offline family and related data', async () => {
      vi.mocked(offlineAdapter.getAllByIndex).mockResolvedValue([]);

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.deleteFamily('offline-family-123');
        expect(response.error).toBeNull();
      });

      expect(offlineAdapter.delete).toHaveBeenCalledWith('families', 'offline-family-123');
    });

    it('should delete cloud family', async () => {
      vi.mocked(familyService.deleteFamily).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.deleteFamily('cloud-family-123');
        expect(response.error).toBeNull();
      });

      expect(familyService.deleteFamily).toHaveBeenCalledWith('cloud-family-123');
    });
  });

  describe('leaveFamily', () => {
    it('should return error when not authenticated', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.leaveFamily('family-123');
        expect(response.error).toBeInstanceOf(Error);
        expect(response.error?.message).toBe('Not authenticated');
      });
    });

    it('should delete offline family when leaving', async () => {
      // Restore authenticated user
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        loading: false,
      } as ReturnType<typeof useAuth>);
      vi.mocked(offlineAdapter.getAllByIndex).mockResolvedValue([]);

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.leaveFamily('offline-family-123');
        expect(response.error).toBeNull();
      });

      expect(offlineAdapter.delete).toHaveBeenCalledWith('families', 'offline-family-123');
    });
  });

  describe('inviteMember', () => {
    it('should return error when not authenticated', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.inviteMember('member@example.com');
        expect(response.error).toBeInstanceOf(Error);
        expect(response.error?.message).toContain('Not authenticated');
      });
    });
  });

  describe('userRole', () => {
    it('should return null when no current family', async () => {
      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.userRole).toBeNull();
    });
  });

  describe('isCurrentFamilyOffline', () => {
    it('should return false when no current family', async () => {
      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isCurrentFamilyOffline).toBe(false);
    });
  });
});
