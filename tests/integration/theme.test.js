import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScript } from '../helpers/load-script.js';

describe('theme toggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.innerHTML = `
      <button id="theme-toggle" aria-label="Toggle light and dark mode"></button>
      <img id="logo-img" src="/assets/logo-dark.png">
    `;
    vi.resetModules();
    loadScript('js/theme.js');
  });

  it('defaults the logo to match the theme already set on <html>', () => {
    expect(document.getElementById('logo-img').src).toContain('logo-dark.png');
  });

  it('switches to light theme and swaps the logo on click', () => {
    document.getElementById('theme-toggle').click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.getElementById('logo-img').src).toContain('logo-light.png');
  });

  it('persists the choice to localStorage', () => {
    document.getElementById('theme-toggle').click();
    expect(localStorage.getItem('ell-theme')).toBe('light');
  });

  it('toggles back to dark on a second click', () => {
    var toggle = document.getElementById('theme-toggle');
    toggle.click();
    toggle.click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('ell-theme')).toBe('dark');
    expect(document.getElementById('logo-img').src).toContain('logo-dark.png');
  });
});
