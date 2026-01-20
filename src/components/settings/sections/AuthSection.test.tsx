import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthSection } from './AuthSection';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn(() => Promise.resolve({ error: null })),
    signUp: vi.fn(() => Promise.resolve({ error: null })),
  }),
}));

vi.mock('@/hooks/ui/use-toast', () => ({
  toast: vi.fn(),
}));

describe('AuthSection', () => {
  const mockT = (key: string) => key;
  const _mockUser: SupabaseUser = {
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
    user: null as SupabaseUser | null,
    myPendingInvitations: [],
    getUserInitials: () => 'TU',
    getDisplayName: () => 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('dialog rendering', () => {
    it('should render when open is true', () => {
      render(<AuthSection {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show login tab by default', () => {
      render(<AuthSection {...defaultProps} />);
      
      expect(screen.getByRole('tab', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /signup/i })).toBeInTheDocument();
    });
  });

  describe('login form', () => {
    it('should render email and password inputs', () => {
      render(<AuthSection {...defaultProps} />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should allow typing in email field', async () => {
      const user = userEvent.setup();
      render(<AuthSection {...defaultProps} />);
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'user@test.com');
      
      expect(emailInput).toHaveValue('user@test.com');
    });

    it('should allow typing in password field', async () => {
      const user = userEvent.setup();
      render(<AuthSection {...defaultProps} />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'secret123');
      
      expect(passwordInput).toHaveValue('secret123');
    });
  });

  describe('signup form', () => {
    it('should switch to signup tab when clicked', async () => {
      const user = userEvent.setup();
      render(<AuthSection {...defaultProps} />);
      
      await user.click(screen.getByRole('tab', { name: /signup/i }));
      
      // Signup form should show additional fields
      expect(screen.getByLabelText(/displayName/i)).toBeInTheDocument();
    });

    it('should render confirm password field in signup tab', async () => {
      const user = userEvent.setup();
      render(<AuthSection {...defaultProps} />);
      
      await user.click(screen.getByRole('tab', { name: /signup/i }));
      
      expect(screen.getByLabelText(/confirmPassword/i)).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should have required submit button', () => {
      render(<AuthSection {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });
  });

  describe('back button', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<AuthSection {...defaultProps} />);
      
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);
      
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    });
  });
});
