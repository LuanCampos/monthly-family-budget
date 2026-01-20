import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileSection } from './ProfileSection';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('@/lib/services/userService', () => ({
  updateUserProfile: vi.fn(() => Promise.resolve({ error: null })),
}));

vi.mock('@/hooks/ui/use-toast', () => ({
  toast: vi.fn(),
}));

describe('ProfileSection', () => {
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
      render(<ProfileSection {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show dialog title', () => {
      render(<ProfileSection {...defaultProps} />);
      
      expect(screen.getByText('editProfile')).toBeInTheDocument();
    });
  });

  describe('form fields', () => {
    it('should render display name input', () => {
      render(<ProfileSection {...defaultProps} />);
      
      expect(screen.getByLabelText(/displayName/i)).toBeInTheDocument();
    });

    it('should populate display name from user metadata', () => {
      render(<ProfileSection {...defaultProps} />);
      
      const input = screen.getByLabelText(/displayName/i);
      expect(input).toHaveValue('Test User');
    });

    it('should allow editing display name', async () => {
      const user = userEvent.setup();
      render(<ProfileSection {...defaultProps} />);
      
      const input = screen.getByLabelText(/displayName/i);
      await user.clear(input);
      await user.type(input, 'New Name');
      
      expect(input).toHaveValue('New Name');
    });
  });

  describe('form actions', () => {
    it('should have save button', () => {
      render(<ProfileSection {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /saveChanges/i })).toBeInTheDocument();
    });

    it('should have cancel button', () => {
      render(<ProfileSection {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call onBack when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProfileSection {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    });
  });
});
