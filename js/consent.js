(function () {
  var KEY = 'ell-consent';

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function save(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
  }

  // Tell the already-loaded Google tag what the visitor decided. The head
  // script set every signal to 'denied' by default, so nothing is stored
  // until this runs with granted === true.
  function updateConsent(granted) {
    var state = granted ? 'granted' : 'denied';
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: state,
        ad_user_data: state,
        ad_personalization: state,
        analytics_storage: state
      });
    }
  }

  // Clearing the cookies matters on withdrawal: revoking consent has to
  // actually remove what was already set, not just stop setting more.
  function clearAdCookies() {
    var host = location.hostname;
    document.cookie.split(';').forEach(function (raw) {
      var name = raw.split('=')[0].trim();
      if (name.indexOf('_gcl') !== 0 && name.indexOf('_ga') !== 0) return;
      var stem = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
      document.cookie = stem;
      document.cookie = stem + '; domain=' + host;
      document.cookie = stem + '; domain=.' + host;
    });
  }

  var current = null;

  function close() {
    if (!current) return;
    var banner = current;
    current = null;
    banner.classList.remove('is-visible');
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 400);
  }

  function decide(granted) {
    save(granted ? 'granted' : 'denied');
    updateConsent(granted);
    if (!granted) clearAdCookies();
    close();
  }

  function onKeydown(e) {
    // Escape only dismisses a banner reopened from the footer — it must never
    // stand in for a first-time choice, since silence is not consent.
    if (e.key === 'Escape' && current && stored()) close();
  }

  function show() {
    if (current) return current;

    var banner = document.createElement('div');
    banner.className = 'consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-labelledby', 'consent-title');
    banner.setAttribute('aria-describedby', 'consent-text');
    banner.innerHTML =
      '<div class="consent-inner">' +
        '<div class="consent-copy">' +
          '<div class="consent-title display" id="consent-title">Cookies<span class="consent-dot">.</span></div>' +
          '<p class="consent-text" id="consent-text">I use Google Ads cookies to measure how well my ads are working. ' +
          'Nothing is stored on your device unless you accept, declining changes nothing about how the site works, ' +
          'and you can change your mind at any time using the Cookie settings link in the footer. ' +
          '<a href="/terms/#cookies">How I use cookies</a>.</p>' +
        '</div>' +
        '<div class="consent-actions">' +
          '<button type="button" class="btn consent-decline">Reject</button>' +
          '<button type="button" class="btn consent-accept">Accept</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(banner);
    current = banner;

    banner.querySelector('.consent-accept').addEventListener('click', function () {
      decide(true);
    });
    banner.querySelector('.consent-decline').addEventListener('click', function () {
      decide(false);
    });

    // Next frame, so the browser paints the off-screen state first and the
    // transition actually runs.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { banner.classList.add('is-visible'); });
    });

    return banner;
  }

  function wireSettingsTriggers() {
    var triggers = document.querySelectorAll('[data-consent-settings]');
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener('click', function (e) {
        e.preventDefault();
        show();
      });
    }
  }

  function init() {
    wireSettingsTriggers();
    // A stored choice was already applied by the head script — only reopen
    // if the visitor asks for it via the footer.
    if (!stored()) show();
  }

  document.addEventListener('keydown', onKeydown);

  // Withdrawing consent has to be as easy as giving it, so the footer link
  // on every page reopens this.
  window.ELLConsent = { open: show, stored: stored };

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
