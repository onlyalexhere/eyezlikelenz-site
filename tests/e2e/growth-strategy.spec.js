const { test, expect } = require('../helpers/browser-test');

const SERVICE_PAGES = ['/services/weddings/', '/services/events/', '/services/nightlife/', '/services/portraits/'];
const STORY_PAGES = [
  '/stories/london-club-night-photography/',
  '/stories/london-rooftop-event-photography/',
  '/stories/london-editorial-portrait-session/',
  '/stories/london-studio-portrait-photography/'
];

const schemaGraph = async (page) => {
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(raw);
  return data['@graph'] || [data];
};

test.describe('searchable service evidence', () => {
  test('the service guide links to every dedicated service page', async ({ page }) => {
    await page.goto('/services/');
    for (const path of SERVICE_PAGES) {
      await expect(page.locator(`a[href="${path}"]`)).toBeVisible();
      expect((await page.request.get(path)).status()).toBe(200);
    }
  });

  test('each service page has visible answers and matching machine-readable data', async ({ page }) => {
    for (const path of SERVICE_PAGES) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.coverage-list li')).toHaveCount(4);
      await expect(page.locator('.service-process li')).toHaveCount(3);
      await expect(page.locator('.service-faq details')).toHaveCount(4);
      await expect(page.locator('a[href="/portfolio/"]').first()).toBeVisible();

      const graph = await schemaGraph(page);
      expect(graph.some((item) => item['@type'] === 'Service')).toBe(true);
      expect(graph.some((item) => item['@type'] === 'BreadcrumbList')).toBe(true);
      const faq = graph.find((item) => item['@type'] === 'FAQPage');
      expect(faq.mainEntity).toHaveLength(4);
    }
  });
});

test.describe('completed project stories', () => {
  test('the story index exposes four completed shoots', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/stories/');
    await expect(page.locator('.story-card')).toHaveCount(4);
    for (const path of STORY_PAGES) await expect(page.locator(`a[href="${path}"]`)).toBeVisible();
    const sizes = await page.locator('.story-card img').evaluateAll((images) => images.map((img) => ({ width: img.clientWidth, height: img.clientHeight })));
    expect(sizes.every(({ width, height }) => height < width)).toBe(true);
  });

  test('each story contains crawlable images, context and CreativeWork data', async ({ page }) => {
    for (const path of STORY_PAGES) {
      await page.goto(path);
      expect(await page.locator('.case-gallery img').count()).toBeGreaterThan(3);
      await expect(page.locator('.story-notes')).toContainText(/approach|framing|coverage|photograph/i);
      await expect(page.locator('.story-notes')).toContainText(/details are intentionally omitted/i);
      const graph = await schemaGraph(page);
      const work = graph.find((item) => item['@type'] === 'CreativeWork');
      expect(work.image.length).toBeGreaterThan(3);
      expect(work.contentLocation.name).toBe('London');
    }
  });
});

test.describe('image and page discovery', () => {
  test('the portfolio photographs exist in initial HTML and JS does not duplicate them', async ({ page }) => {
    const html = await (await page.request.get('/portfolio/')).text();
    expect((html.match(/data-portfolio-index=/g) || [])).toHaveLength(55);
    expect((html.match(/<img src="\/portfolio\/images\/thumbs\/[^>]+alt="[^"]+"/g) || [])).toHaveLength(55);
    await page.goto('/portfolio/');
    await expect(page.locator('.portfolio-item')).toHaveCount(55);
  });

  test('the image sitemap describes every portfolio photograph', async ({ page }) => {
    const response = await page.request.get('/image-sitemap.xml');
    expect(response.status()).toBe(200);
    const xml = await response.text();
    expect((xml.match(/<image:image>/g) || [])).toHaveLength(55);
    expect((xml.match(/<image:title>/g) || [])).toHaveLength(55);
    expect(xml).toContain('https://eyezlikelenz.com/portfolio/images/large/photo-01.jpg');
    expect((await page.request.get('/portfolio/images/large/photo-55.jpg')).status()).toBe(200);
  });

  test('robots advertises both page and image sitemaps', async ({ page }) => {
    const robots = await (await page.request.get('/robots.txt')).text();
    expect(robots).toContain('Sitemap: https://eyezlikelenz.com/sitemap.xml');
    expect(robots).toContain('Sitemap: https://eyezlikelenz.com/image-sitemap.xml');
  });
});

test.describe('enquiry conversion', () => {
  test('the contact page provides working routes for bespoke and standard bookings', async ({ page }) => {
    await page.goto('/contact/');
    await expect(page.locator('a[href^="mailto:alexanderoyekola@gmail.com"]').first()).toBeVisible();
    await expect(page.locator('.contact-routes a[href="/pricing/#payment"]')).toBeVisible();
    await expect(page.locator('.contact-routes a[href="/services/"]')).toBeVisible();
    await expect(page.locator('body')).toContainText(/within two working days/i);
  });

  test('public pages describe a service area without claiming a customer-facing studio', async ({ page }) => {
    for (const path of ['/', '/services/', '/services/portraits/', '/contact/', '/llms.txt']) {
      const response = await page.request.get(path);
      expect(response.status()).toBe(200);
      const content = await response.text();
      expect(content).not.toContain('OMJ Studios');
      expect(content).not.toContain('based at OMJ');
    }

    await page.goto('/services/');
    await expect(page.locator('body')).toContainText(/service-area photography business/i);
    await expect(page.locator('body')).toContainText(/client venues, on location or in hired studios/i);

    await page.goto('/');
    const business = await page.locator('script[type="application/ld+json"]').evaluate((node) => JSON.parse(node.textContent));
    expect(business.address.addressLocality).toBe('London');
    expect(business.address).not.toHaveProperty('streetAddress');
    expect(business.address).not.toHaveProperty('postalCode');
  });
});
