import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeneralSection } from './GeneralSection';
import type { User as SupabaseUser } from '@supabase/supabase-js';

describe('GeneralSection', () => {
  const mockT = (key: string) => key;
  const mockUser: SupabaseUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: { display_name: 'Test User' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2025-01-01',
  } as SupabaseUser;

  const defaultProps = {
    user: mockUser,
    language: 'pt' as const,
    theme: 'system' as const,
    currency: 'BRL' as const,
    currentMonthLabel: 'Janeiro 2025',
    processingAction: null,
    onLanguageChange: vi.fn(),
    onThemeChange: vi.fn(),
    onCurrencyChange: vi.fn(),
    onEditProfile: vi.fn(),
    onEditPassword: vi.fn(),
    onSignOut: vi.fn(),
    onAuthClick: vi.fn(),
    onDeleteMonth: vi.fn(),
    onClearOfflineCache: vi.fn(),
    getUserInitials: () => 'TU',
    getDisplayName: () => 'Test User',
    t: mockT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('user account section', () => {
    it('should render user info when logged in', () => {
      render(<GeneralSection {...defaultProps} />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should show edit profile and change password buttons', () => {
      render(<GeneralSection {...defaultProps} />);
      
      expect(screen.getByText('editProfile')).toBeInTheDocument();
      expect(screen.getByText('changePassword')).toBeInTheDocument();
    });

    it('should call onEditProfile when edit profile button is clicked', async () => {
      const user = userEvent.setup();
      render(<GeneralSection {...defaultProps} />);
      
      await user.click(screen.getByText('editProfile'));
      
      expect(defaultProps.onEditProfile).toHaveBeenCalledTimes(1);
    });

    it('should call onEditPassword when change password button is clicked', async () => {
      const user = userEvent.setup();
      render(<GeneralSection {...defaultProps} />);
      
      await user.click(screen.getByText('changePassword'));
      
      expect(defaultProps.onEditPassword).toHaveBeenCalledTimes(1);
    });

    it('should call onSignOut when logout is clicked', async () => {
      const user = userEvent.setup();
      render(<GeneralSection {...defaultProps} />);
      
      await user.click(screen.getByText('logout'));
      
      expect(defaultProps.onSignOut).toHaveBeenCalledTimes(1);
    });

    it('should show offline mode when user is null', () => {
      render(<GeneralSection {...defaultProps} user={null} />);
      
      expect(screen.getByText('offlineMode')).toBeInTheDocument();
      expect(screen.getByText('loginOrSignup')).toBeInTheDocument();
    });

    it('should call onAuthClick when login button is clicked in offline mode', async () => {
      const user = userEvent.setup();
      render(<GeneralSection {...defaultProps} user={null} />);
      
      await user.click(screen.getByText('loginOrSignup'));
      
      expect(defaultProps.onAuthClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('preferences section', () => {
    it('should render preferences label', () => {
      render(<GeneralSection {...defaultProps} />);
      
      expect(screen.getByText('preferences')).toBeInTheDocument();
    });
  });

  describe('data management section', () => {
    it('should render clear offline cache button', () => {
      render(<GeneralSection {...defaultProps} />);
      
      expect(screen.getByText('clearOfflineCache')).toBeInTheDocument();
    });

    it('should render delete month button with month label when onDeleteMonth is provided', () => {
      render(<GeneralSection {...defaultProps} />);
      
      // The delete button shows: delete "Janeiro 2025"
      expect(screen.getByText(/delete.*Janeiro 2025/i)).toBeInTheDocument();
    });

    it('should not render delete month button when onDeleteMonth is not provided', () => {
      render(<GeneralSection {...defaultProps} onDeleteMonth={undefined} />);
      
      // Should not find the delete month button (the one with month label)
      expect(screen.queryByText(/delete.*Janeiro 2025/i)).not.toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should show loading state when processing cache clear', () => {
      render(<GeneralSection {...defaultProps} processingAction="clear-offline-cache" />);
      
      // Should show loader with animate-spin class
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });
});
