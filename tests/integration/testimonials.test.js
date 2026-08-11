import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadScript } from '../helpers/load-script.js';

function renderSection() {
  document.body.innerHTML = `
    <section id="testimonials">
      <div class="section-header"><h2>What they said.</h2></div>
      <div id="testimonials-grid" class="testimonials-grid"></div>
    </section>
  `;
}

describe('testimonials approval gate', () => {
  afterEach(() => {
    // Loading the real config declares `var TESTIMONIALS`, which becomes a
    // non-configurable global — assign rather than delete.
    try {
      delete window.TESTIMONIALS;
    } catch (e) {
      window.TESTIMONIALS = undefined;
    }
  });

  describe('when nothing is approved', () => {
    beforeEach(() => {
      renderSection();
      window.TESTIMONIALS = [
        { client: 'A', shoot: 'x', quote: 'unapproved words', approved: false },
        { client: 'B', shoot: 'y', quote: 'also unapproved', approved: false }
      ];
      loadScript('js/testimonials.js');
    });

    it('publishes no quote at all', () => {
      expect(document.body.textContent).not.toContain('unapproved words');
      expect(document.body.textContent).not.toContain('also unapproved');
    });

    it('removes the whole section rather than leaving an empty heading', () => {
      expect(document.getElementById('testimonials')).toBeNull();
    });
  });

  describe('when some are approved', () => {
    beforeEach(() => {
      renderSection();
      window.TESTIMONIALS = [
        { client: 'Approved Client', shoot: 'Wedding', quote: 'They signed this off.', approved: true },
        { client: 'Pending Client', shoot: 'Party', quote: 'They have not seen this.', approved: false }
      ];
      loadScript('js/testimonials.js');
    });

    it('renders only the approved one', () => {
      const cards = document.querySelectorAll('.testimonial');
      expect(cards.length).toBe(1);
      expect(document.body.textContent).toContain('They signed this off.');
    });

    it('never leaks an unapproved quote into the DOM', () => {
      expect(document.body.innerHTML).not.toContain('They have not seen this.');
      expect(document.body.innerHTML).not.toContain('Pending Client');
    });

    it('attributes the quote to the client and shoot', () => {
      expect(document.querySelector('.testimonial-client').textContent).toBe('Approved Client');
      expect(document.querySelector('.testimonial-shoot').textContent).toBe('Wedding');
    });

    it('keeps the section on the page', () => {
      expect(document.getElementById('testimonials')).not.toBeNull();
    });
  });

  describe('guarding against a truthy-but-not-true approved value', () => {
    beforeEach(() => {
      renderSection();
      // A stray string or 1 must not be enough to publish someone's words.
      window.TESTIMONIALS = [
        { client: 'C', shoot: 'z', quote: 'string truthy', approved: 'yes' },
        { client: 'D', shoot: 'z', quote: 'number truthy', approved: 1 }
      ];
      loadScript('js/testimonials.js');
    });

    it('requires a strict boolean true', () => {
      expect(document.getElementById('testimonials')).toBeNull();
    });
  });

  describe('the shipped config', () => {
    let entries;

    beforeEach(() => {
      renderSection();
      loadScript('js/testimonials-config.js');
      entries = window.TESTIMONIALS;
    });

    it('is a non-empty list', () => {
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0);
    });

    it('gives every entry an attributable client and a quote', () => {
      for (const t of entries) {
        expect(t.client, 'a quote with no client is not attributable').toBeTruthy();
        expect(t.quote, `"${t.client}" has no quote`).toBeTruthy();
      }
    });

    it('uses a strict boolean for approved on every entry', () => {
      // approved: "true" or approved: 1 would silently fail to publish, and
      // is the kind of typo that looks fine in review.
      for (const t of entries) {
        expect(
          typeof t.approved,
          `"${t.client}" has approved: ${JSON.stringify(t.approved)} — must be a boolean`
        ).toBe('boolean');
      }
    });

    it('has no duplicate clients', () => {
      const names = entries.map((t) => t.client);
      expect(new Set(names).size, `duplicates in: ${names.join(', ')}`).toBe(names.length);
    });
  });
});
