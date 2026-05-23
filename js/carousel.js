(function () {
  var AUTO_ADVANCE_MS = 4000;

  var carousel = document.querySelector('.about-carousel');
  if (!carousel) return;

  var track = carousel.querySelector('.carousel-track');
  var dotsContainer = carousel.querySelector('.carousel-dots');
  var prevBtn = carousel.querySelector('.carousel-prev');
  var nextBtn = carousel.querySelector('.carousel-next');

  var images = (typeof CAROUSEL_IMAGES !== 'undefined') ? CAROUSEL_IMAGES : [];
  var current = 0;
  var timer = null;
  var isAnimating = false;

  if (images.length === 0) {
    carousel.classList.add('carousel-empty');
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    dotsContainer.style.display = 'none';
    return;
  }

  // Preload all images before building the carousel so slides are ready
  var loaded = 0;
  var imgEls = [];

  images.forEach(function (src, i) {
    var img = document.createElement('img');
    img.alt = '';
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.4s ease';
    imgEls.push(img);

    img.onload = img.onerror = function () {
      img.style.opacity = '1';
      loaded++;
      if (loaded === images.length) onAllLoaded();
    };

    img.src = src;
    track.appendChild(img);
  });

  function onAllLoaded() {
    images.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); });
      dotsContainer.appendChild(dot);
    });

    if (images.length === 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    }

    setPosition(0, false);
    startTimer();
  }

  function setPosition(index, animate) {
    if (!animate) {
      track.style.transition = 'none';
    } else {
      track.style.transition = '';
    }
    track.style.transform = 'translate3d(-' + (index * 100) + '%, 0, 0)';
  }

  function goTo(index) {
    if (isAnimating) return;
    isAnimating = true;

    current = (index + images.length) % images.length;
    setPosition(current, true);

    dotsContainer.querySelectorAll('.carousel-dot').forEach(function (d, i) {
      d.classList.toggle('active', i === current);
    });

    setTimeout(function () { isAnimating = false; }, 900);
    resetTimer();
  }

  function startTimer() {
    if (images.length < 2) return;
    timer = setInterval(function () { goTo(current + 1); }, AUTO_ADVANCE_MS);
  }

  function resetTimer() {
    clearInterval(timer);
    startTimer();
  }

  prevBtn.addEventListener('click', function () { goTo(current - 1); });
  nextBtn.addEventListener('click', function () { goTo(current + 1); });
})();
