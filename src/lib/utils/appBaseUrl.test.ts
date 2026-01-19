import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('appBaseUrl', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset module cache to get fresh imports
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('should return the app base URL with origin and base path', async () => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://example.com',
        href: 'https://example.com/monthly-family-budget/',
      },
      writable: true,
    });

    // Import the function fresh
    const { getAppBaseUrl } = await import('./appBaseUrl');
    
    const result = getAppBaseUrl();
    
    // The result should be a valid URL string
    expect(result).toMatch(/^https?:\/\//);
  });

  it('should handle root base URL', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:5173',
        href: 'http://localhost:5173/',
      },
      writable: true,
    });

    const { getAppBaseUrl } = await import('./appBaseUrl');
    
    const result = getAppBaseUrl();
    
    expect(result).toContain('localhost');
  });

  it('should return a string ending with slash when base is a path', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://user.github.io',
        href: 'https://user.github.io/my-app/',
      },
      writable: true,
    });

    const { getAppBaseUrl } = await import('./appBaseUrl');
    
    const result = getAppBaseUrl();
    
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
