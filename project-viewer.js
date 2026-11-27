(() => {
  const viewer = document.querySelector('#project-model');
  const model = document.querySelector('#model-panel');
  const drawing = document.querySelector('#drawing-panel');
  const reset = document.querySelector('#reset-view');
  const retry = document.querySelector('#retry-model');
  const message = document.querySelector('#model-message');
  const controls = document.querySelectorAll('[data-view]');
  let loading = false;

  function failed() {
    loading = false;
    viewer.removeAttribute('src');
    retry.hidden = false;
    reset.hidden = true;
    message.textContent = 'The model could not load.';
  }
  async function loadModel() {
    if (loading || viewer.hasAttribute('src')) return;
    loading = true;
    retry.hidden = true;
    message.textContent = 'Loading 3D model…';
    try {
      await import('./assets/vendor/model-viewer/model-viewer.min.js');
      viewer.src = viewer.dataset.src;
    } catch {
      failed();
    }
  }
  viewer.addEventListener('load', () => {
    loading = false;
    reset.hidden = false;
    message.textContent = 'Drag or use arrow keys to rotate.';
  });
  viewer.addEventListener('error', failed);
  retry.addEventListener('click', loadModel);
  reset.addEventListener('click', () => {
    viewer.cameraTarget = 'auto auto auto';
    viewer.cameraOrbit = 'auto auto auto';
    viewer.fieldOfView = 'auto';
    viewer.jumpCameraToGoal();
  });
  controls.forEach(button => button.addEventListener('click', () => {
    model.hidden = button.dataset.view !== 'model';
    drawing.hidden = !model.hidden;
    controls.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
    if (!model.hidden) loadModel();
  }));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        loadModel();
      }
    });
    observer.observe(model);
  } else {
    loadModel();
  }
})();
