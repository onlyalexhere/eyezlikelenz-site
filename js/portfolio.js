(function () {
  var grid = document.getElementById('portfolio-grid');
  if (!grid) return;

  var images = (typeof PORTFOLIO_IMAGES !== 'undefined') ? PORTFOLIO_IMAGES : [];
  var empty = document.getElementById('portfolio-empty');

  if (!images.length) {
    if (empty) empty.style.display = 'block';
    return;
  }

  // Normalize entries: support plain strings or { thumb, full } objects.
  function thumbOf(item) { return (typeof item === 'string') ? item : item.thumb; }
  function fullOf(item) { return (typeof item === 'string') ? item : (item.full || item.thumb); }
  function altOf(item, index) {
    var description = (typeof item === 'string' || !item.alt) ? 'EyezLikeLenz portfolio photograph' : item.alt;
    return description + ' — photograph ' + (index + 1) + ' of ' + images.length;
  }

  // Lightbox elements
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var current = 0;

  function open(index) {
    current = (index + images.length) % images.length;
    // Fade the image out, swap source, fade back in once loaded for a smooth transition.
    lightboxImg.classList.remove('loaded');
    var src = fullOf(images[current]);
    lightboxImg.alt = altOf(images[current], current);
    var pre = new Image();
    pre.onload = function () {
      lightboxImg.src = src;
      // Next frame so the browser registers the change before fading in.
      requestAnimationFrame(function () { lightboxImg.classList.add('loaded'); });
    };
    pre.src = src;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function next(dir) { open(current + dir); }

  images.forEach(function (item, i) {
    var fig = grid.querySelector('[data-portfolio-index="' + i + '"]');
    var img;
    if (fig) {
      img = fig.querySelector('img');
    } else {
      fig = document.createElement('button');
      fig.className = 'portfolio-item';
      fig.setAttribute('data-portfolio-index', i);
      fig.setAttribute('aria-label', 'View ' + altOf(item, i));
      img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = altOf(item, i);
      img.src = thumbOf(item);
      fig.appendChild(img);
      grid.appendChild(fig);
    }
    img.onload = function () { fig.classList.add('loaded'); };
    img.onerror = function () { fig.style.display = 'none'; };
    if (img.complete && img.naturalWidth) fig.classList.add('loaded');
    fig.addEventListener('click', function () { open(i); });
  });

  // Lightbox controls
  lightbox.querySelector('.lightbox-close').addEventListener('click', close);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', function (e) { e.stopPropagation(); next(-1); });
  lightbox.querySelector('.lightbox-next').addEventListener('click', function (e) { e.stopPropagation(); next(1); });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target === lightboxImg) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') next(-1);
    else if (e.key === 'ArrowRight') next(1);
  });
})();
