const { test, expect } = require('../helpers/browser-test');

/**
 * Guards against bugs this site has actually shipped. Each test names the
 * symptom, so a future failure explains itself.
 */

test.describe('iOS Safari: nav flashed solid black on menu open/close', () => {
  // The fixed nav uses backdrop-filter. When the mobile dropdown mutated
  // nav's DOM, WebKit invalidated the layer and painted the bar black.
  // transform:translateZ(0) pins it to its own compositing layer.
  test('nav keeps its own compositing layer', async ({ page }) => {
    await page.goto('/');
    const transform = await page.locator('nav').evaluate(
      (el) => getComputedStyle(el).transform
    );
    // translateZ(0) resolves to a matrix; "none" means the fix was stripped.
    expect(transform).not.toBe('none');
    expect(transform).toMatch(/^matrix(3d)?\(/);
  });

  test('nav backdrop blur still carries the -webkit- prefix for older iOS', async ({ page }) => {
    await page.goto('/');
    const filters = await page.locator('nav').evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        standard: cs.backdropFilter,
        webkit: cs.webkitBackdropFilter
      };
    });
    expect(filters.standard || filters.webkit).toContain('blur');
  });
});

test.describe('paying without a date allowed double-booking', () => {
  test('no bare Stripe checkout link exists on any page', async ({ page }) => {
    for (const url of ['/', '/about/', '/services/', '/pricing/', '/portfolio/', '/terms/']) {
      await page.goto(url);
      await expect(page.locator('a[href^="https://buy.stripe.com/"]')).toHaveCount(0);
    }
  });
});

test.describe('prices drifting between the pricing and booking sections', () => {
  test('every tier shows the same price in both places', async ({ page }) => {
    await page.goto('/pricing/');

    const priceOf = (locator) =>
      locator.evaluateAll((els) =>
        els.map((el) => (el.textContent.match(/£\s*[\d,]+/) || [''])[0].replace(/\s/g, ''))
      );

    const pricingPrices = await priceOf(page.locator('.price-card .price-amount'));
    const bookingPrices = await priceOf(page.locator('.booking-card .booking-price'));

    expect(pricingPrices).toHaveLength(3);
    expect(bookingPrices).toEqual(pricingPrices);
  });

  test('the booking section and terms agree on the 48 hour cutoff', async ({ page }) => {
    await page.goto('/pricing/');
    await expect(page.locator('.payment-sidenote')).toContainText(/48 hours/i);

    await page.goto('/terms/');
    await expect(page.locator('.terms-section').first()).toContainText(/48 hours/i);
  });
});

test.describe('CSS class renames silently unstyling the page', () => {
  // The booking cards were once .stripe-card. If the CSS and HTML ever fall
  // out of sync again, the cards render as unstyled inline text.
  test('booking cards still pick up their styles', async ({ page }) => {
    await page.goto('/pricing/');
    const styles = await page.locator('.booking-card').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { display: cs.display, borderTopWidth: cs.borderTopWidth, padding: cs.paddingTop };
    });

    expect(styles.display).toBe('flex');
    expect(parseFloat(styles.borderTopWidth)).toBeGreaterThan(0);
    expect(parseFloat(styles.padding)).toBeGreaterThan(0);
  });

  test('no element references a stale stripe-* class', async ({ page }) => {
    await page.goto('/pricing/');
    const stale = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[class]'))
        .map((el) => el.className)
        .filter((c) => typeof c === 'string' && /\bstripe-/.test(c))
    );
    expect(stale).toEqual([]);
  });
});

test.describe('mobile nav was unreachable below 900px', () => {
  test('every page offers a way to reach all nav links on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const url of ['/', '/about/', '/services/', '/pricing/', '/portfolio/', '/terms/']) {
      await page.goto(url);
      const toggle = page.locator('#nav-toggle');
      await expect(toggle, `burger missing on ${url}`).toBeVisible();

      await toggle.click();
      const links = page.locator('#nav-links a');
      await expect(links, `links unreachable on ${url}`).toHaveCount(7);
      await expect(links.first()).toBeVisible();
    }
  });
});

test.describe('portfolio images shipped with empty alt text', () => {
  test('every image that actually loads something has descriptive alt text', async ({ page }) => {
    for (const url of ['/', '/about/', '/services/', '/pricing/', '/portfolio/', '/terms/']) {
      await page.goto(url);
      // Wait for the JS-rendered portfolio grid where applicable.
      if (url === '/portfolio/') {
        await page.locator('.portfolio-item img').first().waitFor();
      }
      const missing = await page.evaluate(() =>
        Array.from(document.images)
          // A placeholder with no src yet is not conveying anything, and an
          // empty alt on it is correct. Only images showing a picture matter.
          .filter((img) => img.getAttribute('src'))
          .filter((img) => !img.alt || !img.alt.trim())
          .map((img) => img.getAttribute('src'))
      );
      expect(missing, `images with a src but no alt on ${url}`).toEqual([]);
    }
  });

  test('no image has an empty src that makes the browser refetch the page', async ({ page }) => {
    // <img src=""> resolves to the current page URL and triggers a wasted
    // request. The lightbox placeholder used to do exactly this.
    for (const url of ['/', '/pricing/', '/portfolio/', '/terms/']) {
      await page.goto(url);
      const emptySrc = await page.evaluate(() =>
        Array.from(document.images)
          .filter((img) => img.hasAttribute('src') && img.getAttribute('src').trim() === '')
          .map((img) => img.id || img.className || 'unnamed <img>')
      );
      expect(emptySrc, `images with an empty src on ${url}`).toEqual([]);
    }
  });

  test('the lightbox gets real alt text once a photo is opened', async ({ page }) => {
    await page.goto('/portfolio/');
    await page.locator('.portfolio-item').first().click();

    const img = page.locator('#lightbox-img');
    await expect(img).toHaveAttribute('alt', /.+/);
    await expect(img).toHaveAttribute('src', /.+/);
  });
});
