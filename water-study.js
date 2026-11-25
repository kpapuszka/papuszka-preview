(() => {
  const canvas = document.querySelector('.water-study canvas');
  const ctx = canvas.getContext('2d');
  const base = document.createElement('canvas');
  const b = base.getContext('2d', { willReadFrequently: true });
  if (!ctx || !b) return;
  const button = document.querySelector('.water-study button');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let w, h, r, source, t = 0, dx = 0, dy = 0;
  let mouseX = 0, mouseY = 0, last = 0, pending = 0;
  let previousPointer = null;
  let contactX = 0, contactY = 0, pullX = 0, pullY = 0;
  let captionCenterY, captionSize;
  let inverseInkContrast;
  let visible = false, paused = false;

  const enteredAt = performance.now();
  let introComplete = motion.matches;
  let pageColor;

  function fade(elapsed, duration) {
    const progress = Math.min(1, Math.max(0, elapsed / duration));
    return progress * progress * (3 - 2 * progress);
  }

  function resize() {
    const scale = Math.min(1, 1100 / canvas.clientWidth);
    w = canvas.width = base.width = Math.max(2, Math.round(canvas.clientWidth * scale));
    h = canvas.height = base.height = Math.max(2, Math.round(canvas.clientHeight * scale));
    r = Math.min(w * .2464, h * .4032, 168);
    const colors = getComputedStyle(canvas);
    pageColor = colors.getPropertyValue('--page').trim();
    b.fillStyle = pageColor;
    b.fillRect(0, 0, w, h);
    b.font = '600 ' + Math.min(w * .135, h * .50) + 'px "IBM Plex Sans", sans-serif';
    b.textAlign = 'center';
    b.textBaseline = 'alphabetic';
    b.fillStyle = colors.getPropertyValue('--ink').trim();
    inverseInkContrast = 1 / (parseInt(colors.getPropertyValue('--ink').trim().slice(1, 3), 16) - parseInt(colors.getPropertyValue('--page').trim().slice(1, 3), 16));
    const metrics = b.measureText('PAPUSZKA');
    b.fillText('PAPUSZKA', w / 2, h / 2 + metrics.actualBoundingBoxAscent / 2, w * .95);
    captionSize = Math.max(13 * scale, Math.min(19 * scale, w * .025));
    b.font = '500 ' + captionSize + 'px "IBM Plex Sans", sans-serif';
    b.fillStyle = colors.getPropertyValue('--secondary').trim();
    const captionBaseline = h / 2 - metrics.actualBoundingBoxAscent / 2 - 1.6 * captionSize;
    captionCenterY = captionBaseline - .35 * captionSize;
    b.fillText('Portfolio', w / 2, captionBaseline);
    source = b.getImageData(0, 0, w, h).data;
    render();
  }

function render(){
 ctx.drawImage(base,0,0);
 const cx = w / 2 + dx;
 const cy = h / 2 + dy;
 const span=r*1.65;
 const left=Math.max(0,Math.floor(cx-span)),top=Math.max(0,Math.floor(cy-span));
 const width=Math.min(w-left,Math.ceil(span*2)),height=Math.min(h-top,Math.ceil(span*2));
 const patch=b.getImageData(left,top,width,height);
 // A drifting shoulder and a slightly tapered end break up the circular silhouette.
 const shear = .18 + .08 * Math.sin(t * .68) + .12 * dx / r;
 const stretch = .91 + .045 * Math.cos(t * .71);
 const taper = .17 + .045 * Math.sin(t * .47);
 // Two shallow depressions travel through the upper half of the liquid body.
 const foldX = -.28 + .065 * Math.sin(t * .43);
 const foldY = -.32 + .055 * Math.cos(t * .38);
 const shoulderY = -.19 + .08 * Math.sin(t * .32);
 for(let y=0;y<height;y++){
   const distanceFromCaption = Math.max(0, Math.abs(top + y - captionCenterY) / captionSize - 1);
   const refractionScale = 1 - .9 * Math.exp(-(distanceFromCaption ** 2));
   for(let x=0;x<width;x++){
   let u = (left + x - cx) / r;
   let v = (top + y - cy) / r;
   // Inverse-map the surface so the outline and its highlights stretch together.
   const offsetX = u - contactX;
   const offsetY = v - contactY;
   const influence = Math.exp(-2.4 * (offsetX * offsetX + offsetY * offsetY));
   u -= pullX * influence;
   v -= pullY * influence;
   // Warp an ellipsoidal cap. Its derivatives orient both the refraction and the reflections.
   const a = u * (stretch + taper * v) + shear * v + .10 * v * v;
   const bAxis = v / stretch + .12 * u * u;
   // A soft five-lobed outline, strongest near the rim.
   const radiusSquared = a * a + bAxis * bAxis;
   const harmonic = a * (a ** 4 - 10 * a * a * bAxis * bAxis + 5 * bAxis ** 4);
   const radial = radiusSquared + .075 * harmonic / (1 + radiusSquared ** 2);
   const px=(y*width+x)*4;
   if (radial > 2.1) continue;
   if(radial>=1){
     const distance=Math.sqrt(radial)-1;
     const shadow=Math.exp(-distance*distance/.018)*Math.max(0,.45+.42*v+.20*u);
     const caustic=Math.exp(-((distance-.043)**2)/.00035)*Math.max(0,v*.82+u*.3);
     for(let k=0;k<3;k++) patch.data[px+k]+=15*caustic-18*shadow;
     continue;
   }
   const z=Math.sqrt(1-radial);
   // Different slopes across each depression bend the same light into separate ribbons.
   const along = u - foldX;
   const across = v - foldY - .22 * along - .55 * along * along;
   const fold = .34 * Math.exp(-3.8 * along * along - 18 * across * across);
   const side = u - .39;
   const groove = v - shoulderY + .62 * side;
   const shoulder = .24 * Math.exp(-7 * side * side - 14 * groove * groove);
   const slopeX = fold * (-7.6 * along + 36 * across * (.22 + 1.1 * along))
                + shoulder * (-14 * side - 17.36 * groove);
   const slopeY = -36 * across * fold - 28 * groove * shoulder;
   const gx = a * (stretch + taper * v) + bAxis * .24 * u + z * slopeX;
   const gy = a * (taper * u + shear + .20 * v) + bAxis / stretch + z * slopeY;
   const length=Math.sqrt(gx*gx+gy*gy+z*z);
   const nx=gx/length,ny=gy/length,nz=z/length;
   // Snell's law at the air-water interface (index of refraction 1.333).
   const eta=1/1.333, bend=Math.sqrt(1-eta*eta*(1-nz*nz))-eta*nz;
   const travel=(.29*z+.09)*r*refractionScale/(eta+bend*nz);
   const sx=Math.max(0,Math.min(w-1.001,left+x-travel*bend*nx));
   const sy=Math.max(0,Math.min(h-1.001,top+y-travel*bend*ny));
   const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
   const index=(iy*w+ix)*4;
   const rx=2*nz*nx,ry=2*nz*ny,rz=2*nz*nz-1;
   // Project the reflected ray onto a tilted studio panel above the left shoulder.
   const panelFacing = -.36 * rx - .80 * ry + .48 * rz;
   const projection = 1 / Math.max(.1, panelFacing);
   const panelX = (.80 * rx + .60 * rz) * projection;
   const panelY = (-.48 * rx + .60 * ry + .64 * rz) * projection;
   const outsideX = Math.max(0, Math.abs(panelX) - .52);
   const outsideY = Math.max(0, Math.abs(panelY) - .045);
   const panelDistance = outsideX * outsideX + outsideY * outsideY;
   const panel = Math.max(0, panelFacing) * (.72 * Math.exp(-panelDistance / .002)
                                            + .28 * Math.exp(-panelDistance / .044));
   // A narrow strip behind the water catches only the side facing the light.
   const rimOffset = rx + .36 * ry - .62;
   const rim = Math.exp(-rimOffset * rimOffset / .003 - ((rz + .60) ** 2) / .13);
   const card = Math.exp(-((ry - .60) ** 2) / .055 - ((rx - .10) ** 2) / .68);
   const fresnel = .0204 + .9796 * (1 - nz) ** 5;
   const reflection = 36 + 120 * Math.max(0, -ry) + 40 * (1 - card);
   const glint = Math.min(.98, panel * (.69 + .30 * (1 - nz)) + rim * .64);
   const edge=Math.min(1,(1-radial)*r*.55);
   // Sample glyph coverage at the refracted position, including antialiased edges.
   const rowBelow = index + 4 * w;
   const red = (source[index] * (1-fx) + source[index+4] * fx) * (1-fy)
             + (source[rowBelow] * (1-fx) + source[rowBelow+4] * fx) * fy;
   const ink = Math.max(0, Math.min(1, (red - source[0]) * inverseInkContrast));
   const highlight = glint * (1 - .83 * ink);
   const reflected = fresnel * (1 - .78 * ink);
   for(let k=0;k<3;k++){
     const i=index+k,below=i+4*w;
     const upper=source[i]*(1-fx)+source[i+4]*fx;
     const lower=source[below]*(1-fx)+source[below+4]*fx;
     const transmitted=(upper*(1-fy)+lower*fy)*(1-.09*card*(1-ink));
     const water=transmitted*(1-reflected)+reflection*reflected;
     patch.data[px+k]+=(water*(1-highlight)+255*highlight-patch.data[px+k])*edge;
   }
 }
 }
 ctx.putImageData(patch,left,top);
 if (!introComplete) {
   const opacity = fade(performance.now() - enteredAt, 1200);
   ctx.globalAlpha = 1 - opacity;
   ctx.fillStyle = pageColor;
   ctx.fillRect(0, 0, w, h);
   ctx.globalAlpha = 1;
   introComplete = opacity === 1;
 }
}

  function frame(now) {
    pending = requestAnimationFrame(frame);
    const elapsed = Math.min(.08, (now - last) / 1000);
    const follow = -Math.expm1(-elapsed / .38);
    t += elapsed;
    last = now;
    const relaxation = Math.exp(-elapsed / .23);
    pullX *= relaxation;
    pullY *= relaxation;
    dx += (mouseX - dx) * follow;
    dy += (mouseY - dy) * follow;
    render();
  }

  function sync() {
    cancelAnimationFrame(pending);
    previousPointer = null;
    if ((paused || motion.matches) && !introComplete) {
      introComplete = true;
      render();
    }
    button.hidden = motion.matches;
    button.textContent = paused ? 'Resume motion' : 'Pause motion';
    if (visible && !document.hidden && !paused && !motion.matches) {
      last = performance.now();
      pending = requestAnimationFrame(frame);
    }
  }

  canvas.addEventListener('pointermove', event => {
    if (motion.matches || paused || event.pointerType === 'touch') return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * w / rect.width - w / 2 - dx) / r;
    const y = ((event.clientY - rect.top) * h / rect.height - h / 2 - dy) / r;
    if (previousPointer && Math.hypot(x, y) < 1.1) {
      contactX = x;
      contactY = y;
      pullX += .75 * (x - previousPointer.x);
      pullY += .75 * (y - previousPointer.y);
      const limit = Math.max(1, Math.hypot(pullX, pullY) / .29);
      pullX /= limit;
      pullY /= limit;
    }
    previousPointer = { x, y };
    mouseX = ((event.clientX - rect.left) / rect.width - .5) * r * .16;
    mouseY = ((event.clientY - rect.top) / rect.height - .5) * r * .08;
  });
  canvas.addEventListener('pointerleave', () => { mouseX = mouseY = 0; previousPointer = null; });
  button.addEventListener('click', () => { paused = !paused; sync(); });
  motion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  new MutationObserver(resize).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  new ResizeObserver(resize).observe(canvas);
  resize();
  document.fonts.ready.then(resize);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(canvas);
})();
