const { test, expect } = require('../helpers/browser-test');

// iPhone 13-ish viewport, emulated on Chromium rather than pulling in the
// (unbundled) WebKit engine — the mobile CSS breakpoint doesn't care which
// rendering engine is behind it.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test.describe('mobile nav menu', () => {
  test('nav links are hidden until the burger is opened', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#nav-toggle')).toBeVisible();
    await expect(page.locator('#nav-links')).toBeHidden();
  });

  test('opens on tap, shows every link, and reflects state via aria-expanded', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('#nav-toggle');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.tap();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    const links = page.locator('#nav-links a');
    await expect(links).toHaveCount(7);
    for (const link of await links.all()) {
      await expect(link).toBeVisible();
    }
  });

  test('closes and scrolls when a same-page link is tapped', async ({ page }) => {
    await page.goto('/');
    await page.locator('#nav-toggle').tap();
    await page.locator('#nav-links a[href="#contact"]').tap();

    await expect(page.locator('#nav-links')).toBeHidden();
    await expect(page).toHaveURL(/#contact$/);
    await expect(page.locator('#contact')).toBeInViewport();
  });

  test('navigates away when a cross-page link is tapped', async ({ page }) => {
    await page.goto('/');
    await page.locator('#nav-toggle').tap();
    await page.locator('#nav-links a[href="/pricing/"]').tap();

    await expect(page).toHaveURL(/\/pricing\/$/);
    await expect(page.locator('.price-card').first()).toBeVisible();
    // The menu must not carry over as open into the new page.
    await expect(page.locator('#nav-links')).toBeHidden();
  });

  test('deep-links straight to the booking section from the nav', async ({ page }) => {
    await page.goto('/');
    await page.locator('#nav-toggle').tap();
    await page.locator('#nav-links a[href="/pricing/#payment"]').tap();

    await expect(page).toHaveURL(/\/pricing\/#payment$/);
    await expect(page.locator('#payment')).toBeInViewport();
  });

  test('closes on outside tap', async ({ page }) => {
    await page.goto('/');
    await page.locator('#nav-toggle').tap();
    await expect(page.locator('#nav-links')).toBeVisible();

    await page.locator('body').tap({ position: { x: 20, y: 700 } });
    await expect(page.locator('#nav-links')).toBeHidden();
  });

  test('works the same way on the portfolio and terms pages', async ({ page }) => {
    await page.goto('/portfolio/');
    await page.locator('#nav-toggle').tap();
    await expect(page.locator('#nav-links a.active')).toHaveText('Portfolio');
    await expect(page.locator('#nav-links a[href="/terms/"]')).toBeVisible();

    await page.goto('/terms/');
    await page.locator('#nav-toggle').tap();
    await expect(page.locator('#nav-links a.active')).toHaveText('Terms');
    await expect(page.locator('#nav-links a[href="/portfolio/"]')).toBeVisible();

    await page.goto('/services/');
    await page.locator('#nav-toggle').tap();
    await expect(page.locator('#nav-links a.active')).toHaveText('Services');
  });

  test('the burger disappears again above the 900px breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.locator('#nav-toggle')).toBeHidden();
    await expect(page.locator('#nav-links')).toBeVisible();
  });
});
