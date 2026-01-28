import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FamilySettingsDialog } from './FamilySettingsDialog';

// Mock scrollIntoView for Radix Select
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const mockMembers = [
  { id: 'member1', user_id: 'user1', role: 'owner' as const, user_email: 'owner@test.com' },
  { id: 'member2', user_id: 'user2', role: 'member' as const, user_email: 'member@test.com' },
];

const mockPendingInvitations = [
  { id: 'inv1', email: 'pending@test.com', family_id: 'fam1' },
];

const mockMyPendingInvitations = [
  { id: 'myinv1', family_name: 'Other Family', family_id: 'fam2' },
];

const mockCurrentFamily = { id: 'fam1', name: 'Test Family', isOffline: false };

const mockFamilyContext = {
  currentFamily: mockCurrentFamily,
  members: mockMembers,
  pendingInvitations: mockPendingInvitations,
  myPendingInvitations: [] as typeof mockMyPendingInvitations,
  userRole: 'owner' as const,
  inviteMember: vi.fn().mockResolvedValue({ error: null }),
  cancelInvitation: vi.fn().mockResolvedValue({ error: null }),
  acceptInvitation: vi.fn().mockResolvedValue({ error: null }),
  rejectInvitation: vi.fn().mockResolvedValue({ error: null }),
  updateMemberRole: vi.fn().mockResolvedValue({ error: null }),
  removeMember: vi.fn().mockResolvedValue({ error: null }),
  updateFamilyName: vi.fn().mockResolvedValue({ error: null }),
  deleteFamily: vi.fn().mockResolvedValue({ error: null }),
  leaveFamily: vi.fn().mockResolvedValue({ error: null }),
};

vi.mock('@/contexts/FamilyContext', () => ({
  useFamily: () => mockFamilyContext,
  FamilyRole: {},
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        openFamilySettings: 'Open Family Settings',
        familySettings: 'Family Settings',
        members: 'Members',
        invitations: 'Invitations',
        settings: 'Settings',
        invite: 'Invite',
        inviteEmailPlaceholder: 'Enter email to invite',
        sendInvitation: 'Send Invitation',
        pendingSent: 'Pending Sent',
        cancelInvitation: 'Cancel Invitation',
        noPendingInvitations: 'No pending invitations',
        invitedToFamily: 'Invited to family',
        accept: 'Accept',
        rejectInvitation: 'Reject',
        familyDetails: 'Family Details',
        edit: 'Edit',
        save: 'Save',
        cancel: 'Cancel',
        dangerZone: 'Danger Zone',
        leaveFamily: 'Leave Family',
        deleteFamily: 'Delete Family',
        deleteFamilyConfirm: 'Delete Family?',
        deleteFamilyWarning: 'All data will be lost.',
        deleteFamilyWarningOnline: 'This will delete all family data permanently.',
        delete: 'Delete',
        leaveFamilyConfirm: 'Leave Family?',
        leaveFamilyWarning: 'You will lose access to family data.',
        leave: 'Leave',
        removeMember: 'Remove Member',
        removeMemberConfirm: 'Remove Member?',
        removeMemberWarning: 'The member will lose access.',
        promoteAdminFirst: 'Promote another admin first',
        role_admin: 'Admin',
        role_member: 'Member',
        you: 'You',
        member: 'Member',
        success: 'Success',
        error: 'Error',
        invitationSent: 'Invitation sent',
        invitationAccepted: 'Invitation accepted',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user1', email: 'owner@test.com' },
  }),
}));

vi.mock('@/hooks/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/components/common', () => ({
  ConfirmDialog: ({ open, onConfirm, title }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
  }) =>
    open ? (
      <div data-testid="confirm-dialog">
        <span>{title}</span>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    ) : null,
}));

describe('FamilySettingsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFamilyContext.currentFamily = mockCurrentFamily;
    mockFamilyContext.members = mockMembers;
    mockFamilyContext.pendingInvitations = mockPendingInvitations;
    mockFamilyContext.myPendingInvitations = [];
    mockFamilyContext.userRole = 'owner';
  });

  describe('Rendering', () => {
    it('should render trigger button', () => {
      render(<FamilySettingsDialog />);

      expect(screen.getByLabelText('Open Family Settings')).toBeInTheDocument();
    });

    it('should not render when no current family', () => {
      mockFamilyContext.currentFamily = null as unknown as typeof mockCurrentFamily;
      const { container } = render(<FamilySettingsDialog />);

      expect(container.firstChild).toBeNull();
    });

    it('should show badge when there are pending invitations for user', () => {
      mockFamilyContext.myPendingInvitations = mockMyPendingInvitations;
      render(<FamilySettingsDialog />);

      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Dialog Opening', () => {
    it('should open dialog when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Family Settings')).toBeInTheDocument();
    });
  });

  describe('Tabs Navigation', () => {
    it('should show members tab by default', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));

      expect(screen.getByText('You')).toBeInTheDocument();
      expect(screen.getByText('member@test.com')).toBeInTheDocument();
    });

    it('should show invitations tab by default when user has pending invitations', async () => {
      const user = userEvent.setup();
      mockFamilyContext.myPendingInvitations = mockMyPendingInvitations;
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));

      expect(screen.getByText('Other Family')).toBeInTheDocument();
    });

    it('should switch to settings tab', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByRole('tab', { name: 'Settings' }));

      expect(screen.getByText('Family Details')).toBeInTheDocument();
      expect(screen.getByText('Test Family')).toBeInTheDocument();
    });
  });

  describe('Members Tab - Admin View', () => {
    it('should show invite section for admin', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));

      expect(screen.getByPlaceholderText('Enter email to invite')).toBeInTheDocument();
    });

    it('should send invitation when clicking invite button', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));

      const input = screen.getByPlaceholderText('Enter email to invite');
      await user.type(input, 'new@test.com');
      await user.click(screen.getByLabelText('Send Invitation'));

      expect(mockFamilyContext.inviteMember).toHaveBeenCalledWith('new@test.com');
    });

    it('should show pending sent invitations', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));

      expect(screen.getByText('pending@test.com')).toBeInTheDocument();
    });

    it('should cancel invitation when clicking cancel button', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByLabelText('Cancel Invitation'));

      expect(mockFamilyContext.cancelInvitation).toHaveBeenCalledWith('inv1');
    });

    it('should show remove button for other members', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));

      expect(screen.getByLabelText('Remove Member')).toBeInTheDocument();
    });

    it('should show role selector for other members', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));

      const roleSelectors = screen.getAllByRole('combobox');
      expect(roleSelectors.length).toBeGreaterThan(0);
    });
  });

  describe('Members Tab - Admin View Extended', () => {
    it('should show members list', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));

      expect(screen.getByText('member@test.com')).toBeInTheDocument();
    });

    it('should show owner indicator for current user', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));

      expect(screen.getByText('You')).toBeInTheDocument();
    });
  });

  describe('Invitations Tab', () => {
    it('should show empty state when no invitations', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByRole('tab', { name: 'Invitations' }));

      expect(screen.getByText('No pending invitations')).toBeInTheDocument();
    });

    it('should show pending invitations for user', async () => {
      const user = userEvent.setup();
      mockFamilyContext.myPendingInvitations = mockMyPendingInvitations;
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByRole('tab', { name: /Invitations/i }));

      expect(screen.getByText('Other Family')).toBeInTheDocument();
    });

    it('should accept invitation', async () => {
      const user = userEvent.setup();
      mockFamilyContext.myPendingInvitations = mockMyPendingInvitations;
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByRole('tab', { name: /Invitations/i }));
      await user.click(screen.getByText('Accept'));

      expect(mockFamilyContext.acceptInvitation).toHaveBeenCalledWith('myinv1');
    });

    it('should reject invitation', async () => {
      const user = userEvent.setup();
      mockFamilyContext.myPendingInvitations = mockMyPendingInvitations;
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByRole('tab', { name: /Invitations/i }));
      await user.click(screen.getByLabelText('Reject'));

      expect(mockFamilyContext.rejectInvitation).toHaveBeenCalledWith('myinv1');
    });
  });

  describe('Settings Tab', () => {
    it('should show family name', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByRole('tab', { name: 'Settings' }));

      expect(screen.getByText('Test Family')).toBeInTheDocument();
    });

    it('should show edit button for admin', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByRole('tab', { name: 'Settings' }));

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });

    it('should enter edit mode when clicking edit', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByRole('tab', { name: 'Settings' }));
      await user.click(screen.getByRole('button', { name: 'Edit' }));

      expect(screen.getByDisplayValue('Test Family')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('should update family name', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByRole('tab', { name: 'Settings' }));
      await user.click(screen.getByRole('button', { name: 'Edit' }));

      const input = screen.getByDisplayValue('Test Family');
      await user.clear(input);
      await user.type(input, 'New Family Name');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(mockFamilyContext.updateFamilyName).toHaveBeenCalledWith('fam1', 'New Family Name');
    });

    it('should show danger zone', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByRole('tab', { name: 'Settings' }));

      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    });

    it('should show leave family button when not only member', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByRole('tab', { name: 'Settings' }));

      expect(screen.getByRole('button', { name: /Leave Family/i })).toBeInTheDocument();
    });

    it('should show delete family button for admin', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByRole('tab', { name: 'Settings' }));

      expect(screen.getByRole('button', { name: /Delete Family/i })).toBeInTheDocument();
    });
  });

  describe('Danger Zone Actions', () => {
    it('should open delete family alert', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByRole('tab', { name: 'Settings' }));
      await user.click(screen.getByRole('button', { name: /Delete Family/i }));

      expect(screen.getByText('Delete Family?')).toBeInTheDocument();
    });

    it('should delete family when confirmed', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByRole('tab', { name: 'Settings' }));
      await user.click(screen.getByRole('button', { name: /Delete Family/i }));
      await user.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(mockFamilyContext.deleteFamily).toHaveBeenCalledWith('fam1');
      });
    });
  });

  describe('Role Changes', () => {
    it('should update member role', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));

      const roleSelector = screen.getByRole('combobox');
      await user.click(roleSelector);
      await user.click(screen.getByRole('option', { name: 'Admin' }));

      expect(mockFamilyContext.updateMemberRole).toHaveBeenCalledWith('member2', 'admin');
    });
  });

  describe('Member Removal', () => {
    it('should show confirmation when removing member', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));
      await user.click(screen.getByLabelText('Remove Member'));

      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Send Invitation')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove Member')).toBeInTheDocument();
    });

    it('should have proper tab structure', async () => {
      const user = userEvent.setup();
      render(<FamilySettingsDialog />);

      await user.click(screen.getByLabelText('Open Family Settings'));

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });
  });
});
