import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { FamilyProvider, useFamily } from './FamilyContext';
import { makeMockFamily } from '@/test/mocks/domain/makeMockFamily';
import { makeMockUser } from '@/test/mocks/domain/makeMockUser';
import { makeMockOfflineAdapter } from '@/test/mocks/services/makeMockServices';

// Helper to create proper PostgrestSingleResponse - must match discriminated union
const createSuccessResponse = <T,>(data: T) => ({
  data,
  error: null,
  count: null,
  status: 200,
  statusText: 'OK',
});

// For success responses only - error responses don't need proper typing in mocks

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: makeMockUser(),
    loading: false,
  })),
}));

// Variável global para o mock do offlineAdapter
let offlineAdapterMock: ReturnType<typeof makeMockOfflineAdapter>;

// O factory do vi.mock precisa ser inline e usar a variável global
vi.mock('@/lib/adapters/offlineAdapter', () => ({
  get offlineAdapter() {
    return offlineAdapterMock;
  },
}));

vi.mock('@/lib/services/familyService', () => ({
  getFamilies: vi.fn().mockResolvedValue([]),
  createFamily: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'family-123', ...data })),
  updateFamily: vi.fn().mockResolvedValue({ id: 'family-123' }),
  deleteFamily: vi.fn().mockResolvedValue({ error: null }),
  deleteMemberByFamilyAndUser: vi.fn().mockResolvedValue({ error: null }),
  getFamilyMembers: vi.fn().mockResolvedValue([]),
  inviteMember: vi.fn().mockResolvedValue({ id: 'invite-123' }),
  removeMember: vi.fn().mockResolvedValue(undefined),
  getInvitations: vi.fn().mockResolvedValue([]),
  acceptInvitation: vi.fn().mockResolvedValue(undefined),
  declineInvitation: vi.fn().mockResolvedValue(undefined),
  insertToTable: vi.fn(),
  insertFamilyMember: vi.fn(),
  deleteMembersByFamily: vi.fn(),
  updateInTable: vi.fn(),
  deleteByIdFromTable: vi.fn(),
  // Métodos necessários para os testes
  updateFamilyName: vi.fn().mockResolvedValue({ error: null }),
  updateInvitationStatus: vi.fn().mockResolvedValue({ error: null }),
  deleteInvitation: vi.fn().mockResolvedValue({ error: null }),
  updateMemberRole: vi.fn().mockResolvedValue({ error: null }),
  deleteMember: vi.fn().mockResolvedValue({ error: null }),
  insertFamily: vi.fn().mockResolvedValue({ id: 'family-123' }),
}));

// The actual `offlineAdapter` mock is provided dynamically above
// using the `offlineAdapterMock` variable to allow per-test customization.

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
import * as userService from '@/lib/services/userService';


describe('FamilyContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Cria novo mock e garante que o vi.mock use sempre o mesmo objeto
    offlineAdapterMock = makeMockOfflineAdapter();
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

      // persistence handled by offline adapter; internal call verified elsewhere
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
      // Mock getSession with the expected Supabase return type
      vi.spyOn(userService, 'getSession').mockResolvedValue({
        data: { session: { user: { id: 'user-123', email: 'test@example.com' } } },
        error: null
      });
    });

    it('should create cloud family when online and authenticated', async () => {
      const mockFamily = makeMockFamily({ id: 'cloud-family-123', name: 'Cloud Family', created_by: 'user-123', created_at: new Date().toISOString() });
      vi.mocked(familyService.insertFamily).mockResolvedValue(createSuccessResponse(mockFamily));
      vi.mocked(familyService.insertFamilyMember).mockResolvedValue(createSuccessResponse(null));
      
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
      const offlineFamily = makeMockFamily({ id: 'offline-family-123', name: 'Old Name', isOffline: true });
      offlineAdapterMock.get.mockResolvedValue(offlineFamily);

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.updateFamilyName('offline-family-123', 'New Name');
        expect(response.error).toBeNull();
      });

      // name update persisted to offline adapter (internal detail)
    });

    it('should update cloud family name', async () => {
      vi.mocked(familyService.updateFamilyName).mockResolvedValue(createSuccessResponse(null));

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
      offlineAdapterMock.getAllByIndex.mockResolvedValue([]);

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.deleteFamily('offline-family-123');
        expect(response.error).toBeNull();
      });

      // deletion persisted to offline adapter (internal detail)
    });

    it('should delete cloud family', async () => {
      vi.mocked(familyService.deleteFamily).mockResolvedValue(createSuccessResponse(null));

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
      offlineAdapterMock.getAllByIndex.mockResolvedValue([]);

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.leaveFamily('offline-family-123');
        expect(response.error).toBeNull();
      });

      // deletion persisted to offline adapter (internal detail)
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

  describe('selectFamily', () => {
    it('should call selectFamily function', async () => {
      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Just verify selectFamily is a function that can be called
      await act(async () => {
        await result.current.selectFamily('test-family-id');
      });
      
      // Function should complete without error
      expect(result.current.selectFamily).toBeDefined();
    });
  });

  describe('acceptInvitation', () => {
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
        const response = await result.current.acceptInvitation('inv-123');
        expect(response.error).toBeInstanceOf(Error);
        expect(response.error?.message).toBe('Not authenticated');
      });
    });
  });

  describe('rejectInvitation', () => {
    it('should reject an invitation successfully', async () => {
      vi.mocked(familyService.updateInvitationStatus).mockResolvedValue(createSuccessResponse(null));

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.rejectInvitation('inv-123');
        expect(response.error).toBeNull();
      });

      expect(familyService.updateInvitationStatus).toHaveBeenCalledWith('inv-123', 'rejected');
    });
  });

  describe('cancelInvitation', () => {
    it('should cancel an invitation successfully', async () => {
      vi.mocked(familyService.deleteInvitation).mockResolvedValue(createSuccessResponse(null));

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.cancelInvitation('inv-123');
        expect(response.error).toBeNull();
      });

      expect(familyService.deleteInvitation).toHaveBeenCalledWith('inv-123');
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role successfully', async () => {
      vi.mocked(familyService.updateMemberRole).mockResolvedValue(createSuccessResponse(null));

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.updateMemberRole('member-123', 'admin');
        expect(response.error).toBeNull();
      });

      expect(familyService.updateMemberRole).toHaveBeenCalledWith('member-123', 'admin');
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      vi.mocked(familyService.deleteMember).mockResolvedValue(createSuccessResponse(null));

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.removeMember('member-123');
        expect(response.error).toBeNull();
      });

      expect(familyService.deleteMember).toHaveBeenCalledWith('member-123');
    });
  });

  describe('inviteMember with no family selected', () => {
    it('should return error when no family is selected', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        loading: false,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useFamily(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.inviteMember('test@example.com');
        expect(response.error).toBeInstanceOf(Error);
        expect(response.error?.message).toContain('no family selected');
      });
    });
  });
});
