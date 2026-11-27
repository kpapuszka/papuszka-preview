if ('IntersectionObserver' in window) {
  const sections = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('entered');
        sections.unobserve(entry.target);
      }
    }
  });
  document.querySelectorAll('.project-section').forEach(section => sections.observe(section));
}

const gallery = document.querySelector('.gallery-track');
if (gallery) {
  const slides = Array.from(gallery.children);
  const controls = document.querySelector('.gallery-controls');
  const status = document.querySelector('.gallery-status');
  const current = () => Math.max(0, Math.min(slides.length - 1,
    Math.round(gallery.scrollLeft / gallery.clientWidth)));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let destination = null;
  let overlay;
  function go(step) {
    overlay?.remove();
    const from = destination ?? current();
    const index = (from + step + slides.length) % slides.length;
    const wraps = Math.abs(index - from) > 1;
    if (wraps && !reducedMotion.matches && gallery.animate) {
      const outgoing = slides[current()].cloneNode(true);
      outgoing.classList.add('gallery-outgoing');
      outgoing.setAttribute('aria-hidden', 'true');
      gallery.after(outgoing);
      overlay = outgoing;
      const fade = outgoing.animate([{ opacity: 1 }, { opacity: 0 }],
        { duration: 360, easing: 'ease-in-out', fill: 'forwards' });
      fade.onfinish = () => outgoing.remove();
    }
    destination = index;
    gallery.scrollTo({ left: index * gallery.clientWidth,
      behavior: wraps || reducedMotion.matches ? 'instant' : 'smooth' });
  }
  for (const event of ['pointerdown', 'wheel']) {
    gallery.addEventListener(event, () => { destination = null; }, { passive: true });
  }
  for (const button of controls.querySelectorAll('button')) {
    button.addEventListener('click', () => go(Number(button.dataset.step)));
  }
  gallery.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      go(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  gallery.addEventListener('scroll', () => {
    if (!gallery.clientWidth) return;
    const index = current();
    if (destination !== null && Math.abs(gallery.scrollLeft - destination * gallery.clientWidth) < 1) {
      destination = null;
    }
    const text = (index + 1) + ' / ' + slides.length + ' · ' + slides[index].dataset.caption;
    if (status.textContent !== text) status.textContent = text;
  }, { passive: true });
  controls.hidden = false;
}
