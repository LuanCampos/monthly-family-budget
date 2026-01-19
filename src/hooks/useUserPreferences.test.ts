import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserPreferences } from './useUserPreferences';
import type { User } from '@supabase/supabase-js';

// Mock dependencies
const mockSetLanguage = vi.fn();
const mockSetTheme = vi.fn();
const mockSetCurrency = vi.fn();

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    setLanguage: mockSetLanguage,
  }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
  }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    setCurrency: mockSetCurrency,
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockGetUserPreferences = vi.fn();

vi.mock('@/lib/services/userService', () => ({
  getUserPreferences: (userId: string) => mockGetUserPreferences(userId),
}));

describe('useUserPreferences', () => {
  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserPreferences.mockResolvedValue({
      data: null,
      error: null,
    });
  });

  it('should not load preferences when still loading auth', () => {
    renderHook(() => useUserPreferences(mockUser as User, true));

    expect(mockGetUserPreferences).not.toHaveBeenCalled();
  });

  it('should not load preferences when no user', () => {
    renderHook(() => useUserPreferences(null, false));

    expect(mockGetUserPreferences).not.toHaveBeenCalled();
  });

  it('should load preferences when user is available', async () => {
    mockGetUserPreferences.mockResolvedValue({
      data: {
        language: 'en',
        theme: 'dark',
        currency: 'USD',
      },
      error: null,
    });

    renderHook(() => useUserPreferences(mockUser as User, false));

    await waitFor(() => {
      expect(mockGetUserPreferences).toHaveBeenCalledWith('user-123');
    });
  });

  it('should apply language preference', async () => {
    mockGetUserPreferences.mockResolvedValue({
      data: { language: 'en' },
      error: null,
    });

    renderHook(() => useUserPreferences(mockUser as User, false));

    await waitFor(() => {
      expect(mockSetLanguage).toHaveBeenCalledWith('en');
    });
  });

  it('should apply theme preference', async () => {
    mockGetUserPreferences.mockResolvedValue({
      data: { theme: 'dark' },
      error: null,
    });

    renderHook(() => useUserPreferences(mockUser as User, false));

    await waitFor(() => {
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });
  });

  it('should apply currency preference', async () => {
    mockGetUserPreferences.mockResolvedValue({
      data: { currency: 'USD' },
      error: null,
    });

    renderHook(() => useUserPreferences(mockUser as User, false));

    await waitFor(() => {
      expect(mockSetCurrency).toHaveBeenCalledWith('USD');
    });
  });

  it('should apply all preferences at once', async () => {
    mockGetUserPreferences.mockResolvedValue({
      data: {
        language: 'pt',
        theme: 'light',
        currency: 'BRL',
      },
      error: null,
    });

    renderHook(() => useUserPreferences(mockUser as User, false));

    await waitFor(() => {
      expect(mockSetLanguage).toHaveBeenCalledWith('pt');
      expect(mockSetTheme).toHaveBeenCalledWith('light');
      expect(mockSetCurrency).toHaveBeenCalledWith('BRL');
    });
  });

  it('should not set language for invalid values', async () => {
    mockGetUserPreferences.mockResolvedValue({
      data: { language: 'fr' }, // Invalid language
      error: null,
    });

    renderHook(() => useUserPreferences(mockUser as User, false));

    await waitFor(() => {
      expect(mockGetUserPreferences).toHaveBeenCalled();
    });

    expect(mockSetLanguage).not.toHaveBeenCalled();
  });

  it('should not set currency for invalid values', async () => {
    mockGetUserPreferences.mockResolvedValue({
      data: { currency: 'EUR' }, // Invalid currency
      error: null,
    });

    renderHook(() => useUserPreferences(mockUser as User, false));

    await waitFor(() => {
      expect(mockGetUserPreferences).toHaveBeenCalled();
    });

    expect(mockSetCurrency).not.toHaveBeenCalled();
  });

  it('should handle error from service gracefully', async () => {
    const { logger } = await import('@/lib/logger');
    mockGetUserPreferences.mockResolvedValue({
      data: null,
      error: 'Database error',
    });

    renderHook(() => useUserPreferences(mockUser as User, false));

    await waitFor(() => {
      expect(mockGetUserPreferences).toHaveBeenCalled();
    });

    expect(logger.warn).toHaveBeenCalledWith(
      'userPreferences.load.error',
      expect.objectContaining({ userId: 'user-123' })
    );
  });

  it('should not reload preferences for the same user', async () => {
    mockGetUserPreferences.mockResolvedValue({
      data: { language: 'en' },
      error: null,
    });

    const { rerender } = renderHook(
      ({ user, loading }) => useUserPreferences(user, loading),
      { initialProps: { user: mockUser as User, loading: false } }
    );

    await waitFor(() => {
      expect(mockGetUserPreferences).toHaveBeenCalledTimes(1);
    });

    // Rerender with same user
    rerender({ user: mockUser as User, loading: false });

    // Should still only be called once
    expect(mockGetUserPreferences).toHaveBeenCalledTimes(1);
  });

  it('should reload preferences when user changes', async () => {
    mockGetUserPreferences.mockResolvedValue({
      data: { language: 'en' },
      error: null,
    });

    const { rerender } = renderHook(
      ({ user, loading }) => useUserPreferences(user, loading),
      { initialProps: { user: mockUser as User, loading: false } }
    );

    await waitFor(() => {
      expect(mockGetUserPreferences).toHaveBeenCalledTimes(1);
    });

    // Rerender with different user
    const newUser: Partial<User> = { id: 'user-456', email: 'new@example.com' };
    rerender({ user: newUser as User, loading: false });

    await waitFor(() => {
      expect(mockGetUserPreferences).toHaveBeenCalledTimes(2);
    });

    expect(mockGetUserPreferences).toHaveBeenCalledWith('user-456');
  });

  it('should handle null data response gracefully', async () => {
    mockGetUserPreferences.mockResolvedValue({
      data: null,
      error: null,
    });

    renderHook(() => useUserPreferences(mockUser as User, false));

    await waitFor(() => {
      expect(mockGetUserPreferences).toHaveBeenCalled();
    });

    // Should not throw and should not set any preferences
    expect(mockSetLanguage).not.toHaveBeenCalled();
    expect(mockSetTheme).not.toHaveBeenCalled();
    expect(mockSetCurrency).not.toHaveBeenCalled();
  });
});
