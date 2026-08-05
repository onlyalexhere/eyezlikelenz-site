/**
 * Payment Unlock
 * =====================================================================
 * Gates the bank details behind a private access code.
 *
 * Bank details are XOR-obfuscated with the access code and base64
 * encoded (see xor-codec.js) so they are not visible in plain HTML to
 * crawlers, casual page-source viewers, or anyone who hasn't been
 * given the code.
 *
 * This is obfuscation, not cryptographic security. A determined
 * attacker who studies the code can recover the data. The goal here
 * is to stop search engines, scrapers, and casual snoopers, while
 * keeping the page fully client-side (no server needed).
 *
 * ---------------------------------------------------------------------
 * HOW TO ROTATE THE CODE OR UPDATE BANK DETAILS
 * ---------------------------------------------------------------------
 * 1. Open the browser console on the page and run:
 *
 *      encodeBankDetails('NEW_CODE_HERE', 'Account Name|Bank|Sort|Acct')
 *
 * 2. Copy the returned string and paste it as the new value of
 *    ENCODED below.
 * 3. Share the new code privately with confirmed clients only —
 *    never paste the code or the plaintext bank details into a
 *    comment, commit message, or anywhere else that ends up in git
 *    history, since this repo is public.
 * =====================================================================
 */

(function () {
  'use strict';

  // Encoded bank details. Generated with encodeBankDetails() below.
  // The access code is shared privately with confirmed clients and is
  // NOT recorded anywhere in this repo.
  // Override hook for tests only — never set in production.
  var ENCODED = (typeof window !== 'undefined' && window.__ELL_TEST_ENCODED__) ||
    'FiIiPFRZXFUlbgg9UFxXXDYyDxd3dEQEZ2N2dRgOC0xif3V3DQYNCQ==';

  function attemptUnlock() {
    var code = codeInput.value.trim().toUpperCase();
    var result = XorCodec.decode(code, ENCODED);
    if (result) {
      document.getElementById('bank-name').textContent = result[0];
      document.getElementById('bank-bank').textContent = result[1];
      document.getElementById('bank-sort').textContent = result[2];
      document.getElementById('bank-account').textContent = result[3];
      lockedEl.style.display = 'none';
      unlockedEl.style.display = 'block';
      errorEl.textContent = '';
    } else {
      errorEl.textContent = 'Incorrect code. Please check and try again.';
      codeInput.focus();
      codeInput.select();
    }
  }

  var unlockBtn = document.getElementById('unlock-btn');
  var codeInput = document.getElementById('access-code');
  var errorEl   = document.getElementById('lock-error');
  var lockedEl  = document.getElementById('payment-locked');
  var unlockedEl = document.getElementById('payment-unlocked');

  if (unlockBtn) {
    unlockBtn.addEventListener('click', attemptUnlock);
    codeInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        attemptUnlock();
      }
    });
  }

  /**
   * Console helper for rotating the code or updating bank details.
   * Exposed on window so you can call it from DevTools.
   *
   *   encodeBankDetails('CODE', 'Name|Bank|Sort|Account')
   *
   * Copy the returned string into the ENCODED constant above.
   */
  window.encodeBankDetails = function (code, payload) {
    if (!code || !payload) {
      console.warn('Usage: encodeBankDetails("CODE", "Name|Bank|Sort|Account")');
      return null;
    }
    var encoded = XorCodec.encode(code, payload);
    console.log('New ENCODED value:', encoded);
    console.log('Paste this into js/payment-unlock.js as the ENCODED constant.');
    return encoded;
  };
})();
