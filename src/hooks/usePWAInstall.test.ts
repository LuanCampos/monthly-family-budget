import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePWAInstall } from './usePWAInstall';

describe('usePWAInstall', () => {
  const originalMatchMedia = window.matchMedia;
  const originalNavigator = window.navigator;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(display-mode: standalone)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
    Object.defineProperty(window, 'navigator', {
      writable: true,
      value: originalNavigator,
    });
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.canInstall).toBe(false);
    expect(result.current.isInstalled).toBe(false);
    expect(typeof result.current.installApp).toBe('function');
  });

  it('should detect when app is installed (standalone mode)', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('should capture beforeinstallprompt event', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockEvent = {
      preventDefault: vi.fn(),
      platforms: ['web', 'android'],
      prompt: mockPrompt,
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'android' }),
    };

    await act(async () => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), mockEvent)
      );
    });

    expect(result.current.canInstall).toBe(true);
  });

  it('should call prompt when installApp is called', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockEvent = {
      preventDefault: vi.fn(),
      platforms: ['web', 'android'],
      prompt: mockPrompt,
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'android' }),
    };

    await act(async () => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), mockEvent)
      );
    });

    let installResult: boolean = false;
    await act(async () => {
      installResult = await result.current.installApp();
    });

    expect(mockPrompt).toHaveBeenCalled();
    expect(installResult).toBe(true);
  });

  it('should return false when user dismisses install prompt', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockEvent = {
      preventDefault: vi.fn(),
      platforms: ['web', 'android'],
      prompt: mockPrompt,
      userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'android' }),
    };

    await act(async () => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), mockEvent)
      );
    });

    let installResult: boolean = true;
    await act(async () => {
      installResult = await result.current.installApp();
    });

    expect(installResult).toBe(false);
  });

  it('should return false when no prompt is available', async () => {
    const { result } = renderHook(() => usePWAInstall());

    let installResult: boolean = true;
    await act(async () => {
      installResult = await result.current.installApp();
    });

    expect(installResult).toBe(false);
  });

  it('should update isInstalled when appinstalled event fires', async () => {
    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isInstalled).toBe(false);

    await act(async () => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('should clear deferredPrompt after successful install', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockEvent = {
      preventDefault: vi.fn(),
      platforms: ['web', 'android'],
      prompt: mockPrompt,
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'android' }),
    };

    await act(async () => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), mockEvent)
      );
    });

    expect(result.current.canInstall).toBe(true);

    await act(async () => {
      await result.current.installApp();
    });

    expect(result.current.canInstall).toBe(false);
  });
});
