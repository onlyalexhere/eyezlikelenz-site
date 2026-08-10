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
│   ├── booking-config.js   Cal.com username + event slugs (the only file to edit)
│   ├── booking.js          Turns booking buttons into Cal.com links/popups
│   ├── nav-menu.js         Mobile burger menu
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

### Booking calendar

Availability, date-locking, and card payment are handled by [Cal.com](https://cal.com). The site itself is static, so it has nowhere to store "this date is taken" — Cal.com owns that, and the site just links to it.

**The site ships safe before this is set up.** While `username` in `js/booking-config.js` is blank, every booking button quietly falls back to the enquiry section, so nothing is ever a dead link.

**One-time setup (you'll need to do this part — it needs your own logins):**

1. Create an account at [cal.com](https://cal.com) and note your username (the `you` in `cal.com/you`).
2. **Connect Google Calendar** (Apps → Google Calendar). This is what makes shoots you book *outside* the site — by phone, DM, whatever — also disappear from your public availability. Without it, only Cal.com bookings block the calendar.
3. **Connect Stripe** (Apps → Stripe) so the session is paid for at the moment of booking. A date isn't held until payment completes.
4. Create three event types, one per tier:

   | Event type | Duration | Price | Slug |
   | --- | --- | --- | --- |
   | Half Session | 2 hours | £110 | `half-session` |
   | Full Session | 4 hours | £215 | `full-session` |
   | Full Day | 8 hours | £525 | `full-day` |

5. On **each** event type, set **Minimum notice to 48 hours** (Limits → Minimum notice). This matches section 01 of the Terms — bookings can't be made inside 48 hours.
6. Also worth setting per event type: a buffer after the event (travel/turnaround time), and your real working hours under Availability.
7. Put your username into `js/booking-config.js`:

   ```js
   username: 'your-cal-username',
   ```

   If you used different slugs in step 4, update the `events` map in the same file to match.

That's the whole integration — `booking-config.js` is the only file you should ever need to touch.

**How the buttons behave:** they're real `<a href="https://cal.com/...">` links, so they work even if Cal's script is blocked or JS is off. When the script does load (only once someone hovers or taps a booking button — never on a plain page view) it upgrades them into an in-page popup that matches the site's light/dark theme.

**Changing prices:** the price lives in *two* places — the pricing cards in `index.html` and the Cal.com event type. Update both, or clients will see one price and be charged another.

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

- `tests/unit/` — `js/xor-codec.js` encode/decode round-trips, wrong-code rejection, malformed input, plus a scanner that fails the build if anything resembling real bank data appears in source.
- `tests/integration/` — jsdom tests for `theme.js`, `payment-unlock.js`, `portfolio.js`, and `booking.js`, loading the actual site scripts against a synthetic DOM.
- `tests/e2e/` — Playwright tests against `python3 -m http.server`, covering pricing amounts, booking entry points, the bank-transfer code gate, portfolio lightbox navigation, the mobile nav, and the terms page.
- `tests/e2e/regressions.spec.js` — one test per bug this site has actually shipped, each named after its symptom so a failure explains itself. See below.

### Regression suite

Every bug found in this codebase gets a test so it can't come back quietly:

| Bug that shipped | Guarded by |
| --- | --- |
| Real bank details and access code sat in a plaintext comment in a public repo | `tests/unit/no-plaintext-secrets.test.js` — scans all source for sort codes, bank names, and the annotate-the-blob-with-its-plaintext pattern |
| Nav flashed solid black on iOS Safari when the mobile menu opened | asserts `nav` keeps its own compositing layer and its `-webkit-` blur prefix |
| Nav links vanished entirely below 900px, leaving phones unable to navigate | asserts a burger + all 7 links are reachable on every page at 390px |
| Stripe links let someone pay with no date attached, allowing double-booking | asserts no bare `buy.stripe.com` link exists anywhere |
| Portfolio images shipped with empty `alt` | asserts every image with a `src` has non-empty alt, on every page |
| Lightbox `<img src="">` made the browser refetch the page URL | asserts no image has an empty `src` |
| Renaming `.stripe-*` to `.booking-*` could silently unstyle the cards | asserts the cards still compute real styles and no stale class remains |
| Prices could drift between the pricing cards and the booking cards | asserts both sections, and the terms' 48-hour cutoff, agree |

The secret scanner is verified to actually fail — drop a file containing a fake sort code into the repo and `npm run test:unit` goes red.

None of the tests use the real production access code or bank details — the payment tests either check the negative path (wrong code → rejected, nothing leaked) against the real `ENCODED` value, or use a `window.__ELL_TEST_ENCODED__` override with synthetic test data for the success path. Never add the real code or bank details to a test file.

`@playwright/test` is pinned to `1.48.0` in `package.json` — newer versions dropped prebuilt browser support for macOS 13. Bump it once you're on a newer OS.

## Licence

All content and code © 2026 Alexander Oyekola. All rights reserved.
