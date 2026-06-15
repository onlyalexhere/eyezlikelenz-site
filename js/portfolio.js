(function () {
  var grid = document.getElementById('portfolio-grid');
  if (!grid) return;

  var images = (typeof PORTFOLIO_IMAGES !== 'undefined') ? PORTFOLIO_IMAGES : [];
  var empty = document.getElementById('portfolio-empty');

  if (!images.length) {
    if (empty) empty.style.display = 'block';
    return;
  }

  // Lightbox elements
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var current = 0;

  function open(index) {
    current = (index + images.length) % images.length;
    lightboxImg.src = images[current];
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function next(dir) { open(current + dir); }

  images.forEach(function (src, i) {
    var fig = document.createElement('button');
    fig.className = 'portfolio-item';
    fig.setAttribute('aria-label', 'View image ' + (i + 1));

    var img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = '';
    img.src = src;
    img.onerror = function () { fig.style.display = 'none'; };

    fig.appendChild(img);
    fig.addEventListener('click', function () { open(i); });
    grid.appendChild(fig);
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
