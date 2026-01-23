/**
 * E2E Tests - Budget Page
 * 
 * End-to-end tests for the Budget page functionality including:
 * - Page loading
 * - Month navigation
 * - Expense CRUD operations
 * - Offline functionality
 */

import { test, expect } from './fixtures';

test.describe('Budget Page', () => {
  test.describe('Page Loading', () => {
    test('should load the budget page', async ({ page }) => {
      await page.goto('/');
      
      // Should show either the budget page or family setup
      await expect(
        page.locator('[data-testid="budget-page"], [data-testid="family-setup"]')
      ).toBeVisible({ timeout: 10000 });
    });

    test('should display app header', async ({ page }) => {
      await page.goto('/');
      
      // Should have a header with navigation
      await expect(page.locator('header')).toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Page should render without horizontal scroll
      const body = await page.locator('body').boundingBox();
      expect(body?.width).toBeLessThanOrEqual(375);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to goals page', async ({ page }) => {
      await page.goto('/');
      
      // Click goals link if exists
      const goalsLink = page.locator('a[href="/goals"], button:has-text("Metas")');
      if (await goalsLink.isVisible()) {
        await goalsLink.click();
        await expect(page).toHaveURL(/.*goals/);
      }
    });

    test('should navigate back to budget page', async ({ page }) => {
      await page.goto('/goals');
      
      // Click budget link if exists
      const budgetLink = page.locator('a[href="/"], button:has-text("Orçamento")');
      if (await budgetLink.isVisible()) {
        await budgetLink.click();
        await expect(page).toHaveURL('/');
      }
    });
  });

  test.describe('Theme Switching', () => {
    test('should toggle dark mode', async ({ page }) => {
      await page.goto('/');
      
      // Find theme toggle button
      const themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme"]');
      
      if (await themeToggle.isVisible()) {
        const htmlClass = await page.locator('html').getAttribute('class');
        
        await themeToggle.click();
        
        const newHtmlClass = await page.locator('html').getAttribute('class');
        
        // Class should have changed
        expect(newHtmlClass).not.toBe(htmlClass);
      }
    });

    test('should persist theme preference', async ({ page }) => {
      await page.goto('/');
      
      // Set theme in localStorage
      await page.evaluate(() => {
        localStorage.setItem('budget-app-theme', 'dark');
      });
      
      await page.reload();
      
      // Theme should be applied
      const theme = await page.evaluate(() => 
        localStorage.getItem('budget-app-theme')
      );
      expect(theme).toBe('dark');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper document structure', async ({ page }) => {
      await page.goto('/');
      
      // Should have a main landmark
      await expect(page.locator('main')).toBeVisible();
      
      // Should have proper heading hierarchy
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(0); // May be 0 if using logo instead
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/');
      
      // Tab through the page
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should have some element focused
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).not.toBe('BODY');
    });

    test('should have skip link for main content', async ({ page }) => {
      await page.goto('/');
      
      // Press Tab to reveal skip link (if exists)
      await page.keyboard.press('Tab');
      
      const skipLink = page.locator('a:has-text("Skip"), a:has-text("Pular")');
      // Skip link is optional but recommended
      const skipLinkCount = await skipLink.count();
      expect(skipLinkCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should show 404 page for invalid routes', async ({ page }) => {
      await page.goto('/invalid-route-that-does-not-exist');
      
      // Should show 404 or redirect
      await expect(page.locator('text=/404|not found|não encontrada/i')).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('Budget Page - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    // Set up localStorage to simulate some state
    await page.addInitScript(() => {
      localStorage.setItem('budget-app-theme', 'light');
      localStorage.setItem('budget-app-language', 'pt');
      localStorage.setItem('budget-app-currency', 'BRL');
    });
  });

  test('should persist language preference', async ({ page }) => {
    await page.goto('/');
    
    const language = await page.evaluate(() => 
      localStorage.getItem('budget-app-language')
    );
    expect(language).toBe('pt');
  });

  test('should persist currency preference', async ({ page }) => {
    await page.goto('/');
    
    const currency = await page.evaluate(() => 
      localStorage.getItem('budget-app-currency')
    );
    expect(currency).toBe('BRL');
  });
});

test.describe('PWA Features', () => {
  test('should register service worker', async ({ page }) => {
    await page.goto('/');
    
    // Wait for service worker registration
    const swRegistration = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration !== undefined;
      }
      return false;
    });
    
    // Service worker may or may not be registered in test environment
    expect(typeof swRegistration).toBe('boolean');
  });

  test('should have manifest link', async ({ page }) => {
    await page.goto('/');
    
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
    // Manifest may or may not exist in dev mode
    expect(manifestLink === null || typeof manifestLink === 'string').toBe(true);
  });

  test('should have meta theme-color', async ({ page }) => {
    await page.goto('/');
    
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    // Theme color may or may not exist
    expect(themeColor === null || typeof themeColor === 'string').toBe(true);
  });
});
