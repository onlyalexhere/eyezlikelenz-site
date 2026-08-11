/**
 * Testimonials
 * =====================================================================
 * Renders only entries marked `approved: true` in testimonials-config.js.
 *
 * The gate is deliberate: a quote the client has not signed off on is a
 * fabricated review. If nothing is approved yet, the entire section is
 * removed from the page rather than left showing an empty heading.
 * =====================================================================
 */
(function () {
  'use strict';

  var section = document.getElementById('testimonials');
  var grid = document.getElementById('testimonials-grid');
  if (!section || !grid) return;

  var all = (typeof TESTIMONIALS !== 'undefined') ? TESTIMONIALS : [];
  var approved = all.filter(function (t) { return t && t.approved === true && t.quote; });

  if (!approved.length) {
    section.remove();
    return;
  }

  approved.forEach(function (item) {
    var fig = document.createElement('figure');
    fig.className = 'testimonial reveal';

    var quote = document.createElement('blockquote');
    quote.className = 'testimonial-quote';
    quote.textContent = '“' + item.quote + '”';

    var caption = document.createElement('figcaption');
    caption.className = 'testimonial-attr';

    var who = document.createElement('span');
    who.className = 'testimonial-client';
    who.textContent = item.client;
    caption.appendChild(who);

    if (item.shoot) {
      var what = document.createElement('span');
      what.className = 'testimonial-shoot';
      what.textContent = item.shoot;
      caption.appendChild(what);
    }

    fig.appendChild(quote);
    fig.appendChild(caption);
    grid.appendChild(fig);
  });
})();
