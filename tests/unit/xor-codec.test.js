import { describe, it, expect } from 'vitest';
import XorCodec from '../../js/xor-codec.js';

describe('XorCodec', () => {
  const payload = 'Test Person|Test Bank|00-00-00|12345678';

  it('round-trips a payload with the correct code', () => {
    const encoded = XorCodec.encode('CORRECTCODE', payload);
    expect(XorCodec.decode('CORRECTCODE', encoded)).toEqual(payload.split('|'));
  });

  it('rejects the wrong code', () => {
    const encoded = XorCodec.encode('CORRECTCODE', payload);
    expect(XorCodec.decode('WRONGCODE', encoded)).toBeNull();
  });

  it('rejects a code that is a prefix or superset of the right one', () => {
    const encoded = XorCodec.encode('CORRECTCODE', payload);
    expect(XorCodec.decode('CORRECT', encoded)).toBeNull();
    expect(XorCodec.decode('CORRECTCODEEXTRA', encoded)).toBeNull();
  });

  it('is case sensitive', () => {
    const encoded = XorCodec.encode('CORRECTCODE', payload);
    expect(XorCodec.decode('correctcode', encoded)).toBeNull();
  });

  it('rejects malformed base64 without throwing', () => {
    expect(XorCodec.decode('ANYCODE', 'not-valid-base64!!!')).toBeNull();
  });

  it('rejects a decode that does not produce exactly 4 pipe-separated fields', () => {
    const encoded = XorCodec.encode('CODE', 'only|three|fields');
    expect(XorCodec.decode('CODE', encoded)).toBeNull();
  });

  it('returns null for empty code or payload on encode', () => {
    expect(XorCodec.encode('', payload)).toBeNull();
    expect(XorCodec.encode('CODE', '')).toBeNull();
  });

  it('returns null for empty code or encoded string on decode', () => {
    const encoded = XorCodec.encode('CODE', payload);
    expect(XorCodec.decode('', encoded)).toBeNull();
    expect(XorCodec.decode('CODE', '')).toBeNull();
  });

  it('handles a code longer than the payload', () => {
    const encoded = XorCodec.encode('AVERYLONGACCESSCODE2026', payload);
    expect(XorCodec.decode('AVERYLONGACCESSCODE2026', encoded)).toEqual(payload.split('|'));
  });
});
