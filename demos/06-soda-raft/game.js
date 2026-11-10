// 汽水木筏 Soda Raft — 6 条河流的双人合作物理操控：左右两个汽水喷口共同驾驶一条木筏逆流而上
// 趋势参考：2026 年 10 月 Next Fest 热门的搞笑物理派对合作游戏（原创青蛙汽水主题）
(() => {
  'use strict';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const LEVELS = [
    { name: '青蛙小溪', len: 3000, current: 38, half: 300, amp: 60, rocks: 0.5, logs: 0, whirl: 0, crocs: 0, par: 30, hp: 3 },
    { name: '林间河道', len: 3800, current: 44, half: 290, amp: 70, rocks: 0.65, logs: 2, whirl: 0, crocs: 0, par: 40, hp: 3 },
    { name: '漩涡湾', len: 4300, current: 48, half: 290, amp: 80, rocks: 0.75, logs: 2, whirl: 4, crocs: 0, par: 46, hp: 3 },
    { name: '鳄鱼滩', len: 4800, current: 52, half: 280, amp: 80, rocks: 0.75, logs: 2, whirl: 2, crocs: 3, par: 54, hp: 4 },
    { name: '急流窄道', len: 5400, current: 60, half: 245, amp: 90, rocks: 0.75, logs: 3, whirl: 2, crocs: 2, par: 62, hp: 5 },
    { name: '瀑布上游', len: 6400, current: 66, half: 260, amp: 100, rocks: 0.8, logs: 4, whirl: 3, crocs: 3, par: 76, hp: 5 },
  ];
  const SAVE = XG.save('06-soda-raft', { tutorialSeen: false, unlocked: 1, stars: {}, best: {}, coins: 0 });
  const SV = SAVE.data;
  let S = null;
  const grassImg = XG.img('../../assets/06-soda-raft/grass.webp'); let grassPat = null;

  function banks(L) {
    const p1 = Math.random() * 10, p2 = Math.random() * 10;
    return {
      left: y => 450 - L.half + L.amp * Math.sin(y / 330 + p1) + 28 * Math.sin(y / 97 + p2),
      right: y => 450 + L.half + L.amp * Math.sin(y / 330 + p1 + 0.6) + 28 * Math.cos(y / 113 + p2),
    };
  }
  function startLevel(li) {
    const L = LEVELS[li], B = banks(L), FIN = -L.len;
    const rocks = [], sodas = [], coins = [], logs = [], whirls = [], crocs = [];
    for (let y = -420; y > FIN + 200; y -= (140 + Math.random() * 90) / L.rocks) {
      const l = B.left(y) + 50, r = B.right(y) - 50;
      rocks.push({ x: l + Math.random() * (r - l), y, r: 16 + Math.random() * 18 });
      if (Math.random() < 0.5) sodas.push({ x: l + Math.random() * (r - l), y: y - 60, taken: false });
      if (Math.random() < 0.7) coins.push({ x: l + Math.random() * (r - l), y: y - 30, taken: false });
    }
    // 去掉和石头重叠的道具
    const clear = o => rocks.every(k => Math.hypot(o.x - k.x, o.y - k.y) > k.r + 24);
    const sp = (n, f) => { for (let i = 0; i < n; i++) f(-700 - (i + 0.5) * (L.len - 1100) / n); };
    sp(L.logs, y => logs.push({ y, x: B.left(y) + 60, w: 150 + Math.random() * 40, vx: (Math.random() < 0.5 ? 1 : -1) * (40 + Math.random() * 35) }));
    sp(L.whirl, y => { const l = B.left(y) + 90, r = B.right(y) - 90; whirls.push({ x: l + Math.random() * (r - l), y: y + 120, r: 70 }); });
    sp(L.crocs, y => crocs.push({ y: y - 150, x: B.left(y) + 80, vx: 50 + Math.random() * 30, snap: 0 }));
    S = {
      li, L, B, FIN, rocks, sodas: sodas.filter(clear), coins: coins.filter(clear), logs, whirls, crocs,
      raft: { x: 450, y: 0, a: 0, vx: 0, vy: 0, va: 0 }, gasL: 100, gasR: 100, hp: L.hp, inv: 0, t: 0, over: false, cam: -H * 0.74, puffs: [], got: 0, fizzT: 0,
    };
    S.totalCoins = S.coins.length;
    setupTouch();
  }

  function hit(what) {
    if (S.inv > 0) return;
    S.hp--; S.inv = 1.6; XG.audio.sfx('hurt'); XG.audio.sfx('splash');
    if (S.hp <= 0) finish(false, what);
  }

  function update(dt) {
    if (!S || S.over || G.paused) return;
    const L = S.L, B = S.B, R = S.raft;
    S.t += dt;
    let jetL = XG.keys.has('KeyA') || XG.keys.has('ArrowRight') || XG.keys.has('ArrowUp') || XG.keys.has('KeyW');
    let jetR = XG.keys.has('KeyL') || XG.keys.has('ArrowLeft') || XG.keys.has('ArrowUp') || XG.keys.has('KeyW');
    if (jetL && S.gasL <= 0) jetL = false; if (jetR && S.gasR <= 0) jetR = false;
    S.gasL = XG.clamp(S.gasL + (jetL ? -20 : 18) * dt, 0, 100); S.gasR = XG.clamp(S.gasR + (jetR ? -20 : 18) * dt, 0, 100);
    S.jetL = jetL; S.jetR = jetR;
    const T = 210, TORQUE = 3.0, fx = Math.sin(R.a), fy = -Math.cos(R.a);
    let ax = 0, ay = 0;
    if (jetL) { ax += fx * T; ay += fy * T; R.va += TORQUE * dt; puff(R, -1); }
    if (jetR) { ax += fx * T; ay += fy * T; R.va -= TORQUE * dt; puff(R, 1); }
    if (jetL || jetR) { S.fizzT -= dt; if (S.fizzT <= 0) { S.fizzT = 0.09; XG.audio.noise({ dur: 0.1, vol: 0.05, filter: 'highpass', freq: 4000 }); } }
    const current = L.current + Math.min(25, -R.y / 200), cx = 25 * Math.sin(R.y / 180);
    R.vx += ax * dt; R.vy += ay * dt;
    const drag = Math.exp(-1.1 * dt);
    R.vx = cx + (R.vx - cx) * drag; R.vy = current + (R.vy - current) * drag;
    // 漩涡：吸向中心并让木筏打转
    for (const w of S.whirls) {
      const dx = w.x - R.x, dy = w.y - R.y, d = Math.hypot(dx, dy);
      if (d < w.r) { const f = (1 - d / w.r); R.vx += dx / d * 150 * f * dt; R.vy += dy / d * 150 * f * dt; R.va += 2.5 * f * dt; if (!w.warned) { w.warned = true; XG.audio.sfx('whoosh'); } }
      else w.warned = false;
    }
    R.va *= Math.exp(-2.8 * dt);
    R.x += R.vx * dt; R.y += R.vy * dt; R.a += R.va * dt;
    if (R.y > 60) { R.y = 60; R.vy = Math.min(0, R.vy); }
    const lb = B.left(R.y), rb = B.right(R.y);
    if (R.x < lb + 26) { const imp = -R.vx; R.x = lb + 26; R.vx = Math.abs(R.vx) * 0.6 + 40; if (imp > 110) hit('撞上河岸'); else XG.audio.sfxThrottled('bounce', 300); }
    if (R.x > rb - 26) { const imp = R.vx; R.x = rb - 26; R.vx = -Math.abs(R.vx) * 0.6 - 40; if (imp > 110) hit('撞上河岸'); else XG.audio.sfxThrottled('bounce', 300); }
    for (const k of S.rocks) {
      const dx = R.x - k.x, dy = R.y - k.y, d = Math.hypot(dx, dy), min = k.r + 24;
      if (d < min && d > 0) { R.x = k.x + dx / d * min; R.y = k.y + dy / d * min; const dot = R.vx * dx / d + R.vy * dy / d; if (dot < 0) { R.vx -= 1.6 * dot * dx / d; R.vy -= 1.6 * dot * dy / d; } R.va += (Math.random() - .5) * 2; if (dot < -110) hit('撞上石头'); else XG.audio.sfxThrottled('bounce', 300); }
    }
    for (const g of S.logs) {
      g.x += g.vx * dt;
      const l2 = B.left(g.y), r2 = B.right(g.y);
      if (g.x < l2 + 10) { g.x = l2 + 10; g.vx *= -1; } if (g.x + g.w > r2 - 10) { g.x = r2 - 10 - g.w; g.vx *= -1; }
      if (R.x > g.x - 20 && R.x < g.x + g.w + 20 && Math.abs(R.y - g.y) < 28) { R.vy = Math.abs(R.vy) + 80; R.y = g.y + 30; R.vx += (R.x < g.x + g.w / 2 ? -1 : 1) * 160; hit('被漂流木撞了'); }
    }
    for (const c of S.crocs) {
      c.x += c.vx * dt; c.snap += dt;
      const l2 = B.left(c.y), r2 = B.right(c.y);
      if (c.x < l2 + 30) { c.x = l2 + 30; c.vx = Math.abs(c.vx); } if (c.x > r2 - 30) { c.x = r2 - 30; c.vx = -Math.abs(c.vx); }
      if (Math.hypot(R.x - c.x, R.y - c.y) < 36) { hit('被鳄鱼咬了一口'); R.vy += 60; }
    }
    for (const b of S.sodas) if (!b.taken && Math.hypot(R.x - b.x, R.y - b.y) < 32) { b.taken = true; S.gasL = Math.min(100, S.gasL + 45); S.gasR = Math.min(100, S.gasR + 45); XG.audio.sfx('pickup'); }
    for (const c of S.coins) if (!c.taken && Math.hypot(R.x - c.x, R.y - c.y) < 30) { c.taken = true; S.got++; XG.audio.sfx('coin'); }
    if (S.inv > 0) S.inv -= dt;
    for (const p of S.puffs) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += 26 * dt; }
    S.puffs = S.puffs.filter(p => p.life > 0);
    if (R.y < S.FIN) return finish(true);
    S.cam += (R.y - H * 0.74 - S.cam) * Math.min(1, dt * 5);
  }
  function puff(R, side) {
    if (Math.random() < 0.45) return;
    const bx = R.x - Math.sin(R.a) * 30 + Math.cos(R.a) * side * 18, by = R.y + Math.cos(R.a) * 30 + Math.sin(R.a) * side * 18;
    S.puffs.push({ x: bx, y: by, vx: -Math.sin(R.a) * 60 + (Math.random() - .5) * 30, vy: Math.cos(R.a) * 60, r: 4, life: 0.6 });
  }

  function finish(win, why) {
    if (S.over) return; S.over = true;
    const li = S.li, key = 'L' + li;
    if (win) {
      const coinRate = S.totalCoins ? S.got / S.totalCoins : 1;
      const stars = 1 + (S.t <= S.L.par ? 1 : 0) + (coinRate >= 0.6 ? 1 : 0);
      SV.coins += S.got;
      const nb = !SV.best[key] || S.t < SV.best[key]; if (nb) SV.best[key] = +S.t.toFixed(1);
      SV.stars[key] = Math.max(SV.stars[key] || 0, stars); SV.unlocked = Math.max(SV.unlocked, Math.min(LEVELS.length, li + 2)); SAVE.write();
      const last = li === LEVELS.length - 1;
      G.end({ win: true, title: last ? '🏆 征服了瀑布上游！' : `🏁 ${S.L.name} 通过！`, sub: `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}${nb ? ' · 新纪录' : ''}（★ 用时 ≤ ${S.L.par}s，★ 金币 ≥ 60%）`,
        stats: [['用时', S.t.toFixed(1) + ' 秒'], ['金币', `${S.got} / ${S.totalCoins}`], ['剩余生命', S.hp], ['最佳', SV.best[key] + ' 秒']],
        buttons: [...(last ? [] : [{ label: '▶ 下一条河', primary: true, id: 'xgNext', onClick: () => G.start(li + 1) }]), { label: '🔁 再来一次', primary: last, id: 'xgAgain', onClick: () => G.start(li) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
    } else {
      SAVE.write();
      G.end({ win: false, title: '💥 木筏散架了……', sub: `最后一下：${why}。进度 ${Math.round(Math.min(1, S.raft.y / S.FIN) * 100)}%`, buttons: [{ label: '🔁 再来一次', primary: true, id: 'xgAgain', onClick: () => G.start(li) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
    }
  }

  function draw() {
    ctx.fillStyle = '#4a9a3a'; ctx.fillRect(0, 0, W, H);
    if (!S) return;
    const cam = S.cam, B = S.B;
    if (XG.ready(grassImg)) { if (!grassPat) grassPat = ctx.createPattern(grassImg, 'repeat'); ctx.save(); ctx.translate(0, -(cam % 512) - 512); ctx.fillStyle = grassPat; ctx.fillRect(0, 0, W, H + 1024); ctx.restore(); }
    // 草地纹理
    ctx.fillStyle = '#3f8a33';
    for (let i = 0; i < 40; i++) { const yy = ((i * 131 - cam * 1) % (H + 60) + H + 60) % (H + 60) - 30; ctx.fillRect((i * 97) % W, yy, 4, 10); }
    // 河道（含浅水边）
    ctx.fillStyle = '#7cc7e8'; ctx.beginPath();
    for (let sy = 0; sy <= H; sy += 10) ctx.lineTo(B.left(sy + cam) - 8, sy);
    for (let sy = H; sy >= 0; sy -= 10) ctx.lineTo(B.right(sy + cam) + 8, sy);
    ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#2272ad'); g.addColorStop(0.5, '#2d86c4'); g.addColorStop(1, '#2272ad');
    ctx.fillStyle = g; ctx.beginPath();
    for (let sy = 0; sy <= H; sy += 10) ctx.lineTo(B.left(sy + cam), sy);
    for (let sy = H; sy >= 0; sy -= 10) ctx.lineTo(B.right(sy + cam), sy);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 2;
    for (let i = 0; i < 30; i++) {
      const wy = ((i * 97 + S.t * S.L.current * 1.6) % (H + 40)) - 20, y = wy + cam, x = B.left(y) + 40 + ((i * 137) % 500);
      if (x < B.right(y) - 30) { ctx.beginPath(); ctx.moveTo(x, wy); ctx.lineTo(x + 18, wy); ctx.stroke(); }
    }
    // 芦苇
    ctx.strokeStyle = '#2f6b26'; ctx.lineWidth = 2;
    for (let i = 0; i < 24; i++) { const sy = ((i * 61 - cam) % H + H) % H, y = sy + cam; const lx = B.left(y) - 14, rx = B.right(y) + 14; ctx.beginPath(); ctx.moveTo(lx, sy); ctx.lineTo(lx - 4, sy - 14); ctx.moveTo(rx, sy); ctx.lineTo(rx + 4, sy - 14); ctx.stroke(); }
    const vis = y => y - cam > -60 && y - cam < H + 60;
    // 终点
    const fy = S.FIN - cam;
    if (fy > -40 && fy < H + 40) {
      const l = B.left(S.FIN), r = B.right(S.FIN);
      for (let i = 0; i < 20; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#111'; ctx.fillRect(l + i * (r - l) / 20, fy - 8, (r - l) / 20, 16); }
      ctx.font = '36px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🏁', W / 2, fy - 16);
    }
    ctx.textAlign = 'center';
    for (const w of S.whirls) if (vis(w.y)) {
      const y = w.y - cam;
      for (let k = 0; k < 4; k++) { ctx.strokeStyle = `rgba(255,255,255,${0.15 + k * 0.08})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w.x, y, w.r * (1 - k * 0.22), S.t * 3 + k, S.t * 3 + k + 4.2); ctx.stroke(); }
    }
    for (const k of S.rocks) if (vis(k.y)) { const y = k.y - cam; ctx.fillStyle = '#00000030'; ctx.beginPath(); ctx.ellipse(k.x + 4, y + 6, k.r, k.r * 0.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6b6f77'; ctx.beginPath(); ctx.arc(k.x, y, k.r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8b9099'; ctx.beginPath(); ctx.arc(k.x - k.r * .3, y - k.r * .3, k.r * .4, 0, Math.PI * 2); ctx.fill(); }
    for (const lg of S.logs) if (vis(lg.y)) { const y = lg.y - cam; ctx.fillStyle = '#7a4b22'; ctx.fillRect(lg.x, y - 12, lg.w, 24); ctx.fillStyle = '#5e3818'; ctx.fillRect(lg.x, y - 12, lg.w, 5); ctx.fillStyle = '#a0682f'; ctx.beginPath(); ctx.arc(lg.x + lg.w, y, 12, 0, Math.PI * 2); ctx.fill(); }
    for (const c of S.crocs) if (vis(c.y)) {
      const y = c.y - cam; ctx.save(); ctx.translate(c.x, y); if (c.vx < 0) ctx.scale(-1, 1);
      ctx.fillStyle = '#3d6b2a'; ctx.beginPath(); ctx.ellipse(0, 0, 38, 12, 0, 0, Math.PI * 2); ctx.fill();
      const open = Math.abs(Math.sin(c.snap * 3)) * 0.4;
      ctx.beginPath(); ctx.moveTo(30, -2); ctx.lineTo(56, -8 - open * 20); ctx.lineTo(56, -2); ctx.fill(); ctx.beginPath(); ctx.moveTo(30, 2); ctx.lineTo(56, 8 + open * 20); ctx.lineTo(56, 2); ctx.fill();
      ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.arc(24, -8, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.font = '22px sans-serif';
    for (const b of S.sodas) if (!b.taken && vis(b.y)) ctx.fillText('🥤', b.x, b.y - cam + 8);
    ctx.font = '20px sans-serif';
    for (const c of S.coins) if (!c.taken && vis(c.y)) ctx.fillText('🪙', c.x, c.y - cam + 7);
    for (const p of S.puffs) { ctx.fillStyle = `rgba(230,245,255,${p.life})`; ctx.beginPath(); ctx.arc(p.x, p.y - cam, p.r, 0, Math.PI * 2); ctx.fill(); }
    const R = S.raft;
    ctx.save(); ctx.translate(R.x, R.y - cam); ctx.rotate(R.a);
    if (S.inv > 0 && ((S.inv * 10) | 0) % 2) ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#00000030'; ctx.fillRect(-26, -28, 60, 66);
    ctx.fillStyle = '#9b6a3a'; ctx.fillRect(-28, -32, 56, 64);
    ctx.strokeStyle = '#6b4320'; ctx.lineWidth = 2; for (let i = -18; i <= 18; i += 12) { ctx.beginPath(); ctx.moveTo(i, -32); ctx.lineTo(i, 32); ctx.stroke(); }
    ctx.font = '24px sans-serif'; ctx.fillText('🐸', -12, 6); ctx.fillText('🐸', 12, 6);
    ctx.fillStyle = S.jetL ? '#fff' : '#cde'; ctx.fillRect(-24, 30, 10, 8); ctx.fillStyle = S.jetR ? '#fff' : '#cde'; ctx.fillRect(14, 30, 10, 8);
    ctx.restore(); ctx.globalAlpha = 1;
    // HUD
    const prog = XG.clamp(R.y / S.FIN, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(10, 10, 260, 96);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`${S.L.name}  ❤️ ${'■'.repeat(Math.max(0, S.hp))}${'□'.repeat(Math.max(0, S.L.hp - S.hp))}  ⏱ ${S.t.toFixed(1)}s`, 20, 30);
    ctx.fillText('左 汽水', 20, 52); ctx.fillText('右 汽水', 20, 72);
    ctx.fillStyle = '#333'; ctx.fillRect(84, 42, 176, 12); ctx.fillRect(84, 62, 176, 12);
    ctx.fillStyle = '#9ee6ff'; ctx.fillRect(84, 42, 1.76 * S.gasL, 12); ctx.fillRect(84, 62, 1.76 * S.gasR, 12);
    ctx.fillStyle = '#fff'; ctx.fillText(`🪙 ${S.got}/${S.totalCoins}  进度`, 20, 96);
    ctx.fillStyle = '#333'; ctx.fillRect(150, 87, 110, 8); ctx.fillStyle = '#ffd34d'; ctx.fillRect(150, 87, 110 * prog, 8);
    if (XG.touch.enabled && S.t < 6) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('按住左半屏 = 左喷口　　按住右半屏 = 右喷口', W / 2, H - 20); }
  }

  function setupTouch() {
    if (!XG.touch.enabled) return;
    if (!XG.touch.buttons.jl) {
      XG.touch.button('jl', { label: '左喷口<br>(A)', key: 'KeyA', wide: true });
      XG.touch.button('jr', { label: '右喷口<br>(L)', key: 'KeyL', wide: true });
      XG.touch.buttons.jl.el.style.background = XG.touch.buttons.jr.el.style.background = 'rgba(255,255,255,.06)';
    }
    placeTouch();
  }
  function placeTouch() {
    if (!XG.touch.buttons.jl) return;
    const r = cv.getBoundingClientRect();
    XG.touch.place('jl', { left: r.left, top: r.top + r.height * 0.25, width: r.width / 2 - 4, height: r.height * 0.75 });
    XG.touch.place('jr', { left: r.left + r.width / 2 + 4, top: r.top + r.height * 0.25, width: r.width / 2 - 4, height: r.height * 0.75 });
  }

  const G = XG.game({
    id: '06-soda-raft', title: '🥤 汽水木筏', subtitle: '两只青蛙摇晃汽水瓶当喷气引擎，驾驶一条木筏逆流而上！6 条河流，石头、漂流木、漩涡和鳄鱼越来越多。适合两人合作。',
    cover: '../../assets/06-soda-raft/cover.webp', music: 'upbeat', save: SAVE,
    tutorial: [
      { title: '两个喷口', text: '木筏左边喷口是 <b>A</b>，右边是 <b>L</b>。只喷一边会<b>转弯</b>（喷左边往右转），两边一起喷才<b>直行</b>。两个人玩时一人管一边！单人也可以用 ← → 转向、↑ 双喷。', touch: '按住屏幕左半边 = 左喷口，右半边 = 右喷口，两个拇指一起按就直行。两人玩就一人按一边。' },
      { title: '汽水量', text: '一直喷会把汽水用光，松开会慢慢回满。捡 🥤 立即补充。', touch: '' },
      { title: '危险', text: '<b>高速</b>撞上河岸或石头会掉 1 点生命（慢慢蹭只会弹开），漂流木和鳄鱼碰到就掉血，生命用完木筏就散架了。<b>漩涡</b>会把你往中心吸并让木筏打转，用力喷出来！', touch: '' },
      { title: '星级', text: '到达终点 🏁 过关得 1 星；用时低于目标再得 1 星；收集 60% 以上的 🪙 再得 1 星。', touch: '' },
    ],
    onStart: li => startLevel(li == null ? Math.min(SV.unlocked, LEVELS.length) - 1 : li),
    onRestart: () => startLevel(S.li),
    onQuit: () => { if (S) S.over = true; },
    onMenu: () => menu(),
    pauseInfo: () => S ? `${S.L.name} · 进度 ${Math.round(XG.clamp(S.raft.y / S.FIN, 0, 1) * 100)}%` : '',
  });
  function menu() {
    const totalStars = Object.values(SV.stars).reduce((a, b) => a + b, 0);
    G.menu(`<div class="xg-stats"><span>已解锁河流</span><b>${SV.unlocked} / ${LEVELS.length}</b><span>星星</span><b>${totalStars} / ${LEVELS.length * 3}</b><span>累计金币</span><b>${SV.coins}</b></div>`, [
      { label: SV.unlocked > 1 ? `▶ 继续：${LEVELS[Math.min(SV.unlocked, LEVELS.length) - 1].name}` : '▶ 开始漂流', primary: true, id: 'xgStart', onClick: () => G.start(Math.min(SV.unlocked, LEVELS.length) - 1) },
      { label: '🗺 选择河流', id: 'xgLevels', onClick: () => G.levelSelect(LEVELS.map((L, i) => ({ name: `${i + 1}. ${L.name}`, sub: `${(L.len / 100) | 0}m · 目标 ${L.par}s`, locked: i >= SV.unlocked, stars: SV.stars['L' + i] || 0 })), i => G.start(i)) },
      { label: '📖 教程', onClick: () => G.tutorial(menu) },
    ]);
  }
  XG.fit(cv, { reserve: () => ({ w: 0, h: 16 }), onResize: () => placeTouch() });
  menu();
  let last = performance.now();
  function loop(now) { const dt = Math.min(0.033, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__demo = { G, SV, get S() { return S; }, LEVELS, startLevel, update };
})();
