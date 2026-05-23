/**
 * Payment Unlock
 * =====================================================================
 * Gates the bank details behind a private access code.
 *
 * Bank details are XOR-obfuscated with the access code and base64
 * encoded so they are not visible in plain HTML to crawlers, casual
 * page-source viewers, or anyone who hasn't been given the code.
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
 *    e.g.
 *      encodeBankDetails('NEW2026', 'Alexander Oyekola|HSBC|40-11-93|51238159')
 *
 * 2. Copy the returned string and paste it as the new value of
 *    ENCODED below.
 * 3. Share the new code privately with confirmed clients only.
 * =====================================================================
 */

(function () {
  'use strict';

  // Encoded bank details. Generated with the helper at the bottom of this file.
  // Current code: EYEZ2026
  // Current payload: Alexander Oyekola|HSBC|40-11-93|51238159
  var ENCODED = 'BDUgIlNeVlM3eQojV1tdWiQlDQlwc04CdXR0ax8JAUpwaHdpCgEHDw==';

  /**
   * Attempt to decode the bank details with the given access code.
   * Returns an array of 4 strings on success, null on failure.
   */
  function tryUnlock(code) {
    if (!code) return null;
    try {
      var bytes = atob(ENCODED);
      var out = '';
      for (var i = 0; i < bytes.length; i++) {
        out += String.fromCharCode(bytes.charCodeAt(i) ^ code.charCodeAt(i % code.length));
      }
      // A valid decode produces exactly 4 pipe-separated, printable parts.
      if (out.split('|').length === 4 && /^[\x20-\x7E]+$/.test(out)) {
        return out.split('|');
      }
    } catch (e) {
      // Bad base64 or string handling, fall through.
    }
    return null;
  }

  function attemptUnlock() {
    var code = codeInput.value.trim().toUpperCase();
    var result = tryUnlock(code);
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
    var bytes = [];
    for (var i = 0; i < payload.length; i++) {
      bytes.push(payload.charCodeAt(i) ^ code.charCodeAt(i % code.length));
    }
    var binary = '';
    for (var j = 0; j < bytes.length; j++) {
      binary += String.fromCharCode(bytes[j]);
    }
    var encoded = btoa(binary);
    console.log('New ENCODED value:', encoded);
    console.log('Paste this into js/payment-unlock.js as the ENCODED constant.');
    return encoded;
  };
})();
