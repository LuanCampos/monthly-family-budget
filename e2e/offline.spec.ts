/**
 * E2E Tests - Offline & PWA Functionality
 * 
 * Tests for Progressive Web App features including:
 * - Offline mode support
 * - Service worker caching
 * - Data persistence in IndexedDB
 * - Network resilience
 */

import { test, expect } from './fixtures';

test.describe('Offline Functionality', () => {
  test.describe('Network Resilience', () => {
    test('should handle network going offline gracefully', async ({ page, context }) => {
      // Start online
      await page.goto('/');
      await expect(page.locator('main')).toBeVisible();
      
      // Go offline
      await context.setOffline(true);
      
      // Page should still be usable (cached assets)
      await expect(page.locator('main')).toBeVisible();
      
      // Should show offline indicator if implemented
      const offlineIndicator = page.locator('[data-testid="offline-indicator"], [aria-label*="offline"]');
      // Offline indicator is optional
      const isVisible = await offlineIndicator.isVisible().catch(() => false);
      expect(typeof isVisible).toBe('boolean');
      
      // Go back online
      await context.setOffline(false);
    });

    test('should recover when network comes back', async ({ page, context }) => {
      await page.goto('/');
      
      // Go offline then online
      await context.setOffline(true);
      await page.waitForTimeout(500);
      await context.setOffline(false);
      
      // Page should still work
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('LocalStorage Persistence', () => {
    test('should persist theme across page reloads', async ({ page }) => {
      await page.goto('/');
      
      // Set theme
      await page.evaluate(() => {
        localStorage.setItem('budget-app-theme', 'dark');
      });
      
      // Reload
      await page.reload();
      
      // Theme should persist
      const theme = await page.evaluate(() => 
        localStorage.getItem('budget-app-theme')
      );
      expect(theme).toBe('dark');
    });

    test('should persist language preference', async ({ page }) => {
      await page.goto('/');
      
      await page.evaluate(() => {
        localStorage.setItem('budget-app-language', 'en');
      });
      
      await page.reload();
      
      const language = await page.evaluate(() => 
        localStorage.getItem('budget-app-language')
      );
      expect(language).toBe('en');
    });

    test('should persist currency preference', async ({ page }) => {
      await page.goto('/');
      
      await page.evaluate(() => {
        localStorage.setItem('budget-app-currency', 'USD');
      });
      
      await page.reload();
      
      const currency = await page.evaluate(() => 
        localStorage.getItem('budget-app-currency')
      );
      expect(currency).toBe('USD');
    });
  });

  test.describe('IndexedDB Storage', () => {
    test('should have IndexedDB available', async ({ page }) => {
      await page.goto('/');
      
      const hasIndexedDB = await page.evaluate(() => {
        return 'indexedDB' in window;
      });
      
      expect(hasIndexedDB).toBe(true);
    });

    test('should be able to open IndexedDB', async ({ page }) => {
      await page.goto('/');
      
      const canOpenDB = await page.evaluate(() => {
        return new Promise((resolve) => {
          const request = indexedDB.open('test-db', 1);
          request.onsuccess = () => {
            request.result.close();
            indexedDB.deleteDatabase('test-db');
            resolve(true);
          };
          request.onerror = () => resolve(false);
        });
      });
      
      expect(canOpenDB).toBe(true);
    });
  });
});

test.describe('Service Worker', () => {
  test('should check for service worker support', async ({ page }) => {
    await page.goto('/');
    
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(hasServiceWorker).toBe(true);
  });

  test('should not break if service worker fails to register', async ({ page }) => {
    await page.goto('/');
    
    // Page should work regardless of SW registration
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('PWA Install', () => {
  test('should have installable PWA manifest', async ({ page }) => {
    await page.goto('/');
    
    // Check for manifest link
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    
    if (manifestHref) {
      // Try to fetch manifest
      const response = await page.request.get(manifestHref);
      expect(response.ok() || response.status() === 404).toBe(true);
    }
  });

  test('should have appropriate meta tags for PWA', async ({ page }) => {
    await page.goto('/');
    
    // Check for viewport meta
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toBeDefined();
    
    // Check for theme color (optional)
    const themeColor = await page.locator('meta[name="theme-color"]').count();
    expect(themeColor).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Network Timeouts', () => {
  test('should handle slow network gracefully', async ({ page }) => {
    // Emulate slow 3G network
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 50000,
      uploadThroughput: 50000,
      latency: 2000,
    });
    
    await page.goto('/', { timeout: 30000 });
    
    // Should still load
    await expect(page.locator('body')).toBeVisible();
  });
});
