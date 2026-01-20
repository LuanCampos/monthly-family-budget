import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordSection } from './PasswordSection';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('@/lib/services/userService', () => ({
  verifyPassword: vi.fn(() => Promise.resolve({ error: null })),
  updatePassword: vi.fn(() => Promise.resolve({ error: null })),
}));

vi.mock('@/hooks/ui/use-toast', () => ({
  toast: vi.fn(),
}));

describe('PasswordSection', () => {
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
    open: true,
    onOpenChange: vi.fn(),
    onBack: vi.fn(),
    t: mockT,
    controlledOpen: true,
    user: mockUser,
    myPendingInvitations: [],
    getUserInitials: () => 'TU',
    getDisplayName: () => 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('dialog rendering', () => {
    it('should render when open is true', () => {
      render(<PasswordSection {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show dialog title', () => {
      render(<PasswordSection {...defaultProps} />);
      
      expect(screen.getByText('changePassword')).toBeInTheDocument();
    });
  });

  describe('form fields', () => {
    it('should render current password input', () => {
      render(<PasswordSection {...defaultProps} />);
      
      expect(screen.getByLabelText(/currentPassword/i)).toBeInTheDocument();
    });

    it('should render new password input', () => {
      render(<PasswordSection {...defaultProps} />);
      
      expect(screen.getByPlaceholderText(/newPasswordPlaceholder/i)).toBeInTheDocument();
    });

    it('should render confirm password input', () => {
      render(<PasswordSection {...defaultProps} />);
      
      expect(screen.getByLabelText(/confirmNewPassword/i)).toBeInTheDocument();
    });

    it('should allow typing in password fields', async () => {
      const user = userEvent.setup();
      render(<PasswordSection {...defaultProps} />);
      
      const currentPass = screen.getByLabelText(/currentPassword/i);
      await user.type(currentPass, 'oldpass');
      expect(currentPass).toHaveValue('oldpass');
      
      const newPass = screen.getByPlaceholderText(/newPasswordPlaceholder/i);
      await user.type(newPass, 'newpass123');
      expect(newPass).toHaveValue('newpass123');
    });
  });

  describe('form actions', () => {
    it('should have update password button', () => {
      render(<PasswordSection {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /updatePassword/i })).toBeInTheDocument();
    });

    it('should have cancel button', () => {
      render(<PasswordSection {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call onBack when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<PasswordSection {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    });
  });
});
