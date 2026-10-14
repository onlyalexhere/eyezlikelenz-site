const { test: base, expect } = require('@playwright/test');
// Local user journeys must not depend on analytics or font CDN uptime.
const test = base.extend({
  page: async ({ page }, use) => {
    for (const host of ['www.googletagmanager.com', 'www.google-analytics.com', 'fonts.googleapis.com', 'fonts.gstatic.com']) {
      await page.route('https://' + host + '/**', route => route.abort());
    }
    await use(page);
  }
});
module.exports = { test, expect };
