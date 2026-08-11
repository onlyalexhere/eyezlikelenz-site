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
    it('has every real client quote still unapproved', () => {
      renderSection();
      loadScript('js/testimonials-config.js');
      const entries = window.TESTIMONIALS;

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0);
      for (const t of entries) {
        expect(t.client, 'every entry needs an attributable client').toBeTruthy();
        expect(t.quote, 'every entry needs a quote').toBeTruthy();
        expect(
          t.approved,
          `"${t.client}" is marked approved — only do that once the client has signed off in writing`
        ).toBe(false);
      }
    });
  });
});
