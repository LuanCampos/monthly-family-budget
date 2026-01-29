/**
 * Centralized context mocks for testing
 * Use these mocks consistently across all test files
 */
import { vi } from 'vitest';

/**
 * Mock for LanguageContext
 */
export const mockLanguageContext = {
  language: 'pt' as const,
  t: (key: string) => key,
  setLanguage: vi.fn(),
};

/**
 * Mock for CurrencyContext
 */
export const mockCurrencyContext = {
  currency: 'BRL' as const,
  currencySymbol: 'R$',
  formatCurrency: (value: number) => `R$ ${value.toFixed(2)}`,
  setCurrency: vi.fn(),
};

/**
 * Mock for ThemeContext
 */
export const mockThemeContext = {
  theme: 'dark' as const,
  setTheme: vi.fn(),
};

/**
 * Mock for FamilyContext
 */
export const mockFamilyContext = {
  currentFamilyId: 'family-123',
  currentFamily: { id: 'family-123', name: 'Test Family' },
  families: [],
  loading: false,
  setCurrentFamilyId: vi.fn(),
  refreshFamilies: vi.fn(),
};

/**
 * Mock for AuthContext
 */
export const mockAuthContext = {
  user: { id: 'user-123', email: 'test@example.com' },
  session: { access_token: 'mock-token' },
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
};

/**
 * Mock for OnlineContext
 */
export const mockOnlineContext = {
  isOnline: true,
  setIsOnline: vi.fn(),
};

/**
 * Creates a fresh copy of all context mocks (useful for beforeEach)
 */
export const createFreshMocks = () => ({
  language: { ...mockLanguageContext, setLanguage: vi.fn() },
  currency: { ...mockCurrencyContext, setCurrency: vi.fn() },
  theme: { ...mockThemeContext, setTheme: vi.fn() },
  family: { ...mockFamilyContext, setCurrentFamilyId: vi.fn(), refreshFamilies: vi.fn() },
  auth: { ...mockAuthContext, signIn: vi.fn(), signOut: vi.fn(), signUp: vi.fn() },
  online: { ...mockOnlineContext, setIsOnline: vi.fn() },
});
