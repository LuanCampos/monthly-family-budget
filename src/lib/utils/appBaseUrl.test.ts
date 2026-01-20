import { describe, it, expect } from 'vitest';
import { getAppBaseUrl } from './appBaseUrl';

describe('appBaseUrl', () => {
  it('should return a valid URL string', () => {
    const result = getAppBaseUrl();
    
    // The result should be a valid URL string
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/^https?:\/\//);
  });

  it('should return a URL based on current origin', () => {
    const result = getAppBaseUrl();
    
    // Should contain the current location origin
    expect(result).toContain(window.location.origin);
  });

  it('should return a URL ending with a slash', () => {
    const result = getAppBaseUrl();
    
    // BASE_URL always ends with slash in Vite
    expect(result.endsWith('/')).toBe(true);
  });

  it('should return consistent results on multiple calls', () => {
    const result1 = getAppBaseUrl();
    const result2 = getAppBaseUrl();
    
    expect(result1).toBe(result2);
  });
});
