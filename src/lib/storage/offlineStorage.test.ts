import { describe, it, expect } from 'vitest';
import { generateOfflineId, isOfflineId, type SyncQueueItem } from './offlineStorage';

describe('offlineStorage utilities', () => {
  describe('generateOfflineId', () => {
    it('should generate ID with default prefix', () => {
      const id = generateOfflineId();
      expect(id).toMatch(/^offline-\d+-[a-z0-9]+$/);
    });

    it('should generate ID with custom prefix', () => {
      const id = generateOfflineId('exp');
      expect(id).toMatch(/^exp-\d+-[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateOfflineId());
      }
      expect(ids.size).toBe(100); // All unique
    });

    it('should include timestamp in ID', () => {
      const before = Date.now();
      const id = generateOfflineId();
      const after = Date.now();
      
      // Extract timestamp from ID (format: prefix-timestamp-random)
      const parts = id.split('-');
      const timestamp = parseInt(parts[1], 10);
      
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should generate IDs with various prefixes', () => {
      const prefixes = ['family', 'exp', 'rec', 'sub', 'goal', 'gentry'];
      
      prefixes.forEach(prefix => {
        const id = generateOfflineId(prefix);
        expect(id.startsWith(`${prefix}-`)).toBe(true);
      });
    });
  });

  describe('isOfflineId', () => {
    it('should identify offline IDs correctly', () => {
      // Offline IDs
      expect(isOfflineId('offline-1234567890-abc123def')).toBe(true);
      expect(isOfflineId('family-1234567890-xyz789')).toBe(true);
      expect(isOfflineId('exp-1234567890-abc')).toBe(true);
      expect(isOfflineId('rec-1234567890-def')).toBe(true);
      expect(isOfflineId('sub-1234567890-ghi')).toBe(true);
      expect(isOfflineId('goal-1234567890-jkl')).toBe(true);
      expect(isOfflineId('gentry-1234567890-mno')).toBe(true);
    });

    it('should reject UUID format (online IDs)', () => {
      // Standard UUIDs from Supabase
      expect(isOfflineId('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
      expect(isOfflineId('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(false);
      expect(isOfflineId('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(false);
    });

    it('should reject random strings that are not offline IDs', () => {
      expect(isOfflineId('random-string')).toBe(false);
      expect(isOfflineId('some-random-id-123')).toBe(false);
      expect(isOfflineId('user-123')).toBe(false);
      expect(isOfflineId('123456789')).toBe(false);
      expect(isOfflineId('')).toBe(false);
    });

    it('should identify generated offline IDs', () => {
      const generatedId = generateOfflineId();
      expect(isOfflineId(generatedId)).toBe(true);
    });

    it('should identify generated IDs with custom prefixes', () => {
      const customPrefixes = ['family', 'exp', 'rec', 'sub', 'goal', 'gentry'];
      
      customPrefixes.forEach(prefix => {
        const id = generateOfflineId(prefix);
        expect(isOfflineId(id)).toBe(true);
      });
    });

    it('should be case-sensitive', () => {
      expect(isOfflineId('Offline-1234567890-abc')).toBe(false);
      expect(isOfflineId('FAMILY-1234567890-abc')).toBe(false);
      expect(isOfflineId('EXP-1234567890-abc')).toBe(false);
    });
  });

  describe('security considerations', () => {
    it('should not generate predictable IDs', () => {
      // IDs should have random component
      const id1 = generateOfflineId();
      const id2 = generateOfflineId();
      
      // Even if generated at same millisecond, random part should differ
      const random1 = id1.split('-')[2];
      const random2 = id2.split('-')[2];
      
      // If timestamps are same, random parts must differ
      // If timestamps differ, that's also fine
      const timestamp1 = id1.split('-')[1];
      const timestamp2 = id2.split('-')[1];
      
      if (timestamp1 === timestamp2) {
        expect(random1).not.toBe(random2);
      }
    });

    it('should not expose sensitive information in ID format', () => {
      const id = generateOfflineId('expense');
      
      // ID should only contain prefix, timestamp, and random string
      // No user data, family data, or other sensitive info
      const parts = id.split('-');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('expense'); // Just the type prefix
      expect(parts[1]).toMatch(/^\d+$/); // Just timestamp
      expect(parts[2]).toMatch(/^[a-z0-9]+$/); // Just random alphanumeric
    });

    it('should reject XSS payloads as IDs', () => {
      const xssPayloads = [
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        '<img src=x onerror=alert(1)>',
        '"><script>alert(1)</script>',
      ];

      xssPayloads.forEach(payload => {
        expect(isOfflineId(payload)).toBe(false);
      });
    });

    it('should reject SQL injection payloads as IDs', () => {
      const sqlPayloads = [
        "'; DROP TABLE expenses; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM users",
      ];

      sqlPayloads.forEach(payload => {
        expect(isOfflineId(payload)).toBe(false);
      });
    });

    it('should reject prototype pollution attempts', () => {
      expect(isOfflineId('__proto__')).toBe(false);
      expect(isOfflineId('constructor')).toBe(false);
      expect(isOfflineId('prototype')).toBe(false);
    });

    it('should reject path traversal attempts', () => {
      expect(isOfflineId('../../../etc/passwd')).toBe(false);
      expect(isOfflineId('..\\..\\..\\windows')).toBe(false);
      expect(isOfflineId('file:///etc/passwd')).toBe(false);
    });

    it('should handle null bytes safely', () => {
      expect(isOfflineId('offline-123\x00-abc')).toBe(false);
      expect(isOfflineId('\x00offline-123-abc')).toBe(false);
    });
  });

  describe('SyncQueueItem type', () => {
    it('should accept valid sync queue item types', () => {
      const validTypes: SyncQueueItem['type'][] = [
        'family',
        'month',
        'expense',
        'recurring_expense',
        'subcategory',
        'category_limit',
        'family_member',
        'income_source',
        'goal',
        'goal_entry',
      ];

      validTypes.forEach((type) => {
        const item: Partial<SyncQueueItem> = {
          id: 'sync-123',
          type,
          action: 'insert',
          data: {},
          createdAt: new Date().toISOString(),
          familyId: 'family-123',
        };
        expect(item.type).toBe(type);
      });
    });

    it('should accept valid action types', () => {
      const validActions: SyncQueueItem['action'][] = ['insert', 'update', 'delete'];

      validActions.forEach((action) => {
        const item: Partial<SyncQueueItem> = {
          id: 'sync-123',
          type: 'expense',
          action,
          data: {},
          createdAt: new Date().toISOString(),
          familyId: 'family-123',
        };
        expect(item.action).toBe(action);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string prefix in generateOfflineId', () => {
      const id = generateOfflineId('');
      expect(id).toMatch(/^-\d+-[a-z0-9]+$/);
    });

    it('should handle very long prefix in generateOfflineId', () => {
      const longPrefix = 'a'.repeat(100);
      const id = generateOfflineId(longPrefix);
      expect(id.startsWith(longPrefix + '-')).toBe(true);
    });

    it('should handle special characters in prefix', () => {
      // This is allowed by the function but isOfflineId won't recognize it
      const id = generateOfflineId('test-prefix');
      expect(id.startsWith('test-prefix-')).toBe(true);
      // But it won't be recognized as offline ID since prefix contains hyphen
      expect(isOfflineId(id)).toBe(false);
    });

    it('should handle isOfflineId with month- prefix', () => {
      expect(isOfflineId('month-1234567890-abc')).toBe(true);
    });

    it('should handle null/undefined gracefully', () => {
      expect(isOfflineId(null as unknown as string)).toBe(false);
      expect(isOfflineId(undefined as unknown as string)).toBe(false);
    });

    it('should handle non-string values', () => {
      expect(isOfflineId(123 as unknown as string)).toBe(false);
      expect(isOfflineId({} as unknown as string)).toBe(false);
      expect(isOfflineId([] as unknown as string)).toBe(false);
    });

    it('should reject control characters', () => {
      expect(isOfflineId('offline-\t123-abc')).toBe(false);
      expect(isOfflineId('offline-\n123-abc')).toBe(false);
      expect(isOfflineId('offline-\r123-abc')).toBe(false);
      expect(isOfflineId('offline-\x1f123-abc')).toBe(false);
      expect(isOfflineId('offline-\x7f123-abc')).toBe(false);
    });

    it('should handle very short IDs', () => {
      expect(isOfflineId('a')).toBe(false);
      expect(isOfflineId('of')).toBe(false);
      expect(isOfflineId('offline')).toBe(false);
      expect(isOfflineId('offline-')).toBe(true); // Starts with valid prefix
    });

    it('should handle IDs with only prefix', () => {
      expect(isOfflineId('exp-')).toBe(true);
      expect(isOfflineId('family-')).toBe(true);
    });
  });
});
