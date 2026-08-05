/**
 * Mobile Nav Menu
 * =====================================================================
 * Below the 900px breakpoint the nav links collapse into a dropdown
 * behind a burger button. This wires up open/close plus the usual
 * dismiss affordances (link click, outside click, Escape, resize back
 * to desktop).
 * =====================================================================
 */
(function () {
  'use strict';

  var toggle = document.getElementById('nav-toggle');
  var links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  function isOpen() { return links.classList.contains('open'); }

  function open() {
    links.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
  }

  function close() {
    links.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  }

  toggle.addEventListener('click', function () {
    if (isOpen()) close(); else open();
  });

  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') close();
  });

  document.addEventListener('click', function (e) {
    if (!isOpen()) return;
    if (links.contains(e.target) || toggle.contains(e.target)) return;
    close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) close();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && isOpen()) close();
  });
})();
