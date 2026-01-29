import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of domain keywords to flag as problematic inline mocks
const DOMAIN_KEYWORDS = [
  'Expense', 'Goal', 'Income', 'Family', 'Subcategory', 'Recurring', 'Month',
  'Category', 'User', 'Budget', 'Entry', 'Settings', 'Dialog', 'Card', 'List', 'Panel', 'Chart', 'Source'
];

function isDomainInlineLiteral(line) {
  // Only flag if assigned to a literal object or array, not a function call or primitive (string, number, boolean)
  // Ignore mocks assigned to vi.fn, jest.fn, primitive values, or makeMock* factories
  return DOMAIN_KEYWORDS.some(keyword => {
    // Only match if assigned to object/array literal
    const match = line.match(new RegExp(`const\\s+mock${keyword}\\s*=\\s*([\\[{])`));
    if (!match) return false;
    // Ignore if line contains vi.fn, jest.fn, makeMock, or = ' or = " or = ` or = [number|boolean]
    if (/vi\.fn|jest\.fn|makeMock|=\s*['"`]|=\s*\d|=\s*(true|false)/.test(line)) return false;
    return true;
  });
}

/**
 * Recursively scans a directory for test files and checks for inline mocks.
 */
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  let issues = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      issues = issues.concat(scanDirectory(fullPath));
    } else if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split(/\r?\n/);
      // Only flag inline mocks for domain data assigned to literals
      const domainInlineLiterals = lines.filter(isDomainInlineLiteral);
      if (domainInlineLiterals.length > 0) {
        issues.push({ file: fullPath, message: 'Inline domain mock literal detected' });
      }
    }
  }

  return issues;
}

// Entry point
const testDir = path.join(__dirname, '../src');
const issues = scanDirectory(testDir);

if (issues.length > 0) {
  console.log('Inline domain mock literals detected in the following files:');
  issues.forEach((issue) => {
    console.log(`- ${issue.file}`);
  });
  console.log(`There are ${issues.length} files with inline domain mocks. Please refactor them to use centralized mocks.`);
  process.exit(1);
} else {
  console.log('No inline domain mock literals detected.');
}