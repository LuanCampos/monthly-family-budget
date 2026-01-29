import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme, themes, type ThemeKey } from './ThemeContext';

// Mock secureStorage
vi.mock('@/lib/storage/secureStorage', () => ({
  getSecureStorageItem: vi.fn(() => null),
  setSecureStorageItem: vi.fn(),
}));

import { getSecureStorageItem, setSecureStorageItem } from '@/lib/storage/secureStorage';

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document.documentElement.style
    document.documentElement.style.cssText = '';
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>{children}</ThemeProvider>
  );

  describe('useTheme', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });

    it('should provide default dark theme', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('dark');
    });

    it('should load theme from storage', () => {
      vi.mocked(getSecureStorageItem).mockReturnValue('light');

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('light');
    });

    it('should fall back to dark for invalid stored theme', () => {
      vi.mocked(getSecureStorageItem).mockReturnValue('invalid-theme');

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('dark');
    });

    it('should update theme and save to storage', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('nord');
      });

      expect(result.current.theme).toBe('nord');
      expect(setSecureStorageItem).toHaveBeenCalledWith('budget-app-theme', 'nord');
    });

    it('should apply CSS variables when theme changes', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      // Check that CSS variables are applied
      const style = document.documentElement.style;
      expect(style.getPropertyValue('--background')).toBeTruthy();
    });
  });

  describe('themes export', () => {
    it('should export all available themes', () => {
      expect(themes).toHaveLength(8);
      
      const themeKeys = themes.map(t => t.key);
      expect(themeKeys).toContain('dark');
      expect(themeKeys).toContain('light');
      expect(themeKeys).toContain('nord');
      expect(themeKeys).toContain('dracula');
      expect(themeKeys).toContain('solarized');
      expect(themeKeys).toContain('gruvbox');
      expect(themeKeys).toContain('catppuccin');
      expect(themeKeys).toContain('solarizedLight');
    });

    it('should have labelKey for all themes', () => {
      themes.forEach(theme => {
        expect(theme.labelKey).toBeTruthy();
        expect(theme.labelKey.startsWith('theme')).toBe(true);
      });
    });
  });

  describe('theme switching', () => {
    it('should switch between all available themes', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      const themeKeys: ThemeKey[] = ['dark', 'light', 'nord', 'dracula', 'solarized', 'gruvbox', 'catppuccin', 'solarizedLight'];

      themeKeys.forEach(themeKey => {
        act(() => {
          result.current.setTheme(themeKey);
        });
        expect(result.current.theme).toBe(themeKey);
      });
    });
  });
});
