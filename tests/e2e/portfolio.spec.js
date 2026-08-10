const { test, expect } = require('@playwright/test');

test.describe('portfolio page', () => {
  test('renders a non-empty grid of photos with descriptive alt text', async ({ page }) => {
    await page.goto('/portfolio/');
    const items = page.locator('.portfolio-item');
    await expect(items.first()).toBeVisible();
    const count = await items.count();
    expect(count).toBeGreaterThan(0);

    const firstImg = items.first().locator('img');
    await expect(firstImg).toHaveAttribute('alt', /.+/);
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

test.describe('terms page', () => {
  test('lists all 11 numbered clauses', async ({ page }) => {
    await page.goto('/terms/');
    await expect(page.locator('.terms-section')).toHaveCount(11);
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
