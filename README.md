# EyezLikeLenz Photography

Single page site for Alex Oyekola Photography: about, services, pricing, payment, terms, and contact. Static HTML, no build step, no framework, no dependencies beyond Google Fonts.

## Structure

```
eyezlikelenz-site/
├── index.html              Page markup
├── css/
│   └── styles.css          All styling (sectioned by component)
├── js/
│   ├── payment-unlock.js   Gated bank details (XOR + base64)
│   └── reveal.js           Scroll-triggered fade-ins
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

   For example:

   ```js
   encodeBankDetails('NEW2026', 'Alexander Oyekola|HSBC|40-11-93|51238159')
   ```

3. Copy the printed string and paste it into `js/payment-unlock.js`, replacing the value of the `ENCODED` constant.
4. Share the new code privately (email, DM) only with confirmed clients.

The current code is documented in a comment at the top of `payment-unlock.js`. Update that comment too when you rotate it.

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

## Licence

All content and code © 2026 Alexander Oyekola. All rights reserved.
