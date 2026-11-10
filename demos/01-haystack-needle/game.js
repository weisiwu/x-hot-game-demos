// 草堆寻针 Haystack Hunt — 10 关闯关 + 永久工具升级 + 存档
// 趋势参考：2026-08 在 X 上爆红的"草堆找针"帖子与 Find the Needle 类增量游戏（原创实现）
(() => {
  'use strict';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const octx = off.getContext('2d');
  const $ = id => document.getElementById(id);
  const CELL = 20, GW = Math.ceil(W / CELL), GH = Math.ceil(H / CELL);
  const COLORS = ['#e8c565', '#d9b04e', '#c99a3a', '#f2d98a', '#b98a35'];
  const STRAWS_PER_COIN = 45;
  const groundImg = XG.img('../../assets/01-haystack-needle/ground.webp', () => { st.dirty = true; });

  // 关卡：稻草数、针数、钉子（干扰物）数、是否有风、时间限制（秒）
  const LEVELS = [
    { straws: 3500, needles: 1, nails: 0, wind: 0, limit: 120, name: '后院小草堆' },
    { straws: 5500, needles: 1, nails: 1, wind: 0, limit: 130, name: '谷仓边' },
    { straws: 7000, needles: 1, nails: 3, wind: 0, limit: 140, name: '生锈的秘密' },
    { straws: 8000, needles: 2, nails: 2, wind: 0, limit: 160, name: '双针奇缘' },
    { straws: 9500, needles: 2, nails: 3, wind: 1, limit: 170, name: '起风了' },
    { straws: 11000, needles: 2, nails: 5, wind: 1, limit: 180, name: '钉子窝' },
    { straws: 12500, needles: 3, nails: 4, wind: 1, limit: 200, name: '三针齐发' },
    { straws: 14000, needles: 3, nails: 6, wind: 2, limit: 210, name: '大风天' },
    { straws: 16000, needles: 3, nails: 8, wind: 2, limit: 230, name: '丰收季' },
    { straws: 19000, needles: 4, nails: 8, wind: 2, limit: 260, name: '传说中的草垛' },
  ];
  const SAVE = XG.save('01-haystack-needle', { tutorialSeen: false, unlocked: 1, stars: {}, best: {}, coins: 0, up: { radius: 0, power: 0, detector: 0 }, magnets: 1, totalStraws: 0 });
  const S = SAVE.data;

  const st = { level: 0, t: 0, running: false, mouse: { x: -100, y: -100, down: false }, dirty: true, beepT: 0, dragDist: 0, found: 0, windT: 0, penalty: 0, sparkles: [] };
  let N = 0, CAP = 0, sx, sy, ex, ey, col, alive, aliveCount = 0, grid, metals = [];
  const radius = () => 20 + S.up.radius * 7;
  const power = () => 6 + S.up.power * 5;

  function inField(x, y) { const dx = (x - W / 2) / (W * 0.47), dy = (y - H * 0.53) / (H * 0.44); return dx * dx + dy * dy < 1; }
  function addStraw(i, x, y) {
    const a = Math.random() * Math.PI, l = 14 + Math.random() * 22;
    sx[i] = x - Math.cos(a) * l / 2; sy[i] = y - Math.sin(a) * l / 2; ex[i] = x + Math.cos(a) * l / 2; ey[i] = y + Math.sin(a) * l / 2;
    col[i] = (Math.random() * COLORS.length) | 0; alive[i] = 1;
    const gx = XG.clamp((x / CELL) | 0, 0, GW - 1), gy = XG.clamp((y / CELL) | 0, 0, GH - 1);
    grid[gy * GW + gx].push(i);
  }
  function randInField(margin) {
    let x, y; do { x = margin + Math.random() * (W - 2 * margin); y = margin + Math.random() * (H - 2 * margin); } while (!inField(x, y) || Math.hypot((x - W / 2) / W, (y - H * 0.53) / H) > 0.34);
    return [x, y];
  }

  function buildLevel(li) {
    const L = LEVELS[li];
    st.level = li; N = L.straws; CAP = N + (L.wind ? 6000 : 0);
    sx = new Float32Array(CAP); sy = new Float32Array(CAP); ex = new Float32Array(CAP); ey = new Float32Array(CAP);
    col = new Uint8Array(CAP); alive = new Uint8Array(CAP);
    grid = Array.from({ length: GW * GH }, () => []);
    metals = [];
    const mk = (kind) => {
      let x, y, tries = 0;
      do { [x, y] = randInField(70); tries++; } while (tries < 50 && metals.some(m => Math.hypot(m.cx - x, m.cy - y) < 90));
      const a = Math.random() * Math.PI, len = kind === 'needle' ? 13 : 8;
      metals.push({ kind, cx: x, cy: y, x: x - Math.cos(a) * len, y: y - Math.sin(a) * len, x2: x + Math.cos(a) * len, y2: y + Math.sin(a) * len, done: false });
    };
    for (let i = 0; i < L.needles; i++) mk('needle');
    for (let i = 0; i < L.nails; i++) mk('nail');
    // 每个金属物附近额外加密，保证开局被完全盖住
    let i = 0;
    for (const m of metals) for (let k = 0; k < 160 && i < N; k++, i++) addStraw(i, m.cx + (Math.random() - .5) * 60, m.cy + (Math.random() - .5) * 60);
    for (; i < N; i++) { let x, y; do { x = Math.random() * W; y = Math.random() * H; } while (!inField(x, y)); addStraw(i, x, y); }
    aliveCount = N; st.found = 0; st.t = 0; st.penalty = 0; st.windT = 0; st.sparkles = [];
    st.running = true; st.dirty = true;
    msg(`「${L.name}」：${N.toLocaleString()} 根稻草里藏着 ${L.needles} 根针${L.nails ? `和 ${L.nails} 颗生锈钉子（别点错！）` : ''}${L.wind ? '。注意：风会把稻草吹回来！' : '。'}`);
    refreshUI();
  }

  function segDist(px, py, x1, y1, x2, y2) {
    const vx = x2 - x1, vy = y2 - y1, wx = px - x1, wy = py - y1, L = vx * vx + vy * vy || 1;
    const t = XG.clamp((wx * vx + wy * vy) / L, 0, 1);
    return Math.hypot(px - (x1 + t * vx), py - (y1 + t * vy));
  }
  function coverCount(m) {
    let c = 0;
    const gx0 = Math.max(0, ((m.cx - 40) / CELL) | 0), gx1 = Math.min(GW - 1, ((m.cx + 40) / CELL) | 0);
    const gy0 = Math.max(0, ((m.cy - 40) / CELL) | 0), gy1 = Math.min(GH - 1, ((m.cy + 40) / CELL) | 0);
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) for (const i of grid[gy * GW + gx]) {
      if (!alive[i]) continue;
      for (let k = 0; k <= 2; k++) { const px = m.x + (m.x2 - m.x) * k / 2, py = m.y + (m.y2 - m.y) * k / 2; if (segDist(px, py, sx[i], sy[i], ex[i], ey[i]) < 3) { c++; break; } }
    }
    return c;
  }

  function rake(x, y, r, maxRemove) {
    let removed = 0; const cand = [];
    const gx0 = Math.max(0, ((x - r) / CELL) | 0), gx1 = Math.min(GW - 1, ((x + r) / CELL) | 0);
    const gy0 = Math.max(0, ((y - r) / CELL) | 0), gy1 = Math.min(GH - 1, ((y + r) / CELL) | 0);
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) for (const i of grid[gy * GW + gx]) {
      if (!alive[i]) continue; const mx = (sx[i] + ex[i]) / 2, my = (sy[i] + ey[i]) / 2;
      if ((mx - x) ** 2 + (my - y) ** 2 < r * r) cand.push(i);
    }
    cand.sort((a, b) => b - a);
    for (const i of cand) { if (removed >= maxRemove) break; alive[i] = 0; removed++; }
    if (removed) {
      aliveCount -= removed; S.totalStraws += removed;
      st.coinAcc = (st.coinAcc || 0) + removed;
      while (st.coinAcc >= STRAWS_PER_COIN) { st.coinAcc -= STRAWS_PER_COIN; S.coins++; XG.audio.sfxThrottled('coin', 260); }
      XG.audio.sfxThrottled('rustle', 70);
      st.dirty = true;
    }
    return removed;
  }

  function windGust() {
    // 风把一些稻草吹回草堆（优先吹到被清空的区域）
    const L = LEVELS[st.level]; let added = 0;
    const count = 120 * L.wind;
    for (let k = 0; k < count && N < CAP; k++) {
      let x, y; do { x = Math.random() * W; y = Math.random() * H; } while (!inField(x, y));
      addStraw(N++, x, y); added++;
    }
    aliveCount += added; st.dirty = true;
    XG.audio.sfx('wind'); msg('🌬️ 一阵风吹来，又多了一些稻草！');
  }

  function redraw() {
    // 地面
    const g = octx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * 0.7);
    g.addColorStop(0, '#6b5032'); g.addColorStop(1, '#3e2c19');
    octx.fillStyle = g; octx.fillRect(0, 0, W, H);
    if (XG.ready(groundImg)) { octx.globalAlpha = 0.9; octx.drawImage(groundImg, 0, 0, W, H); octx.globalAlpha = 1; }
    octx.fillStyle = 'rgba(0,0,0,.18)'; octx.beginPath(); octx.ellipse(W / 2, H * 0.55, W * 0.48, H * 0.44, 0, 0, Math.PI * 2); octx.fill();
    // 金属物（底层）
    for (const m of metals) {
      if (m.done) continue;
      if (m.kind === 'needle') {
        octx.strokeStyle = '#eef3f8'; octx.lineWidth = 2.4; octx.lineCap = 'round';
        octx.beginPath(); octx.moveTo(m.x, m.y); octx.lineTo(m.x2, m.y2); octx.stroke();
        octx.strokeStyle = '#8fa1b3'; octx.lineWidth = 1.2; octx.beginPath(); octx.arc(m.x, m.y, 2.4, 0, Math.PI * 2); octx.stroke();
      } else {
        octx.strokeStyle = '#9a4b22'; octx.lineWidth = 3; octx.lineCap = 'round';
        octx.beginPath(); octx.moveTo(m.x, m.y); octx.lineTo(m.x2, m.y2); octx.stroke();
        octx.fillStyle = '#7a3a18'; octx.beginPath(); octx.arc(m.x, m.y, 4, 0, Math.PI * 2); octx.fill();
      }
    }
    octx.lineWidth = 1.7; octx.lineCap = 'round';
    for (let c = 0; c < COLORS.length; c++) {
      octx.strokeStyle = COLORS[c]; octx.beginPath();
      for (let i = 0; i < N; i++) if (alive[i] && col[i] === c) { octx.moveTo(sx[i], sy[i]); octx.lineTo(ex[i], ey[i]); }
      octx.stroke();
    }
    st.dirty = false;
  }

  // ---------- 商店 ----------
  const cost = {
    radius: () => Math.round(8 * Math.pow(1.85, S.up.radius)),
    power: () => Math.round(8 * Math.pow(1.85, S.up.power)),
    detector: () => [25, 70][S.up.detector] || 0,
    magnet: () => 18,
  };
  function buy(kind) {
    const c = cost[kind]();
    if (S.coins < c) return XG.audio.sfx('error');
    if (kind === 'radius' && S.up.radius >= 6) return; if (kind === 'power' && S.up.power >= 6) return; if (kind === 'detector' && S.up.detector >= 2) return;
    S.coins -= c;
    if (kind === 'magnet') S.magnets++; else S.up[kind]++;
    XG.audio.sfx('powerup'); SAVE.write(); refreshUI();
  }
  function useMagnet() {
    if (!st.running || G.paused || S.magnets <= 0) return;
    const left = metals.filter(m => m.kind === 'needle' && !m.done);
    if (!left.length) return;
    S.magnets--; SAVE.write();
    const m = XG.pick(left), a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 50;
    const n = rake(m.cx + Math.cos(a) * d, m.cy + Math.sin(a) * d, 75, 99999);
    XG.audio.sfx('whoosh'); msg(`🧲 磁铁有了反应，吹开了 ${n} 根稻草——针就在附近！`); refreshUI();
  }
  $('bRadius').onclick = () => buy('radius'); $('bPower').onclick = () => buy('power');
  $('bDetector').onclick = () => buy('detector'); $('bMagnet').onclick = () => buy('magnet'); $('bUseMagnet').onclick = useMagnet;

  function setBtn(b, t, dis) { if (b.textContent !== t) b.textContent = t; if (b.disabled !== dis) b.disabled = dis; }
  function refreshUI() {
    const L = LEVELS[st.level];
    $('lvl').textContent = st.level + 1;
    $('found').textContent = `${st.found}/${L.needles}`;
    $('coins').textContent = S.coins; $('mag').textContent = S.magnets;
    setBtn($('bRadius'), S.up.radius >= 6 ? '🧹 耙子已满级' : `🧹 加宽耙子 Lv${S.up.radius + 1} · ${cost.radius()}🪙`, S.up.radius >= 6 || S.coins < cost.radius());
    setBtn($('bPower'), S.up.power >= 6 ? '💪 力气已满级' : `💪 增加力气 Lv${S.up.power + 1} · ${cost.power()}🪙`, S.up.power >= 6 || S.coins < cost.power());
    setBtn($('bDetector'), S.up.detector >= 2 ? '📡 探测器已满级' : `📡 金属探测器 Lv${S.up.detector + 1} · ${cost.detector()}🪙`, S.up.detector >= 2 || S.coins < cost.detector());
    setBtn($('bMagnet'), `🧲 买磁铁 · ${cost.magnet()}🪙`, S.coins < cost.magnet());
    setBtn($('bUseMagnet'), `🧲 使用磁铁（剩 ${S.magnets}）`, S.magnets <= 0 || !st.running);
    $('detWrap').style.display = S.up.detector > 0 ? 'block' : 'none';
  }
  function msg(t) { $('msg').textContent = t; }

  // ---------- 输入 ----------
  let downAt = null;
  cv.addEventListener('pointerdown', e => {
    if (!st.running || G.paused) return;
    const p = XG.canvasPos(cv, e); st.mouse.x = p.x; st.mouse.y = p.y; st.mouse.down = true; downAt = p; st.dragDist = 0;
    try { cv.setPointerCapture(e.pointerId); } catch (_) { /* 合成事件可能没有可捕获的指针 */ }
  });
  cv.addEventListener('pointermove', e => {
    const p = XG.canvasPos(cv, e);
    if (st.mouse.down) st.dragDist += Math.hypot(p.x - st.mouse.x, p.y - st.mouse.y);
    st.mouse.x = p.x; st.mouse.y = p.y;
  });
  const up = e => {
    if (!st.mouse.down) return;
    st.mouse.down = false;
    if (!st.running || G.paused || !downAt) return;
    if (st.dragDist < 8) tryPick(downAt.x, downAt.y);
    downAt = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { st.mouse.down = false; });
  window.addEventListener('keydown', e => { if (e.code === 'KeyG' && G.state === 'play') useMagnet(); });

  function tryPick(x, y) {
    let best = null, bd = 12;
    for (const m of metals) { if (m.done) continue; const d = segDist(x, y, m.x, m.y, m.x2, m.y2); if (d < bd) { bd = d; best = m; } }
    if (!best) return;
    const cc = coverCount(best);
    if (cc > 1) { XG.audio.sfx('tick'); msg(`摸到了硬东西……但上面还压着 ${cc} 根稻草，再拨一拨！`); return; }
    best.done = true; st.dirty = true;
    for (let k = 0; k < 14; k++) st.sparkles.push({ x: best.cx, y: best.cy, vx: (Math.random() - .5) * 160, vy: (Math.random() - .5) * 160, life: 0.8 });
    if (best.kind === 'nail') {
      st.penalty += 10; XG.audio.sfx('error'); msg('🔩 这是一颗生锈的钉子！扎到手，时间 +10 秒。'); return;
    }
    st.found++; XG.audio.sfx('levelup');
    const L = LEVELS[st.level];
    if (st.found >= L.needles) win(); else msg(`🪡 找到第 ${st.found} 根针！还剩 ${L.needles - st.found} 根。`);
    refreshUI();
  }

  function starsFor(li, t) { const L = LEVELS[li]; return t <= L.limit * 0.4 ? 3 : t <= L.limit * 0.7 ? 2 : 1; }
  function win() {
    st.running = false;
    const li = st.level, t = st.t + st.penalty, stars = starsFor(li, t);
    const bonus = 10 + li * 4 + stars * 5;
    S.coins += bonus;
    const key = 'L' + li;
    const newBest = !S.best[key] || t < S.best[key];
    if (newBest) S.best[key] = +t.toFixed(1);
    S.stars[key] = Math.max(S.stars[key] || 0, stars);
    S.unlocked = Math.max(S.unlocked, Math.min(LEVELS.length, li + 2));
    SAVE.write(); refreshUI();
    const last = li >= LEVELS.length - 1;
    G.end({
      win: true, title: last ? '🏆 传说中的草垛也被你征服了！' : `🪡 第 ${li + 1} 堆完成！`,
      sub: `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}${newBest ? ' · 新纪录！' : ''}`,
      stats: [['用时（含罚时）', t.toFixed(1) + ' 秒'], ['最佳', S.best[key] + ' 秒'], ['奖励金币', '+' + bonus], ['累计拨开稻草', S.totalStraws.toLocaleString()]],
      buttons: [
        ...(last ? [] : [{ label: '▶ 下一堆', primary: true, id: 'xgNext', onClick: () => G.start(li + 1) }]),
        { label: '🔁 再玩一次', primary: last, id: 'xgAgain', onClick: () => G.start(li) },
        { label: '🏠 菜单', onClick: () => G.menu() },
      ],
    });
  }
  function lose() {
    st.running = false;
    const li = st.level;
    G.end({ win: false, title: '⌛ 时间到！', sub: `还差 ${LEVELS[li].needles - st.found} 根针没找到。买点工具再来？`, stats: [['已找到', `${st.found}/${LEVELS[li].needles}`], ['金币', S.coins]],
      buttons: [{ label: '🔁 重试', primary: true, id: 'xgAgain', onClick: () => G.start(li) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
    SAVE.write();
  }

  // ---------- 主循环 ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (st.running && !G.paused) {
      st.t += dt;
      const L = LEVELS[st.level];
      if (st.mouse.down && st.dragDist >= 8) rake(st.mouse.x, st.mouse.y, radius(), power());
      if (L.wind) { st.windT += dt; if (st.windT > 14 - L.wind * 3) { st.windT = 0; windGust(); } }
      if (st.t + st.penalty >= L.limit) lose();
      // 探测器：越近蜂鸣越快
      if (S.up.detector > 0) {
        let d = 1e9; for (const m of metals) if (!m.done) d = Math.min(d, Math.hypot(st.mouse.x - m.cx, st.mouse.y - m.cy));
        const range = S.up.detector === 1 ? 380 : 260;
        let v = Math.max(0, 1 - d / range); if (S.up.detector === 1) v = Math.round(v * 4) / 4;
        $('meterFill').style.width = (v * 100).toFixed(0) + '%';
        st.beepT -= dt;
        if (v > 0.05 && st.beepT <= 0) { XG.audio.sfx('tick'); st.beepT = 0.9 - v * 0.8; }
      }
    }
    if (st.dirty && N) { redraw(); refreshUI(); }
    if (N) ctx.drawImage(off, 0, 0);
    // 闪光提示：已基本露出的针
    if (st.running) for (const m of metals) if (!m.done && m.kind === 'needle' && (now % 1400) < 260 && coverCount(m) <= 2) {
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(m.cx, m.cy, 3 + Math.random() * 3, 0, Math.PI * 2); ctx.fill();
    }
    for (const p of st.sparkles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; ctx.fillStyle = `rgba(255,240,180,${Math.max(0, p.life)})`; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
    st.sparkles = st.sparkles.filter(p => p.life > 0);
    if (st.running) {
      ctx.strokeStyle = st.mouse.down ? 'rgba(255,220,120,.95)' : 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(st.mouse.x, st.mouse.y, radius(), 0, Math.PI * 2); ctx.stroke();
      const L = LEVELS[st.level], left = L.limit - st.t - st.penalty;
      $('time').textContent = XG.fmtTime(left); $('time').style.color = left < 20 ? '#ff6b6b' : '';
    }
    requestAnimationFrame(frame);
  }

  // ---------- 外壳 ----------
  const G = XG.game({
    id: '01-haystack-needle', title: '🪡 草堆寻针', subtitle: '10 个越来越大的草堆，拨开稻草找出所有的针。小心生锈的钉子和吹回稻草的风！',
    cover: '../../assets/01-haystack-needle/cover.webp', music: 'calm', save: SAVE,
    tutorial: [
      { title: '拨开稻草', text: '在草堆上<b>按住并拖动</b>，光标圈内最上层的稻草会被拨走。拨开的稻草会自动换成 🪙 金币。', touch: '手指按住草堆拖动即可。' },
      { title: '找到针', text: '看到银色的针以后，<b>单击它</b>（不要拖动）。针上最多只能压着 1 根稻草才算拿到。露出来的针会偶尔闪光。', touch: '轻点针的位置。' },
      { title: '小心钉子', text: '从第 2 堆开始会出现<b>生锈的钉子</b>（褐色、带圆头）。点错会被扎手，罚时 10 秒。', touch: '' },
      { title: '工具与时间', text: '每堆都有时间限制，越快完成星星越多。金币可以买更宽的耙子、更大力气、金属探测器（越靠近金属蜂鸣越快）和磁铁（快捷键 G）。工具升级会永久保存。', touch: '工具按钮在画面下方。' },
    ],
    onStart: li => { buildLevel(li == null ? Math.min(S.unlocked - 1, LEVELS.length - 1) : li); },
    onRestart: () => buildLevel(st.level),
    onQuit: () => { st.running = false; },
    onMenu: () => menu(),
    pauseInfo: () => `第 ${st.level + 1} 堆 · 已找到 ${st.found}/${LEVELS[st.level].needles}`,
  });
  function menu() {
    const totalStars = Object.values(S.stars).reduce((a, b) => a + b, 0);
    G.menu(`<div class="xg-stats"><span>已解锁</span><b>${S.unlocked} / ${LEVELS.length}</b><span>星星</span><b>${totalStars} / ${LEVELS.length * 3}</b><span>金币</span><b>${S.coins}</b><span>累计拨开稻草</span><b>${S.totalStraws.toLocaleString()}</b></div>`, [
      { label: S.unlocked > 1 ? `▶ 继续：第 ${Math.min(S.unlocked, LEVELS.length)} 堆` : '▶ 开始游戏', primary: true, id: 'xgStart', onClick: () => G.start(Math.min(S.unlocked, LEVELS.length) - 1) },
      { label: '🗺 选择关卡', id: 'xgLevels', onClick: () => G.levelSelect(LEVELS.map((L, i) => ({ name: `${i + 1}. ${L.name}`, sub: `${L.needles} 针 · ${L.limit}s`, locked: i >= S.unlocked, stars: S.stars['L' + i] || 0 })), i => G.start(i)) },
      { label: '📖 教程', onClick: () => G.tutorial(menu) },
      { label: '🗑 清空存档', onClick: () => { if (confirm('确定清空草堆寻针的全部存档？')) { SAVE.reset(); menu(); } } },
    ]);
  }
  XG.fit(cv, { reserve: () => XG.landscape() ? { w: $('side').offsetWidth + 24, h: $('hud').offsetHeight + 16 } : { w: 0, h: $('hud').offsetHeight + 230 } });
  buildLevel(0); st.running = false;
  menu(); refreshUI();
  requestAnimationFrame(frame);
  window.__demo = { st, S, metals: () => metals, coverCount, rake, tryPick, win, lose, G, LEVELS };
})();
