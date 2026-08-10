/**
 * Shared "this looks like real bank data" patterns.
 *
 * Kept in one file so no other file in the repo has to spell out a real
 * bank name just to assert its absence — and so the source scanner and the
 * browser-level leak test can never drift apart.
 *
 * The scanner deliberately skips this file when reading the repo.
 */

// A UK sort code: exactly three 2-digit groups, e.g. 00-00-00.
// Never put a real sort code here — this file is excluded from the scanner
// (it has to contain the patterns as literals), so nothing would catch it.
const SORT_CODE = /(?<![\d-])\d{2}-\d{2}-\d{2}(?![\d-])/;

const BANK_NAMES = /\b(HSBC|Barclays|NatWest|Lloyds|Santander|Monzo|Starling|Revolut|Halifax|Nationwide)\b/i;

// The literal shape of the original leak, which annotated the encoded blob
// with its own plaintext:  // Current code: XXXX   /   // Current payload: ...
const PLAINTEXT_ANNOTATION = /current\s+(code|payload)\s*:/i;

// "Some Name|Some Bank|00-00-00|12345678" — 4 pipe-separated fields ending
// in a long digit run.
const PIPE_DELIMITED_PAYLOAD = /[A-Za-z][^|\n]*\|[^|\n]+\|[^|\n]+\|\s*\d{6,}/;

module.exports = {
  SORT_CODE,
  BANK_NAMES,
  PLAINTEXT_ANNOTATION,
  PIPE_DELIMITED_PAYLOAD
};
