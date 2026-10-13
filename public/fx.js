// Quiet physics toy for the hero: springy nodes that dodge the cursor and scatter on click.
(function () {
  var c = document.getElementById('fx'); if (!c) return;
  var ctx = c.getContext('2d'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var w, h, nodes = [], mouse = { x: -999, y: -999 }, raf, running = true;
  function resize() {
    var r = c.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.max(14, Math.min(40, Math.round(w * h / 9000))); nodes = [];
    for (var i = 0; i < n; i++) { var x = Math.random() * w, y = Math.random() * h; nodes.push({ x: x, y: y, vx: 0, vy: 0, hx: x, hy: y }); }
  }
  function step() {
    ctx.clearRect(0, 0, w, h);
    nodes.forEach(function (p) {
      p.vx += (p.hx - p.x) * 0.012; p.vy += (p.hy - p.y) * 0.012;
      var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 16900 && d2 > 1) { var d = Math.sqrt(d2), f = (1 - d / 130) * 1.6; p.vx += dx / d * f; p.vy += dy / d * f; }
      p.vx *= 0.9; p.vy *= 0.9; p.x += p.vx; p.y += p.vy;
    });
    ctx.lineWidth = 1;
    for (var i = 0; i < nodes.length; i++) for (var j = i + 1; j < nodes.length; j++) {
      var d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (d < 150) { ctx.strokeStyle = 'rgba(23,23,23,' + (0.14 * (1 - d / 150)) + ')'; ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(23,23,23,0.45)';
    nodes.forEach(function (p) { ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 6.2832); ctx.fill(); });
    if (running && !reduce) raf = requestAnimationFrame(step);
  }
  addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  addEventListener('pointerdown', function (e) {
    var r = c.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top;
    nodes.forEach(function (p) { var dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1; if (d < 260) { var f = (1 - d / 260) * 14; p.vx += dx / d * f; p.vy += dy / d * f; } });
  });
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(step); } });
  resize(); step();
})();
