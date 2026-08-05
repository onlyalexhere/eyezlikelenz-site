const { test, expect } = require('@playwright/test');

test.describe('home page', () => {
  test('loads with the right title and hero', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/EyezLikeLenz/);
    await expect(page.locator('h1')).toContainText('the moment');
  });

  test('nav links point to the right sections and pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav a[href="/portfolio/"]')).toBeVisible();
    await expect(page.locator('nav a[href="/terms/"]')).toBeVisible();
    await expect(page.locator('nav a[href="#pricing"]')).toBeVisible();
    await expect(page.locator('nav a[href="#contact"]')).toBeVisible();
  });

  test('theme toggle switches theme and persists across reload', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const initial = await html.getAttribute('data-theme');

    await page.click('#theme-toggle');
    const toggled = await html.getAttribute('data-theme');
    expect(toggled).not.toBe(initial);

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', toggled);
  });

  test('contact links use the correct email and phone number', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="mailto:alexanderoyekola@gmail.com"]').first()).toBeVisible();
    await expect(page.locator('a[href="tel:+447456038901"]')).toBeVisible();
  });
});

test.describe('pricing', () => {
  test('displays the three tiers with the correct prices', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('.price-card');
    await expect(cards).toHaveCount(3);

    await expect(cards.nth(0)).toContainText('£110');
    await expect(cards.nth(0)).toContainText('2 hours');
    await expect(cards.nth(1)).toContainText('£215');
    await expect(cards.nth(1)).toContainText('4 hours');
    await expect(cards.nth(2)).toContainText('£525');
    await expect(cards.nth(2)).toContainText('8 hours');
  });
});

test.describe('stripe payment links', () => {
  test('each pricing tier has a working "pay now" link to Stripe checkout', async ({ page }) => {
    await page.goto('/');
    const stripeCards = page.locator('.stripe-card');
    await expect(stripeCards).toHaveCount(3);

    for (const card of await stripeCards.all()) {
      const href = await card.getAttribute('href');
      expect(href).toMatch(/^https:\/\/buy\.stripe\.com\//);
      await expect(card).toHaveAttribute('target', '_blank');
      await expect(card).toHaveAttribute('rel', /noopener/);
    }

    await expect(stripeCards.nth(0)).toContainText('£110');
    await expect(stripeCards.nth(1)).toContainText('£215');
    await expect(stripeCards.nth(2)).toContainText('£525');
  });
});

test.describe('bank transfer gate', () => {
  test('rejects an incorrect access code without revealing bank details', async ({ page }) => {
    await page.goto('/#payment');
    await page.fill('#access-code', 'DEFINITELY-NOT-A-VALID-CODE');
    await page.click('#unlock-btn');

    await expect(page.locator('#lock-error')).toContainText(/incorrect code/i);
    await expect(page.locator('#payment-unlocked')).toBeHidden();
    await expect(page.locator('#payment-locked')).toBeVisible();

    // The unlocked panel must not contain leaked bank text anywhere in the DOM.
    const bankHtml = await page.locator('#payment-unlocked').innerHTML();
    expect(bankHtml).not.toMatch(/HSBC|[0-9]{2}-[0-9]{2}-[0-9]{2}/);
  });

  test('an empty submission is also rejected, not silently accepted', async ({ page }) => {
    await page.goto('/#payment');
    await page.click('#unlock-btn');

    await expect(page.locator('#payment-unlocked')).toBeHidden();
  });
});
