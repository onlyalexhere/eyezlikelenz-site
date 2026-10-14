const { test, expect } = require('../helpers/browser-test');

test('wedding enquiry and session booking remain separate working paths', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('.wedding-hero a[href="#contact"]').click();
  await expect(page.locator('#contact')).toBeInViewport();
  await expect(page.locator('.wedding-contact')).toHaveAttribute('href', /^mailto:alexanderoyekola@gmail.com/);
  await page.locator('.session-link a[href="/pricing/#payment"]').click();
  await expect(page.locator('#payment')).toBeInViewport();
  await expect(page.locator('[data-booking-tier]')).toHaveCount(6);
});

for (const width of [375, 390, 768, 1440]) {
  test('navigation and photography fit at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('.hero-photograph img')).toBeVisible();
    expect(await page.locator('.hero-photograph img').evaluate(img => img.complete && img.naturalWidth > 0)).toBeTruthy();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    if (width <= 900) {
      await page.locator('#nav-toggle').click();
      await expect(page.locator('#nav-links a')).toHaveCount(7);
      await page.locator('#nav-links a[href="/pricing/"]').click();
      await expect(page).toHaveURL(/\/pricing\/$/);
    }
  });
}
test('essential content stays visible without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route('https://**', route => route.abort());
  await page.goto('/');
  await expect(page.locator('.about-text')).toHaveCSS('opacity', '1');
  await expect(page.locator('.wedding-contact')).toBeVisible();
  await context.close();
});
