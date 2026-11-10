// 汽水木筏 — 双人合作物理操控（趋势参考：2026 年 10 月 Next Fest 热门的搞笑物理派对合作 demo；原创青蛙汽水主题）
(() => {
  'use strict';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const FINISH = -5200;
  const leftBank = y => 150 + 70 * Math.sin(y / 330) + 30 * Math.sin(y / 97);
  const rightBank = y => 750 + 70 * Math.sin(y / 290 + 1.3) + 30 * Math.cos(y / 113);

  let S;
  function reset() {
    const rocks = [], beans = [], logs = [];
    for (let y = -400; y > FINISH + 200; y -= 110 + Math.random() * 80) {
      const l = leftBank(y) + 40, r = rightBank(y) - 40;
      rocks.push({ x: l + Math.random() * (r - l), y, r: 16 + Math.random() * 18 });
      if (Math.random() < 0.55) beans.push({ x: l + Math.random() * (r - l), y: y - 50, taken: false });
    }
    for (let y = -900; y > FINISH + 400; y -= 700 + Math.random() * 300) logs.push({ y, x: 300, w: 160, vx: (Math.random() < 0.5 ? 1 : -1) * (60 + Math.random() * 50) });
    S = {
      raft: { x: 450, y: 0, a: 0, vx: 0, vy: 0, va: 0 },
      gasL: 100, gasR: 100, hp: 3, inv: 0, t: 0, over: false, win: false, cam: 0,
      rocks, beans, logs, puffs: [],
    };
  }
  reset();

  const keys = new Set();
  addEventListener('keydown', e => { keys.add(e.code); if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); if (e.code === 'KeyR' && S.over) reset(); });
  addEventListener('keyup', e => keys.delete(e.code));

  function hit() {
    if (S.inv > 0) return;
    S.hp--; S.inv = 1.2;
    if (S.hp <= 0) { S.over = true; S.win = false; }
  }

  function update(dt) {
    if (S.over) return;
    S.t += dt;
    const R = S.raft;
    let jetL = keys.has('KeyA') || keys.has('ArrowRight') || keys.has('ArrowUp');
    let jetR = keys.has('KeyL') || keys.has('ArrowLeft') || keys.has('ArrowUp');
    if (jetL && S.gasL <= 0) jetL = false;
    if (jetR && S.gasR <= 0) jetR = false;
    S.gasL = Math.max(0, Math.min(100, S.gasL + (jetL ? -20 : 18) * dt));
    S.gasR = Math.max(0, Math.min(100, S.gasR + (jetR ? -20 : 18) * dt));
    const T = 300, TORQUE = 3.4;
    const fx = Math.sin(R.a), fy = -Math.cos(R.a);
    let ax = 0, ay = 0;
    if (jetL) { ax += fx * T; ay += fy * T; R.va += TORQUE * dt; puff(R, -1); }
    if (jetR) { ax += fx * T; ay += fy * T; R.va -= TORQUE * dt; puff(R, 1); }
    // 水流：向下（+y），并带一点横向涡流
    const current = 45 + Math.min(35, -R.y / 150);
    const cx = 25 * Math.sin(R.y / 180);
    R.vx += ax * dt; R.vy += ay * dt;
    const drag = Math.exp(-1.1 * dt);
    R.vx = cx + (R.vx - cx) * drag; R.vy = current + (R.vy - current) * drag;
    R.va *= Math.exp(-2.8 * dt);
    R.x += R.vx * dt; R.y += R.vy * dt; R.a += R.va * dt;
    if (R.y > 60) { R.y = 60; R.vy = Math.min(0, R.vy); }
    // 河岸
    const lb = leftBank(R.y), rb = rightBank(R.y);
    if (R.x < lb + 26) { R.x = lb + 26; R.vx = Math.abs(R.vx) * 0.6 + 40; hit(); }
    if (R.x > rb - 26) { R.x = rb - 26; R.vx = -Math.abs(R.vx) * 0.6 - 40; hit(); }
    // 石头
    for (const k of S.rocks) {
      const dx = R.x - k.x, dy = R.y - k.y, d = Math.hypot(dx, dy), min = k.r + 24;
      if (d < min && d > 0) {
        R.x = k.x + dx / d * min; R.y = k.y + dy / d * min;
        const dot = R.vx * dx / d + R.vy * dy / d;
        R.vx -= 1.6 * dot * dx / d; R.vy -= 1.6 * dot * dy / d; R.va += (Math.random() - .5) * 3;
        hit();
      }
    }
    // 漂流木
    for (const g of S.logs) {
      g.x += g.vx * dt;
      const lb2 = leftBank(g.y), rb2 = rightBank(g.y);
      if (g.x < lb2 + 10) { g.x = lb2 + 10; g.vx *= -1; } if (g.x + g.w > rb2 - 10) { g.x = rb2 - 10 - g.w; g.vx *= -1; }
      if (R.x > g.x - 20 && R.x < g.x + g.w + 20 && Math.abs(R.y - g.y) < 28) { R.vy = Math.abs(R.vy) + 80; R.y = g.y + 30; hit(); }
    }
    // 豆子
    for (const b of S.beans) if (!b.taken && Math.hypot(R.x - b.x, R.y - b.y) < 30) { b.taken = true; S.gasL = Math.min(100, S.gasL + 45); S.gasR = Math.min(100, S.gasR + 45); }
    if (S.inv > 0) S.inv -= dt;
    for (const p of S.puffs) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += 30 * dt; }
    S.puffs = S.puffs.filter(p => p.life > 0);
    if (R.y < FINISH) { S.over = true; S.win = true; }
    S.cam += (R.y - H * 0.62 - S.cam) * Math.min(1, dt * 5);
  }

  function puff(R, side) {
    if (Math.random() < 0.5) return;
    const bx = R.x - Math.sin(R.a) * 30 + Math.cos(R.a) * side * 18;
    const by = R.y + Math.cos(R.a) * 30 + Math.sin(R.a) * side * 18;
    S.puffs.push({ x: bx, y: by, vx: -Math.sin(R.a) * 60 + (Math.random() - .5) * 30, vy: Math.cos(R.a) * 60, r: 5, life: 0.6 });
  }

  function draw() {
    const cam = S.cam;
    ctx.fillStyle = '#3f7d3a'; ctx.fillRect(0, 0, W, H);
    // 河道
    ctx.fillStyle = '#2d7fb8'; ctx.beginPath();
    for (let sy = 0; sy <= H; sy += 10) { const y = sy + cam; ctx.lineTo(leftBank(y), sy); }
    for (let sy = H; sy >= 0; sy -= 10) { const y = sy + cam; ctx.lineTo(rightBank(y), sy); }
    ctx.closePath(); ctx.fill();
    // 水纹
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const wy = ((i * 97 + S.t * 75) % (H + 40)) - 20, y = wy + cam;
      const x = leftBank(y) + 40 + ((i * 137) % 500);
      if (x < rightBank(y) - 30) { ctx.beginPath(); ctx.moveTo(x, wy); ctx.lineTo(x + 18, wy); ctx.stroke(); }
    }
    // 终点
    const fy = FINISH - cam;
    if (fy > -40 && fy < H + 40) {
      for (let i = 0; i < 20; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#111'; ctx.fillRect(leftBank(FINISH) + i * (rightBank(FINISH) - leftBank(FINISH)) / 20, fy - 8, (rightBank(FINISH) - leftBank(FINISH)) / 20, 16); }
      ctx.font = '36px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🏁', W / 2, fy - 16);
    }
    ctx.textAlign = 'center';
    for (const k of S.rocks) { const y = k.y - cam; if (y < -50 || y > H + 50) continue; ctx.fillStyle = '#6b6f77'; ctx.beginPath(); ctx.arc(k.x, y, k.r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#868b94'; ctx.beginPath(); ctx.arc(k.x - k.r * .3, y - k.r * .3, k.r * .4, 0, Math.PI * 2); ctx.fill(); }
    for (const g of S.logs) { const y = g.y - cam; if (y < -50 || y > H + 50) continue; ctx.fillStyle = '#7a4b22'; ctx.fillRect(g.x, y - 12, g.w, 24); ctx.fillStyle = '#a0682f'; ctx.beginPath(); ctx.arc(g.x + g.w, y, 12, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = '22px sans-serif';
    for (const b of S.beans) { if (b.taken) continue; const y = b.y - cam; if (y > -30 && y < H + 30) ctx.fillText('🥤', b.x, y + 8); }
    for (const p of S.puffs) { ctx.fillStyle = `rgba(220,240,255,${p.life})`; ctx.beginPath(); ctx.arc(p.x, p.y - cam, p.r, 0, Math.PI * 2); ctx.fill(); }
    // 木筏
    const R = S.raft;
    ctx.save(); ctx.translate(R.x, R.y - cam); ctx.rotate(R.a);
    if (S.inv > 0 && ((S.inv * 10) | 0) % 2) ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#9b6a3a'; ctx.fillRect(-28, -32, 56, 64);
    ctx.strokeStyle = '#6b4320'; ctx.lineWidth = 2; for (let i = -18; i <= 18; i += 12) { ctx.beginPath(); ctx.moveTo(i, -32); ctx.lineTo(i, 32); ctx.stroke(); }
    ctx.font = '24px sans-serif'; ctx.fillText('🐸', -12, 6); ctx.fillText('🐸', 12, 6);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.fillText('A', -14, 26); ctx.fillText('L', 14, 26);
    ctx.restore(); ctx.globalAlpha = 1;
    // HUD
    const prog = Math.min(1, Math.max(0, R.y / FINISH));
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(10, 10, 250, 92);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`❤️ ${'■'.repeat(S.hp)}${'□'.repeat(Math.max(0, 3 - S.hp))}   ⏱ ${S.t.toFixed(1)}s`, 20, 30);
    ctx.fillText('A 汽水', 20, 52); ctx.fillText('L 汽水', 20, 72);
    ctx.fillStyle = '#333'; ctx.fillRect(80, 42, 160, 12); ctx.fillRect(80, 62, 160, 12);
    ctx.fillStyle = '#c6e36b'; ctx.fillRect(80, 42, 1.6 * S.gasL, 12); ctx.fillRect(80, 62, 1.6 * S.gasR, 12);
    ctx.fillStyle = '#fff'; ctx.fillText(`进度 ${(prog * 100).toFixed(0)}%`, 20, 94);
    ctx.fillStyle = '#333'; ctx.fillRect(110, 85, 130, 8); ctx.fillStyle = '#ffd34d'; ctx.fillRect(110, 85, 130 * prog, 8);
    if (S.over) {
      ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 34px sans-serif';
      ctx.fillText(S.win ? `🏁 抵达上游！用时 ${S.t.toFixed(1)} 秒` : '💥 木筏散架了……', W / 2, H / 2);
      ctx.font = '18px sans-serif'; ctx.fillText('按 R 再来一次', W / 2, H / 2 + 40);
    }
  }

  let last = performance.now();
  function loop(now) { const dt = Math.min(0.033, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__demo = { get S() { return S; } };
})();
