const { test, expect } = require('../helpers/browser-test');

const PAGES = [
  { url: '/', canonical: 'https://eyezlikelenz.com/' },
  { url: '/about/', canonical: 'https://eyezlikelenz.com/about/' },
  { url: '/pricing/', canonical: 'https://eyezlikelenz.com/pricing/' },
  { url: '/portfolio/', canonical: 'https://eyezlikelenz.com/portfolio/' },
  { url: '/terms/', canonical: 'https://eyezlikelenz.com/terms/' }
];

test.describe('search relevance', () => {
  test('every indexable page has one clear primary heading', async ({ page }) => {
    for (const { url } of PAGES) {
      await page.goto(url);
      await expect(page.locator('h1'), `${url} should have one H1`).toHaveCount(1);
      await expect(page.locator('h1')).not.toHaveText('');
    }
  });

  test('core pages identify the London photography service in title and copy', async ({ page }) => {
    for (const url of ['/', '/about/', '/pricing/', '/portfolio/']) {
      await page.goto(url);
      expect(await page.title(), `${url} title should identify London or the photographer`).toMatch(/London|Alex Oyekola/i);
      expect(await page.locator('body').innerText(), `${url} should visibly identify the location`).toMatch(/London/i);
    }
  });
});

test.describe('social share previews', () => {
  for (const { url, canonical } of PAGES) {
    test(`${url} has a complete share card`, async ({ page }) => {
      await page.goto(url);

      const meta = async (sel) =>
        page.locator(sel).first().getAttribute('content');

      // Without og:image a shared link renders as a bare grey box — for a
      // photographer that is the whole pitch missing.
      expect(await meta('meta[property="og:image"]')).toBe(
        'https://eyezlikelenz.com/assets/editorial/share.jpg'
      );
      expect(await meta('meta[property="og:image:width"]')).toBe('1200');
      expect(await meta('meta[property="og:image:height"]')).toBe('630');
      expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');

      // Title and description must be non-empty and page-specific.
      const ogTitle = await meta('meta[property="og:title"]');
      const ogDesc = await meta('meta[property="og:description"]');
      expect(ogTitle).toBeTruthy();
      expect(ogDesc).toBeTruthy();
      expect(ogDesc.length).toBeGreaterThan(30);

      expect(await meta('meta[property="og:url"]')).toBe(canonical);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    });
  }

  test('each page has a distinct og:title', async ({ page }) => {
    const titles = [];
    for (const { url } of PAGES) {
      await page.goto(url);
      titles.push(await page.locator('meta[property="og:title"]').getAttribute('content'));
    }
    expect(new Set(titles).size, `duplicate og:titles: ${titles.join(' | ')}`).toBe(PAGES.length);
  });

  test('the share image actually exists and is the right size', async ({ page }) => {
    const res = await page.request.get('/assets/editorial/share.jpg');
    expect(res.status()).toBe(200);
    const len = Number(res.headers()['content-length'] || 0);
    expect(len).toBeGreaterThan(10_000);
    expect(len, 'og image over 1MB — social scrapers may skip it').toBeLessThan(1_000_000);
  });
});

test.describe('crawlability', () => {
  test('robots.txt allows crawling and points at the sitemap', async ({ page }) => {
    const res = await page.request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/User-agent:\s*\*/i);
    expect(body).toMatch(/Sitemap:\s*https:\/\/eyezlikelenz\.com\/sitemap\.xml/i);
    expect(body).not.toMatch(/^\s*Disallow:\s*\/\s*$/im);
  });

  test('sitemap is valid and lists every page', async ({ page }) => {
    const res = await page.request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    for (const { canonical } of PAGES) {
      expect(body, `sitemap missing ${canonical}`).toContain(`<loc>${canonical}</loc>`);
    }
  });

  test('every URL in the sitemap actually resolves', async ({ page }) => {
    const body = await (await page.request.get('/sitemap.xml')).text();
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBe(PAGES.length);

    for (const loc of locs) {
      const path = loc.replace('https://eyezlikelenz.com', '') || '/';
      const res = await page.request.get(path);
      expect(res.status(), `${loc} is in the sitemap but returns ${res.status()}`).toBe(200);
    }
  });
});

test.describe('structured data', () => {
  test('home page carries parseable business data with matching prices', async ({ page }) => {
    await page.goto('/');
    const raw = await page.locator('script[type="application/ld+json"]').textContent();

    let data;
    expect(() => { data = JSON.parse(raw); }, 'JSON-LD must parse or Google ignores it').not.toThrow();

    expect(data['@context']).toBe('https://schema.org');
    expect(data.name).toBe('EyezLikeLenz');
    expect(data.address.addressLocality).toBe('London');
    expect(data.url).toBe('https://eyezlikelenz.com/');

    // Prices here must not drift from the pricing page.
    const offers = data.hasOfferCatalog.itemListElement;
    expect(offers.map((o) => o.price).sort()).toEqual(['110', '215', '525']);

    await page.goto('/pricing/');
    const onPage = await page.locator('.price-card .price-amount').evaluateAll((els) =>
      els.map((el) => (el.textContent.match(/[\d,]+/) || [''])[0])
    );
    expect(offers.map((o) => o.price).sort()).toEqual(onPage.sort());
  });
});
