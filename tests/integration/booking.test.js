import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadScript } from '../helpers/load-script.js';

function renderBookingButtons() {
  document.body.innerHTML = `
    <button id="theme-toggle"></button>
    <a href="#contact" class="btn" data-booking-tier="half">Check dates &amp; book</a>
    <a href="#contact" class="btn" data-booking-tier="full">Check dates &amp; book</a>
    <a href="#contact" class="btn" data-booking-tier="day">Check dates &amp; book</a>
  `;
}

const EVENTS = { half: 'half-session', full: 'full-session', day: 'full-day' };

describe('booking buttons', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });

  afterEach(() => {
    delete window.BOOKING_CONFIG;
    delete window.Cal;
  });

  describe('before Cal.com is configured', () => {
    beforeEach(() => {
      renderBookingButtons();
      window.BOOKING_CONFIG = { username: '', events: EVENTS };
      loadScript('js/booking.js');
    });

    it('leaves the enquiry fallback in place rather than shipping a dead button', () => {
      for (const btn of document.querySelectorAll('[data-booking-tier]')) {
        expect(btn.getAttribute('href')).toBe('#contact');
        expect(btn.hasAttribute('data-cal-link')).toBe(false);
      }
    });
  });

  describe('once Cal.com is configured', () => {
    beforeEach(() => {
      renderBookingButtons();
      window.BOOKING_CONFIG = { username: 'eyezlikelenz', events: EVENTS };
      loadScript('js/booking.js');
    });

    it('points each tier at its own Cal.com event type', () => {
      const hrefFor = (tier) =>
        document.querySelector(`[data-booking-tier="${tier}"]`).getAttribute('href');

      expect(hrefFor('half')).toBe('https://cal.com/eyezlikelenz/half-session');
      expect(hrefFor('full')).toBe('https://cal.com/eyezlikelenz/full-session');
      expect(hrefFor('day')).toBe('https://cal.com/eyezlikelenz/full-day');
    });

    it('keeps the button a real link so it survives the embed script failing', () => {
      const btn = document.querySelector('[data-booking-tier="half"]');
      expect(btn.tagName).toBe('A');
      expect(btn.getAttribute('href')).toMatch(/^https:\/\/cal\.com\//);
    });

    it('tags each button for the Cal embed to pick up', () => {
      const btn = document.querySelector('[data-booking-tier="full"]');
      expect(btn.getAttribute('data-cal-link')).toBe('eyezlikelenz/full-session');
    });

    it('matches the popup theme to the current site theme', () => {
      const btn = document.querySelector('[data-booking-tier="half"]');
      expect(btn.getAttribute('data-cal-config')).toContain('"theme":"dark"');
    });

    it('updates the popup theme when the visitor toggles the site theme', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.getElementById('theme-toggle').click();

      for (const btn of document.querySelectorAll('[data-booking-tier]')) {
        expect(btn.getAttribute('data-cal-config')).toContain('"theme":"light"');
      }
    });

    it('does not load the third-party embed script on a plain page view', () => {
      const calScripts = document.querySelectorAll('script[src*="cal.com"]');
      expect(calScripts.length).toBe(0);
      expect(window.Cal).toBeUndefined();
    });

    it('loads the embed only once the visitor shows booking intent', () => {
      const btn = document.querySelector('[data-booking-tier="half"]');
      btn.dispatchEvent(new window.MouseEvent('mouseenter'));

      expect(typeof window.Cal).toBe('function');
    });
  });

  describe('with an unknown tier in the markup', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <button id="theme-toggle"></button>
        <a href="#contact" data-booking-tier="does-not-exist">Book</a>
      `;
      window.BOOKING_CONFIG = { username: 'eyezlikelenz', events: EVENTS };
      loadScript('js/booking.js');
    });

    it('leaves the button alone instead of building a broken Cal.com URL', () => {
      const btn = document.querySelector('[data-booking-tier]');
      expect(btn.getAttribute('href')).toBe('#contact');
      expect(btn.hasAttribute('data-cal-link')).toBe(false);
    });
  });
});
