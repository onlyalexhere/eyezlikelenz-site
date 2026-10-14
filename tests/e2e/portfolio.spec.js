const { test, expect } = require('../helpers/browser-test');

test.describe('portfolio page', () => {
  test('renders a non-empty grid of photos with descriptive alt text', async ({ page }) => {
    await page.goto('/portfolio/');
    const items = page.locator('.portfolio-item');
    await expect(items.first()).toBeVisible();
    const count = await items.count();
    expect(count).toBeGreaterThan(0);

    const firstImg = items.first().locator('img');
    await expect(firstImg).toHaveAttribute('alt', /.+/);

    const descriptions = await items.locator('img').evaluateAll((images) => images.map((image) => image.alt));
    expect(new Set(descriptions).size).toBe(descriptions.length);
    expect(descriptions.every((description) => !/^EyezLikeLenz portfolio photograph/.test(description))).toBe(true);
  });

  test('opens the lightbox on click, navigates, and closes on Escape', async ({ page }) => {
    await page.goto('/portfolio/');
    const items = page.locator('.portfolio-item');
    await items.first().click();

    const lightbox = page.locator('#lightbox');
    await expect(lightbox).toHaveClass(/open/);
    await expect(page.locator('#lightbox-img')).toHaveAttribute('alt', /1 of/);

    await page.click('.lightbox-next');
    await expect(page.locator('#lightbox-img')).toHaveAttribute('alt', /2 of/);

    await page.click('.lightbox-prev');
    await expect(page.locator('#lightbox-img')).toHaveAttribute('alt', /1 of/);

    await page.keyboard.press('Escape');
    await expect(lightbox).not.toHaveClass(/open/);
  });

  test('the "Portfolio" nav link is marked active', async ({ page }) => {
    await page.goto('/portfolio/');
    await expect(page.locator('nav a.active')).toHaveAttribute('href', '/portfolio/');
  });
});

test.describe('pricing page', () => {
  test('carries both the pricing and booking sections', async ({ page }) => {
    await page.goto('/pricing/');
    await expect(page.locator('#pricing')).toBeVisible();
    await expect(page.locator('#payment')).toBeVisible();
    await expect(page.locator('.price-card')).toHaveCount(3);
    await expect(page.locator('.booking-card')).toHaveCount(3);
  });

  test('the "Pricing" nav link is marked active', async ({ page }) => {
    await page.goto('/pricing/');
    await expect(page.locator('nav a.active')).toHaveAttribute('href', '/pricing/');
  });

  test('has its own title and description rather than inheriting the home page', async ({ page }) => {
    await page.goto('/pricing/');
    await expect(page).toHaveTitle(/Pricing/);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toMatch(/pricing|booking/i);
  });

  test('enquiry links resolve to the home page, not a dead anchor', async ({ page }) => {
    await page.goto('/pricing/');
    // #contact lives on the home page now, so bare "#contact" would go nowhere.
    const dangling = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href^="#"]'))
        .filter((a) => !document.querySelector(a.getAttribute('href')))
        .map((a) => a.getAttribute('href'))
    );
    expect(dangling).toEqual([]);
  });
});

test.describe('terms page', () => {
  test('lists all 13 numbered clauses', async ({ page }) => {
    await page.goto('/terms/');
    await expect(page.locator('.terms-section')).toHaveCount(13);
    await expect(page.locator('.terms-section').first()).toContainText('Booking');
  });

  test('states that sessions are paid in full at booking', async ({ page }) => {
    await page.goto('/terms/');
    await expect(page.locator('.terms-section').first()).toContainText(/paid in full at the time of booking/i);
  });

  test('states the 48 hour minimum booking notice', async ({ page }) => {
    await page.goto('/terms/');
    await expect(page.locator('.terms-section').first()).toContainText(/less than 48 hours/i);
  });

  test('states the non-refundable booking fee on cancellation', async ({ page }) => {
    await page.goto('/terms/');
    await expect(page.locator('.terms-section').nth(1)).toContainText('10%');
    await expect(page.locator('.terms-section').nth(1)).toContainText('90%');
  });
});
