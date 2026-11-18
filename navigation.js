const root = document.documentElement;
const header = document.querySelector('header');
const theme = document.querySelector('#theme');
const menu = document.querySelector('#menu');
const mobile = matchMedia('(max-width: 650px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function applyTheme(value) {
  const dark = value === 'dark';
  root.dataset.theme = dark ? 'dark' : 'light';
  theme.textContent = dark ? 'Light' : 'Dark';
  theme.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
}
let savedTheme;
try { savedTheme = localStorage.getItem('papuszka-home-theme'); } catch {}
applyTheme(savedTheme);
theme.addEventListener('click', () => {
  applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  try { localStorage.setItem('papuszka-home-theme', root.dataset.theme); } catch {}
});

function setMenu(open) {
  header.classList.toggle('menu-open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.textContent = open ? 'Close' : 'Menu';
  if (open) document.querySelector('nav a').focus();
}
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && header.classList.contains('menu-open')) {
    setMenu(false);
    menu.focus();
  }
});
document.addEventListener('click', event => {
  if (!header.contains(event.target)) setMenu(false);
});
header.addEventListener('focusout', event => {
  if (event.relatedTarget && !header.contains(event.relatedTarget)) setMenu(false);
});
mobile.addEventListener('change', () => setMenu(false));
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    setMenu(false);
    if (link.hash === '#top') {
      event.preventDefault();
      document.querySelector('.brand').focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
      if (location.hash) history.replaceState(null, '', '#top');
      return;
    }
    document.querySelector(link.hash).focus({ preventScroll: true });
  });
});

