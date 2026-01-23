/**
 * E2E Test Fixtures
 * 
 * Custom fixtures for testing the Monthly Family Budget PWA
 * including authenticated state and offline scenarios.
 */

import { test as base, expect } from '@playwright/test';

// Extend the base test with custom fixtures for authenticated state
export const test = base.extend({
  // Fixture for authenticated state (mocked)
  authenticatedPage: async ({ page }, use: () => Promise<void>) => {
    // Set up local storage to simulate authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('budget-app-theme', 'light');
      localStorage.setItem('budget-app-language', 'pt');
      localStorage.setItem('budget-app-currency', 'BRL');
    });
    
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use();
  },
});

export { expect };

/**
 * Page Object Model - Budget Page
 */
export class BudgetPage {
  constructor(private page: ReturnType<typeof test['page']>) {}

  async goto() {
    await this.page.goto('/');
  }

  async waitForLoad() {
    // Wait for the main content to load
    await this.page.waitForSelector('[data-testid="budget-page"], [data-testid="family-setup"]', {
      timeout: 10000,
    });
  }

  async getMonthSelector() {
    return this.page.locator('[data-testid="month-selector"]');
  }

  async getExpenseList() {
    return this.page.locator('[data-testid="expense-list"]');
  }

  async clickAddExpense() {
    await this.page.click('[data-testid="add-expense-button"]');
  }

  async fillExpenseForm(data: { title: string; value: string; category?: string }) {
    await this.page.fill('[data-testid="expense-title-input"]', data.title);
    await this.page.fill('[data-testid="expense-value-input"]', data.value);
    
    if (data.category) {
      await this.page.click('[data-testid="expense-category-select"]');
      await this.page.click(`[data-value="${data.category}"]`);
    }
  }

  async saveExpense() {
    await this.page.click('[data-testid="save-expense-button"]');
  }
}

/**
 * Page Object Model - Goals Page
 */
export class GoalsPage {
  constructor(private page: ReturnType<typeof test['page']>) {}

  async goto() {
    await this.page.goto('/goals');
  }

  async waitForLoad() {
    await this.page.waitForSelector('[data-testid="goals-page"]', {
      timeout: 10000,
    });
  }

  async getGoalCards() {
    return this.page.locator('[data-testid="goal-card"]');
  }

  async clickAddGoal() {
    await this.page.click('[data-testid="add-goal-button"]');
  }

  async fillGoalForm(data: { name: string; targetValue: string }) {
    await this.page.fill('[data-testid="goal-name-input"]', data.name);
    await this.page.fill('[data-testid="goal-target-input"]', data.targetValue);
  }

  async saveGoal() {
    await this.page.click('[data-testid="save-goal-button"]');
  }
}
