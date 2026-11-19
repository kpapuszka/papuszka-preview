(() => {
  const canvas = document.querySelector('#model-panel canvas');
  const ctx = canvas.getContext('2d');
  const organizer = canvas.dataset.object === 'organizer';
  const depth = organizer ? 37 : 63;
  const height = organizer ? 15 : 24;
  const wells = [[-36, 23], [-13, 18], [23, 48]];
  const ports = [-28, 0, 28];
  const faces = [];

  // A rounded rectangle in plan. Reuse its outline for both projections.
  function outline(cx, width, depth, radius) {
    const points = [];
    for (let corner = 0; corner < 4; corner++) {
      const angle = corner * Math.PI / 2;
      const x = cx + (corner === 0 || corner === 3 ? 1 : -1) * (width / 2 - radius);
      const z = (corner < 2 ? 1 : -1) * (depth / 2 - radius);
      for (let step = 0; step <= 8; step++) {
        const a = angle + step * Math.PI / 16;
        points.push([x + radius * Math.cos(a), z + radius * Math.sin(a)]);
      }
    }
    return points;
  }
  const rim = outline(0, 100, depth, 5);
  function level(path, y) { return path.map(([x,z]) => [x,y,z]); }
  function face(points, tone, frontLayer = 0) { faces.push({points, tone, frontLayer}); }
  function join(lower, upper, tone) {
    lower.forEach((point, i) => {
      const j = (i + 1) % lower.length;
      face([point, lower[j], upper[j], upper[i]], tone);
    });
  }
  const bottom = level(rim, 0);
  const top = level(rim, height);
  join(bottom, top, organizer ? 76 : 170);
  face(bottom, organizer ? 59 : 140);
  const openings = wells.map(([x,w]) => outline(x,w,depth-5,3));
  const panel = outline(0, 89, height-4, 3);
  const sockets = ports.map(x => outline(x, 10, 3.7, 1.4));
  if (organizer) {
    openings.forEach((hole,i) => {
      const left = i === 0 ? -50 : (wells[i-1][0]+wells[i-1][1]/2+wells[i][0]-wells[i][1]/2)/2;
      const right = i === 2 ? 50 : (wells[i][0]+wells[i][1]/2+wells[i+1][0]-wells[i+1][1]/2)/2;
      // Only the two ends of the continuous rim have rounded outer corners.
      const outer = outline((left+right)/2,right-left,depth,5).map(([x,z],j) => {
        const onRight = j < 9 || j >= 27;
        if ((onRight && i < 2) || (!onRight && i > 0)) return [onRight ? right : left, z >= 0 ? depth/2 : -depth/2];
        return [x,z];
      });
      join(level(outer,height),level(hole,height),95);
      join(level(hole,height),level(hole,2),63);
      face(level(hole,2),69);
    });
  } else {
    face(top, 192);
    function frontFace(path, z, tone, layer) {
      face(path.map(([x,y]) => [x,height/2-y,z]),tone,layer);
    }
    frontFace(panel,depth/2+.1,54,1);
    sockets.forEach(path => frontFace(path,depth/2+.2,18,2));
  }

  let yaw = -.45, tilt = .52;
  function paint() {
    if (!ctx || canvas.parentElement.hidden) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const ratio = Math.min(devicePixelRatio,2);
    canvas.width = Math.round(w*ratio);
    canvas.height = Math.round(h*ratio);
    ctx.scale(ratio,ratio);
    const scale = Math.min(w/140,h/125);
    const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    const visible = faces.filter(face => !face.frontLayer || cy*ct > 0).map(({points,tone,frontLayer}) => {
      const projected = points.map(([x,y,z]) => {
        const d = x*sy+z*cy;
        y -= height/2;
        return [x*cy-z*sy,y*ct-d*st,y*st+d*ct];
      });
      const [a,b,c] = projected;
      const u = b.map((v,i)=>v-a[i]), v = c.map((n,i)=>n-a[i]);
      const nx=u[1]*v[2]-u[2]*v[1], ny=u[2]*v[0]-u[0]*v[2], nz=u[0]*v[1]-u[1]*v[0];
      const norm = Math.hypot(nx,ny,nz);
      // Some rim strips taper to triangles with two coincident vertices.
      const light = norm ? (.45*ny-.32*nx)*Math.sign(nz)/norm : .15;
      const order = frontLayer ? depth/2*cy*ct + frontLayer*.001 : projected.reduce((s,p)=>s+p[2],0)/points.length;
      return {projected, shade:Math.round(tone*(.9+light)), order};
    });
    visible.sort((a,b)=>a.order-b.order);
    // Draw the front graphics together with their underlying face in depth order.
    for (const {projected,shade} of visible) {
      ctx.fillStyle = ctx.strokeStyle = 'rgb('+[shade+3,shade+2,shade].join(',')+')';
      ctx.lineWidth=.4;
      ctx.beginPath();
      projected.forEach(([x,y],i) => ctx[i?'lineTo':'moveTo'](w/2+x*scale,h/2-y*scale));
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  const group=document.querySelector('.drawing-geometry');
  function svg(tag,attrs,text) {
    const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    if (text) el.textContent=text;
    group.append(el);
  }
  function line(points,cls='') {
    svg('polyline',{points:points.map(p=>p.join(',')).join(' '),class:cls});
  }
  function shape(path,cx,cy) {
    const points=path.map(([x,y])=>[cx+x*1.65,cy+y*1.65]);
    line([...points,points[0]]);
  }
  function label(x,y,text) {svg('text',{x,y,'text-anchor':'middle'},text);}
  shape(outline(0,100,height,0),115,125);
  shape(rim,325,125);
  if (organizer) openings.forEach(path=>shape(path,325,125));
  else [panel,...sockets].forEach(path=>shape(path,115,125));
  line([[32.5,174],[197.5,174]],'dimension-line');
  for (const x of [32.5,197.5]) line([[x,129+height*.825],[x,179]],'dimension-line');
  label(115,191,'100');
  label(115,224,'Front elevation'); label(325,224,'Top view');
  bindStudyControls(canvas,paint,(dx,dy)=>{
    yaw+=dx; tilt=Math.max(-1.4,Math.min(1.4,tilt+dy));
  },()=>{yaw=-.45; tilt=.52;});
})();
