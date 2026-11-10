// 体力登顶 — 体力管理攀爬（趋势参考：GameDiscoverCo 2026-11 提到的合作攀爬 "friendslop" 爆款类型；此为单人简化版）
(() => {
  'use strict';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const TOP = -3200, REACH = 125;
  let S;

  function gen() {
    const holds = [];
    let startX = 450;
    // 平台（休息点）
    const ledges = [{ x: 450, y: 0, w: 500, base: true }];
    for (let y = -380; y > TOP + 300; y -= 360 + Math.random() * 80) ledges.push({ x: 200 + Math.random() * 500, y, w: 120 + Math.random() * 40 });
    ledges.push({ x: 450, y: TOP, w: 220, summit: true });
    for (const l of ledges) holds.push({ x: l.x, y: l.y, ledge: l, type: 'ledge' });
    // 岩点：在相邻平台之间生成一条保证可达的主路径，再撒一些干扰岩点
    for (let i = 0; i < ledges.length - 1; i++) {
      const a = ledges[i], b = ledges[i + 1];
      const n = Math.max(2, Math.ceil((a.y - b.y) / 68));
      const ax = Math.max(a.x - a.w / 2 + 10, Math.min(a.x + a.w / 2 - 10, b.x)), bx = Math.max(b.x - b.w / 2 + 10, Math.min(b.x + b.w / 2 - 10, a.x));
      if (i === 0) startX = ax;
      for (let k = 1; k < n; k++) {
        const t = k / n, y = a.y + (b.y - a.y) * t;
        const x = Math.max(130, Math.min(770, ax + (bx - ax) * t + (Math.random() - .5) * 30));
        const hi = -y / -TOP;
        holds.push({ x, y, type: Math.random() < 0.08 + hi * 0.12 ? 'crumbly' : 'rock', food: Math.random() < 0.08 });
        for (let j = 0; j < 2; j++) if (Math.random() < 0.7) holds.push({ x: 120 + Math.random() * 660, y: y + (Math.random() - .5) * 40, type: Math.random() < 0.3 ? 'crumbly' : 'rock', food: Math.random() < 0.04 });
      }
    }
    return { holds, ledges, startX };
  }

  function reset() {
    const g = gen();
    S = {
      ...g, cur: g.holds[0], px: g.startX, py: g.holds[0].y, anim: null,
      st: 100, maxSt: 100, t: 0, cam: -H * 0.7, over: false, win: false,
      gust: 8, gustWarn: 0, gustFx: 0, msg: '点击上方岩点开始攀爬', msgT: 3, falls: 0, grabT: 0, mouse: { x: 0, y: 0 },
    };
  }
  reset();

  const onLedge = () => S.cur && S.cur.type === 'ledge';
  const say = m => { S.msg = m; S.msgT = 2.4; };

  // 平台上的目标点 = 平台线段上离参考点最近的位置
  function pointOf(h, refX) {
    if (h.type !== 'ledge') return { x: h.x, y: h.y };
    const l = h.ledge;
    return { x: Math.max(l.x - l.w / 2 + 10, Math.min(l.x + l.w / 2 - 10, refX)), y: l.y };
  }
  function reachable(h, refX = S.px) {
    if (h.broken) return false;
    if (h === S.cur) return h.type === 'ledge';
    const p = pointOf(h, refX);
    return Math.hypot(p.x - S.px, p.y - S.py) <= REACH;
  }

  function moveTo(h, refX = S.px) {
    if (S.anim || S.over || !reachable(h, refX)) return;
    const p = pointOf(h, refX);
    const d = Math.hypot(p.x - S.px, p.y - S.py);
    const up = Math.max(0, S.py - p.y);
    const walking = h === S.cur;
    const cost = walking ? 0 : 3 + d * 0.04 + up * 0.05;
    if (!walking && S.st < cost) say('体力快不够了！');
    S.st -= cost;
    S.anim = { fx: S.px, fy: S.py, tx: p.x, ty: p.y, t: 0, h };
  }

  function arrive(h) {
    S.cur = h; S.grabT = 0;
    if (h.food) { h.food = false; S.maxSt = Math.min(100, S.maxSt + 12); S.st = Math.min(S.maxSt, S.st + 30); say('🍎 补充能量！体力上限恢复'); }
    if (h.type === 'ledge' && h.ledge.summit) { S.over = true; S.win = true; }
    if (S.st <= 0) fall('体力透支！');
  }

  function fall(why) {
    S.falls++;
    const below = S.ledges.filter(l => l.y >= S.py).sort((a, b) => a.y - b.y)[0] || S.ledges[0];
    const h = S.holds.find(x => x.ledge === below);
    const dist = below.y - S.py;
    const dmg = Math.min(30, 8 + dist * 0.03);
    S.maxSt -= dmg;
    S.cur = h; S.px = h.x; S.py = h.y; S.st = Math.min(S.st, S.maxSt);
    S.st = Math.max(S.st, 10);
    say(`${why} 摔落 ${(dist / 3).toFixed(0)} 米，体力上限 -${dmg.toFixed(0)}`);
    if (S.maxSt < 25) { S.over = true; S.win = false; }
  }

  cv.addEventListener('click', e => {
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height + S.cam;
    if (S.over) { reset(); return; }
    let best = null, bd = 30;
    for (const h of S.holds) { if (h.broken) continue; const d = Math.hypot(h.x - x, h.y - y) - (h.type === 'ledge' ? 20 : 0); if (d < bd) { bd = d; best = h; } }
    // 平台可点击整段区域
    if (!best) for (const l of S.ledges) if (Math.abs(y - l.y) < 16 && Math.abs(x - l.x) < l.w / 2) best = S.holds.find(h => h.ledge === l);
    if (best) { if (reachable(best, x)) moveTo(best, x); else say('太远了，够不着'); }
  });
  cv.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); S.mouse.x = (e.clientX - r.left) * W / r.width; S.mouse.y = (e.clientY - r.top) * H / r.height; });
  addEventListener('keydown', e => { if (e.code === 'KeyR') reset(); });

  function update(dt) {
    if (S.msgT > 0) S.msgT -= dt;
    if (S.over) return;
    S.t += dt;
    if (S.anim) {
      const a = S.anim; a.t += dt / 0.22;
      const k = Math.min(1, a.t), ease = 1 - (1 - k) ** 2;
      S.px = a.fx + (a.tx - a.fx) * ease; S.py = a.fy + (a.ty - a.fy) * ease - Math.sin(k * Math.PI) * 10;
      if (k >= 1) { S.anim = null; arrive(a.h); }
    } else {
      if (onLedge()) S.st = Math.min(S.maxSt, S.st + 28 * dt);
      else {
        S.st -= (3.5 + (-S.py / -TOP) * 2.5) * dt;
        if (S.cur.type === 'crumbly') { S.grabT += dt; if (S.grabT > 1.2) { S.cur.broken = true; S.cur.brokenT = 6; fall('岩点碎了！'); } }
        if (S.st <= 0) fall('抓不住了！');
      }
    }
    // 阵风：海拔超过 1/3 后出现
    const alt = -S.py / -TOP;
    if (alt > 0.33) {
      S.gust -= dt;
      if (S.gust < 1.5 && S.gust > 0) S.gustWarn = 1;
      if (S.gust <= 0) {
        S.gust = 6 + Math.random() * 5; S.gustWarn = 0; S.gustFx = 0.6;
        if (!onLedge() && !S.anim) { S.st -= 18; say('🌬️ 一阵强风！'); if (S.st <= 0) fall('被风吹落！'); }
      }
    }
    if (S.gustFx > 0) S.gustFx -= dt;
    for (const h of S.holds) if (h.broken && (h.brokenT -= dt) <= 0) h.broken = false; // 碎掉的岩点过一会儿重新长出
    S.cam += (S.py - H * 0.62 - S.cam) * Math.min(1, dt * 4);
  }

  function draw() {
    const cam = S.cam, alt = Math.min(1, Math.max(0, -S.py / -TOP));
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `hsl(${215 - alt * 20},45%,${30 + alt * 25}%)`); g.addColorStop(1, `hsl(215,30%,${20 + alt * 15}%)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 岩壁
    ctx.fillStyle = '#4a4f5a'; ctx.fillRect(90, 0, 720, H);
    ctx.fillStyle = '#545a66';
    for (let i = 0; i < 18; i++) { const yy = ((i * 173 - cam * 0.95) % (H + 100) + H + 100) % (H + 100) - 50; ctx.fillRect(90 + (i * 211) % 680, yy, 60, 18); }
    if (alt > 0.6) { ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, 0, W, H); }
    // 平台
    for (const l of S.ledges) {
      const y = l.y - cam; if (y < -30 || y > H + 30) continue;
      ctx.fillStyle = l.summit ? '#e8f0ff' : '#7b6a4e'; ctx.fillRect(l.x - l.w / 2, y, l.w, 14);
      ctx.fillStyle = l.summit ? '#fff' : '#5ba35b'; ctx.fillRect(l.x - l.w / 2, y - 3, l.w, 4);
      if (l.summit) { ctx.font = '36px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🚩', l.x, y - 6); }
      else if (!l.base) { ctx.fillStyle = '#ffffffaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('平台·回体力', l.x, y + 28); }
    }
    // 岩点
    for (const h of S.holds) {
      if (h.type === 'ledge' || h.broken) continue;
      const y = h.y - cam; if (y < -20 || y > H + 20) continue;
      const can = !S.anim && h !== S.cur && reachable(h);
      ctx.fillStyle = h.type === 'crumbly' ? '#9a9a9a' : '#c48a4a';
      ctx.beginPath(); ctx.arc(h.x, y, 9, 0, Math.PI * 2); ctx.fill();
      if (h.type === 'crumbly') { ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(h.x - 6, y - 4); ctx.lineTo(h.x + 2, y + 1); ctx.lineTo(h.x + 6, y + 6); ctx.stroke(); }
      if (can) { ctx.strokeStyle = '#7dffb0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(h.x, y, 13, 0, Math.PI * 2); ctx.stroke(); }
      if (h.food) { ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🍎', h.x + 16, y + 5); }
    }
    // 可达范围
    ctx.strokeStyle = 'rgba(125,255,176,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(S.px, S.py - cam, REACH, 0, Math.PI * 2); ctx.stroke();
    // 玩家
    ctx.font = '30px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🧗', S.px, S.py - cam + 6);
    if (S.cur && S.cur.type === 'crumbly' && !S.anim) { ctx.fillStyle = '#f55'; ctx.fillRect(S.px - 15, S.py - cam - 28, 30 * (1 - S.grabT / 1.2), 4); }
    // 阵风
    if (S.gustWarn) { ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.fillText('🌬️ 风要来了！快到平台！', W / 2, 90); }
    if (S.gustFx > 0) { ctx.strokeStyle = `rgba(255,255,255,${S.gustFx})`; ctx.lineWidth = 2; for (let i = 0; i < 12; i++) { const yy = (i * 53) % H; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W * (1 - S.gustFx), yy + 10); ctx.stroke(); } }
    // HUD
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(10, 10, 310, 66);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`⛰️ 海拔 ${(-S.py / 3).toFixed(0)} / ${(-TOP / 3).toFixed(0)} 米   ⏱ ${S.t.toFixed(0)}s   摔落 ${S.falls}`, 20, 30);
    ctx.fillStyle = '#222'; ctx.fillRect(20, 42, 290, 16);
    ctx.fillStyle = '#5a1f1f'; ctx.fillRect(20 + 290 * S.maxSt / 100, 42, 290 * (1 - S.maxSt / 100), 16);
    ctx.fillStyle = S.st < 25 ? '#ff5d5d' : '#ffd84d'; ctx.fillRect(20, 42, 290 * Math.max(0, S.st) / 100, 16);
    ctx.fillStyle = '#000'; ctx.font = 'bold 11px sans-serif'; ctx.fillText(`体力 ${Math.max(0, S.st).toFixed(0)} / 上限 ${S.maxSt.toFixed(0)}`, 26, 54);
    if (S.msgT > 0) { ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText(S.msg, W / 2, H - 20); }
    if (S.over) {
      ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 34px sans-serif';
      ctx.fillText(S.win ? `🚩 登顶成功！用时 ${S.t.toFixed(0)} 秒` : '🩹 伤得太重，只能下山了……', W / 2, H / 2);
      ctx.font = '18px sans-serif'; ctx.fillText('点击画面或按 R 重新开始', W / 2, H / 2 + 38);
    }
  }

  let last = performance.now();
  function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__demo = { get S() { return S; }, moveTo, reachable, gen, REACH };
})();
