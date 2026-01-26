/**
 * SettingsDialogs Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteFamilyAlert, LeaveFamilyAlert, CreateFamilyDialog } from './SettingsDialogs';

describe('SettingsDialogs', () => {
  const mockT = (key: string) => key;

  describe('DeleteFamilyAlert', () => {
    const defaultProps = {
      open: true,
      onOpenChange: vi.fn(),
      isCurrentOffline: false,
      isDeleting: false,
      onDelete: vi.fn(),
      t: mockT,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render when open', () => {
      render(<DeleteFamilyAlert {...defaultProps} />);
      
      expect(screen.getByText('deleteFamilyConfirm')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<DeleteFamilyAlert {...defaultProps} open={false} />);
      
      expect(screen.queryByText('deleteFamilyConfirm')).not.toBeInTheDocument();
    });

    it('should show offline warning when isCurrentOffline is true', () => {
      render(<DeleteFamilyAlert {...defaultProps} isCurrentOffline={true} />);
      
      expect(screen.getByText('deleteFamilyWarning')).toBeInTheDocument();
    });

    it('should show online warning when isCurrentOffline is false', () => {
      render(<DeleteFamilyAlert {...defaultProps} isCurrentOffline={false} />);
      
      expect(screen.getByText('deleteFamilyWarningOnline')).toBeInTheDocument();
    });

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteFamilyAlert {...defaultProps} />);
      
      await user.click(screen.getByText('delete'));
      
      expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
    });

    it('should call onOpenChange when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteFamilyAlert {...defaultProps} />);
      
      await user.click(screen.getByText('cancel'));
      
      expect(defaultProps.onOpenChange).toHaveBeenCalled();
    });

    it('should disable buttons when isDeleting is true', () => {
      render(<DeleteFamilyAlert {...defaultProps} isDeleting={true} />);
      
      expect(screen.getByText('cancel')).toBeDisabled();
      expect(screen.getByText('delete')).toBeDisabled();
    });
  });

  describe('LeaveFamilyAlert', () => {
    const defaultProps = {
      open: true,
      onOpenChange: vi.fn(),
      isLeaving: false,
      onLeave: vi.fn(),
      t: mockT,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render when open', () => {
      render(<LeaveFamilyAlert {...defaultProps} />);
      
      expect(screen.getByText('leaveFamilyConfirm')).toBeInTheDocument();
      expect(screen.getByText('leaveFamilyWarning')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<LeaveFamilyAlert {...defaultProps} open={false} />);
      
      expect(screen.queryByText('leaveFamilyConfirm')).not.toBeInTheDocument();
    });

    it('should call onLeave when leave button is clicked', async () => {
      const user = userEvent.setup();
      render(<LeaveFamilyAlert {...defaultProps} />);
      
      await user.click(screen.getByText('leave'));
      
      expect(defaultProps.onLeave).toHaveBeenCalledTimes(1);
    });

    it('should call onOpenChange when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<LeaveFamilyAlert {...defaultProps} />);
      
      await user.click(screen.getByText('cancel'));
      
      expect(defaultProps.onOpenChange).toHaveBeenCalled();
    });

    it('should disable buttons when isLeaving is true', () => {
      render(<LeaveFamilyAlert {...defaultProps} isLeaving={true} />);
      
      expect(screen.getByText('cancel')).toBeDisabled();
      expect(screen.getByText('leave')).toBeDisabled();
    });
  });

  describe('CreateFamilyDialog', () => {
    const defaultProps = {
      open: true,
      onOpenChange: vi.fn(),
      familyName: '',
      onFamilyNameChange: vi.fn(),
      isCreating: false,
      onCreate: vi.fn(),
      t: mockT,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render when open', () => {
      render(<CreateFamilyDialog {...defaultProps} />);
      
      // Dialog title and button have same text, use getAllByText and check count
      const elements = screen.getAllByText('createFamily');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should not render when closed', () => {
      render(<CreateFamilyDialog {...defaultProps} open={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should call onFamilyNameChange when input changes', async () => {
      const user = userEvent.setup();
      render(<CreateFamilyDialog {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('familyNamePlaceholder');
      await user.type(input, 'My Family');
      
      expect(defaultProps.onFamilyNameChange).toHaveBeenCalled();
    });

    it('should call onCreate when create button is clicked with valid name', async () => {
      const user = userEvent.setup();
      render(<CreateFamilyDialog {...defaultProps} familyName="Test Family" />);
      
      // Find the create button by role
      const buttons = screen.getAllByRole('button');
      const createButton = buttons.find(btn => btn.textContent?.includes('createFamily') && !btn.textContent?.includes('cancel'));
      
      if (createButton) {
        await user.click(createButton);
        expect(defaultProps.onCreate).toHaveBeenCalledTimes(1);
      }
    });

    it('should disable create button when familyName is empty', () => {
      render(<CreateFamilyDialog {...defaultProps} familyName="" />);
      
      // Find the create button by role
      const buttons = screen.getAllByRole('button');
      const createButton = buttons.find(btn => btn.textContent?.includes('createFamily') && !btn.textContent?.includes('cancel'));
      
      expect(createButton).toBeDisabled();
    });

    it('should disable create button when isCreating is true', () => {
      render(<CreateFamilyDialog {...defaultProps} familyName="Test" isCreating={true} />);
      
      const buttons = screen.getAllByRole('button');
      const createButton = buttons.find(btn => btn.textContent?.includes('createFamily') && !btn.textContent?.includes('cancel'));
      
      expect(createButton).toBeDisabled();
    });

    it('should call onCreate when Enter is pressed in input', () => {
      render(<CreateFamilyDialog {...defaultProps} familyName="Test Family" />);
      
      const input = screen.getByPlaceholderText('familyNamePlaceholder');
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(defaultProps.onCreate).toHaveBeenCalledTimes(1);
    });

    it('should call onOpenChange when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateFamilyDialog {...defaultProps} />);
      
      await user.click(screen.getByText('cancel'));
      
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should show loader when isCreating is true', () => {
      render(<CreateFamilyDialog {...defaultProps} familyName="Test" isCreating={true} />);
      
      // Look for the Loader2 element (SVG with animate-spin class)
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });
});
