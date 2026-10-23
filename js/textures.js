function randomRange(a, b) {
  return Math.random() * (b - a) + a;
}

function createTexture(drawFn, w = 512, h = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function drawSun(ctx, w, h) {
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.55);
  grad.addColorStop(0, '#fff8dc');
  grad.addColorStop(0.25, '#ffd700');
  grad.addColorStop(0.6, '#ff8c00');
  grad.addColorStop(1, '#b22222');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = 'rgba(255, 255, 220, ' + randomRange(0.05, 0.25) + ')';
    ctx.beginPath();
    ctx.arc(randomRange(0, w), randomRange(0, h), randomRange(0.5, 3), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlanet(ctx, w, h, ocean, land, pole) {
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = pole;
  ctx.fillRect(0, 0, w, h * 0.12);
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
  const blobs = Math.floor(randomRange(6, 14));
  for (let i = 0; i < blobs; i++) {
    ctx.fillStyle = land;
    const r = randomRange(12, 60);
    ctx.beginPath();
    ctx.arc(randomRange(r, w - r), randomRange(h * 0.15, h * 0.85), r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawClouds(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < 45; i++) {
    ctx.fillStyle = 'rgba(255, 255, 255, ' + randomRange(0.15, 0.45) + ')';
    const r = randomRange(14, 40);
    ctx.beginPath();
    ctx.ellipse(randomRange(0, w), randomRange(0, h), r, r * 0.5, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMoon(ctx, w, h) {
  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = '#5a5a5a';
    const r = randomRange(2, 10);
    ctx.beginPath();
    ctx.arc(randomRange(0, w), randomRange(0, h), r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bababa';
    ctx.beginPath();
    ctx.arc(randomRange(0, w), randomRange(0, h), r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBands(ctx, w, h, c1, c2, c3) {
  const strip = h / 14;
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = i % 2 === 0 ? c1 : i % 3 === 0 ? c2 : c3;
    ctx.fillRect(0, i * strip, w, strip);
  }
  ctx.fillStyle = 'rgba(139, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(w * 0.62, h * 0.48, w * 0.08, h * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawGas(ctx, w, h, main, acc) {
  ctx.fillStyle = main;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = acc;
  for (let i = 0; i < 60; i++) {
    const r = randomRange(6, 28);
    ctx.beginPath();
    ctx.ellipse(randomRange(0, w), randomRange(0, h), r, r * 0.6, Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }
}
