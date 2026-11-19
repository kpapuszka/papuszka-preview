function bindStudyControls(canvas, paint, rotate, reset) {
  let frame = 0;
  const modelPanel = canvas.parentElement;
  const drawingPanel = document.querySelector("#drawing-panel");
  function redraw() {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; paint(); });
  }
  function orbit(horizontal, vertical) {
    rotate(horizontal, vertical);
    redraw();
  }
  let drag;
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0 || drag) return;
    drag = {id:e.pointerId, x:e.clientX, y:e.clientY};
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    orbit((drag.x-e.clientX)*.012,(e.clientY-drag.y)*.012);
    drag.x=e.clientX; drag.y=e.clientY;
  });
  canvas.addEventListener('lostpointercapture', () => { drag = null; });
  const keys = {ArrowLeft:[-.14,0],ArrowRight:[.14,0],ArrowUp:[0,.12],ArrowDown:[0,-.12]};
  canvas.addEventListener('keydown', e => {
    if (keys[e.key]) { e.preventDefault(); orbit(...keys[e.key]); }
  });
  document.querySelector('#reset-view').addEventListener('click', () => {
    reset(); redraw();
  });
  new ResizeObserver(redraw).observe(canvas);

  const controls = document.querySelectorAll('[data-view]');
  controls.forEach(button => button.addEventListener('click', () => {
    const model = button.dataset.view === 'model';
    modelPanel.hidden = !model;
    drawingPanel.hidden = model;
    controls.forEach(control => control.setAttribute('aria-pressed',String(control===button)));
    if (model) redraw();
  }));
  redraw();
}
