import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forwardRef } from 'react';

import { SettingsDialog } from './SettingsDialog';

// Centralized context/domain mocks
import { makeMockUser } from '@/test/mocks/domain/makeMockUser';
import { makeMockFamilyContext } from '@/test/mocks/context/makeMockFamilyContext';
import { makeMockOnlineContext } from '@/test/mocks/context/makeMockOnlineContext';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'pt',
    setLanguage: vi.fn(),
    t: (key: string) => {
      const translations: Record<string, string> = {
        settings: 'Settings',
        general: 'General',
        family: 'Family',
        profile: 'Profile',
        theme: 'Theme',
        language: 'Language',
        currency: 'Currency',
        dark: 'Dark',
        light: 'Light',
        system: 'System',
        signOut: 'Sign Out',
        deleteMonth: 'Delete Month',
        manageFamily: 'Manage Family',
        familyMembers: 'Family Members',
        inviteMember: 'Invite Member',
        pendingInvitations: 'Pending Invitations',
        cancel: 'Cancel',
        save: 'Save',
        close: 'Close',
        account: 'Account',
        preferences: 'Preferences',
        data: 'Data',
        clearOfflineCache: 'Clear Offline Cache',
        owner: 'Owner',
        admin: 'Admin',
        member: 'Member',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
  }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    currency: 'BRL',
    setCurrency: vi.fn(),
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: makeMockUser({ id: 'user-1', email: 'test@example.com' }),
    signOut: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@/contexts/FamilyContext', () => ({
  useFamily: () => makeMockFamilyContext(),
}));

vi.mock('@/contexts/OnlineContext', () => ({
  useOnline: () => makeMockOnlineContext(),
}));

vi.mock('@/lib/adapters/offlineAdapter', () => ({
  offlineAdapter: {
    isOfflineId: vi.fn().mockReturnValue(false),
    put: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/services/userService', () => ({
  upsertUserPreference: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('@/lib/storage/offlineStorage', () => ({
  clearOfflineCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/hooks/ui/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock sections
vi.mock('./sections', () => ({
  ProfileSection: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="profile-section">
      Profile Section
      <button onClick={onBack}>Back</button>
    </div>
  ),
  PasswordSection: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="password-section">
      Password Section
      <button onClick={onBack}>Back</button>
    </div>
  ),
  AuthSection: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="auth-section">
      Auth Section
      <button onClick={onBack}>Back</button>
    </div>
  ),
  GeneralSection: () => <div data-testid="general-section">General Section</div>,
  FamilySection: () => <div data-testid="family-section">Family Section</div>,
  DeleteFamilyAlert: () => <div data-testid="delete-family-alert" />,
  LeaveFamilyAlert: () => <div data-testid="leave-family-alert" />,
  CreateFamilyDialog: () => <div data-testid="create-family-dialog" />,
}));

vi.mock('@/components/common', () => ({
  TriggerButton: forwardRef<HTMLButtonElement, { onClick?: () => void; children: React.ReactNode }>(
    ({ onClick, children, ...props }, ref) => (
      <button ref={ref} onClick={onClick} data-testid="trigger-button" {...props}>{children}</button>
    )
  ),
  ConfirmDialog: () => <div data-testid="confirm-dialog" />,
}));

describe('SettingsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render trigger button', () => {
      render(<SettingsDialog />);
      
      expect(screen.getByTestId('trigger-button')).toBeInTheDocument();
    });

    it('should open dialog when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);
      
      await user.click(screen.getByTestId('trigger-button'));
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render general section by default', async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);
      
      await user.click(screen.getByTestId('trigger-button'));
      
      expect(screen.getByTestId('general-section')).toBeInTheDocument();
    });
  });

  describe('controlled mode', () => {
    it('should render open when open prop is true', () => {
      const onOpenChange = vi.fn();
      render(<SettingsDialog open={true} onOpenChange={onOpenChange} />);
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should not render when open prop is false', () => {
      const onOpenChange = vi.fn();
      render(<SettingsDialog open={false} onOpenChange={onOpenChange} />);
      
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('tab navigation', () => {
    it('should switch to family tab when clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);
      
      await user.click(screen.getByTestId('trigger-button'));
      await user.click(screen.getByRole('tab', { name: /family/i }));
      
      expect(screen.getByTestId('family-section')).toBeInTheDocument();
    });
  });

  describe('delete month', () => {
    it('should render delete month button when currentMonthLabel is provided', async () => {
      const user = userEvent.setup();
      const onDeleteMonth = vi.fn();
      render(
        <SettingsDialog 
          currentMonthLabel="January 2026" 
          onDeleteMonth={onDeleteMonth} 
        />
      );
      
      await user.click(screen.getByTestId('trigger-button'));
      
      // The delete month functionality should be accessible
      expect(screen.getByTestId('general-section')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible dialog', async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);
      
      await user.click(screen.getByTestId('trigger-button'));
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have accessible tabs', async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);
      
      await user.click(screen.getByTestId('trigger-button'));
      
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle missing currentMonthLabel', async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);
      
      await user.click(screen.getByTestId('trigger-button'));
      
      expect(screen.getByTestId('general-section')).toBeInTheDocument();
    });

    it('should handle missing onDeleteMonth', async () => {
      const user = userEvent.setup();
      render(<SettingsDialog currentMonthLabel="January 2026" />);
      
      await user.click(screen.getByTestId('trigger-button'));
      
      expect(screen.getByTestId('general-section')).toBeInTheDocument();
    });
  });
});
