import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SORT_CODE,
  BANK_NAMES,
  PLAINTEXT_ANNOTATION,
  PIPE_DELIMITED_PAYLOAD
} from '../helpers/secret-patterns.js';

/**
 * Regression guard for the worst bug this repo has had: the real bank
 * access code and the plaintext account details sat in a comment in
 * js/payment-unlock.js, in a PUBLIC repo, deployed live.
 *
 * This scans committed source for the *shape* of that leak. It deliberately
 * never hardcodes the real code or account number — doing so would recreate
 * the exact bug it exists to prevent.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const THIS_FILE = fileURLToPath(import.meta.url);
const PATTERNS_FILE = path.join(REPO_ROOT, 'tests', 'helpers', 'secret-patterns.js');

const SCAN_EXTENSIONS = ['.html', '.js', '.md', '.json', '.css'];
const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'test-results', 'playwright-report',
  'images', 'assets', 'attachments'
]);

function collectSourceFiles(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      collectSourceFiles(full, found);
    } else if (SCAN_EXTENSIONS.includes(path.extname(entry.name))) {
      // These two necessarily contain the patterns as literals.
      if (full === THIS_FILE || full === PATTERNS_FILE) continue;
      found.push(full);
    }
  }
  return found;
}

const allFiles = collectSourceFiles(REPO_ROOT);
const isTestFile = (f) => path.relative(REPO_ROOT, f).startsWith('tests' + path.sep);

// Files that actually ship to the public site, plus docs and config.
const shippedFiles = allFiles.filter((f) => !isTestFile(f));

function scan(files, pattern) {
  const hits = [];
  for (const file of files) {
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (pattern.test(line)) {
        hits.push(`${path.relative(REPO_ROOT, file)}:${i + 1}: ${line.trim().slice(0, 100)}`);
      }
    });
  }
  return hits;
}

describe('no plaintext secrets in source', () => {
  it('actually finds files to scan', () => {
    // Guards against a bad ignore rule silently turning this suite into a no-op.
    expect(shippedFiles.length).toBeGreaterThan(5);
    expect(shippedFiles.some((f) => f.endsWith('payment-unlock.js'))).toBe(true);
    expect(shippedFiles.some((f) => f.endsWith('index.html'))).toBe(true);
  });

  describe('shipped source, docs and config', () => {
    it('contains no UK sort code', () => {
      expect(scan(shippedFiles, SORT_CODE)).toEqual([]);
    });

    it('contains no pipe-delimited bank payload in the clear', () => {
      expect(scan(shippedFiles, PIPE_DELIMITED_PAYLOAD)).toEqual([]);
    });
  });

  describe('every file in the repo, including tests', () => {
    // Test fixtures legitimately need bank-*shaped* fake data (sort codes,
    // account numbers), so those patterns are only enforced on shipped files
    // above. But there is no legitimate reason for a real bank's name, or for
    // the encoded blob to be annotated with its own plaintext, to appear
    // anywhere at all.
    it('names no real retail bank', () => {
      expect(scan(allFiles, BANK_NAMES)).toEqual([]);
    });

    it('never annotates the encoded payload with its plaintext', () => {
      expect(scan(allFiles, PLAINTEXT_ANNOTATION)).toEqual([]);
    });
  });

  it('uses only obviously-fake examples in the patterns file itself', () => {
    // secret-patterns.js is excluded from the scan above (it must contain the
    // patterns as literals), which makes it the one place a real value could
    // hide. Example sort codes in it must be visibly synthetic.
    const source = fs.readFileSync(PATTERNS_FILE, 'utf8');
    const OBVIOUS_PLACEHOLDERS = ['00-00-00', '11-11-11', '12-34-56'];

    const sortCodes = source.match(/(?<![\d-])\d{2}-\d{2}-\d{2}(?![\d-])/g) || [];
    for (const code of sortCodes) {
      expect(OBVIOUS_PLACEHOLDERS, `"${code}" is not an obvious placeholder`).toContain(code);
    }
  });

  it('keeps bare account-length digit runs out of the payment code', () => {
    const source = fs.readFileSync(path.join(REPO_ROOT, 'js', 'payment-unlock.js'), 'utf8');
    // The base64 ENCODED blob is expected; a standalone 8-digit number is not.
    const withoutEncoded = source.replace(/'[A-Za-z0-9+/=]{20,}'/g, "'<encoded>'");
    expect(withoutEncoded).not.toMatch(/(?<!\d)\d{8}(?!\d)/);
  });
});
