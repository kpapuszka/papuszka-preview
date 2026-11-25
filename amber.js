(() => {
  const stage = document.querySelector('.amber-stage');
  const gallery = stage.querySelector('.gallery-track');
  const caption = document.querySelector('.gallery-caption');
  const toggle = document.querySelector('#amber-toggle');
  const status = document.querySelector('#amber-status');
  let viewer;

  function showModel(show) {
    viewer.hidden = !show;
    gallery.hidden = show;
    caption.hidden = show;
    toggle.textContent = show ? 'Back to images' : 'Explore in 3D';
    status.textContent = show ? (viewer.loaded ? 'Drag to rotate or use the arrow keys.' : 'Loading 3D model…') : '';
  }

  function failed() {
    if (viewer) {
      viewer.remove();
      viewer = null;
    }
    gallery.hidden = caption.hidden = false;
    toggle.disabled = false;
    toggle.textContent = 'Explore in 3D';
    status.textContent = 'The 3D view could not load. The gallery is available above.';
  }

  toggle.hidden = false;
  toggle.addEventListener('click', async () => {
    if (viewer) {
      showModel(viewer.hidden);
      return;
    }
    toggle.disabled = true;
    status.textContent = 'Loading 3D model…';
    try {
      await import('./assets/vendor/model-viewer/model-viewer.min.js');
      viewer = document.createElement('model-viewer');
      viewer.setAttribute('alt', 'Interactive Amber table lamp with a rounded orange shade and satin steel base');
      viewer.setAttribute('camera-controls', '');
      viewer.setAttribute('touch-action', 'pan-y');
      viewer.setAttribute('interaction-prompt', 'none');
      viewer.setAttribute('loading', 'eager');
      viewer.setAttribute('environment-image', 'neutral');
      viewer.setAttribute('poster', 'assets/projects/amber/detail.webp');
      viewer.addEventListener('load', () => {
        if (!viewer.hidden) status.textContent = 'Drag to rotate or use the arrow keys.';
      }, { once: true });
      viewer.addEventListener('error', failed, { once: true });
      viewer.src = 'assets/projects/amber/amber.glb';
      stage.append(viewer);
      toggle.disabled = false;
      showModel(true);
    } catch {
      failed();
    }
  });
})();
