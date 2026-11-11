const clusters = [
  { label: "C. gigas", color: [244, 241, 234], cx: 0.78, cy: 0.36, rx: 0.1, ry: 0.12, n: 110, angle: -0.35 },
  { label: "C. virginica", color: [42, 168, 142], cx: 0.62, cy: 0.58, rx: 0.08, ry: 0.11, n: 80, angle: 0.4 },
  { label: "O. lurida", color: [126, 198, 178], cx: 0.86, cy: 0.66, rx: 0.07, ry: 0.09, n: 70, angle: -0.15 },
  { label: "S. glomerata", color: [214, 206, 190], cx: 0.7, cy: 0.24, rx: 0.06, ry: 0.08, n: 55, angle: 0.55 },
  { label: "hybrid", color: [26, 107, 90], cx: 0.74, cy: 0.48, rx: 0.16, ry: 0.18, n: 36, angle: 0 },
];

function gaussian() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function startHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const hero = canvas.closest(".hero") ?? canvas.parentElement;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  /** @type {Array<{x:number,y:number,homeX:number,homeY:number,vx:number,vy:number,r:number,color:number[],opacity:number,phase:number}>} */
  let points = [];
  let width = 0;
  let height = 0;
  let running = false;
  let onscreen = true;
  let resizing = false;
  let rafId = 0;
  const pointer = { x: -1000, y: -1000 };

  function anchor(cluster) {
    if (width >= 720) return { cx: cluster.cx, cy: cluster.cy };
    return {
      cx: Math.min(0.86, Math.max(0.14, 0.5 + (cluster.cx - 0.74) * 1.8)),
      cy: 0.78 + (cluster.cy - 0.45) * 0.32,
    };
  }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function buildPoints(assemble) {
    points = [];
    const kick = assemble ? 1 : 0;
    for (const cluster of clusters) {
      for (let i = 0; i < cluster.n; i++) {
        const spot = anchor(cluster);
        const gx = gaussian() * cluster.rx * width * 0.5;
        const gy = gaussian() * cluster.ry * height * 0.5;
        const cos = Math.cos(cluster.angle);
        const sin = Math.sin(cluster.angle);
        const homeX = spot.cx * width + (gx * cos - gy * sin);
        const homeY = spot.cy * height + (gx * sin + gy * cos);
        const hybrid = cluster.label === "hybrid";
        points.push({
          x: homeX + (Math.random() - 0.5) * width * 0.05 * kick,
          y: homeY + (Math.random() - 0.5) * height * 0.05 * kick,
          homeX,
          homeY,
          vx: 0,
          vy: 0,
          r: hybrid ? 1.1 + Math.random() * 1.2 : 1.3 + Math.random() * 2.1,
          color: cluster.color,
          opacity: hybrid ? 0.18 + Math.random() * 0.2 : 0.5 + Math.random() * 0.45,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  function resize() {
    if (resizing) return;
    resizing = true;
    try {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const nextW = rect.width;
      const nextH = rect.height;
      if (nextW < 1 || nextH < 1) return;
      if (Math.abs(nextW - width) < 0.5 && Math.abs(nextH - height) < 0.5) return;

      const prevW = width;
      const prevH = height;
      width = nextW;
      height = nextH;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const heightOnly = points.length > 0 && prevW > 0 && Math.abs(width - prevW) < 2;
      if (heightOnly) {
        const scale = height / prevH;
        for (const point of points) {
          point.y *= scale;
          point.homeY *= scale;
        }
        if (reducedMotion()) paint();
        return;
      }

      buildPoints(!reducedMotion());
      if (reducedMotion()) paint();
    } finally {
      resizing = false;
    }
  }

  function paint() {
    ctx.clearRect(0, 0, width, height);
    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${point.color[0]}, ${point.color[1]}, ${point.color[2]}, ${point.opacity})`;
      ctx.fill();
    }
  }

  function step(now) {
    const t = now * 0.001;
    for (const point of points) {
      point.vx += (point.homeX - point.x) * 0.012;
      point.vy += (point.homeY - point.y) * 0.012;
      point.vx += Math.cos(t * 0.65 + point.phase) * 0.018;
      point.vy += Math.sin(t * 0.5 + point.phase * 1.3) * 0.018;
      const dx = point.x - pointer.x;
      const dy = point.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 150 && distance > 0) {
        const force = (150 - distance) / 150;
        point.vx += (dx / distance) * force * 1.15;
        point.vy += (dy / distance) * force * 1.15;
      }
      point.vx *= 0.9;
      point.vy *= 0.9;
      point.x += point.vx;
      point.y += point.vy;
    }
    paint();
  }

  function frame(now) {
    if (!running) return;
    step(now);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reducedMotion()) return;
    running = true;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  function placePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  }

  function clearPointer() {
    pointer.x = -1000;
    pointer.y = -1000;
  }

  hero?.addEventListener("pointermove", placePointer);
  hero?.addEventListener("pointerleave", clearPointer);
  hero?.addEventListener("pointercancel", clearPointer);

  const seen = new IntersectionObserver((entries) => {
    onscreen = entries.some((entry) => entry.isIntersecting);
    if (onscreen && !document.hidden) start();
    else stop();
  });
  if (hero) seen.observe(hero);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden || !onscreen) stop();
    else start();
  });

  motion.addEventListener("change", () => {
    if (reducedMotion()) {
      stop();
      buildPoints(false);
      paint();
      return;
    }
    if (onscreen && !document.hidden) start();
  });

  const sized = new ResizeObserver(() => resize());
  sized.observe(canvas);
  resize();
  if (reducedMotion()) paint();
  else start();
}
