// 草堆寻针 — 致敬 2026 年 8 月在 X 上走红的"大海捞针"玩法与 Find the Needle 类增量游戏
(() => {
  'use strict';
  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const octx = off.getContext('2d');

  const LEVEL_STRAWS = [7000, 12000, 18000];
  const CELL = 20, GW = Math.ceil(W / CELL), GH = Math.ceil(H / CELL);
  const COLORS = ['#e8c565', '#d9b04e', '#c99a3a', '#f2d98a'];
  const STRAWS_PER_COIN = 40;

  const $ = id => document.getElementById(id);
  const ui = { lvl: $('lvl'), left: $('left'), coins: $('coins'), time: $('time'), msg: $('msg'),
    bRadius: $('bRadius'), bPower: $('bPower'), bDetector: $('bDetector'), bMagnet: $('bMagnet'),
    detWrap: $('detWrap'), meterFill: $('meterFill'), overlay: $('overlay'), ovText: $('ovText') };

  const state = {
    level: 0, coins: 0, removedTotal: 0, removedSinceCoin: 0,
    radius: 22, power: 8, detector: 0,
    upRadius: 0, upPower: 0,
    t0: 0, elapsed: 0, times: [], running: false,
    mouse: { x: -100, y: -100, down: false },
    dirty: true, sparkle: 0,
  };

  let N = 0, sx, sy, ex, ey, col, alive, aliveCount = 0, grid;
  const needle = { x: 0, y: 0, x2: 0, y2: 0, cx: 0, cy: 0 };

  function inField(x, y) {
    // 草堆形状：一个宽椭圆
    const dx = (x - W / 2) / (W * 0.47), dy = (y - H / 2) / (H * 0.45);
    return dx * dx + dy * dy < 1;
  }

  function buildLevel() {
    N = LEVEL_STRAWS[state.level];
    sx = new Float32Array(N); sy = new Float32Array(N); ex = new Float32Array(N); ey = new Float32Array(N);
    col = new Uint8Array(N); alive = new Uint8Array(N);
    grid = Array.from({ length: GW * GH }, () => []);
    // 针：放在草堆内部，离边缘有点距离
    let nx, ny;
    do { nx = 80 + Math.random() * (W - 160); ny = 70 + Math.random() * (H - 140); }
    while (!inField(nx, ny) || Math.hypot((nx - W / 2) / W, (ny - H / 2) / H) > 0.33);
    const na = Math.random() * Math.PI;
    needle.cx = nx; needle.cy = ny;
    needle.x = nx - Math.cos(na) * 13; needle.y = ny - Math.sin(na) * 13;
    needle.x2 = nx + Math.cos(na) * 13; needle.y2 = ny + Math.sin(na) * 13;
    // 针附近额外加密，保证一开始完全被盖住
    for (let i = 0; i < N; i++) {
      let x, y;
      if (i < 260) { x = nx + (Math.random() - .5) * 60; y = ny + (Math.random() - .5) * 60; }
      else do { x = Math.random() * W; y = Math.random() * H; } while (!inField(x, y));
      const a = Math.random() * Math.PI, l = 14 + Math.random() * 22;
      sx[i] = x - Math.cos(a) * l / 2; sy[i] = y - Math.sin(a) * l / 2;
      ex[i] = x + Math.cos(a) * l / 2; ey[i] = y + Math.sin(a) * l / 2;
      col[i] = (Math.random() * COLORS.length) | 0;
      alive[i] = 1;
      const gx = Math.min(GW - 1, Math.max(0, (x / CELL) | 0)), gy = Math.min(GH - 1, Math.max(0, (y / CELL) | 0));
      grid[gy * GW + gx].push(i);
    }
    aliveCount = N;
    state.t0 = performance.now(); state.elapsed = 0; state.running = true; state.dirty = true;
    msg(`第 ${state.level + 1} 个草堆：${N.toLocaleString()} 根稻草，1 根针。`);
    refreshUI();
  }

  function segDist(px, py, x1, y1, x2, y2) {
    const vx = x2 - x1, vy = y2 - y1, wx = px - x1, wy = py - y1;
    const L = vx * vx + vy * vy || 1;
    let t = (wx * vx + wy * vy) / L; t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * vx), py - (y1 + t * vy));
  }

  function coverCount() {
    let c = 0;
    const gx0 = Math.max(0, ((needle.cx - 40) / CELL) | 0), gx1 = Math.min(GW - 1, ((needle.cx + 40) / CELL) | 0);
    const gy0 = Math.max(0, ((needle.cy - 40) / CELL) | 0), gy1 = Math.min(GH - 1, ((needle.cy + 40) / CELL) | 0);
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
      for (const i of grid[gy * GW + gx]) {
        if (!alive[i]) continue;
        // 采样针上 3 个点，判断是否被这根草压住
        for (let k = 0; k <= 2; k++) {
          const px = needle.x + (needle.x2 - needle.x) * k / 2, py = needle.y + (needle.y2 - needle.y) * k / 2;
          if (segDist(px, py, sx[i], sy[i], ex[i], ey[i]) < 3) { c++; break; }
        }
      }
    }
    return c;
  }

  function rake(x, y, r, maxRemove) {
    let removed = 0;
    const gx0 = Math.max(0, ((x - r) / CELL) | 0), gx1 = Math.min(GW - 1, ((x + r) / CELL) | 0);
    const gy0 = Math.max(0, ((y - r) / CELL) | 0), gy1 = Math.min(GH - 1, ((y + r) / CELL) | 0);
    // 先收集候选，再按索引从大到小（最上层先拨走）
    const cand = [];
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
      for (const i of grid[gy * GW + gx]) {
        if (!alive[i]) continue;
        const mx = (sx[i] + ex[i]) / 2, my = (sy[i] + ey[i]) / 2;
        if ((mx - x) ** 2 + (my - y) ** 2 < r * r) cand.push(i);
      }
    }
    cand.sort((a, b) => b - a);
    for (const i of cand) {
      if (removed >= maxRemove) break;
      alive[i] = 0; removed++;
    }
    if (removed) {
      aliveCount -= removed; state.removedTotal += removed; state.removedSinceCoin += removed;
      while (state.removedSinceCoin >= STRAWS_PER_COIN) { state.removedSinceCoin -= STRAWS_PER_COIN; state.coins++; }
      state.dirty = true;
    }
    return removed;
  }

  function redrawOffscreen() {
    octx.fillStyle = '#5a4329'; octx.fillRect(0, 0, W, H);
    // 地面纹理
    octx.fillStyle = '#4c3822';
    for (let i = 0; i < 60; i++) octx.fillRect((i * 97) % W, (i * 53) % H, 3, 3);
    // 针（最底层）
    octx.strokeStyle = '#e8eef5'; octx.lineWidth = 2.2; octx.lineCap = 'round';
    octx.beginPath(); octx.moveTo(needle.x, needle.y); octx.lineTo(needle.x2, needle.y2); octx.stroke();
    octx.strokeStyle = '#8fa1b3'; octx.lineWidth = 1;
    octx.beginPath(); octx.arc(needle.x, needle.y, 2.2, 0, Math.PI * 2); octx.stroke();
    // 稻草按颜色批量绘制
    octx.lineWidth = 1.6;
    for (let c = 0; c < COLORS.length; c++) {
      octx.strokeStyle = COLORS[c]; octx.beginPath();
      for (let i = 0; i < N; i++) if (alive[i] && col[i] === c) { octx.moveTo(sx[i], sy[i]); octx.lineTo(ex[i], ey[i]); }
      octx.stroke();
    }
    state.dirty = false;
  }

  function cost(kind) {
    if (kind === 'radius') return 4 * (2 ** state.upRadius);
    if (kind === 'power') return 4 * (2 ** state.upPower);
    if (kind === 'detector') return state.detector === 0 ? 10 : 30;
    if (kind === 'magnet') return 12;
  }

  function refreshUI() {
    ui.lvl.textContent = `${state.level + 1} / ${LEVEL_STRAWS.length}`;
    ui.left.textContent = aliveCount.toLocaleString();
    ui.coins.textContent = state.coins;
    ui.bRadius.textContent = `🧹 加宽耙子 (半径 ${state.radius}) — ${cost('radius')} 金币`;
    ui.bPower.textContent = `💪 增加力气 (每帧 ${state.power} 根) — ${cost('power')} 金币`;
    ui.bDetector.textContent = state.detector >= 2 ? '📡 探测器已满级' : `📡 金属探测器 Lv${state.detector + 1} — ${cost('detector')} 金币`;
    ui.bMagnet.textContent = `🧲 磁铁吹风（在针附近吹开一片） — ${cost('magnet')} 金币`;
    ui.bRadius.disabled = state.coins < cost('radius') || state.upRadius >= 5;
    ui.bPower.disabled = state.coins < cost('power') || state.upPower >= 5;
    ui.bDetector.disabled = state.detector >= 2 || state.coins < cost('detector');
    ui.bMagnet.disabled = state.coins < cost('magnet');
    ui.detWrap.style.display = state.detector > 0 ? 'block' : 'none';
  }

  function msg(t) { ui.msg.textContent = t; }

  function buy(kind) {
    const c = cost(kind);
    if (state.coins < c) return;
    state.coins -= c;
    if (kind === 'radius') { state.upRadius++; state.radius += 8; }
    if (kind === 'power') { state.upPower++; state.power += 6; }
    if (kind === 'detector') state.detector++;
    if (kind === 'magnet') {
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 60;
      const mx = needle.cx + Math.cos(a) * d, my = needle.cy + Math.sin(a) * d;
      const n = rake(mx, my, 70, 99999);
      msg(`磁铁感应到附近有金属，吹走了 ${n} 根稻草！`);
    }
    refreshUI();
  }
  ui.bRadius.onclick = () => buy('radius');
  ui.bPower.onclick = () => buy('power');
  ui.bDetector.onclick = () => buy('detector');
  ui.bMagnet.onclick = () => buy('magnet');

  function pos(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  let downAt = null, dragDist = 0;
  cv.addEventListener('pointerdown', e => {
    const p = pos(e); state.mouse.x = p.x; state.mouse.y = p.y; state.mouse.down = true;
    downAt = p; dragDist = 0; cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => {
    const p = pos(e);
    if (state.mouse.down) dragDist += Math.hypot(p.x - state.mouse.x, p.y - state.mouse.y);
    state.mouse.x = p.x; state.mouse.y = p.y;
  });
  cv.addEventListener('pointerup', e => {
    state.mouse.down = false;
    if (!state.running || !downAt) return;
    const p = pos(e);
    // 短按 = 点击判定
    if (dragDist < 6) tryPick(p.x, p.y);
    downAt = null;
  });

  function tryPick(x, y) {
    const d = segDist(x, y, needle.x, needle.y, needle.x2, needle.y2);
    if (d < 9) {
      const cc = coverCount();
      if (cc <= 1) return win();
      msg(`你摸到了什么硬东西……但还压着 ${cc} 根稻草，再拨一拨！`);
    }
  }

  function win() {
    state.running = false;
    const t = state.elapsed;
    state.times.push(t);
    const bonus = 10 + state.level * 5;
    state.coins += bonus;
    const last = state.level >= LEVEL_STRAWS.length - 1;
    ui.ovText.innerHTML = last
      ? `<h2>🏆 三个草堆全部找到针！</h2><p>各关用时：${state.times.map(x => x.toFixed(1) + 's').join(' / ')}<br>总共拨开 ${state.removedTotal.toLocaleString()} 根稻草。</p><button id="again">再来一局</button>`
      : `<h2>🪡 找到针了！</h2><p>用时 ${t.toFixed(1)}s，奖励 ${bonus} 金币。<br>下一个草堆更大。</p><button id="next">下一个草堆</button>`;
    ui.overlay.style.display = 'flex';
    const b = document.getElementById(last ? 'again' : 'next');
    b.onclick = () => {
      ui.overlay.style.display = 'none';
      if (last) { Object.assign(state, { level: 0, coins: 0, removedTotal: 0, removedSinceCoin: 0, radius: 22, power: 8, detector: 0, upRadius: 0, upPower: 0, times: [] }); }
      else state.level++;
      buildLevel();
    };
  }

  function frame(now) {
    if (state.running) {
      state.elapsed = (now - state.t0) / 1000;
      if (state.mouse.down && dragDist >= 6) rake(state.mouse.x, state.mouse.y, state.radius, state.power);
    }
    if (state.dirty) { redrawOffscreen(); refreshUI(); }
    ctx.drawImage(off, 0, 0);
    // 针被基本露出时闪光提示
    if (state.running && (now | 0) % 1500 < 300 && coverCount() <= 2) {
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.beginPath(); ctx.arc(needle.cx, needle.cy, 3 + Math.random() * 3, 0, Math.PI * 2); ctx.fill();
    }
    // 光标圈
    ctx.strokeStyle = state.mouse.down ? 'rgba(255,220,120,.9)' : 'rgba(255,255,255,.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(state.mouse.x, state.mouse.y, state.radius, 0, Math.PI * 2); ctx.stroke();
    // 探测器
    if (state.detector > 0) {
      const d = Math.hypot(state.mouse.x - needle.cx, state.mouse.y - needle.cy);
      const range = state.detector === 1 ? 420 : 260;
      let v = Math.max(0, 1 - d / range);
      if (state.detector === 1) v = Math.round(v * 4) / 4; // 1 级只有粗略档位
      ui.meterFill.style.width = (v * 100).toFixed(0) + '%';
    }
    ui.time.textContent = state.elapsed.toFixed(1) + 's';
    requestAnimationFrame(frame);
  }

  buildLevel();
  requestAnimationFrame(frame);
  window.__demo = { state, needle, coverCount, rake, tryPick }; // 供自测脚本使用
})();
