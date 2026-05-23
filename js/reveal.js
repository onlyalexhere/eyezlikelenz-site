/**
 * Scroll Reveal
 * =====================================================================
 * Fades elements with the .reveal class into view as they scroll
 * into the viewport. Hero reveals fire immediately on page load.
 * =====================================================================
 */

(function () {
  'use strict';

  var reveals = document.querySelectorAll('.reveal');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  reveals.forEach(function (el) {
    observer.observe(el);
  });

  // Hero is above the fold, so reveal it on load rather than waiting
  // for the intersection observer.
  window.addEventListener('load', function () {
    document.querySelectorAll('.hero .reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  });
})();
