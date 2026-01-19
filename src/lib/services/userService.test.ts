import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: null, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: null, error: null }),
      resend: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

import {
  getUserPreferences,
  getCurrentFamilyPreference,
  upsertUserPreference,
  updateCurrentFamily,
  getSession,
  updateUserProfile,
  verifyPassword,
  updatePassword,
  resetPasswordForEmail,
  resendVerificationEmail,
} from './userService';
import { supabase } from '../supabase';

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserPreferences', () => {
    it('should query user preferences with correct parameters', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: { id: '1' }, error: null });
      const mockEq2 = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
      const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
      const mockSelect = vi.fn(() => ({ eq: mockEq1 }));
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as ReturnType<typeof supabase.from>);

      await getUserPreferences('user-123');

      expect(supabase.from).toHaveBeenCalledWith('user_preference');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq1).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockEq2).toHaveBeenCalledWith('application_key', 'finance');
    });
  });

  describe('getCurrentFamilyPreference', () => {
    it('should query current family preference', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: { current_family_id: 'fam-1' }, error: null });
      const mockEq2 = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
      const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
      const mockSelect = vi.fn(() => ({ eq: mockEq1 }));
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as ReturnType<typeof supabase.from>);

      await getCurrentFamilyPreference('user-123');

      expect(supabase.from).toHaveBeenCalledWith('user_preference');
      expect(mockSelect).toHaveBeenCalledWith('current_family_id');
    });
  });

  describe('upsertUserPreference', () => {
    it('should upsert user preference with application_key', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert } as unknown as ReturnType<typeof supabase.from>);

      await upsertUserPreference({
        user_id: 'user-123',
        language: 'pt',
        currency: 'BRL',
      });

      expect(supabase.from).toHaveBeenCalledWith('user_preference');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          application_key: 'finance',
          language: 'pt',
          currency: 'BRL',
        }),
        { onConflict: 'user_id,application_key' }
      );
    });

    it('should use provided updated_at if given', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert } as unknown as ReturnType<typeof supabase.from>);

      const customDate = '2024-01-01T00:00:00.000Z';
      await upsertUserPreference({
        user_id: 'user-123',
        updated_at: customDate,
      });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: customDate,
        }),
        expect.anything()
      );
    });
  });

  describe('updateCurrentFamily', () => {
    it('should update current family for user', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert } as unknown as ReturnType<typeof supabase.from>);

      await updateCurrentFamily('user-123', 'fam-456');

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          current_family_id: 'fam-456',
          application_key: 'finance',
        }),
        { onConflict: 'user_id,application_key' }
      );
    });

    it('should handle null family id', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert } as unknown as ReturnType<typeof supabase.from>);

      await updateCurrentFamily('user-123', null);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          current_family_id: null,
        }),
        expect.anything()
      );
    });
  });

  describe('auth helpers', () => {
    it('getSession should call supabase.auth.getSession', async () => {
      await getSession();
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    it('updateUserProfile should call updateUser with metadata', async () => {
      await updateUserProfile({ display_name: 'John Doe' });
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: { display_name: 'John Doe' },
      });
    });

    it('verifyPassword should sign in with password', async () => {
      await verifyPassword('test@example.com', 'password123');
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('updatePassword should update user password', async () => {
      await updatePassword('newPassword123');
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123',
      });
    });

    it('resetPasswordForEmail should send reset email', async () => {
      await resetPasswordForEmail('test@example.com', 'https://example.com/reset');
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: 'https://example.com/reset',
      });
    });

    it('resendVerificationEmail should resend signup email', async () => {
      await resendVerificationEmail('test@example.com', 'https://example.com/verify');
      expect(supabase.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'https://example.com/verify',
        },
      });
    });
  });
});
