/**
 * XOR Codec
 * =====================================================================
 * Pure encode/decode helpers used to obfuscate the bank details behind
 * an access code. No DOM access, so this file is safe to load in a
 * plain Node/test environment as well as the browser.
 *
 * This is obfuscation, not cryptographic security — see payment-unlock.js.
 * =====================================================================
 */
(function (root) {
  'use strict';

  function encode(code, payload) {
    if (!code || !payload) return null;
    var bytes = [];
    for (var i = 0; i < payload.length; i++) {
      bytes.push(payload.charCodeAt(i) ^ code.charCodeAt(i % code.length));
    }
    var binary = '';
    for (var j = 0; j < bytes.length; j++) {
      binary += String.fromCharCode(bytes[j]);
    }
    return btoa(binary);
  }

  /**
   * Attempt to decode a base64 XOR payload with the given access code.
   * Returns an array of 4 strings on success, null on failure.
   */
  function decode(code, encoded) {
    if (!code || !encoded) return null;
    try {
      var bytes = atob(encoded);
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

  var XorCodec = { encode: encode, decode: decode };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = XorCodec;
  } else {
    root.XorCodec = XorCodec;
  }
})(typeof window !== 'undefined' ? window : this);
