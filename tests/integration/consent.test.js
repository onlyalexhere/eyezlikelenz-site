import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScript } from '../helpers/load-script.js';

/**
 * The banner is the consent gate in front of the Google Ads tag. The rule it
 * has to hold: no advertising signal is granted until the visitor clicks
 * Accept, and whatever they click sticks on the next page load.
 */
describe('cookie consent banner', () => {
  let consentCalls;

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    consentCalls = [];
    // Stand-in for the real gtag queued by the head script.
    window.gtag = function () {
      var args = Array.from(arguments);
      if (args[0] === 'consent') consentCalls.push({ mode: args[1], signals: args[2] });
    };
    vi.resetModules();
  });

  function banner() {
    return document.querySelector('.consent-banner');
  }

  describe('with no choice stored', () => {
    beforeEach(() => {
      loadScript('js/consent.js');
    });

    it('renders the banner', () => {
      expect(banner()).not.toBeNull();
    });

    it('offers both an accept and a decline control', () => {
      expect(banner().querySelector('.consent-accept')).not.toBeNull();
      expect(banner().querySelector('.consent-decline')).not.toBeNull();
    });

    it('grants every advertising signal only after Accept is clicked', () => {
      expect(consentCalls).toHaveLength(0);

      banner().querySelector('.consent-accept').click();

      expect(consentCalls).toHaveLength(1);
      expect(consentCalls[0].mode).toBe('update');
      expect(consentCalls[0].signals).toEqual({
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted'
      });
      expect(localStorage.getItem('ell-consent')).toBe('granted');
    });

    it('keeps every signal denied when Decline is clicked', () => {
      banner().querySelector('.consent-decline').click();

      expect(consentCalls[0].signals).toEqual({
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied'
      });
      expect(localStorage.getItem('ell-consent')).toBe('denied');
    });

    it('links to the cookie clause so the visitor can read the detail first', () => {
      expect(banner().querySelector('.consent-text a').getAttribute('href')).toBe('/terms/#cookies');
    });

    it('is announced to assistive tech as a dialog', () => {
      expect(banner().getAttribute('role')).toBe('dialog');
      expect(banner().getAttribute('aria-labelledby')).toBe('consent-title');
    });
  });

  describe('with a choice already stored', () => {
    it('stays hidden after a previous Accept', () => {
      localStorage.setItem('ell-consent', 'granted');
      loadScript('js/consent.js');
      expect(banner()).toBeNull();
    });

    it('stays hidden after a previous Decline, and re-grants nothing', () => {
      localStorage.setItem('ell-consent', 'denied');
      loadScript('js/consent.js');
      expect(banner()).toBeNull();
      expect(consentCalls).toHaveLength(0);
    });
  });

  // The ICO expects withdrawing consent to be as easy as giving it, so the
  // footer trigger has to work from a settled state on every page.
  describe('withdrawing a previous consent', () => {
    beforeEach(() => {
      localStorage.setItem('ell-consent', 'granted');
      document.body.innerHTML =
        '<button type="button" class="consent-settings" data-consent-settings>Cookie settings</button>';
      loadScript('js/consent.js');
    });

    it('does not show the banner unprompted', () => {
      expect(banner()).toBeNull();
    });

    it('reopens the banner from the footer trigger', () => {
      document.querySelector('[data-consent-settings]').click();
      expect(banner()).not.toBeNull();
    });

    it('revokes every signal when the visitor switches to Reject', () => {
      document.querySelector('[data-consent-settings]').click();
      banner().querySelector('.consent-decline').click();

      expect(localStorage.getItem('ell-consent')).toBe('denied');
      expect(consentCalls[consentCalls.length - 1].signals).toEqual({
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied'
      });
    });

    it('exposes an open() API so any page can surface the choice', () => {
      expect(typeof window.ELLConsent.open).toBe('function');
      window.ELLConsent.open();
      expect(banner()).not.toBeNull();
    });
  });

  describe('accept and reject are offered on equal terms', () => {
    beforeEach(() => {
      loadScript('js/consent.js');
    });

    it('gives neither button styling that outweighs the other', () => {
      var accept = banner().querySelector('.consent-accept');
      var reject = banner().querySelector('.consent-decline');
      // .btn-primary is the site's emphasised treatment. Neither control may
      // carry it, or the reject option reads as the lesser choice.
      expect(accept.className).not.toContain('btn-primary');
      expect(reject.className).not.toContain('btn-primary');
      // Identity classes aside, both must carry exactly the same styling.
      var styling = function (el) {
        return el.className
          .split(/\s+/)
          .filter(function (c) { return c !== 'consent-accept' && c !== 'consent-decline'; })
          .sort()
          .join(' ');
      };
      expect(styling(accept)).toBe(styling(reject));
    });

    it('tells the visitor they can change their mind before they choose', () => {
      expect(banner().textContent.toLowerCase()).toContain('change your mind');
    });
  });
});
