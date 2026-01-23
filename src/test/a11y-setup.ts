/**
 * Accessibility Testing Setup
 * 
 * This file provides utilities for running axe-core accessibility tests
 * in Vitest with React Testing Library.
 */

import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { expect } from 'vitest';

// Extend Vitest matchers with axe matchers
expect.extend(matchers);

// Helper to run axe on a container element with config
export async function checkA11y(container: Element) {
  const results = await axe(container, {
    rules: {
      // Disable rules that are too strict for component-level testing
      'region': { enabled: false }, // Components may not have landmark regions
      'page-has-heading-one': { enabled: false }, // Not applicable to individual components
      'landmark-one-main': { enabled: false }, // Not applicable to individual components
      'bypass': { enabled: false }, // Skip link not needed for components
    },
  });
  expect(results).toHaveNoViolations();
}

// Re-export axe for direct usage
export { axe };

// Type declaration for vitest-axe matchers
declare module 'vitest' {
  interface Assertion<T> {
    toHaveNoViolations(): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
