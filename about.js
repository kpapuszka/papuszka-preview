(async () => {
  const frame = document.querySelector('.portrait-frame');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  function updateFit() {
    frame.parentElement.classList.toggle('fits-screen',
      document.documentElement.scrollHeight <= window.innerHeight + 1);
  }
  new ResizeObserver(updateFit).observe(document.body);
  window.addEventListener('resize', updateFit);
  updateFit();
  frame.classList.add('is-ready');
  try {
    await frame.querySelector('img').decode();
  } catch {
    return;
  }
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.intersectionRatio >= 0.2)) {
      frame.classList.add('is-captured');
      observer.disconnect();
    }
  }, { threshold: 0.2 });
  observer.observe(frame);
})();

const toolsBand = document.querySelector('.tools-band');
const motionButton = document.querySelector('#tool-motion');
const toolsList = toolsBand.querySelector('.tools-list');
const repeatedTools = toolsList.cloneNode(true);
repeatedTools.setAttribute('aria-hidden', 'true');
toolsList.after(repeatedTools);
toolsBand.classList.add('is-looping');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
function updateMotionControl() {
  motionButton.hidden = motionPreference.matches;
}
motionPreference.addEventListener('change', updateMotionControl);
updateMotionControl();
motionButton.addEventListener('click', () => {
  const paused = toolsBand.classList.toggle('is-paused');
  motionButton.textContent = paused ? 'Resume motion' : 'Pause motion';
});
