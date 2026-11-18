const lamp = new URLSearchParams(location.search).get('lamp') === 'motion'
  ? document.querySelector('.feature-layout .render')
  : null;

let frame = 0;
function updateProgress() {
  frame = 0;
  updateMeasurements();
  const travel = root.scrollHeight - window.innerHeight;
  const progress = travel > 0 ? Math.min(1, Math.max(0, scrollY / travel)) : 0;
  header.style.setProperty('--progress', progress);
  if (lamp) {
    // Pan within the existing crop, starting at the original centered framing.
    const distance = Math.max(1, lamp.clientHeight);
    const fraction = Math.min(1, Math.max(0, scrollY / distance));
    lamp.style.setProperty('--lamp-position', (50 - 50 * fraction) + '%');
  }
}
function requestProgress() {
  if (!reducedMotion.matches && !frame) frame = requestAnimationFrame(updateProgress);
}
window.addEventListener('scroll', requestProgress, { passive: true });
window.addEventListener('resize', requestProgress);
reducedMotion.addEventListener('change', requestProgress);
document.fonts.ready.then(requestProgress);

// Dimensions describe the responsive heading box and its circular full stop.
const heading = document.querySelector('.measured-title');
const period = heading.querySelector('.period');
const widthNote = heading.querySelector('.width-note');
const heightNote = heading.querySelector('.height-note');
const radiusNote = period?.querySelector('.radius-note');
function measureHeading() {
  const box = heading.getBoundingClientRect();
  widthNote.dataset.value = Math.round(box.width) + ' px';
  heightNote.dataset.value = Math.round(box.height) + ' px';
  if (radiusNote) radiusNote.dataset.value = 'R ' + (period.getBoundingClientRect().width / 2).toFixed(1) + ' px';
}
measureHeading();
const headingObserver = new ResizeObserver(measureHeading);
headingObserver.observe(heading);
if (period) headingObserver.observe(period);

const workImages = document.querySelectorAll('.work-image');
function updateMeasurements() {
  const fadeDistance = Math.min(240, innerHeight * 0.3);
  const opacity = Math.max(0, Math.min(1, scrollY / fadeDistance));
  root.style.setProperty('--measure-opacity', opacity);
  for (const image of workImages) {
    if (scrollY <= 0) {
      image.classList.remove('is-measured');
    } else if (!image.classList.contains('is-measured')) {
      const box = image.getBoundingClientRect();
      if (box.top < innerHeight - Math.min(box.height * 0.15, 64)) {
        image.classList.add('is-measured');
      }
    }
  }
}

const featuredImage = document.querySelector('.featured-image');
const cornerRadius = getComputedStyle(featuredImage.querySelector('.render')).borderTopRightRadius;
featuredImage.querySelector('.corner-radius span').textContent = 'R' + parseFloat(cornerRadius);

const workSizes = new ResizeObserver(entries => {
  for (const entry of entries) {
    entry.target.querySelector('.frame-width span').textContent =
      Math.round(entry.contentRect.width) + ' px';
    const heightLabel = entry.target.querySelector('.frame-height span');
    if (heightLabel) heightLabel.textContent = Math.round(entry.contentRect.height) + ' px';
  }
});
for (const image of workImages) workSizes.observe(image);
