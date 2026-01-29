import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from './LanguageContext';

// Mock secureStorage
vi.mock('@/lib/storage/secureStorage', () => ({
  getSecureStorageItem: vi.fn(() => null),
  setSecureStorageItem: vi.fn(),
}));

import { getSecureStorageItem, setSecureStorageItem } from '@/lib/storage/secureStorage';

describe('LanguageContext', () => {
  const originalNavigator = window.navigator;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <LanguageProvider>{children}</LanguageProvider>
  );

  describe('useLanguage', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useLanguage());
      }).toThrow('useLanguage must be used within a LanguageProvider');

      consoleSpy.mockRestore();
    });

    it('should provide default language based on browser', () => {
      Object.defineProperty(window, 'navigator', {
        value: { language: 'en-US' },
        writable: true,
      });

      const { result } = renderHook(() => useLanguage(), { wrapper });

      expect(result.current.language).toBe('en');

      Object.defineProperty(window, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('should detect Portuguese browser language', () => {
      Object.defineProperty(window, 'navigator', {
        value: { language: 'pt-BR' },
        writable: true,
      });

      vi.mocked(getSecureStorageItem).mockReturnValue(null);

      const { result } = renderHook(() => useLanguage(), { wrapper });

      expect(result.current.language).toBe('pt');

      Object.defineProperty(window, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('should load language from storage', () => {
      vi.mocked(getSecureStorageItem).mockReturnValue('pt');

      const { result } = renderHook(() => useLanguage(), { wrapper });

      expect(result.current.language).toBe('pt');
    });

    it('should update language and save to storage', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      act(() => {
        result.current.setLanguage('pt');
      });

      expect(result.current.language).toBe('pt');
      expect(setSecureStorageItem).toHaveBeenCalledWith('budget-app-language', 'pt');
    });

    it('should translate keys correctly', () => {
      vi.mocked(getSecureStorageItem).mockReturnValue('en');

      const { result } = renderHook(() => useLanguage(), { wrapper });

      // Test a common key that should exist
      const translation = result.current.t('save');
      expect(typeof translation).toBe('string');
      expect(translation.length).toBeGreaterThan(0);
    });

    it('should return key if translation not found', () => {
      vi.mocked(getSecureStorageItem).mockReturnValue('en');

      const { result } = renderHook(() => useLanguage(), { wrapper });

      // Test with a non-existent key - it should return the key itself
      const key = 'nonExistentKey' as never;
      const translation = result.current.t(key);
      expect(translation).toBe('nonExistentKey');
    });
  });
});
