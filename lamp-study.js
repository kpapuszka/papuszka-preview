(() => {
  // Height and radius in relative units. Both views use this same profile.
  const profile = [
    [0, 0], [0, 12], [1, 13], [5, 13.4], [9, 14], [13, 16],
    [17, 19.5], [23, 24], [30, 27.8], [38, 30], [46, 30.8],
    [56, 31], [67, 31], [78, 30.6], [84, 29.6], [89, 27.5],
    [93, 24.3], [96, 20], [98.5, 15], [100, 8], [98.8, 7],
    [96.8, 7], [96.8, 0]
  ];
  const ribs = 36;
  const segments = ribs * 6;
  const tau = 2 * Math.PI;
  function radiusAt(radius, angle) {
    return radius * (0.95 + 0.05 * Math.cos(angle * ribs));
  }
  const rings = profile.map(([height, radius]) =>
    Array.from({ length: segments }, (_, j) => {
      const angle = j * tau / segments;
      const r = radiusAt(radius, angle);
      return [r * Math.cos(angle), height - 50, r * Math.sin(angle)];
    })
  );
  const faces = [];
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < segments; j++) {
      const next = (j + 1) % segments;
      const a = rings[i][j], b = rings[i + 1][j], c = rings[i + 1][next], d = rings[i][next];
      const edge = profile[i][1] === 0 ? c : d;
      const ux = b[0]-a[0], uy = b[1]-a[1], uz = b[2]-a[2];
      const vx = edge[0]-a[0], vy = edge[1]-a[1], vz = edge[2]-a[2];
      const nx = uy*vz-uz*vy, ny = uz*vx-ux*vz, nz = ux*vy-uy*vx;
      const length = Math.hypot(nx, ny, nz) || 1;
      faces.push({ i, j, next, nx: nx/length, ny: ny/length, nz: nz/length });
    }
  }

  const canvas = document.querySelector('#model-panel canvas');
  const ctx = canvas.getContext('2d');
  const modelPanel = document.querySelector('#model-panel');
  const drawingPanel = document.querySelector('#drawing-panel');
  const initialYaw = 0.22, initialTilt = 0.17;
  let yaw = initialYaw, tilt = initialTilt, frame = 0;
  function paint() {
    frame = 0;
    if (modelPanel.hidden || !ctx) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const density = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w*density) || canvas.height !== Math.round(h*density)) {
      canvas.width = Math.round(w*density);
      canvas.height = Math.round(h*density);
    }
    ctx.setTransform(density, 0, 0, density, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    const scale = Math.min(w/92, h/126);
    const projected = rings.map(ring => ring.map(([x,y,z]) => {
      const depth = x*sy + z*cy;
      return [w/2 + scale*(x*cy-z*sy), h/2 - scale*(y*ct-depth*st), y*st+depth*ct];
    }));
    const visible = [];
    for (const face of faces) {
      const { i, j, next, nx, ny, nz } = face;
      const depth = nx*sy+nz*cy;
      if (ny*st+depth*ct <= 0) continue;
      const light = Math.max(0, -.52*(nx*cy-nz*sy) + .52*(ny*ct-depth*st) + .68*(ny*st+depth*ct));
      const points = [projected[i][j], projected[i+1][j], projected[i+1][next], projected[i][next]];
      visible.push({points, z:(points[0][2]+points[2][2])/2, light});
    }
    visible.sort((a,b)=>a.z-b.z);
    ctx.lineWidth = .5;
    ctx.lineJoin = 'round';
    for (const {points, light} of visible) {
      ctx.fillStyle = ctx.strokeStyle = 'rgb('+[110+133*light,84+137*light,56+128*light].map(Math.round).join(',')+')';
      ctx.beginPath();
      ctx.moveTo(points[0][0],points[0][1]);
      for (let n=1;n<4;n++) ctx.lineTo(points[n][0],points[n][1]);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  function redraw() {
    if (!frame) frame = requestAnimationFrame(paint);
  }
  function orbit(horizontal, vertical) {
    yaw += horizontal;
    tilt = Math.max(-1.4, Math.min(1.4, tilt + vertical));
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
    yaw=initialYaw; tilt=initialTilt; redraw();
  });
  new ResizeObserver(redraw).observe(canvas);

  // Front and plan share an orthographic scale and the model's silhouette.
  const drawing = drawingPanel.querySelector('.drawing-geometry');
  const ns = 'http://www.w3.org/2000/svg';
  function element(tag, attrs, label) {
    const el = document.createElementNS(ns, tag);
    for (const [key,value] of Object.entries(attrs)) el.setAttribute(key,value);
    if (label) el.textContent=label;
    drawing.append(el);
  }
  function line(points, cls='') {
    element('polyline',{points:points.map(p=>p.join(',')).join(' '),class:cls});
  }
  function label(x,y,text) { element('text',{x,y,'text-anchor':'middle'},text); }
  const projectionScale=1.75, base=211, front=129, plan=321, mid=123.5;
  const outer=profile.slice(1,20);
  const maxR=Math.max(...outer.map(p=>p[1]));
  for (let j=0;j<=ribs/2;j++) {
    const cos=Math.cos(j*tau/ribs);
    line(outer.map(([y,r])=>[front+r*cos*projectionScale,base-y*projectionScale]),j===0||j===ribs/2?'':'rib');
  }
  for (const [y,r] of [outer[0],outer.at(-1)]) line([[front-r*projectionScale,base-y*projectionScale],[front+r*projectionScale,base-y*projectionScale]]);
  const topOutline=rings[11].map(([x,,z])=>[plan+x*projectionScale,mid+z*projectionScale]);
  line([...topOutline,topOutline[0]]);
  for (let j=0;j<ribs;j++) {
    const a=j*tau/ribs;
    line([8,maxR].map(r=>[plan+projectionScale*r*Math.cos(a),mid+projectionScale*r*Math.sin(a)]),'rib');
  }
  element('circle',{cx:plan,cy:mid,r:8*projectionScale});
  line([[front,24],[front,221]],'axis');
  line([[plan-65,mid],[plan+65,mid]],'axis');
  line([[plan,mid-66],[plan,mid+66]],'axis');
  line([[50,36],[50,211]],'dimension-line');
  for (const [height,radius] of [outer[0],outer.at(-1)]) {
    const y = base-height*projectionScale;
    line([[46,y],[front-radius*projectionScale-4,y]],'dimension-line');
  }
  label(31,128,'100');
  const left=plan-maxR*projectionScale, right=plan+maxR*projectionScale;
  line([[left,187],[right,187]],'dimension-line');
  for(const x of [left,right]) line([[x,mid+4],[x,192]],'dimension-line');
  label(plan,204,'Ø '+2*maxR);
  label(front,245,'Front elevation'); label(plan,245,'Top view');

  const controls = document.querySelectorAll('[data-view]');
  controls.forEach(button => button.addEventListener('click', () => {
    const model = button.dataset.view === 'model';
    modelPanel.hidden = !model;
    drawingPanel.hidden = model;
    controls.forEach(control => control.setAttribute('aria-pressed',String(control===button)));
    if (model) redraw();
  }));
  redraw();
})();
