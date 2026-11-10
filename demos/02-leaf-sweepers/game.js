// 落叶清扫队 Leaf Sweepers — 8 个公园关卡 · 跨关卡永久升级 · 本地双人合作 · 触屏双摇杆
// 趋势参考：2026 年 10 月走红的合作 + 增量清洁类游戏（原创落叶公园主题）
(() => {
  'use strict';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const CS = 10, GW = W / CS, GH = H / CS;
  const leaf = new Float32Array(GW * GH), hue = new Uint8Array(GW * GH), lawn = new Uint8Array(GW * GH);
  const img = new ImageData(GW, GH);
  const leafCanvas = document.createElement('canvas'); leafCanvas.width = GW; leafCanvas.height = GH;
  const lctx = leafCanvas.getContext('2d');
  const $ = id => document.getElementById(id);

  const LEVELS = [
    { name: '社区小公园', trees: 3, density: 0.55, limit: 240, wind: 0, puddles: 0, target: 0.9 },
    { name: '银杏大道', trees: 6, density: 0.6, limit: 200, wind: 0, puddles: 0, target: 0.9 },
    { name: '湖边草地', trees: 5, density: 0.68, limit: 180, wind: 0, puddles: 2, target: 0.9 },
    { name: '秋风起', trees: 7, density: 0.72, limit: 170, wind: 1, puddles: 1, target: 0.9 },
    { name: '枫叶山坡', trees: 9, density: 0.8, limit: 160, wind: 1, puddles: 2, target: 0.92 },
    { name: '游乐场', trees: 8, density: 0.85, limit: 150, wind: 1, puddles: 3, target: 0.92 },
    { name: '台风过后', trees: 10, density: 0.95, limit: 150, wind: 2, puddles: 3, target: 0.93 },
    { name: '中央大公园', trees: 12, density: 1.0, limit: 160, wind: 2, puddles: 4, target: 0.95 },
  ];
  const SAVE = XG.save('02-leaf-sweepers', { tutorialSeen: false, unlocked: 1, stars: {}, best: {}, money: 0, up: { brush: 0, bag: 0, boots: 0, robots: 0, compost: 0 }, twoP: false, totalLeaves: 0 });
  const S = SAVE.data;

  const UPG = [
    { key: 'brush', name: '🧹 大扫帚', base: 60, mult: 1.6, max: 8, desc: () => `半径 ${stats().radius}` },
    { key: 'bag', name: '🎒 大落叶袋', base: 45, mult: 1.6, max: 8, desc: () => `容量 ${stats().cap}` },
    { key: 'boots', name: '👟 跑鞋', base: 80, mult: 1.7, max: 6, desc: () => `速度 ${stats().speed}` },
    { key: 'robots', name: '🤖 扫地机器人', base: 200, mult: 1.55, max: 6, desc: () => `已有 ${S.up.robots}` },
    { key: 'compost', name: '🏭 堆肥加工', base: 150, mult: 2.0, max: 5, desc: () => `每袋价 ×${stats().price}` },
  ];
  const stats = () => ({ radius: 12 + S.up.brush * 5, rate: 3 + S.up.brush * 0.6, cap: 40 + S.up.bag * 30, speed: 140 + S.up.boots * 22, price: +(1 + S.up.compost * 0.25).toFixed(2) });
  const costOf = u => Math.round(u.base * Math.pow(u.mult, S.up[u.key]));

  const st = { level: 0, t: 0, running: false, cleaned: 0, initial: 1, trees: [], puddles: [], depot: { x: 450, y: 270, r: 34 }, windT: 0, flying: [], popups: [] };
  const players = [
    { x: 0, y: 0, bag: 0, color: '#ffd166', keys: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }, name: 'P1', stick: 'p1', face: 1 },
    { x: 0, y: 0, bag: 0, color: '#06d6a0', keys: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, name: 'P2', stick: 'p2', face: 1 },
  ];
  let robots = [];

  function smoothNoise(seed) {
    const ph = Array.from({ length: 6 }, () => Math.random() * Math.PI * 2);
    return (x, y) => (Math.sin(x * 0.011 + ph[0]) * Math.cos(y * 0.013 + ph[1]) + Math.sin((x + y) * 0.007 + ph[2]) * 0.6 + Math.cos(x * 0.023 - y * 0.017 + ph[3]) * 0.4) / 2 + 0.5;
  }
  function buildLevel(li) {
    const L = LEVELS[li]; st.level = li;
    // 堆肥站位置
    st.depot = XG.pick([{ x: 450, y: 270 }, { x: 120, y: 270 }, { x: 780, y: 270 }, { x: 450, y: 90 }]); st.depot.r = 34;
    const far = (x, y, d) => Math.hypot(x - st.depot.x, y - st.depot.y) > d;
    st.trees = []; let guard = 0;
    while (st.trees.length < L.trees && guard++ < 400) {
      const x = 50 + Math.random() * (W - 100), y = 50 + Math.random() * (H - 100);
      if (far(x, y, 110) && st.trees.every(t => Math.hypot(t.x - x, t.y - y) > 110)) st.trees.push({ x, y, r: 14, canopy: 34 + Math.random() * 12, hueBase: (Math.random() * 3) | 0 });
    }
    st.puddles = []; guard = 0;
    while (st.puddles.length < L.puddles && guard++ < 400) {
      const x = 80 + Math.random() * (W - 160), y = 80 + Math.random() * (H - 160);
      if (far(x, y, 120) && st.trees.every(t => Math.hypot(t.x - x, t.y - y) > 70)) st.puddles.push({ x, y, rx: 40 + Math.random() * 25, ry: 24 + Math.random() * 12 });
    }
    const n1 = smoothNoise(), n2 = smoothNoise();
    let total = 0;
    for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
      const x = gx * CS + CS / 2, y = gy * CS + CS / 2, i = gy * GW + gx;
      lawn[i] = n2(x, y) > 0.32 ? 1 : 0;
      let v = L.density * (0.18 + 0.42 * n1(x, y) + Math.random() * 0.12) * (lawn[i] ? 1 : 0.6);
      for (const t of st.trees) { const d = Math.hypot(x - t.x, y - t.y); if (d < 90) v += 0.55 * (1 - d / 90); }
      if (!far(x, y, st.depot.r + 10)) v = 0;
      if (st.trees.some(t => Math.hypot(x - t.x, y - t.y) < t.r)) v = 0;
      v = XG.clamp(v, 0, 1); leaf[i] = v; total += v;
      hue[i] = (Math.random() * 4) | 0;
    }
    st.initial = total; st.t = 0; st.windT = 0; st.flying = []; st.popups = [];
    players[0].x = st.depot.x - 55; players[0].y = st.depot.y; players[1].x = st.depot.x + 55; players[1].y = st.depot.y;
    players.forEach(p => { p.bag = 0; p.x = XG.clamp(p.x, 20, W - 20); });
    robots = Array.from({ length: S.up.robots }, makeRobot);
    st.running = true;
    XG.toast(`「${L.name}」天黑前清扫到 ${Math.round(L.target * 100)}%！`, 2600);
    setupTouch(); refreshShop();
  }
  function makeRobot() { return { x: st.depot.x, y: st.depot.y, bag: 0, cap: 14, tx: null, ty: null, mode: 'seek' }; }

  function buy(i) {
    const u = UPG[i], c = costOf(u);
    if (S.up[u.key] >= u.max || S.money < c) { XG.audio.sfx('error'); return; }
    S.money -= c; S.up[u.key]++;
    if (u.key === 'robots' && st.running) robots.push(makeRobot());
    XG.audio.sfx('powerup'); XG.toast(`${u.name} → Lv${S.up[u.key]}`); SAVE.write(); refreshShop();
  }
  const shop = $('shop');
  UPG.forEach((u, i) => { const b = document.createElement('button'); b.id = 'u_' + u.key; b.onclick = () => buy(i); shop.appendChild(b); });
  function refreshShop() {
    UPG.forEach(u => {
      const b = $('u_' + u.key), maxed = S.up[u.key] >= u.max;
      const html = `${u.name} ${maxed ? '（满级）' : `Lv${S.up[u.key] + 1} · $${costOf(u)}`}<small>${u.desc()}</small>`;
      if (b.innerHTML !== html) b.innerHTML = html;
      const dis = maxed || S.money < costOf(u); if (b.disabled !== dis) b.disabled = dis;
    });
  }
  window.addEventListener('keydown', e => { if (/^Digit[1-5]$/.test(e.code) && G.state === 'play') buy(+e.code.slice(5) - 1); });

  function suck(x, y, radius, rate, dt, room) {
    let got = 0;
    const g0x = Math.max(0, ((x - radius) / CS) | 0), g1x = Math.min(GW - 1, ((x + radius) / CS) | 0);
    const g0y = Math.max(0, ((y - radius) / CS) | 0), g1y = Math.min(GH - 1, ((y + radius) / CS) | 0);
    for (let gy = g0y; gy <= g1y && got < room; gy++) for (let gx = g0x; gx <= g1x && got < room; gx++) {
      const cx = gx * CS + CS / 2, cy = gy * CS + CS / 2;
      if ((cx - x) ** 2 + (cy - y) ** 2 > radius * radius) continue;
      const i = gy * GW + gx, take = Math.min(leaf[i], rate * dt, room - got);
      leaf[i] -= take; got += take;
    }
    return got;
  }
  function sell(amount, x, y) {
    const e = amount * stats().price; S.money += e; S.totalLeaves += amount;
    st.popups.push({ x, y, s: `+$${Math.round(e)}`, life: 1 });
    XG.audio.sfxThrottled('coin', 150); refreshShop();
  }
  function collide(o, rad) {
    for (const t of st.trees) { const dx = o.x - t.x, dy = o.y - t.y, d = Math.hypot(dx, dy), m = t.r + rad; if (d < m && d > 0) { o.x = t.x + dx / d * m; o.y = t.y + dy / d * m; } }
    o.x = XG.clamp(o.x, rad, W - rad); o.y = XG.clamp(o.y, rad, H - rad);
  }
  const inPuddle = o => st.puddles.some(p => ((o.x - p.x) / p.rx) ** 2 + ((o.y - p.y) / p.ry) ** 2 < 1);
  function findTarget(r) {
    let best = null, bs = -1;
    for (let k = 0; k < 50; k++) {
      const gx = (Math.random() * GW) | 0, gy = (Math.random() * GH) | 0, v = leaf[gy * GW + gx];
      if (v < 0.08) continue;
      const x = gx * CS + 5, y = gy * CS + 5, sc = v / (1 + Math.hypot(x - r.x, y - r.y) / 180);
      if (sc > bs) { bs = sc; best = { x, y }; }
    }
    return best;
  }
  function gust() {
    const L = LEVELS[st.level];
    for (const t of st.trees) {
      const n = 4 * L.wind;
      for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2, d = 20 + Math.random() * 90, x = t.x + Math.cos(a) * d, y = t.y + Math.sin(a) * d;
        st.flying.push({ x: t.x, y: t.y, tx: x, ty: y, t: 0, h: (Math.random() * 4) | 0 });
      }
    }
    XG.audio.sfx('wind'); XG.toast('🍂 一阵秋风，树上又掉了好多叶子！');
  }

  function update(dt) {
    if (!st.running || G.paused) return;
    const L = LEVELS[st.level], s = stats();
    st.t += dt;
    const active = S.twoP ? players : [players[0]];
    for (const p of active) {
      let vx = 0, vy = 0;
      const stick = XG.touch.sticks[p.stick];
      if (stick && stick.active) { vx = stick.x; vy = stick.y; }
      else {
        if (XG.keys.has(p.keys.up)) vy--; if (XG.keys.has(p.keys.down)) vy++;
        if (XG.keys.has(p.keys.left)) vx--; if (XG.keys.has(p.keys.right)) vx++;
        // 单人时方向键也能控制 P1
        if (!S.twoP && p === players[0]) { if (XG.keys.has('ArrowUp')) vy--; if (XG.keys.has('ArrowDown')) vy++; if (XG.keys.has('ArrowLeft')) vx--; if (XG.keys.has('ArrowRight')) vx++; }
      }
      const l = Math.hypot(vx, vy); if (l > 1) { vx /= l; vy /= l; }
      const slow = (p.bag >= s.cap ? 0.8 : 1) * (inPuddle(p) ? 0.5 : 1);
      p.x += vx * s.speed * slow * dt; p.y += vy * s.speed * slow * dt; if (vx) p.face = Math.sign(vx);
      collide(p, 10);
      if (p.bag < s.cap) { const got = suck(p.x, p.y, s.radius, s.rate, dt, s.cap - p.bag); p.bag += got; if (got > 0.01 && l > 0.1) XG.audio.sfxThrottled('rustle', 110); }
      else if (!p.fullWarned) { p.fullWarned = true; XG.toast(`${p.name} 的袋子满了，回堆肥站！`); }
      if (Math.hypot(p.x - st.depot.x, p.y - st.depot.y) < st.depot.r + 8 && p.bag > 0.5) { sell(p.bag, p.x, p.y - 20); p.bag = 0; p.fullWarned = false; }
    }
    for (const r of robots) {
      const sp = 75 + S.up.boots * 8;
      if (r.mode === 'seek') {
        if (r.tx == null || Math.random() < 0.003) { const t = findTarget(r); if (t) { r.tx = t.x; r.ty = t.y; } }
        if (r.tx != null) {
          const dx = r.tx - r.x, dy = r.ty - r.y, d = Math.hypot(dx, dy);
          if (d > 3) { r.x += dx / d * sp * dt; r.y += dy / d * sp * dt; }
          const got = suck(r.x, r.y, 10, 2, dt, r.cap - r.bag); r.bag += got;
          if (d <= 3 && got < 0.001) r.tx = null;
        }
        if (r.bag >= r.cap - 0.01) r.mode = 'back';
      } else {
        const dx = st.depot.x - r.x, dy = st.depot.y - r.y, d = Math.hypot(dx, dy);
        if (d < st.depot.r) { sell(r.bag, r.x, r.y - 14); r.bag = 0; r.mode = 'seek'; r.tx = null; } else { r.x += dx / d * sp * 1.3 * dt; r.y += dy / d * sp * 1.3 * dt; }
      }
      collide(r, 7);
    }
    // 风
    if (L.wind) { st.windT += dt; if (st.windT > 26 - L.wind * 6) { st.windT = 0; gust(); } }
    for (const f of st.flying) {
      f.t += dt / 1.2;
      if (f.t >= 1 && !f.landed) {
        f.landed = true; const gx = XG.clamp((f.tx / CS) | 0, 0, GW - 1), gy = XG.clamp((f.ty / CS) | 0, 0, GH - 1);
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const i = XG.clamp(gy + oy, 0, GH - 1) * GW + XG.clamp(gx + ox, 0, GW - 1); leaf[i] = Math.min(1, leaf[i] + (ox || oy ? 0.12 : 0.4)); }
      }
    }
    st.flying = st.flying.filter(f => !f.landed);
    for (const p of st.popups) { p.life -= dt; p.y -= 30 * dt; }
    st.popups = st.popups.filter(p => p.life > 0);
    let rem = 0; for (let i = 0; i < leaf.length; i++) rem += leaf[i];
    st.cleaned = Math.max(0, 1 - rem / st.initial);
    if (st.cleaned >= L.target) return win();
    if (st.t >= L.limit) return lose();
  }

  function win() {
    st.running = false;
    const li = st.level, L = LEVELS[li], t = st.t;
    const stars = t <= L.limit * 0.55 ? 3 : t <= L.limit * 0.8 ? 2 : 1;
    const bonus = Math.round(30 + li * 15 + stars * 10); S.money += bonus;
    const key = 'L' + li, nb = !S.best[key] || t < S.best[key]; if (nb) S.best[key] = +t.toFixed(1);
    S.stars[key] = Math.max(S.stars[key] || 0, stars); S.unlocked = Math.max(S.unlocked, Math.min(LEVELS.length, li + 2)); SAVE.write();
    const last = li === LEVELS.length - 1;
    G.end({ win: true, title: last ? '🏆 全城最干净的公园管理员！' : `🍂 ${L.name} 扫干净了！`, sub: `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}${nb ? ' · 新纪录' : ''}`,
      stats: [['用时', XG.fmtTime(t)], ['清洁度', (st.cleaned * 100).toFixed(1) + '%'], ['通关奖励', '+$' + bonus], ['现金', '$' + Math.floor(S.money)]],
      buttons: [...(last ? [] : [{ label: '▶ 下一个公园', primary: true, id: 'xgNext', onClick: () => G.start(li + 1) }]), { label: '🔁 再扫一次', id: 'xgAgain', primary: last, onClick: () => G.start(li) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
  }
  function lose() {
    st.running = false; SAVE.write();
    G.end({ win: false, title: '🌙 天黑了……', sub: `只扫到 ${(st.cleaned * 100).toFixed(1)}%，目标 ${Math.round(LEVELS[st.level].target * 100)}%。挣到的钱都保留了，升级一下再来！`, stats: [['现金', '$' + Math.floor(S.money)]],
      buttons: [{ label: '🔁 再试一次', primary: true, id: 'xgAgain', onClick: () => G.start(st.level) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
  }

  // ---------- 绘制 ----------
  const LEAF_RGB = [[230, 120, 40], [200, 72, 42], [242, 163, 58], [184, 80, 31]];
  function draw() {
    const d = img.data;
    for (let i = 0; i < leaf.length; i++) {
      const v = leaf[i], g = lawn[i] ? [74, 135, 58] : [196, 178, 138], c = LEAF_RGB[hue[i]];
      const a = Math.min(1, v * 1.4);
      const stripe = lawn[i] && ((i / GW | 0) % 6 < 3) ? 8 : 0;
      d[i * 4] = g[0] + stripe + (c[0] - g[0]) * a; d[i * 4 + 1] = g[1] + stripe + (c[1] - g[1]) * a; d[i * 4 + 2] = g[2] + (c[2] - g[2]) * a; d[i * 4 + 3] = 255;
    }
    lctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(leafCanvas, 0, 0, W, H);
    for (const p of st.puddles) { ctx.fillStyle = 'rgba(90,150,210,.55)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.stroke(); }
    // 堆肥站
    const D = st.depot;
    ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.ellipse(D.x, D.y + 26, 40, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4a24'; ctx.fillRect(D.x - 32, D.y - 22, 64, 44); ctx.fillStyle = '#8a5f30'; ctx.fillRect(D.x - 32, D.y - 22, 64, 10);
    ctx.fillStyle = '#ffe7c2'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('堆肥站', D.x, D.y + 8);
    const s = stats();
    for (const r of robots) {
      ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.ellipse(r.x, r.y + 7, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d8dde6'; ctx.beginPath(); ctx.arc(r.x, r.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3cb4ff'; ctx.beginPath(); ctx.arc(r.x, r.y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e0913a'; ctx.fillRect(r.x - 8, r.y + 10, 16 * r.bag / r.cap, 2);
    }
    const active = S.twoP ? players : [players[0]];
    for (const p of active) {
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, s.radius, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 11, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
      // 扫帚
      ctx.strokeStyle = '#7a4b22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x + p.face * 6, p.y); ctx.lineTo(p.x + p.face * 16, p.y + 12); ctx.stroke();
      ctx.fillStyle = '#d9b04e'; ctx.beginPath(); ctx.arc(p.x + p.face * 17, p.y + 13, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y - 2, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(p.x - 3 + p.face * 2, p.y - 4, 1.6, 0, Math.PI * 2); ctx.arc(p.x + 3 + p.face * 2, p.y - 4, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0008'; ctx.fillRect(p.x - 15, p.y - 22, 30, 5);
      ctx.fillStyle = p.bag >= s.cap ? '#ff5555' : '#ffe7c2'; ctx.fillRect(p.x - 15, p.y - 22, 30 * Math.min(1, p.bag / s.cap), 5);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.fillText(p.name, p.x, p.y + 24);
    }
    // 树冠（盖在最上层）
    for (const t of st.trees) {
      ctx.fillStyle = '#00000038'; ctx.beginPath(); ctx.ellipse(t.x + 8, t.y + 10, t.canopy * 0.9, t.canopy * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5b3518'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
      const cols = [['#ffb347', '#e0662b'], ['#ffd24d', '#d9a12b'], ['#ff8a5c', '#c9482a']][t.hueBase];
      const g = ctx.createRadialGradient(t.x - 10, t.y - 18, 4, t.x, t.y - 8, t.canopy);
      g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]);
      ctx.globalAlpha = 0.88; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(t.x, t.y - 8, t.canopy * 0.75, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    for (const f of st.flying) {
      const x = f.x + (f.tx - f.x) * f.t, y = f.y + (f.ty - f.y) * f.t - Math.sin(f.t * Math.PI) * 30;
      const c = LEAF_RGB[f.h]; ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.save(); ctx.translate(x, y); ctx.rotate(f.t * 8); ctx.fillRect(-4, -2, 8, 4); ctx.restore();
    }
    ctx.font = 'bold 13px sans-serif';
    for (const p of st.popups) { ctx.fillStyle = `rgba(255,240,150,${p.life})`; ctx.fillText(p.s, p.x, p.y); }
    // HUD
    const L = LEVELS[st.level];
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(8, 8, 330, 52);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`💰 $${Math.floor(S.money)}   🍂 ${(st.cleaned * 100).toFixed(1)}% / ${Math.round(L.target * 100)}%   🌙 ${XG.fmtTime(L.limit - st.t)}`, 16, 28);
    ctx.fillStyle = '#333'; ctx.fillRect(16, 38, 314, 8);
    ctx.fillStyle = '#e0913a'; ctx.fillRect(16, 38, 314 * Math.min(1, st.cleaned / L.target), 8);
    ctx.fillStyle = '#fff'; ctx.fillRect(16 + 314 * Math.min(1, st.t / L.limit) - 1, 36, 2, 12);
    // 天色渐暗
    const dusk = Math.max(0, st.t / L.limit - 0.6) / 0.4;
    if (dusk > 0) { ctx.fillStyle = `rgba(20,20,60,${dusk * 0.35})`; ctx.fillRect(0, 0, W, H); }
  }

  // ---------- 触屏 ----------
  function setupTouch() {
    if (!XG.touch.enabled) return;
    if (!XG.touch.sticks.p1) {
      XG.touch.stick('p1', { keys: players[0].keys, hint: 'P1 拖动移动' });
      XG.touch.stick('p2', { keys: players[1].keys, hint: 'P2 拖动移动' });
    }
    placeTouch();
  }
  function placeTouch() {
    if (!XG.touch.sticks.p1) return;
    const r = cv.getBoundingClientRect();
    if (S.twoP) {
      XG.touch.place('p1', { left: r.left, top: r.top, width: r.width / 2, height: r.height });
      XG.touch.place('p2', { left: r.left + r.width / 2, top: r.top, width: r.width / 2, height: r.height });
      XG.touch.setVisible('p2', true);
    } else { XG.touch.place('p1', { left: r.left, top: r.top, width: r.width, height: r.height }); XG.touch.setVisible('p2', false); }
  }

  const G = XG.game({
    id: '02-leaf-sweepers', title: '🍂 落叶清扫队', subtitle: '天黑之前把公园扫干净！卖落叶换钱、升级扫帚、买扫地机器人，8 个公园越来越大、风越来越猛。支持本地双人合作。',
    cover: '../../assets/02-leaf-sweepers/cover.svg', music: 'cozy', save: SAVE,
    tutorial: [
      { title: '扫落叶', text: '用 <b>WASD</b>（或方向键）走动，身边圆圈里的落叶会被自动扫进袋子。', touch: '在画面上按住拖动，出现的摇杆控制移动。' },
      { title: '卖给堆肥站', text: '头顶的条是落叶袋，满了就回到<b>堆肥站</b>，进站自动卖掉换钱。', touch: '' },
      { title: '升级', text: '下方按钮（或数字键 1–5）购买升级：大扫帚、大袋子、跑鞋、扫地机器人、堆肥加工（提高卖价）。<b>升级和金钱会永久保存</b>，过不去就多升级。', touch: '升级按钮在画面下方。' },
      { title: '天黑与风', text: '每个公园都有时间限制（右上角 🌙），天黑前清洁度达标才算过关。后面的公园会刮风，树上会再掉叶子；水坑会让你减速。', touch: '' },
      { title: '双人合作', text: '在菜单里打开<b>双人模式</b>：P1 用 WASD，P2 用方向键，共享金钱和升级。', touch: '双人时左半屏是 P1 摇杆，右半屏是 P2 摇杆。' },
    ],
    onStart: li => buildLevel(li == null ? Math.min(S.unlocked, LEVELS.length) - 1 : li),
    onRestart: () => buildLevel(st.level),
    onQuit: () => { st.running = false; SAVE.write(); },
    onPause: () => SAVE.write(),
    onMenu: () => menu(),
    pauseInfo: () => `${LEVELS[st.level].name} · 清洁度 ${(st.cleaned * 100).toFixed(1)}%`,
  });
  function menu() {
    const totalStars = Object.values(S.stars).reduce((a, b) => a + b, 0);
    G.menu(`<div class="xg-stats"><span>已解锁公园</span><b>${S.unlocked} / ${LEVELS.length}</b><span>星星</span><b>${totalStars} / ${LEVELS.length * 3}</b><span>现金</span><b>$${Math.floor(S.money)}</b><span>累计扫叶</span><b>${Math.floor(S.totalLeaves)}</b></div>`, [
      { label: `▶ ${S.unlocked > 1 ? '继续：' + LEVELS[Math.min(S.unlocked, LEVELS.length) - 1].name : '开始游戏'}`, primary: true, id: 'xgStart', onClick: () => G.start(Math.min(S.unlocked, LEVELS.length) - 1) },
      { label: '🗺 选择公园', id: 'xgLevels', onClick: () => G.levelSelect(LEVELS.map((L, i) => ({ name: `${i + 1}. ${L.name}`, sub: `${XG.fmtTime(L.limit)} · ${Math.round(L.target * 100)}%`, locked: i >= S.unlocked, stars: S.stars['L' + i] || 0 })), i => G.start(i)) },
      { label: S.twoP ? '👥 双人模式：开' : '👤 双人模式：关', id: 'xgTwoP', onClick: () => { S.twoP = !S.twoP; SAVE.write(); menu(); } },
      { label: '📖 教程', onClick: () => G.tutorial(menu) },
    ]);
  }

  XG.fit(cv, { reserve: () => ({ w: 0, h: $('shop').offsetHeight + 24 }), onResize: () => placeTouch() });
  buildLevel(0); st.running = false; menu();
  let last = performance.now();
  function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__demo = { st, S, players, robots: () => robots, leaf, G, LEVELS, buy, update, buildLevel, UPG, costOf, stats };
})();
