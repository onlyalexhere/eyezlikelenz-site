const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/**
 * Executes one of the site's plain (non-module) <script> files against the
 * current jsdom global scope, exactly as a browser <script> tag would.
 * Used because payment-unlock.js / theme.js / portfolio.js are IIFEs that
 * read document/window at load time — they aren't ES modules.
 */
function loadScript(relPathFromRepoRoot) {
  const filePath = path.resolve(__dirname, '../../', relPathFromRepoRoot);
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInThisContext(code, { filename: filePath });
}

module.exports = { loadScript };
