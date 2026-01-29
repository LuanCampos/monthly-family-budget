import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TriggerButton } from './TriggerButton';
import { makeMockUser } from '@/test/mocks/common/makeMockUser';

describe('TriggerButton', () => {
  const mockUser = makeMockUser();

  it('should render settings icon when no user', () => {
    render(<TriggerButton />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Open user menu');
  });

  it('should render avatar when user is provided', () => {
    const getDisplayName = () => 'John Doe';
    const getUserInitials = () => 'JD';

    render(
      <TriggerButton
        user={mockUser}
        getDisplayName={getDisplayName}
        getUserInitials={getUserInitials}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should show fallback initials when no avatar', () => {
    const userWithoutAvatar = {
      ...mockUser,
      user_metadata: {},
    };
    const getUserInitials = () => 'JD';

    render(
      <TriggerButton
        user={userWithoutAvatar}
        getUserInitials={getUserInitials}
      />
    );

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('should show question mark when no getUserInitials provided', () => {
    const userWithoutAvatar = {
      ...mockUser,
      user_metadata: {},
    };

    render(<TriggerButton user={userWithoutAvatar} />);

    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('should show pending invitations badge', () => {
    const pendingInvitations = [{ id: '1' }, { id: '2' }];

    render(<TriggerButton myPendingInvitations={pendingInvitations} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should not show badge when no pending invitations', () => {
    render(<TriggerButton myPendingInvitations={[]} />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<TriggerButton onClick={onClick} />);

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should accept custom aria-label', () => {
    render(<TriggerButton aria-label="Custom label" />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom label');
  });

  it('should accept custom className', () => {
    render(<TriggerButton className="custom-class" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});
