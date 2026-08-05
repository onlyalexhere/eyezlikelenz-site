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

  test('states the non-refundable deposit percentage', async ({ page }) => {
    await page.goto('/terms/');
    await expect(page.locator('.terms-section').first()).toContainText('10%');
  });
});
