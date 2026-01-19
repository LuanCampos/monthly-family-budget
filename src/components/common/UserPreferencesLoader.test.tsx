import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserPreferencesLoader } from './UserPreferencesLoader';

// Mock the contexts and hooks
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    loading: false,
  }),
}));

vi.mock('@/hooks/useUserPreferences', () => ({
  useUserPreferences: vi.fn(),
}));

describe('UserPreferencesLoader', () => {
  it('should render children', () => {
    render(
      <UserPreferencesLoader>
        <div data-testid="child">Child Content</div>
      </UserPreferencesLoader>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('should call useUserPreferences hook', async () => {
    const { useUserPreferences } = await import('@/hooks/useUserPreferences');

    render(
      <UserPreferencesLoader>
        <div>Content</div>
      </UserPreferencesLoader>
    );

    expect(useUserPreferences).toHaveBeenCalled();
  });
});
