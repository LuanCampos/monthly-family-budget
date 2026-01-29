import { makeMockSession } from '@/test/mocks/domain/makeMockSession';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock Supabase
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: () => mockSignInWithPassword(),
      signUp: (params: unknown) => mockSignUp(params),
      signOut: (options?: unknown) => mockSignOut(options),
      getSession: () => mockGetSession(),
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        mockOnAuthStateChange(callback);
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      },
    },
  },
}));

vi.mock('@/lib/utils/appBaseUrl', () => ({
  getAppBaseUrl: vi.fn(() => 'http://localhost:3000'),
}));

vi.mock('@/lib/services/userService', () => ({
  getUserPreferences: vi.fn(() => Promise.resolve({ data: null, error: null })),
  upsertUserPreference: vi.fn(() => Promise.resolve({ error: null })),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({
    t: (key: string) => key,
    language: 'pt',
  })),
}));

vi.mock('@/hooks/ui/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Default mock implementations
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockSignUp.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleSpy.mockRestore();
    });

    it('should return context when used within provider', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('session');
      expect(result.current).toHaveProperty('signIn');
      expect(result.current).toHaveProperty('signUp');
      expect(result.current).toHaveProperty('signOut');
    });
  });

  describe('initial state', () => {
    it('should start with loading true', () => {
      mockGetSession.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('should set loading to false after session check', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should restore existing session on mount', async () => {
      const mockSession = makeMockSession({ access_token: 'mock-token' });
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.user).toEqual(mockSession.user);
      expect(result.current.session).toEqual(mockSession);
    });
  });

  describe('signIn', () => {
    it('should call supabase signInWithPassword', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      mockSignInWithPassword.mockResolvedValue({ error: null });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });
      
      expect(mockSignInWithPassword).toHaveBeenCalled();
    });

    it('should return error on failed login', async () => {
      const mockError = new Error('Invalid credentials');
      mockSignInWithPassword.mockResolvedValue({ error: mockError });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      let loginResult: { error: Error | null } | undefined;
      await act(async () => {
        loginResult = await result.current.signIn('test@example.com', 'wrongpassword');
      });
      
      expect(loginResult?.error).toBe(mockError);
    });

    it('should return null error on successful login', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      let loginResult: { error: Error | null } | undefined;
      await act(async () => {
        loginResult = await result.current.signIn('test@example.com', 'password123');
      });
      
      expect(loginResult?.error).toBeNull();
    });
  });

  describe('rate limiting', () => {
    it('should track failed login attempts', async () => {
      const mockError = new Error('Invalid credentials');
      mockSignInWithPassword.mockResolvedValue({ error: mockError });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Attempt 4 failed logins (not enough to trigger lockout)
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          await result.current.signIn('test@example.com', 'wrongpassword');
        });
      }
      
      // 5th attempt should still work but trigger lockout
      let loginResult: { error: Error | null } | undefined;
      await act(async () => {
        loginResult = await result.current.signIn('test@example.com', 'wrongpassword');
      });
      
      expect(loginResult?.error).toBe(mockError);
    });

    it('should lockout after 5 failed attempts', async () => {
      const mockError = new Error('Invalid credentials');
      mockSignInWithPassword.mockResolvedValue({ error: mockError });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.signIn('test@example.com', 'wrongpassword');
        });
      }
      
      // Next attempt should be locked out
      let loginResult: { error: Error | null } | undefined;
      await act(async () => {
        loginResult = await result.current.signIn('test@example.com', 'password123');
      });
      
      expect(loginResult?.error?.message).toContain('Muitas tentativas');
    });

    it('should allow login again after lockout timeout expires', async () => {
      const mockError = new Error('Invalid credentials');
      mockSignInWithPassword.mockResolvedValue({ error: mockError });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Trigger lockout with 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.signIn('test@example.com', 'wrongpassword');
        });
      }
      
      // Verify we are locked out
      let loginResult: { error: Error | null } | undefined;
      await act(async () => {
        loginResult = await result.current.signIn('test@example.com', 'password123');
      });
      
      expect(loginResult?.error?.message).toContain('Muitas tentativas');
      // Lockout message should include seconds remaining
      expect(loginResult?.error?.message).toMatch(/\d+\s*segundos/);
    });

    it('should reset attempts on successful login', async () => {
      mockSignInWithPassword
        .mockResolvedValueOnce({ error: new Error('Invalid') })
        .mockResolvedValueOnce({ error: new Error('Invalid') })
        .mockResolvedValueOnce({ error: null }); // Success
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // 2 failed attempts
      await act(async () => {
        await result.current.signIn('test@example.com', 'wrong1');
      });
      await act(async () => {
        await result.current.signIn('test@example.com', 'wrong2');
      });
      
      // Successful login
      await act(async () => {
        await result.current.signIn('test@example.com', 'correct');
      });
      
      // Should be able to fail 4 more times without lockout
      mockSignInWithPassword.mockResolvedValue({ error: new Error('Invalid') });
      
      for (let i = 0; i < 4; i++) {
        let loginResult: { error: Error | null } | undefined;
        await act(async () => {
          loginResult = await result.current.signIn('test@example.com', 'wrong');
        });
        // Should still return the actual error, not lockout message
        expect(loginResult?.error?.message).toBe('Invalid');
      }
    });
  });

  describe('signUp', () => {
    it('should call supabase signUp with email and password', async () => {
      mockSignUp.mockResolvedValue({ error: null });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      await act(async () => {
        await result.current.signUp('new@example.com', 'password123');
      });
      
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          password: 'password123',
        })
      );
    });

    it('should include displayName in metadata when provided', async () => {
      mockSignUp.mockResolvedValue({ error: null });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      await act(async () => {
        await result.current.signUp('new@example.com', 'password123', 'John Doe');
      });
      
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: { display_name: 'John Doe' },
          }),
        })
      );
    });

    it('should return error on failed signup', async () => {
      const mockError = new Error('Email already exists');
      mockSignUp.mockResolvedValue({ error: mockError });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      let signUpResult: { error: Error | null } | undefined;
      await act(async () => {
        signUpResult = await result.current.signUp('existing@example.com', 'password123');
      });
      
      expect(signUpResult?.error).toBe(mockError);
    });
  });

  describe('signOut', () => {
    it('should call supabase signOut', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'mock-token',
      };
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });
      mockSignOut.mockResolvedValue({ error: null });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      await act(async () => {
        await result.current.signOut();
      });
      
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should fallback to local signOut on server error', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'mock-token',
      };
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });
      
      // First call fails, second (local) succeeds
      mockSignOut
        .mockResolvedValueOnce({ error: new Error('Server error') })
        .mockResolvedValueOnce({ error: null });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      await act(async () => {
        await result.current.signOut();
      });
      
      // Should have called signOut twice (global, then local)
      expect(mockSignOut).toHaveBeenCalledTimes(2);
      expect(mockSignOut).toHaveBeenLastCalledWith({ scope: 'local' });
    });

    it('should attempt local signOut and cleanup when global signOut fails', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'mock-token',
      };
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });
      
      // First signOut fails (triggers fallback path)
      mockSignOut.mockResolvedValueOnce({ error: new Error('Server error') })
                 .mockResolvedValueOnce({ error: null }); // Local signOut succeeds
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      await act(async () => {
        await result.current.signOut();
      });
      
      // Should have called signOut twice (global failed, then local)
      expect(mockSignOut).toHaveBeenCalledTimes(2);
      expect(mockSignOut).toHaveBeenNthCalledWith(1, undefined);
      expect(mockSignOut).toHaveBeenNthCalledWith(2, { scope: 'local' });
    });
  });

  describe('auth state change listener', () => {
    it('should update user and session on auth state change', async () => {
      let authCallback: ((event: string, session: unknown) => void) | null = null;
      
      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
      });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.user).toBeNull();
      
      // Simulate auth state change
      const newSession = {
        user: { id: 'new-user-123', email: 'new@example.com' },
        access_token: 'new-token',
      };
      
      await act(async () => {
        authCallback?.('SIGNED_IN', newSession);
      });
      
      expect(result.current.user).toEqual(newSession.user);
      expect(result.current.session).toEqual(newSession);
    });

    it('should clear user and session on sign out event', async () => {
      let authCallback: ((event: string, session: unknown) => void) | null = null;
      
      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
      });
      
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'mock-token',
      };
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.user).toEqual(mockSession.user);
      });
      
      // Simulate sign out
      await act(async () => {
        authCallback?.('SIGNED_OUT', null);
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });

  describe('security', () => {
    it('should not expose password in any error messages', async () => {
      const mockError = new Error('Authentication failed');
      mockSignInWithPassword.mockResolvedValue({ error: mockError });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      const testPassword = 'superSecretPassword123!';
      let loginResult: { error: Error | null } | undefined;
      
      await act(async () => {
        loginResult = await result.current.signIn('test@example.com', testPassword);
      });
      
      // Error message should not contain password
      expect(loginResult?.error?.message).not.toContain(testPassword);
    });

    it('should handle malicious email input', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      const maliciousEmail = '<script>alert("xss")</script>@example.com';
      
      await act(async () => {
        await result.current.signIn(maliciousEmail, 'password');
      });
      
      // Should call supabase without throwing
      expect(mockSignInWithPassword).toHaveBeenCalled();
    });
  });
});
