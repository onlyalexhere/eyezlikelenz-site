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

  function decide(banner, granted) {
    save(granted ? 'granted' : 'denied');
    updateConsent(granted);
    banner.classList.remove('is-visible');
    // Leave the node in place until the slide-out finishes, then drop it.
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 400);
  }

  function build() {
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
          '<p class="consent-text" id="consent-text">I use cookies to measure how well my ads are working. ' +
          'Nothing gets stored on your device unless you say yes, and declining changes nothing about how the site works. ' +
          '<a href="/terms/">Read the terms</a>.</p>' +
        '</div>' +
        '<div class="consent-actions">' +
          '<button type="button" class="btn consent-decline">Decline</button>' +
          '<button type="button" class="btn btn-primary consent-accept">Accept</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(banner);

    banner.querySelector('.consent-accept').addEventListener('click', function () {
      decide(banner, true);
    });
    banner.querySelector('.consent-decline').addEventListener('click', function () {
      decide(banner, false);
    });

    // Next frame, so the browser paints the off-screen state first and the
    // transition actually runs.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { banner.classList.add('is-visible'); });
    });

    return banner;
  }

  // A stored choice was already applied by the head script — stay out of the way.
  if (stored()) return;

  if (document.body) {
    build();
  } else {
    document.addEventListener('DOMContentLoaded', build);
  }
})();
