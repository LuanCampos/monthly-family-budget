import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FamilySetup } from './FamilySetup';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock('@/contexts/FamilyContext', () => ({
  useFamily: () => ({
    createFamily: vi.fn(),
    createOfflineFamily: vi.fn(),
    myPendingInvitations: [],
    acceptInvitation: vi.fn(),
    rejectInvitation: vi.fn(),
    loading: false,
  }),
}));

vi.mock('@/hooks/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/lib/services/userService', () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('@/lib/utils/appBaseUrl', () => ({
  getAppBaseUrl: () => 'http://localhost:3000',
}));

describe('FamilySetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<FamilySetup />);
      // Component should render something
      expect(document.body.textContent).not.toBe('');
    });

    it('should render login button when no user', () => {
      render(<FamilySetup />);
      // Should have some button for login/signup
      expect(screen.getByText('loginOrSignup')).toBeInTheDocument();
    });

    it('should render offline option', () => {
      render(<FamilySetup />);
      // Should have continue offline option (translation key or text)
      expect(screen.getByText('continueOffline')).toBeInTheDocument();
    });
  });
});
