// 口袋排球 Pocket Volley — 6 位 CPU 的沙滩巡回赛 + 本地双人对战 + 触屏分屏按键
// 趋势参考：2026 年 10 月 Next Fest 峰值榜上的街机排球 demo（原创实现）
(() => {
  'use strict';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const GROUND = 420, NET_X = W / 2, NET_TOP = 290, NET_W = 10;
  const GRAV = 1100, BG = GRAV * 0.62, BR = 14, PR = 30;
  const OPP = [
    { name: '沙滩新手·小鸭', color: '#ffd23d', speed: 210, react: 0.3, noise: 40, jump: 0.45, spike: 0.005, miss: 0.32 },
    { name: '海鸥队长', color: '#e8e8e8', speed: 230, react: 0.25, noise: 30, jump: 0.6, spike: 0.012, miss: 0.22 },
    { name: '椰子哥', color: '#8a5a2b', speed: 250, react: 0.2, noise: 22, jump: 0.72, spike: 0.022, miss: 0.14 },
    { name: '冲浪女王', color: '#ff6fb5', speed: 270, react: 0.15, noise: 15, jump: 0.82, spike: 0.035, miss: 0.06 },
    { name: '灯塔守护者', color: '#c0392b', speed: 285, react: 0.11, noise: 10, jump: 0.9, spike: 0.05, miss: 0.03 },
    { name: '传说·沙滩之王', color: '#7c5cff', speed: 300, react: 0.07, noise: 6, jump: 0.96, spike: 0.07, miss: 0.008 },
  ];
  const SAVE = XG.save('07-pocket-volley', { tutorialSeen: false, unlocked: 1, wins: {}, totalWins: 0, totalLosses: 0, pvp: 0, longestRally: 0 });
  const SV = SAVE.data;

  const mk = (x, color, name) => ({ x, y: GROUND, vx: 0, vy: 0, color, name, onGround: true, spikeCD: 0, touching: false, ai: null });
  let M = null; // 当前比赛
  const beachImg = XG.img('../../assets/07-pocket-volley/beach.webp');
  const ball = { x: 200, y: 150, vx: 0, vy: 0, spin: 0, trail: [] };

  function startMatch(mode, oi) {
    const o = OPP[oi || 0];
    M = { mode, oi: oi || 0, score: [0, 0], touches: [0, 0], side: 0, pause: 1, over: false, msg: '', msgT: 0, rally: 0, longest: 0, t: 0,
      L: mk(200, '#ff8a3d', mode === 'pvp' ? 'P1' : '你'), R: mk(W - 200, mode === 'pvp' ? '#3dc7ff' : o.color, mode === 'pvp' ? 'P2' : o.name) };
    if (mode !== 'pvp') M.R.ai = { prm: o, seenT: 0, target: W * 0.75, jumpDecided: null };
    serve(0); setupTouch();
    flash(mode === 'pvp' ? '双人对战开始！' : `对手：${o.name}`);
  }
  function flash(m) { M.msg = m; M.msgT = 1.8; }
  function serve(who) {
    M.touches = [0, 0]; M.pause = 0.9; M.rally = 0;
    const { L, R } = M; L.x = 200; R.x = W - 200; L.y = R.y = GROUND; L.vx = R.vx = L.vy = R.vy = 0;
    ball.x = who === 0 ? 200 : W - 200; ball.y = 140; ball.vx = 0; ball.vy = 0; ball.trail = [];
    M.side = who; if (M.R.ai) M.R.ai.seenT = 0; M.lastEvt = M.t;
  }
  function point(winner, why) {
    M.score[winner]++; M.longest = Math.max(M.longest, M.rally);
    XG.audio.sfx('whistle');
    flash(`${winner === 0 ? M.L.name : M.R.name} 得分！${why}`);
    const [a, b] = M.score, hi = Math.max(a, b), lo = Math.min(a, b);
    if ((hi >= 7 && hi - lo >= 2) || hi >= 11) return finish(a > b);
    serve(winner);
  }
  function predictLandingX() {
    let x = ball.x, y = ball.y, vx = ball.vx, vy = ball.vy;
    for (let i = 0; i < 240; i++) {
      const dt = 1 / 60; vy += BG * dt; x += vx * dt; y += vy * dt;
      if (x < BR) { x = BR; vx = -vx; } if (x > W - BR) { x = W - BR; vx = -vx; }
      if (y > GROUND - PR - 30) return x;
    }
    return x;
  }
  function trySpike(p) {
    if (p.onGround || p.spikeCD > 0 || M.rally === 0) return; // 发球的第一下不能扣
    const cy = p.y - PR;
    if (Math.hypot(ball.x - p.x, ball.y - cy) < PR + BR + 40 && ball.y < cy + 10) {
      const dir = p === M.L ? 1 : -1;
      const close = 1 - XG.clamp(Math.abs(p.x - NET_X) / 300, 0, 1); // 离网越近扣得越狠
      ball.vx = dir * (360 + 230 * close); ball.vy = 250 + 130 * close; p.spikeCD = 0.6; ball.spin = dir * 20; p.touchCD = 0.18;
      registerTouch(p === M.L ? 0 : 1); XG.audio.sfx('spike'); flash('💥 扣球！'); M.lastEvt = M.t;
    }
  }
  function move(p, minX, maxX, dt) {
    p.vy += GRAV * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.y >= GROUND) { p.y = GROUND; p.vy = 0; p.onGround = true; }
    p.x = XG.clamp(p.x, minX + PR, maxX - PR);
    if (p.spikeCD > 0) p.spikeCD -= dt; if (p.touchCD > 0) p.touchCD -= dt;
  }
  function human(p, k, minX, maxX, dt) {
    const sp = 330;
    p.vx = (XG.keys.has(k.right) ? sp : 0) - (XG.keys.has(k.left) ? sp : 0);
    if (XG.keys.has(k.jump) && p.onGround) { p.vy = -560; p.onGround = false; XG.audio.sfx('jump'); }
    if (XG.keys.has(k.spike)) trySpike(p);
    move(p, minX, maxX, dt);
  }
  // 通用 AI：side=1 守右半场，side=0 守左半场（自测/平衡模拟时也可以让 AI 控制左边）
  function ai(p, side, dt) {
    const A = p.ai, prm = A.prm;
    const own = side === 1 ? x => x > NET_X : x => x < NET_X;
    if (M.t - M.lastEvt >= prm.react && A.seenT !== M.lastEvt) {
      A.seenT = M.lastEvt; const lx = predictLandingX();
      const off = XG.clamp(Math.abs(lx - NET_X) * 0.09 + 10, 10, 30); // 离网越远，站得越靠后，把球往前顶
      A.target = own(lx) || own(ball.x) ? lx + (side === 1 ? off : -off) + (Math.random() - 0.5) * 2 * prm.noise : (side === 1 ? W * 0.72 : W * 0.28);
      if (prm.miss && Math.random() < prm.miss) A.target += (Math.random() < 0.5 ? -1 : 1) * (80 + Math.random() * 70); // 判断失误
      A.jumpDecided = null;
    }
    const d = A.target - p.x;
    p.vx = XG.clamp(d * 9, -prm.speed, prm.speed); // 接近目标时减速，避免来回抖动
    const cy = p.y - PR;
    if (p.onGround && own(ball.x) && Math.abs(ball.x - p.x) < 50 && ball.y < cy - 50 && ball.y > cy - 130 && ball.vy > 60) {
      if (A.jumpDecided === null) A.jumpDecided = Math.random() < prm.jump;
      if (A.jumpDecided) { p.vy = -540; p.onGround = false; A.jumpDecided = false; }
    }
    if (!p.onGround && Math.abs(p.x - NET_X) < 170 && ball.y < NET_TOP - 10 && Math.random() < prm.spike * 3) trySpike(p);
    move(p, side === 1 ? NET_X + NET_W / 2 : 0, side === 1 ? W : NET_X - NET_W / 2, dt);
  }
  function registerTouch(side) {
    if (M.side !== side) { M.side = side; M.touches = [0, 0]; }
    M.touches[side]++; M.rally++;
    if (M.touches[side] > 3) point(1 - side, '（对方超过 3 次触球）');
  }
  function collide(p) {
    const cx = p.x, cy = p.y - PR, dx = ball.x - cx, dy = ball.y - cy, d = Math.hypot(dx, dy);
    if (d < PR + BR && d > 0) {
      const nx = dx / d, ny = dy / d;
      ball.x = cx + nx * (PR + BR + 0.5); ball.y = cy + ny * (PR + BR + 0.5);
      const rvx = ball.vx - p.vx, rvy = ball.vy - p.vy, dot = rvx * nx + rvy * ny;
      if (dot < 0) { ball.vx -= 1.9 * dot * nx; ball.vy -= 1.9 * dot * ny; }
      ball.vx += p.vx * 0.3 + (p === M.L ? 1 : -1) * 90; ball.vy += Math.min(0, p.vy) * 0.3; // 轻微助推：顶向对方场地
      const s = Math.hypot(ball.vx, ball.vy);
      if (s < 520) { ball.vx = ball.vx / s * 520; ball.vy = ball.vy / s * 520; }
      if (s > 900) { ball.vx = ball.vx / s * 900; ball.vy = ball.vy / s * 900; }
      ball.spin = ball.vx / 40;
      if (!p.touching && !(p.touchCD > 0)) { registerTouch(p === M.L ? 0 : 1); XG.audio.sfx('bounce'); M.lastEvt = M.t; p.touchCD = 0.18; }
      p.touching = true;
    } else p.touching = false;
  }
  const K1 = { left: 'KeyA', right: 'KeyD', jump: 'KeyW', spike: 'KeyS' }, K2 = { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', spike: 'ArrowDown' };
  function update(dt) {
    if (!M || M.over || G.paused) return;
    M.t += dt; if (M.msgT > 0) M.msgT -= dt;
    if (M.L.ai) ai(M.L, 0, dt); else human(M.L, M.mode === 'pvp' ? K1 : { left: XG.keys.has('ArrowLeft') ? 'ArrowLeft' : 'KeyA', right: XG.keys.has('ArrowRight') ? 'ArrowRight' : 'KeyD', jump: XG.keys.has('ArrowUp') || XG.keys.has('Space') ? (XG.keys.has('Space') ? 'Space' : 'ArrowUp') : 'KeyW', spike: XG.keys.has('ArrowDown') ? 'ArrowDown' : 'KeyS' }, 0, NET_X - NET_W / 2, dt);
    if (M.R.ai) ai(M.R, 1, dt); else human(M.R, K2, NET_X + NET_W / 2, W, dt);
    if (M.pause > 0) { M.pause -= dt; return; }
    ball.vy += BG * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.spin *= 0.99;
    ball.trail.push([ball.x, ball.y]); if (ball.trail.length > 10) ball.trail.shift();
    if (ball.x < BR) { ball.x = BR; ball.vx = Math.abs(ball.vx); }
    if (ball.x > W - BR) { ball.x = W - BR; ball.vx = -Math.abs(ball.vx); }
    if (ball.y < BR) { ball.y = BR; ball.vy = Math.abs(ball.vy); }
    if (ball.x > NET_X - NET_W / 2 - BR && ball.x < NET_X + NET_W / 2 + BR && ball.y > NET_TOP - BR) {
      if (ball.y < NET_TOP && Math.abs(ball.x - NET_X) < NET_W / 2 + 2) { ball.y = NET_TOP - BR; ball.vy = -Math.abs(ball.vy) * 0.7; }
      else if (ball.x < NET_X) { ball.x = NET_X - NET_W / 2 - BR; ball.vx = -Math.abs(ball.vx) * 0.8; }
      else { ball.x = NET_X + NET_W / 2 + BR; ball.vx = Math.abs(ball.vx) * 0.8; }
      M.lastEvt = M.t;
    }
    const cur = ball.x < NET_X ? 0 : 1;
    if (cur !== M.side) { M.touches = [0, 0]; M.side = cur; M.lastEvt = M.t; }
    collide(M.L); collide(M.R);
    if (ball.y > GROUND - BR) { XG.audio.sfx('thud'); point(ball.x < NET_X ? 1 : 0, ''); }
  }

  function finish(leftWon) {
    M.over = true; M.longest = Math.max(M.longest, M.rally);
    SV.longestRally = Math.max(SV.longestRally, M.longest);
    if (M.mode === 'pvp') {
      SV.pvp++; SAVE.write();
      G.end({ win: true, title: `🏆 ${leftWon ? 'P1' : 'P2'} 获胜！`, sub: `比分 ${M.score[0]} : ${M.score[1]}`, stats: [['最长回合', M.longest + ' 次触球']],
        buttons: [{ label: '🔁 再来一局', primary: true, id: 'xgAgain', onClick: () => G.start({ mode: 'pvp' }) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
      return;
    }
    const oi = M.oi;
    if (leftWon) { SV.totalWins++; SV.wins['o' + oi] = (SV.wins['o' + oi] || 0) + 1; SV.unlocked = Math.max(SV.unlocked, Math.min(OPP.length, oi + 2)); } else SV.totalLosses++;
    SAVE.write();
    const last = oi === OPP.length - 1;
    G.end({ win: leftWon, title: leftWon ? (last ? '🏆 你就是新的沙滩之王！' : `🏐 击败了${OPP[oi].name}！`) : `😵 输给了${OPP[oi].name}`, sub: `比分 ${M.score[0]} : ${M.score[1]}`,
      stats: [['最长回合', M.longest + ' 次触球'], ['巡回赛进度', `${SV.unlocked} / ${OPP.length}`], ['总战绩', `${SV.totalWins} 胜 ${SV.totalLosses} 负`]],
      buttons: [...(leftWon && !last ? [{ label: '▶ 下一位对手', primary: true, id: 'xgNext', onClick: () => G.start({ mode: 'cpu', oi: oi + 1 }) }] : []), { label: leftWon ? '🔁 再打一场' : '🔁 再挑战', primary: !leftWon || last, id: 'xgAgain', onClick: () => G.start({ mode: 'cpu', oi }) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
  }

  // ---------- 绘制 ----------
  function drawPlayer(p, faceRight) {
    ctx.fillStyle = '#0003'; ctx.beginPath(); ctx.ellipse(p.x, GROUND + 6, PR * Math.max(0.5, 1 - (GROUND - p.y) / 300), 6, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createLinearGradient(p.x, p.y - PR * 2, p.x, p.y); g.addColorStop(0, p.color); g.addColorStop(1, '#00000055');
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y - PR, PR, Math.PI, 0); ctx.lineTo(p.x + PR, p.y); ctx.lineTo(p.x - PR, p.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = g; ctx.fill();
    const ex = p.x + (faceRight ? 12 : -12), ey = p.y - PR - 8;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000'; const a = Math.atan2(ball.y - ey, ball.x - ex);
    ctx.beginPath(); ctx.arc(ex + Math.cos(a) * 3, ey + Math.sin(a) * 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(p.name, p.x, p.y - PR * 2 - 8);
  }
  function draw() {
    const tt = performance.now() / 1000;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ff9a5a'); g.addColorStop(0.55, '#ffd9a0'); g.addColorStop(1, '#ffe8c0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (XG.ready(beachImg)) { ctx.drawImage(beachImg, 0, -40, W, W * beachImg.naturalHeight / beachImg.naturalWidth); ctx.fillStyle = 'rgba(232,194,122,.85)'; ctx.fillRect(0, GROUND, W, H - GROUND); }
    else {
    ctx.fillStyle = '#fff1c4'; ctx.beginPath(); ctx.arc(700, 110, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3fa7d6'; ctx.fillRect(0, 300, W, 60);
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) { const x = (i * 83 + tt * 20) % W; ctx.beginPath(); ctx.moveTo(x, 320 + (i % 3) * 12); ctx.lineTo(x + 24, 320 + (i % 3) * 12); ctx.stroke(); }
    ctx.fillStyle = '#f0cf8a'; ctx.fillRect(0, 350, W, H - 350);
    ctx.fillStyle = '#e8c27a'; ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = '#d9b06a'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 53) % W, GROUND + 10 + (i * 17) % 50, 3, 2);
    }
    ctx.fillStyle = '#0002'; ctx.fillRect(NET_X + 4, NET_TOP + 4, NET_W, GROUND - NET_TOP);
    ctx.fillStyle = '#fff'; ctx.fillRect(NET_X - NET_W / 2, NET_TOP, NET_W, GROUND - NET_TOP);
    ctx.fillStyle = '#c33'; ctx.fillRect(NET_X - NET_W / 2 - 2, NET_TOP - 4, NET_W + 4, 6);
    if (!M) return;
    drawPlayer(M.L, true); drawPlayer(M.R, false);
    ball.trail.forEach(([x, y], i) => { ctx.fillStyle = `rgba(255,255,255,${i / 30})`; ctx.beginPath(); ctx.arc(x, y, BR * i / 10, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#0002'; ctx.beginPath(); ctx.ellipse(ball.x, GROUND + 4, BR * Math.max(0.3, 1 - (GROUND - ball.y) / 500), 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(ball.x, ball.y); ctx.rotate(tt * ball.spin);
    ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(0, 0, BR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2c6fd1'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, BR - 3, 0.3, 2.4); ctx.stroke();
    ctx.strokeStyle = '#f2b134'; ctx.beginPath(); ctx.arc(0, 0, BR - 3, 3.4, 5.4); ctx.stroke(); ctx.restore();
    if (ball.y < 0) { ctx.fillStyle = '#c33'; ctx.beginPath(); ctx.moveTo(ball.x, 4); ctx.lineTo(ball.x - 8, 16); ctx.lineTo(ball.x + 8, 16); ctx.fill(); }
    ctx.fillStyle = '#3a2410'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${M.score[0]}  :  ${M.score[1]}`, W / 2, 60);
    ctx.font = '13px sans-serif'; ctx.fillText(M.mode === 'pvp' ? '双人对战 · 7 分制（需领先 2 分）' : `巡回赛 ${M.oi + 1}/${OPP.length} · vs ${OPP[M.oi].name}`, W / 2, 82);
    ctx.fillText(`触球 ${M.touches[0]}/3`, W * 0.25, GROUND + 40); ctx.fillText(`触球 ${M.touches[1]}/3`, W * 0.75, GROUND + 40);
    if (M.msgT > 0) { ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#7a1d00'; ctx.fillText(M.msg, W / 2, 112); }
  }

  // ---------- 触屏 ----------
  function setupTouch() {
    if (!XG.touch.enabled) return;
    if (!XG.touch.buttons.p1L) {
      const B = (id, label, key) => XG.touch.button(id, { label, key, size: 64 });
      B('p1L', '◀', 'KeyA'); B('p1R', '▶', 'KeyD'); B('p1J', '跳', 'KeyW'); B('p1S', '扣', 'KeyS');
      B('p2L', '◀', 'ArrowLeft'); B('p2R', '▶', 'ArrowRight'); B('p2J', '跳', 'ArrowUp'); B('p2S', '扣', 'ArrowDown');
    }
    const pvp = M && M.mode === 'pvp';
    const set = (id, css) => { const e = XG.touch.buttons[id].el; e.style.left = e.style.right = e.style.top = e.style.bottom = ''; Object.assign(e.style, css); };
    if (pvp) {
      set('p1L', { left: '8px', bottom: '84px' }); set('p1R', { left: '78px', bottom: '84px' }); set('p1J', { left: '8px', bottom: '12px' }); set('p1S', { left: '78px', bottom: '12px' });
      set('p2L', { right: '78px', bottom: '84px' }); set('p2R', { right: '8px', bottom: '84px' }); set('p2J', { right: '78px', bottom: '12px' }); set('p2S', { right: '8px', bottom: '12px' });
    } else {
      set('p1L', { left: '12px', bottom: '16px' }); set('p1R', { left: '90px', bottom: '16px' }); set('p1J', { right: '90px', bottom: '16px' }); set('p1S', { right: '12px', bottom: '16px' });
    }
    ['p2L', 'p2R', 'p2J', 'p2S'].forEach(id => XG.touch.setVisible(id, pvp));
  }

  const G = XG.game({
    id: '07-pocket-volley', title: '🏐 口袋排球', subtitle: '沙滩街机排球：在巡回赛里依次击败 6 位越来越强的对手，或者和朋友本地双人对战。',
    cover: '../../assets/07-pocket-volley/cover.webp', music: 'sport', save: SAVE,
    tutorial: [
      { title: '移动与跳跃', text: '<b>A / D</b>（或 ← →）左右移动，<b>W</b>（或 ↑ / 空格）跳起来用身体顶球。球会按你身体碰到它的角度弹出去。', touch: '左下 ◀ ▶ 移动，右下「跳」。' },
      { title: '扣球', text: '在空中靠近球时按 <b>S</b>（或 ↓）扣球，球会高速砸向对面场地。', touch: '右下「扣」。' },
      { title: '规则', text: '每边最多触球 3 次，球落地对方得分。<b>先到 7 分且领先 2 分</b>获胜（11 分封顶）。', touch: '' },
      { title: '双人对战', text: '菜单里选「本地双人」：P1 用 WASD，P2 用方向键。', touch: '双人时左右下角各有一组按钮（◀ ▶ 跳 扣）。' },
    ],
    onStart: opt => startMatch(opt && opt.mode === 'pvp' ? 'pvp' : 'cpu', opt && opt.oi != null ? opt.oi : Math.min(SV.unlocked, OPP.length) - 1),
    onRestart: () => startMatch(M.mode, M.oi),
    onQuit: () => { if (M) M.over = true; },
    onMenu: () => menu(),
    pauseInfo: () => M ? `比分 ${M.score[0]} : ${M.score[1]}` : '',
  });
  function menu() {
    G.menu(`<div class="xg-stats"><span>巡回赛进度</span><b>${SV.unlocked} / ${OPP.length}</b><span>总战绩</span><b>${SV.totalWins} 胜 ${SV.totalLosses} 负</b><span>最长回合</span><b>${SV.longestRally} 次触球</b></div>`, [
      { label: `▶ 巡回赛：${OPP[Math.min(SV.unlocked, OPP.length) - 1].name}`, primary: true, id: 'xgStart', onClick: () => G.start({ mode: 'cpu', oi: Math.min(SV.unlocked, OPP.length) - 1 }) },
      { label: '🗺 选择对手', id: 'xgLevels', onClick: () => G.levelSelect(OPP.map((o, i) => ({ name: `${i + 1}. ${o.name}`, sub: `已胜 ${SV.wins['o' + i] || 0} 场`, locked: i >= SV.unlocked })), i => G.start({ mode: 'cpu', oi: i }), '选择对手') },
      { label: '👥 本地双人', id: 'xgPvp', onClick: () => G.start({ mode: 'pvp' }) },
      { label: '📖 教程', onClick: () => G.tutorial(menu) },
    ]);
  }
  XG.fit(cv, { reserve: () => ({ w: 0, h: 16 }) });
  menu();
  let last = performance.now();
  function loop(now) { const dt = Math.min(0.033, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__demo = { G: G, SV, get M() { return M; }, ball, OPP, startMatch, update, mkAI: prm => ({ prm, seenT: -1, target: W * 0.25, jumpDecided: null }) };
})();
