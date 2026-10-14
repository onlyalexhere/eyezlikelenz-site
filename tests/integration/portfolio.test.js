import { describe, it, expect, beforeEach } from 'vitest';
import { loadScript } from '../helpers/load-script.js';

function renderPortfolioSection() {
  document.body.innerHTML = `
    <div id="portfolio-grid" class="portfolio-grid"></div>
    <p id="portfolio-empty" style="display:none;"></p>
    <div id="lightbox" class="lightbox" aria-hidden="true">
      <button class="lightbox-close" aria-label="Close">&times;</button>
      <button class="lightbox-prev" aria-label="Previous">&#8592;</button>
      <img id="lightbox-img" class="lightbox-img" src="" alt="">
      <button class="lightbox-next" aria-label="Next">&#8594;</button>
    </div>
  `;
}

const TEST_IMAGES = [
  { thumb: '/portfolio/images/thumbs/photo-01.jpg', full: '/portfolio/images/large/photo-01.jpg', alt: 'DJ performing at a club night' },
  { thumb: '/portfolio/images/thumbs/photo-02.jpg', full: '/portfolio/images/large/photo-02.jpg', alt: 'Guest enjoying a party' },
  { thumb: '/portfolio/images/thumbs/photo-03.jpg', full: '/portfolio/images/large/photo-03.jpg', alt: 'Neon sign inside a venue' }
];

describe('portfolio grid + lightbox', () => {
  describe('with images configured', () => {
    beforeEach(() => {
      renderPortfolioSection();
      window.PORTFOLIO_IMAGES = TEST_IMAGES;
      loadScript('js/portfolio.js');
    });

    it('renders one button per image with a thumb src and non-empty descriptive alt text', () => {
      const items = document.querySelectorAll('#portfolio-grid .portfolio-item');
      expect(items.length).toBe(TEST_IMAGES.length);

      const img = items[1].querySelector('img');
      expect(img.src).toContain('photo-02.jpg');
      expect(img.alt.trim().length).toBeGreaterThan(0);
      expect(img.alt).not.toBe('');
      expect(img.alt).toContain('Guest enjoying a party');
    });

    it('keeps the empty-state message hidden', () => {
      expect(document.getElementById('portfolio-empty').style.display).toBe('none');
    });

    it('opens the lightbox with a descriptive alt on thumbnail click', () => {
      document.querySelectorAll('#portfolio-grid .portfolio-item')[0].click();

      const lightbox = document.getElementById('lightbox');
      expect(lightbox.classList.contains('open')).toBe(true);
      expect(document.getElementById('lightbox-img').alt.trim().length).toBeGreaterThan(0);
    });

    it('navigates to the next image and wraps around from the last to the first', () => {
      document.querySelectorAll('#portfolio-grid .portfolio-item')[2].click(); // open last (index 2)
      document.querySelector('.lightbox-next').click(); // should wrap to index 0

      expect(document.getElementById('lightbox-img').alt).toContain('1 of 3');
    });

    it('navigates to the previous image and wraps around from the first to the last', () => {
      document.querySelectorAll('#portfolio-grid .portfolio-item')[0].click(); // open first (index 0)
      document.querySelector('.lightbox-prev').click(); // should wrap to index 2

      expect(document.getElementById('lightbox-img').alt).toContain('3 of 3');
    });

    it('closes on Escape', () => {
      document.querySelectorAll('#portfolio-grid .portfolio-item')[0].click();
      document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(document.getElementById('lightbox').classList.contains('open')).toBe(false);
    });

    it('closes via the close button', () => {
      document.querySelectorAll('#portfolio-grid .portfolio-item')[0].click();
      document.querySelector('.lightbox-close').click();

      expect(document.getElementById('lightbox').classList.contains('open')).toBe(false);
    });
  });

  describe('with no images configured', () => {
    beforeEach(() => {
      renderPortfolioSection();
      window.PORTFOLIO_IMAGES = [];
      loadScript('js/portfolio.js');
    });

    it('shows the empty state instead of rendering a broken grid', () => {
      expect(document.getElementById('portfolio-empty').style.display).toBe('block');
      expect(document.querySelectorAll('#portfolio-grid .portfolio-item').length).toBe(0);
    });
  });
});
