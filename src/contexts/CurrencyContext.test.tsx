import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CurrencyProvider, useCurrency, currencies } from './CurrencyContext';

// Mock secureStorage
vi.mock('@/lib/storage/secureStorage', () => ({
  getSecureStorageItem: vi.fn(() => null),
  setSecureStorageItem: vi.fn(),
}));

import { getSecureStorageItem, setSecureStorageItem } from '@/lib/storage/secureStorage';

describe('CurrencyContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CurrencyProvider>{children}</CurrencyProvider>
  );

  describe('useCurrency', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useCurrency());
      }).toThrow('useCurrency must be used within a CurrencyProvider');

      consoleSpy.mockRestore();
    });

    it('should provide default BRL currency', () => {
      const { result } = renderHook(() => useCurrency(), { wrapper });

      expect(result.current.currency).toBe('BRL');
      expect(result.current.currencySymbol).toBe('R$');
    });

    it('should load currency from storage', () => {
      vi.mocked(getSecureStorageItem).mockReturnValue('USD');

      const { result } = renderHook(() => useCurrency(), { wrapper });

      expect(result.current.currency).toBe('USD');
      expect(result.current.currencySymbol).toBe('$');
    });

    it('should fall back to BRL for invalid stored currency', () => {
      vi.mocked(getSecureStorageItem).mockReturnValue('INVALID');

      const { result } = renderHook(() => useCurrency(), { wrapper });

      expect(result.current.currency).toBe('BRL');
    });

    it('should update currency and save to storage', () => {
      const { result } = renderHook(() => useCurrency(), { wrapper });

      act(() => {
        result.current.setCurrency('USD');
      });

      expect(result.current.currency).toBe('USD');
      expect(setSecureStorageItem).toHaveBeenCalledWith('budget-app-currency', 'USD');
    });

    it('should format currency in BRL', () => {
      vi.mocked(getSecureStorageItem).mockReturnValue('BRL');

      const { result } = renderHook(() => useCurrency(), { wrapper });

      const formatted = result.current.formatCurrency(1234.56);
      expect(formatted).toMatch(/R\$/);
      expect(formatted).toMatch(/1.*234/); // Thousands separator
    });

    it('should format currency in USD', () => {
      vi.mocked(getSecureStorageItem).mockReturnValue('USD');

      const { result } = renderHook(() => useCurrency(), { wrapper });

      const formatted = result.current.formatCurrency(1234.56);
      expect(formatted).toMatch(/\$/);
      expect(formatted).toMatch(/1.*234/); // Thousands separator
    });
  });

  describe('currencies export', () => {
    it('should export available currencies', () => {
      expect(currencies).toHaveLength(2);
      expect(currencies).toContainEqual({ code: 'BRL', name: 'Real (R$)' });
      expect(currencies).toContainEqual({ code: 'USD', name: 'Dollar ($)' });
    });
  });
});
