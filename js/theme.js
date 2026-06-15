(function () {
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  var logo = document.getElementById('logo-img');

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    if (logo) {
      logo.src = theme === 'light' ? '/assets/logo-light.png' : '/assets/logo-dark.png';
    }
  }

  // Sync logo with whatever the no-flash head script already set.
  apply(root.getAttribute('data-theme') || 'dark');

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      apply(next);
      try { localStorage.setItem('ell-theme', next); } catch (e) {}
    });
  }
})();
