import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnlineStatusBar } from './OnlineStatusBar';

// Mock OnlineContext
const mockOnlineContext = {
  isOnline: true,
  isSyncing: false,
  pendingSyncCount: 0,
  syncNow: vi.fn(),
};

vi.mock('@/contexts/OnlineContext', () => ({
  useOnline: () => mockOnlineContext,
}));

// Mock LanguageContext
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        online: 'Online',
        offline: 'Offline',
        pendingChanges: 'pending changes',
      };
      return translations[key] || key;
    },
  }),
}));

describe('OnlineStatusBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock to default values
    mockOnlineContext.isOnline = true;
    mockOnlineContext.isSyncing = false;
    mockOnlineContext.pendingSyncCount = 0;
  });

  it('should not render when online with no pending changes', () => {
    const { container } = render(<OnlineStatusBar />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should render offline status when not online', () => {
    mockOnlineContext.isOnline = false;
    
    render(<OnlineStatusBar />);
    
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('should render online status with pending changes', () => {
    mockOnlineContext.pendingSyncCount = 3;
    
    render(<OnlineStatusBar />);
    
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText(/3 pending changes/)).toBeInTheDocument();
  });

  it('should render offline status with pending changes', () => {
    mockOnlineContext.isOnline = false;
    mockOnlineContext.pendingSyncCount = 5;
    
    render(<OnlineStatusBar />);
    
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByText(/5 pending changes/)).toBeInTheDocument();
  });

  it('should show sync button when online with pending changes', () => {
    mockOnlineContext.pendingSyncCount = 2;
    
    render(<OnlineStatusBar />);
    
    // Should find a button (the sync button)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should not show sync button when offline', () => {
    mockOnlineContext.isOnline = false;
    mockOnlineContext.pendingSyncCount = 2;
    
    render(<OnlineStatusBar />);
    
    // Should not have sync button when offline
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });

  it('should call syncNow when sync button is clicked', async () => {
    const user = userEvent.setup();
    mockOnlineContext.pendingSyncCount = 2;
    
    render(<OnlineStatusBar />);
    
    const syncButton = screen.getByRole('button');
    await user.click(syncButton);
    
    expect(mockOnlineContext.syncNow).toHaveBeenCalledTimes(1);
  });

  it('should disable sync button when syncing', () => {
    mockOnlineContext.pendingSyncCount = 2;
    mockOnlineContext.isSyncing = true;
    
    render(<OnlineStatusBar />);
    
    const syncButton = screen.getByRole('button');
    expect(syncButton).toBeDisabled();
  });

  it('should have correct styling when online', () => {
    mockOnlineContext.pendingSyncCount = 1;
    
    const { container } = render(<OnlineStatusBar />);
    
    const statusBar = container.firstChild as HTMLElement;
    expect(statusBar.className).toContain('bg-primary');
  });

  it('should have correct styling when offline', () => {
    mockOnlineContext.isOnline = false;
    
    const { container } = render(<OnlineStatusBar />);
    
    const statusBar = container.firstChild as HTMLElement;
    expect(statusBar.className).toContain('bg-warning');
  });
});
