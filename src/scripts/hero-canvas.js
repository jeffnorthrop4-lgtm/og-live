const clusters = [
  { label: "C. gigas", color: [26, 107, 90], cx: 0.42, cy: 0.3, rx: 0.08, ry: 0.1, n: 80, angle: -0.3 },
  { label: "C. virginica", color: [42, 139, 116], cx: 0.58, cy: 0.52, rx: 0.06, ry: 0.09, n: 65, angle: 0.4 },
  { label: "O. lurida", color: [60, 160, 140], cx: 0.48, cy: 0.7, rx: 0.07, ry: 0.06, n: 55, angle: -0.1 },
  { label: "S. glomerata", color: [80, 130, 120], cx: 0.35, cy: 0.5, rx: 0.05, ry: 0.07, n: 45, angle: 0.6 },
  { label: "hybrid", color: [30, 80, 70], cx: 0.45, cy: 0.5, rx: 0.14, ry: 0.14, n: 15, angle: 0 },
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

  const section = canvas.closest("section");
  let width = 0;
  let height = 0;
  /** @type {Array<{x:number,y:number,homeX:number,homeY:number,vx:number,vy:number,r:number,color:number[],opacity:number}>} */
  let points = [];
  const pointer = { x: -1000, y: -1000 };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    points = [];
    for (const cluster of clusters) {
      for (let i = 0; i < cluster.n; i++) {
        const gx = gaussian() * cluster.rx * width * 0.5;
        const gy = gaussian() * cluster.ry * height * 0.5;
        const cos = Math.cos(cluster.angle);
        const sin = Math.sin(cluster.angle);
        const x = cluster.cx * width + (gx * cos - gy * sin);
        const y = cluster.cy * height + (gx * sin + gy * cos);
        points.push({
          x,
          y,
          homeX: x,
          homeY: y,
          vx: 0,
          vy: 0,
          r: Math.random() * 1.8 + 1.2,
          color: cluster.color,
          opacity: cluster.label === "hybrid" ? 0.12 : 0.2 + Math.random() * 0.3,
        });
      }
    }
  }

  function frame() {
    ctx.clearRect(0, 0, width, height);
    for (const point of points) {
      point.vx += (point.homeX - point.x) * 0.003;
      point.vy += (point.homeY - point.y) * 0.003;
      point.vx += (Math.random() - 0.5) * 0.08;
      point.vy += (Math.random() - 0.5) * 0.08;
      const dx = point.x - pointer.x;
      const dy = point.y - pointer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 120 && distance > 0) {
        const force = (120 - distance) / 120;
        point.vx += (dx / distance) * force * 0.5;
        point.vy += (dy / distance) * force * 0.5;
      }
      point.vx *= 0.94;
      point.vy *= 0.94;
      point.x += point.vx;
      point.y += point.vy;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${point.color[0]}, ${point.color[1]}, ${point.color[2]}, ${point.opacity})`;
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  section?.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  });
  section?.addEventListener("mouseleave", () => {
    pointer.x = -1000;
    pointer.y = -1000;
  });
  window.addEventListener("resize", resize);
  resize();
  frame();
}
