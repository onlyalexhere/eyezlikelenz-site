/**
 * Booking
 * =====================================================================
 * Turns any element with [data-booking-tier="half|full|day"] into a
 * booking link for the matching Cal.com event type.
 *
 * Progressive enhancement, deliberately:
 *   - The button is a real <a href="https://cal.com/...">, so it works
 *     with JS off, if Cal's script fails, and on right-click/new-tab.
 *   - Cal's embed script is only fetched once the visitor shows intent
 *     (hover/focus/touch on a booking button), so the third-party JS
 *     never costs anything on a normal page view.
 *   - Once loaded, Cal's own delegated handler upgrades the click into
 *     an in-page popup.
 *
 * If BOOKING_CONFIG.username is blank the buttons are left exactly as
 * authored (pointing at the enquiry section), so an unconfigured site
 * never ships a dead button.
 * =====================================================================
 */
(function () {
  'use strict';

  var config = (typeof BOOKING_CONFIG !== 'undefined') ? BOOKING_CONFIG : null;
  var buttons = document.querySelectorAll('[data-booking-tier]');
  if (!buttons.length) return;

  if (!config || !config.username) return; // Not set up yet — leave the #contact fallback in place.

  function slugFor(tier) {
    return config.events && config.events[tier];
  }

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  // Point each button at its real Cal.com booking page.
  var linked = [];
  Array.prototype.forEach.call(buttons, function (btn) {
    var slug = slugFor(btn.getAttribute('data-booking-tier'));
    if (!slug) return;

    var calLink = config.username + '/' + slug;
    btn.href = 'https://cal.com/' + calLink;
    btn.setAttribute('data-cal-link', calLink);
    btn.setAttribute('data-cal-config', '{"theme":"' + currentTheme() + '"}');
    linked.push(btn);
  });

  if (!linked.length) return;

  // Keep the popup's theme in step if the visitor toggles the site theme.
  var themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var theme = currentTheme();
      linked.forEach(function (btn) {
        btn.setAttribute('data-cal-config', '{"theme":"' + theme + '"}');
      });
      if (window.Cal) window.Cal('ui', { theme: theme });
    });
  }

  // Load Cal's embed script once, on first sign of booking intent.
  var loaded = false;
  function loadCalEmbed() {
    if (loaded) return;
    loaded = true;

    (function (C, A, L) {
      var p = function (a, ar) { a.q.push(ar); };
      var d = C.document;
      C.Cal = C.Cal || function () {
        var cal = C.Cal;
        var ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement('script')).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          var api = function () { p(api, arguments); };
          var namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === 'string') {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ['initNamespace', namespace]);
          } else {
            p(cal, ar);
          }
          return;
        }
        p(cal, ar);
      };
    })(window, 'https://app.cal.com/embed/embed.js', 'init');

    window.Cal('init', { origin: 'https://cal.com' });
    window.Cal('ui', { theme: currentTheme(), hideEventTypeDetails: false });
  }

  linked.forEach(function (btn) {
    btn.addEventListener('mouseenter', loadCalEmbed);
    btn.addEventListener('focus', loadCalEmbed);
    btn.addEventListener('touchstart', loadCalEmbed, { passive: true });
  });
})();
