import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
  interface Window {
    deferredPWAPrompt?: BeforeInstallPromptEvent;
  }
}

interface UsePWAInstallReturn {
  /** Whether the app can be installed (prompt is available) */
  canInstall: boolean;
  /** Whether the app is already installed as PWA */
  isInstalled: boolean;
  /** Whether we're on a supported platform (Android/Chrome) */
  isSupported: boolean;
  /** Trigger the install prompt */
  installApp: () => Promise<boolean>;
}

// Capture the event globally before React mounts
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPWAPrompt = e as BeforeInstallPromptEvent;
  }, { once: true });
}

/**
 * Hook to manage PWA installation.
 * Only shows install option when:
 * - User is on a supported browser (Chrome on Android)
 * - App is not already installed
 * - Browser has triggered beforeinstallprompt
 */
export const usePWAInstall = (): UsePWAInstallReturn => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => window.deferredPWAPrompt || null
  );
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if running as installed PWA
  useEffect(() => {
    const checkInstalled = () => {
      // Check display-mode media query
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check iOS standalone mode
      const isIOSStandalone = ('standalone' in navigator) && (navigator as unknown as { standalone: boolean }).standalone;
      
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstalled();

    // Listen for display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkInstalled();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Capture the beforeinstallprompt event
  useEffect(() => {
    // Check if we already have a deferred prompt from the global handler
    if (window.deferredPWAPrompt && !deferredPrompt) {
      setDeferredPrompt(window.deferredPWAPrompt);
      logger.debug('pwa.install.prompt.restored', { platforms: window.deferredPWAPrompt.platforms });
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event for later use
      setDeferredPrompt(e);
      window.deferredPWAPrompt = e;
      logger.debug('pwa.install.prompt.ready', { platforms: e.platforms });
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      window.deferredPWAPrompt = undefined;
      setIsInstalled(true);
      logger.info('pwa.install.completed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  // Check if browser supports PWA install
  const isSupported = 'BeforeInstallPromptEvent' in window || 
    ('serviceWorker' in navigator && 'PushManager' in window);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      logger.warn('pwa.install.no.prompt');
      return false;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;
      
      logger.info('pwa.install.user.choice', { outcome });
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('pwa.install.error', { error });
      return false;
    }
  }, [deferredPrompt]);

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    isInstalled,
    isSupported,
    installApp,
  };
};
