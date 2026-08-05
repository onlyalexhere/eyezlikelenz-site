# EyezLikeLenz Photography

Single page site for Alex Oyekola Photography: about, services, pricing, payment, terms, and contact. Static HTML, no build step, no framework, no runtime dependencies beyond Google Fonts. A Node-based test suite (dev-only) covers the business-critical logic — see [Testing](#testing).

## Structure

```
eyezlikelenz-site/
├── index.html              Page markup
├── css/
│   └── styles.css          All styling (sectioned by component)
├── js/
│   ├── xor-codec.js        Pure XOR encode/decode helpers (no DOM, unit-testable)
│   ├── payment-unlock.js   Gated bank details (XOR + base64, via xor-codec.js)
│   └── reveal.js           Scroll-triggered fade-ins
├── tests/                  Unit, integration, and e2e tests (see below)
├── README.md
└── .gitignore
```

## Running locally

It's a static site. Open `index.html` in a browser directly, or serve the folder with any static file server. For example:

```sh
# python
python3 -m http.server 8000

# node
npx serve .
```

Then visit http://localhost:8000.

## Deploying

Push the folder to any static host: GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3, or a shared web host. No build step. Just upload all four files (and the folders) and point the host at `index.html`.

## Editing the most common things

### Prices

Open `index.html`, find the `#pricing` section, and change the values inside `.price-amount` and the `.price-features` lists.

### Bank details / access code

Bank details are XOR encoded with an access code so they don't appear in plain HTML. To rotate the code or change the details:

1. Open the site in a browser and open the DevTools console.
2. Run, with your new code and details:

   ```js
   encodeBankDetails('NEW_CODE_HERE', 'Account Name|Bank|Sort Code|Account Number')
   ```

3. Copy the printed string and paste it into `js/payment-unlock.js`, replacing the value of the `ENCODED` constant.
4. Share the new code privately (email, DM) only with confirmed clients.

**Never write the plaintext code or bank details into a comment, commit message, or any other file in this repo — it's public, and anything committed is visible to anyone (and stays in git history even after you edit it away).** The `ENCODED` constant is the only place bank details should exist in this codebase.

### Terms and conditions

All clauses live in the `#terms` section of `index.html`. They are numbered consecutively, so if you add or remove one, renumber the `<span class="num">` labels.

### Colours and fonts

Open `css/styles.css` and edit the `:root` variables at the top. Every colour on the site references these. Fonts are loaded from Google Fonts; swap the `<link>` in `index.html` if you change them.

## Security note

The gated payment section is **obfuscation, not encryption**. A determined attacker who reads `payment-unlock.js` can recover the bank details. It is strong enough to stop:

* Search engines indexing the details.
* Bots scraping payment pages.
* Anyone casually viewing the page source.

For higher security on a real public site, move payment details behind a server-side flow that emails them only after an enquiry is verified. The current setup is the right level of friction for a small photography business sharing the link with clients directly.

## Testing

The site itself ships with zero dependencies, but there's a Node-based test suite (dev-only) covering the business-critical paths: the payment access-code gate, pricing display, the portfolio lightbox, theme persistence, and the Stripe/contact links.

```sh
npm install
npx playwright install chromium   # one-time, downloads a browser for e2e tests

npm run test:unit   # vitest — pure logic (js/xor-codec.js) + jsdom integration tests
npm run test:e2e    # playwright — real browser against a local static server
npm test            # both
```

- `tests/unit/` — `js/xor-codec.js` encode/decode round-trips, wrong-code rejection, malformed input.
- `tests/integration/` — jsdom tests for `theme.js`, `payment-unlock.js`, and `portfolio.js`, loading the actual site scripts against a synthetic DOM.
- `tests/e2e/` — Playwright tests against `python3 -m http.server`, covering pricing amounts, Stripe link hrefs, the bank-transfer code gate, portfolio lightbox navigation, and the terms page.

None of the tests use the real production access code or bank details — the payment tests either check the negative path (wrong code → rejected, nothing leaked) against the real `ENCODED` value, or use a `window.__ELL_TEST_ENCODED__` override with synthetic test data for the success path. Never add the real code or bank details to a test file.

`@playwright/test` is pinned to `1.48.0` in `package.json` — newer versions dropped prebuilt browser support for macOS 13. Bump it once you're on a newer OS.

## Licence

All content and code © 2026 Alexander Oyekola. All rights reserved.
