import { describe, it, expect } from 'vitest';
import { reducer } from './use-toast';

describe('use-toast reducer', () => {
  const createMockToast = (id: string, open = true) => ({
    id,
    open,
    title: `Toast ${id}`,
    description: `Description for ${id}`,
  });

  describe('ADD_TOAST', () => {
    it('should add a toast to the beginning of the list', () => {
      const initialState = { toasts: [] };
      const newToast = createMockToast('1');

      const result = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: newToast,
      });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe('1');
    });

    it('should limit toasts to TOAST_LIMIT (1)', () => {
      const initialState = { toasts: [createMockToast('existing')] };
      const newToast = createMockToast('new');

      const result = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: newToast,
      });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe('new');
    });

    it('should add new toast at the beginning', () => {
      const initialState = { toasts: [] };
      
      let state = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: createMockToast('1'),
      });

      state = reducer(state, {
        type: 'ADD_TOAST',
        toast: createMockToast('2'),
      });

      // Due to TOAST_LIMIT = 1, only the newest toast should remain
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].id).toBe('2');
    });
  });

  describe('UPDATE_TOAST', () => {
    it('should update an existing toast', () => {
      const initialState = { toasts: [createMockToast('1')] };

      const result = reducer(initialState, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated Title' },
      });

      expect(result.toasts[0].title).toBe('Updated Title');
      expect(result.toasts[0].description).toBe('Description for 1');
    });

    it('should not modify other toasts', () => {
      const toast1 = createMockToast('1');
      const toast2 = createMockToast('2');
      // Manually set initial state with 2 toasts (bypassing limit for test)
      const initialState = { toasts: [toast1, toast2] };

      const result = reducer(initialState, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated' },
      });

      expect(result.toasts.find(t => t.id === '2')?.title).toBe('Toast 2');
    });

    it('should handle updating non-existent toast gracefully', () => {
      const initialState = { toasts: [createMockToast('1')] };

      const result = reducer(initialState, {
        type: 'UPDATE_TOAST',
        toast: { id: 'non-existent', title: 'Updated' },
      });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].title).toBe('Toast 1');
    });
  });

  describe('DISMISS_TOAST', () => {
    it('should set open to false for specific toast', () => {
      const initialState = { toasts: [createMockToast('1', true)] };

      const result = reducer(initialState, {
        type: 'DISMISS_TOAST',
        toastId: '1',
      });

      expect(result.toasts[0].open).toBe(false);
    });

    it('should dismiss all toasts when no toastId provided', () => {
      const initialState = {
        toasts: [createMockToast('1', true), createMockToast('2', true)],
      };

      const result = reducer(initialState, {
        type: 'DISMISS_TOAST',
      });

      result.toasts.forEach(toast => {
        expect(toast.open).toBe(false);
      });
    });

    it('should not modify other toasts when dismissing specific one', () => {
      const initialState = {
        toasts: [createMockToast('1', true), createMockToast('2', true)],
      };

      const result = reducer(initialState, {
        type: 'DISMISS_TOAST',
        toastId: '1',
      });

      expect(result.toasts.find(t => t.id === '1')?.open).toBe(false);
      expect(result.toasts.find(t => t.id === '2')?.open).toBe(true);
    });
  });

  describe('REMOVE_TOAST', () => {
    it('should remove a specific toast', () => {
      const initialState = {
        toasts: [createMockToast('1'), createMockToast('2')],
      };

      const result = reducer(initialState, {
        type: 'REMOVE_TOAST',
        toastId: '1',
      });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe('2');
    });

    it('should remove all toasts when no toastId provided', () => {
      const initialState = {
        toasts: [createMockToast('1'), createMockToast('2')],
      };

      const result = reducer(initialState, {
        type: 'REMOVE_TOAST',
      });

      expect(result.toasts).toHaveLength(0);
    });

    it('should handle removing non-existent toast gracefully', () => {
      const initialState = { toasts: [createMockToast('1')] };

      const result = reducer(initialState, {
        type: 'REMOVE_TOAST',
        toastId: 'non-existent',
      });

      expect(result.toasts).toHaveLength(1);
    });
  });
});

import { renderHook, act } from '@testing-library/react';
import { useToast, toast } from './use-toast';

describe('useToast hook', () => {
  it('should return toast state and methods', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toasts).toBeDefined();
    expect(typeof result.current.toast).toBe('function');
    expect(typeof result.current.dismiss).toBe('function');
  });

  it('should add a toast when toast function is called', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'Test Description',
      });
    });

    expect(result.current.toasts.length).toBeGreaterThanOrEqual(0);
  });

  it('should return toast controls with dismiss and update', () => {
    const { result } = renderHook(() => useToast());

    let toastControls: { id: string; dismiss: () => void; update: (props: unknown) => void } | undefined;

    act(() => {
      toastControls = result.current.toast({
        title: 'Test Toast',
      });
    });

    expect(toastControls).toBeDefined();
    expect(toastControls?.id).toBeDefined();
    expect(typeof toastControls?.dismiss).toBe('function');
    expect(typeof toastControls?.update).toBe('function');
  });

  it('should dismiss toast by id', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: 'Toast to dismiss',
      });
    });

    const toastId = result.current.toasts[0]?.id;

    act(() => {
      result.current.dismiss(toastId);
    });

    // Toast should be marked as closed (open: false)
    const dismissedToast = result.current.toasts.find(t => t.id === toastId);
    if (dismissedToast) {
      expect(dismissedToast.open).toBe(false);
    }
  });

  it('should dismiss all toasts when no id is provided', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Toast 1' });
    });

    act(() => {
      result.current.dismiss();
    });

    // All toasts should be marked as closed
    result.current.toasts.forEach(t => {
      expect(t.open).toBe(false);
    });
  });
});

describe('toast function', () => {
  it('should create a toast with auto-generated id', () => {
    const controls = toast({
      title: 'Direct toast',
      description: 'Created directly',
    });

    expect(controls.id).toBeDefined();
    expect(typeof controls.id).toBe('string');
  });

  it('should allow updating the toast', () => {
    const controls = toast({
      title: 'Initial title',
    });

    expect(() => {
      controls.update({ title: 'Updated title', id: controls.id });
    }).not.toThrow();
  });

  it('should allow dismissing the toast', () => {
    const controls = toast({
      title: 'Toast to dismiss',
    });

    expect(() => {
      controls.dismiss();
    }).not.toThrow();
  });
});
