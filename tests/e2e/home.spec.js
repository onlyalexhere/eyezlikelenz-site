const { test, expect } = require('@playwright/test');
const { SORT_CODE, BANK_NAMES } = require('../helpers/secret-patterns.js');

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

test.describe('booking entry points', () => {
  test('each booking card shows the right tier and price', async ({ page }) => {
    await page.goto('/');
    const bookingCards = page.locator('.booking-card');
    await expect(bookingCards).toHaveCount(3);

    await expect(bookingCards.nth(0)).toContainText('£110');
    await expect(bookingCards.nth(1)).toContainText('£215');
    await expect(bookingCards.nth(2)).toContainText('£525');
  });

  test('every booking entry point is tagged with a tier the config knows about', async ({ page }) => {
    await page.goto('/');
    // 3 pricing-card buttons + 3 booking cards in the booking section.
    const bookable = page.locator('[data-booking-tier]');
    await expect(bookable).toHaveCount(6);

    const tiers = await bookable.evaluateAll(function (els) {
      return els.map(function (el) { return el.getAttribute('data-booking-tier'); });
    });
    const knownTiers = await page.evaluate(function () {
      return Object.keys(window.BOOKING_CONFIG.events);
    });
    for (const tier of tiers) {
      expect(knownTiers).toContain(tier);
    }
  });

  test('booking buttons never render as dead links, configured or not', async ({ page }) => {
    await page.goto('/');
    const configured = await page.evaluate(function () {
      return Boolean(window.BOOKING_CONFIG && window.BOOKING_CONFIG.username);
    });

    for (const el of await page.locator('[data-booking-tier]').all()) {
      const href = await el.getAttribute('href');
      expect(href).toBeTruthy();
      if (configured) {
        expect(href).toMatch(/^https:\/\/cal\.com\/.+\/.+/);
      } else {
        // Falls back to the enquiry section until Cal.com is set up.
        expect(href).toBe('#contact');
      }
    }
  });

  test('no standalone pay-now link can be used without picking a date', async ({ page }) => {
    await page.goto('/');
    // Paying outside the booking flow is what allowed double-booking, so the
    // page must not offer a bare Stripe checkout link anywhere.
    await expect(page.locator('a[href^="https://buy.stripe.com/"]')).toHaveCount(0);
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
    expect(bankHtml).not.toMatch(SORT_CODE);
    expect(bankHtml).not.toMatch(BANK_NAMES);
  });

  test('an empty submission is also rejected, not silently accepted', async ({ page }) => {
    await page.goto('/#payment');
    await page.click('#unlock-btn');

    await expect(page.locator('#payment-unlocked')).toBeHidden();
  });
});
