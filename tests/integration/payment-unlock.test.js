import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import XorCodec from '../../js/xor-codec.js';
import { loadScript } from '../helpers/load-script.js';

// Synthetic-only credentials. Never the real production access code or
// bank details — those must never appear in this repo. See payment-unlock.js.
const TEST_CODE = 'TESTCODE2099';
const TEST_PAYLOAD = 'Test Payee|Test Bank|11-22-33|99887766';

function renderPaymentSection() {
  document.body.innerHTML = `
    <div id="payment-locked">
      <input type="text" id="access-code">
      <button id="unlock-btn">Unlock</button>
      <p id="lock-error"></p>
    </div>
    <div id="payment-unlocked" style="display: none;">
      <div id="bank-name"></div>
      <div id="bank-bank"></div>
      <div id="bank-sort"></div>
      <div id="bank-account"></div>
    </div>
  `;
}

describe('payment unlock', () => {
  afterEach(() => {
    delete window.__ELL_TEST_ENCODED__;
    delete window.encodeBankDetails;
    delete window.XorCodec;
  });

  describe('against the real production ENCODED value (negative path only)', () => {
    beforeEach(() => {
      renderPaymentSection();
      loadScript('js/xor-codec.js');
      loadScript('js/payment-unlock.js');
    });

    it('shows an error and keeps the bank panel hidden for a wrong code', () => {
      document.getElementById('access-code').value = 'DEFINITELY-NOT-THE-CODE';
      document.getElementById('unlock-btn').click();

      expect(document.getElementById('lock-error').textContent).toMatch(/incorrect code/i);
      expect(document.getElementById('payment-unlocked').style.display).toBe('none');
      expect(document.getElementById('payment-locked').style.display).not.toBe('none');
    });

    it('never reveals bank details in the DOM for a wrong code', () => {
      document.getElementById('access-code').value = 'ALSO-WRONG';
      document.getElementById('unlock-btn').click();

      expect(document.getElementById('bank-name').textContent).toBe('');
      expect(document.getElementById('bank-bank').textContent).toBe('');
      expect(document.getElementById('bank-sort').textContent).toBe('');
      expect(document.getElementById('bank-account').textContent).toBe('');
    });
  });

  describe('against a synthetic test ENCODED value (full success path)', () => {
    beforeEach(() => {
      renderPaymentSection();
      window.__ELL_TEST_ENCODED__ = XorCodec.encode(TEST_CODE, TEST_PAYLOAD);
      loadScript('js/xor-codec.js');
      loadScript('js/payment-unlock.js');
    });

    it('unlocks and populates bank fields for the correct code', () => {
      document.getElementById('access-code').value = TEST_CODE;
      document.getElementById('unlock-btn').click();

      const [name, bank, sort, account] = TEST_PAYLOAD.split('|');
      expect(document.getElementById('bank-name').textContent).toBe(name);
      expect(document.getElementById('bank-bank').textContent).toBe(bank);
      expect(document.getElementById('bank-sort').textContent).toBe(sort);
      expect(document.getElementById('bank-account').textContent).toBe(account);
      expect(document.getElementById('payment-locked').style.display).toBe('none');
      expect(document.getElementById('payment-unlocked').style.display).toBe('block');
    });

    it('is case-insensitive and trims whitespace on the entered code', () => {
      document.getElementById('access-code').value = '  ' + TEST_CODE.toLowerCase() + '  ';
      document.getElementById('unlock-btn').click();

      expect(document.getElementById('payment-unlocked').style.display).toBe('block');
    });

    it('also unlocks when Enter is pressed in the input', () => {
      const input = document.getElementById('access-code');
      input.value = TEST_CODE;
      input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(document.getElementById('payment-unlocked').style.display).toBe('block');
    });

    it('rejects the wrong code even when a valid code exists for this ENCODED value', () => {
      document.getElementById('access-code').value = 'WRONGCODE';
      document.getElementById('unlock-btn').click();

      expect(document.getElementById('lock-error').textContent).toMatch(/incorrect code/i);
      expect(document.getElementById('payment-unlocked').style.display).toBe('none');
    });
  });
});
