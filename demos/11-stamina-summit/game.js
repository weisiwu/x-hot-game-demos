// 体力登顶 Stamina Summit — 5 座山峰的体力管理攀爬：裂纹岩点、结冰岩点、阵风、苹果与安全绳
// 趋势参考：GameDiscoverCo 2026-11 提到的合作攀爬 “friendslop” 爆款类型（原创单人 2D 实现）
(() => {
  'use strict';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height, REACH = 125;
  const PEAKS = [
    { name: '晨雾小丘', height: 2000, crumbly: 0.06, ice: 0, wind: 0, gust: 99, drain: 3.2, ropes: 0, par: 90 },
    { name: '松林峭壁', height: 2800, crumbly: 0.12, ice: 0, wind: 14, gust: 11, drain: 3.6, ropes: 1, par: 130 },
    { name: '冰瀑岩', height: 3400, crumbly: 0.12, ice: 0.16, wind: 16, gust: 10, drain: 4.0, ropes: 1, par: 160 },
    { name: '风之脊', height: 4000, crumbly: 0.16, ice: 0.12, wind: 22, gust: 8, drain: 4.3, ropes: 2, par: 200 },
    { name: '云顶之巅', height: 4800, crumbly: 0.2, ice: 0.18, wind: 24, gust: 7, drain: 4.8, ropes: 2, par: 250 },
  ];
  const SAVE = XG.save('11-stamina-summit', { tutorialSeen: false, unlocked: 1, stars: {}, best: {}, meters: 0, summits: 0 });
  const SV = SAVE.data;
  const cliffImg = XG.img('../../assets/11-stamina-summit/cliff.webp');
  let S = null;

  function gen(P) {
    const TOP = -P.height, holds = [], ledges = [{ x: 450, y: 0, w: 500, base: true }];
    for (let y = -380; y > TOP + 300; y -= 360 + Math.random() * 80) ledges.push({ x: 200 + Math.random() * 500, y, w: 120 + Math.random() * 40 });
    ledges.push({ x: 450, y: TOP, w: 220, summit: true });
    for (const l of ledges) holds.push({ x: l.x, y: l.y, ledge: l, type: 'ledge' });
    let startX = 450;
    const kind = () => { const r = Math.random(); return r < P.crumbly ? 'crumbly' : r < P.crumbly + P.ice ? 'ice' : 'rock'; };
    let ropeBudget = P.ropes;
    for (let i = 0; i < ledges.length - 1; i++) {
      const a = ledges[i], b = ledges[i + 1], n = Math.max(2, Math.ceil((a.y - b.y) / 68));
      const ax = XG.clamp(b.x, a.x - a.w / 2 + 10, a.x + a.w / 2 - 10), bx = XG.clamp(a.x, b.x - b.w / 2 + 10, b.x + b.w / 2 - 10);
      if (i === 0) startX = ax;
      for (let k = 1; k < n; k++) {
        const t = k / n, y = a.y + (b.y - a.y) * t, x = XG.clamp(ax + (bx - ax) * t + (Math.random() - .5) * 30, 130, 770);
        // 主路径上不放裂纹岩点，保证总有一条路
        holds.push({ x, y, type: Math.random() < P.ice ? 'ice' : 'rock', food: Math.random() < 0.08, rope: ropeBudget > 0 && i > 0 && k === 1 && Math.random() < 0.5 ? (ropeBudget--, true) : false });
        for (let j = 0; j < 2; j++) if (Math.random() < 0.7) holds.push({ x: 120 + Math.random() * 660, y: y + (Math.random() - .5) * 40, type: kind(), food: Math.random() < 0.04 });
      }
    }
    return { holds, ledges, startX, TOP };
  }
  function start(pi) {
    const P = PEAKS[pi], g = gen(P);
    S = { pi, P, ...g, cur: g.holds[0], px: g.startX, py: 0, anim: null, st: 100, maxSt: 100, t: 0, cam: -H * 0.7, over: false, gust: P.gust, gustWarn: 0, gustFx: 0, msg: '点击高亮的岩点开始攀爬', msgT: 3, falls: 0, grabT: 0, ropes: 0, peakY: 0 };
  }
  const onLedge = () => S.cur && S.cur.type === 'ledge';
  const say = m => { S.msg = m; S.msgT = 2.4; };
  function pointOf(h, refX) { if (h.type !== 'ledge') return { x: h.x, y: h.y }; const l = h.ledge; return { x: XG.clamp(refX, l.x - l.w / 2 + 10, l.x + l.w / 2 - 10), y: l.y }; }
  function reachable(h, refX = S.px) { if (h.broken) return false; if (h === S.cur) return h.type === 'ledge'; const p = pointOf(h, refX); return Math.hypot(p.x - S.px, p.y - S.py) <= REACH; }
  function moveTo(h, refX = S.px) {
    if (!S || S.anim || S.over || G.paused || !reachable(h, refX)) return;
    const p = pointOf(h, refX), d = Math.hypot(p.x - S.px, p.y - S.py), up = Math.max(0, S.py - p.y), walking = h === S.cur;
    const cost = walking ? 0 : 3 + d * 0.04 + up * 0.05;
    S.st -= cost; S.anim = { fx: S.px, fy: S.py, tx: p.x, ty: p.y, t: 0, h };
    XG.audio.sfx(walking ? 'step' : 'jump');
  }
  function arrive(h) {
    S.cur = h; S.grabT = 0;
    if (h.type !== 'ledge') XG.audio.sfx('thud');
    if (h.food) { h.food = false; S.maxSt = Math.min(100, S.maxSt + 12); S.st = Math.min(S.maxSt, S.st + 30); XG.audio.sfx('heal'); say('🍎 补充能量！体力上限恢复'); }
    if (h.rope) { h.rope = false; S.ropes++; XG.audio.sfx('pickup'); say('🪢 捡到安全绳：下次摔落不受伤'); }
    if (h.type === 'ledge' && h.ledge.summit) return finish(true);
    if (-S.py > S.peakY) { SV.meters += Math.round((-S.py - S.peakY) / 3); S.peakY = -S.py; }
    if (S.st <= 0) fall('体力透支！');
  }
  function fall(why) {
    S.falls++;
    const below = S.ledges.filter(l => l.y >= S.py).sort((a, b) => a.y - b.y)[0] || S.ledges[0];
    const h = S.holds.find(x => x.ledge === below), dist = below.y - S.py;
    let dmg = Math.min(30, 8 + dist * 0.03);
    if (S.ropes > 0) { S.ropes--; dmg = 0; say(`🪢 安全绳拉住了你！${why}`); } else say(`${why} 摔落 ${(dist / 3).toFixed(0)} 米，体力上限 -${dmg.toFixed(0)}`);
    S.maxSt -= dmg; S.cur = h; S.px = h.x; S.py = h.y; S.st = Math.max(10, Math.min(S.st, S.maxSt)); S.anim = null;
    XG.audio.sfx('hurt');
    if (S.maxSt < 25) finish(false);
  }
  cv.addEventListener('pointerdown', e => {
    if (!S || S.over || G.paused || G.state !== 'play') return;
    const p = XG.canvasPos(cv, e), x = p.x, y = p.y + S.cam;
    let best = null, bd = XG.isTouch ? 42 : 30;
    for (const h of S.holds) { if (h.broken) continue; const d = Math.hypot(h.x - x, h.y - y) - (h.type === 'ledge' ? 20 : 0); if (d < bd && (h.type === 'ledge' || reachable(h) || d < 18)) { bd = d; best = h; } }
    if (!best) for (const l of S.ledges) if (Math.abs(y - l.y) < 18 && Math.abs(x - l.x) < l.w / 2) best = S.holds.find(h => h.ledge === l);
    if (best) { if (reachable(best, x)) moveTo(best, x); else { say('太远了，够不着'); XG.audio.sfx('error'); } }
  });

  function update(dt) {
    if (!S) return;
    if (S.msgT > 0) S.msgT -= dt;
    if (S.over || G.paused) return;
    S.t += dt; const P = S.P;
    if (S.anim) {
      const a = S.anim; a.t += dt / 0.22; const k = Math.min(1, a.t), ease = 1 - (1 - k) ** 2;
      S.px = a.fx + (a.tx - a.fx) * ease; S.py = a.fy + (a.ty - a.fy) * ease - Math.sin(k * Math.PI) * 10;
      if (k >= 1) { S.anim = null; S.px = a.tx; S.py = a.ty; arrive(a.h); }
    } else if (onLedge()) S.st = Math.min(S.maxSt, S.st + 28 * dt);
    else {
      const alt = -S.py / P.height;
      S.st -= (P.drain + alt * 2.5) * (S.cur.type === 'ice' ? 1.8 : 1) * dt;
      if (S.cur.type === 'crumbly') { S.grabT += dt; if (S.grabT > 1.2) { S.cur.broken = true; S.cur.brokenT = 6; XG.audio.sfx('crumble'); fall('岩点碎了！'); } }
      if (S.st <= 0) fall('抓不住了！');
    }
    for (const h of S.holds) if (h.broken && (h.brokenT -= dt) <= 0) h.broken = false;
    if (P.wind && -S.py / P.height > 0.25) {
      S.gust -= dt;
      S.gustWarn = S.gust < 1.6 && S.gust > 0;
      if (S.gust <= 0) {
        S.gust = P.gust + Math.random() * 4; S.gustFx = 0.6; XG.audio.sfx('wind');
        if (!onLedge() && !S.anim) { S.st -= P.wind; say('🌬️ 一阵强风！'); if (S.st <= 0) fall('被风吹落！'); }
      }
    }
    if (S.gustFx > 0) S.gustFx -= dt;
    S.cam += (S.py - H * 0.62 - S.cam) * Math.min(1, dt * 4);
  }
  function finish(win) {
    if (S.over) return; S.over = true;
    const key = 'P' + S.pi;
    if (win) {
      const stars = 1 + (S.t <= S.P.par ? 1 : 0) + (S.falls === 0 ? 1 : 0);
      const nb = !SV.best[key] || S.t < SV.best[key]; if (nb) SV.best[key] = Math.round(S.t);
      SV.stars[key] = Math.max(SV.stars[key] || 0, stars); SV.summits++; SV.unlocked = Math.max(SV.unlocked, Math.min(PEAKS.length, S.pi + 2)); SAVE.write();
      const last = S.pi === PEAKS.length - 1;
      G.end({ win: true, title: last ? '🏆 登上了云顶之巅！' : `🚩 登顶${S.P.name}！`, sub: `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}（★ 用时 ≤ ${S.P.par}s，★ 零摔落）${nb ? ' · 新纪录' : ''}`,
        stats: [['用时', XG.fmtTime(S.t)], ['摔落', S.falls + ' 次'], ['剩余体力上限', Math.round(S.maxSt)], ['累计攀爬', SV.meters + ' 米']],
        buttons: [...(last ? [] : [{ label: '▶ 下一座山', primary: true, id: 'xgNext', onClick: () => G.start(S.pi + 1) }]), { label: '🔁 再爬一次', primary: last, id: 'xgAgain', onClick: () => G.start(S.pi) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
    } else {
      SAVE.write();
      G.end({ win: false, title: '🩹 伤得太重，只能下山了……', sub: `爬到了 ${Math.round(S.peakY / 3)} / ${Math.round(S.P.height / 3)} 米。多在平台回体力，避开灰色裂纹和蓝色冰岩。`, buttons: [{ label: '🔁 再试一次', primary: true, id: 'xgAgain', onClick: () => G.start(S.pi) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
    }
  }

  function draw() {
    ctx.fillStyle = '#2b3a50'; ctx.fillRect(0, 0, W, H);
    if (!S) return;
    const cam = S.cam, alt = XG.clamp(-S.py / S.P.height, 0, 1);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `hsl(${210 - alt * 15},55%,${45 + alt * 25}%)`); g.addColorStop(1, `hsl(215,35%,${28 + alt * 15}%)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (XG.ready(cliffImg)) {
      // 视差：山崖图按攀爬进度从下往上滚动
      const ih = W * cliffImg.naturalHeight / cliffImg.naturalWidth, oy = -(ih - H) * (1 - alt);
      ctx.globalAlpha = 0.95; ctx.drawImage(cliffImg, 0, oy, W, ih); ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(30,35,45,.35)'; ctx.fillRect(90, 0, 720, H);
    } else { ctx.fillStyle = '#4a4f5a'; ctx.fillRect(90, 0, 720, H); }
    for (const l of S.ledges) {
      const y = l.y - cam; if (y < -30 || y > H + 30) continue;
      ctx.fillStyle = '#00000040'; ctx.fillRect(l.x - l.w / 2 + 4, y + 4, l.w, 14);
      ctx.fillStyle = l.summit ? '#e8f0ff' : '#7b6a4e'; ctx.fillRect(l.x - l.w / 2, y, l.w, 14);
      ctx.fillStyle = l.summit ? '#fff' : '#5ba35b'; ctx.fillRect(l.x - l.w / 2, y - 3, l.w, 4);
      ctx.textAlign = 'center';
      if (l.summit) { ctx.font = '36px sans-serif'; ctx.fillText('🚩', l.x, y - 6); }
      else if (!l.base) { ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('平台·回体力', l.x, y + 28); }
    }
    for (const h of S.holds) {
      if (h.type === 'ledge' || h.broken) continue;
      const y = h.y - cam; if (y < -20 || y > H + 20) continue;
      const can = !S.anim && h !== S.cur && reachable(h);
      ctx.fillStyle = '#0005'; ctx.beginPath(); ctx.arc(h.x + 2, y + 3, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = h.type === 'crumbly' ? '#9a9a9a' : h.type === 'ice' ? '#a8e4ff' : '#c48a4a';
      ctx.beginPath(); ctx.arc(h.x, y, 10, 0, Math.PI * 2); ctx.fill();
      if (h.type === 'crumbly') { ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(h.x - 6, y - 4); ctx.lineTo(h.x + 2, y + 1); ctx.lineTo(h.x + 6, y + 6); ctx.stroke(); }
      if (h.type === 'ice') { ctx.fillStyle = '#fff'; ctx.fillRect(h.x - 3, y - 6, 2, 5); }
      if (can) { ctx.strokeStyle = '#7dffb0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(h.x, y, 15, 0, Math.PI * 2); ctx.stroke(); }
      ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
      if (h.food) ctx.fillText('🍎', h.x + 18, y + 5);
      if (h.rope) ctx.fillText('🪢', h.x - 18, y + 5);
    }
    ctx.strokeStyle = 'rgba(125,255,176,.22)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(S.px, S.py - cam, REACH, 0, Math.PI * 2); ctx.stroke();
    ctx.font = '32px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🧗', S.px, S.py - cam + 6);
    if (S.cur && S.cur.type === 'crumbly' && !S.anim) { ctx.fillStyle = '#f55'; ctx.fillRect(S.px - 15, S.py - cam - 30, 30 * (1 - S.grabT / 1.2), 4); }
    if (S.gustWarn) { ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.fillText('🌬️ 风要来了！快到平台！', W / 2, 90); }
    if (S.gustFx > 0) { ctx.strokeStyle = `rgba(255,255,255,${S.gustFx})`; ctx.lineWidth = 2; for (let i = 0; i < 12; i++) { const yy = (i * 53) % H; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W * (1 - S.gustFx), yy + 10); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(10, 10, 340, 70);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`⛰️ ${S.P.name} ${Math.round(-S.py / 3)}/${Math.round(S.P.height / 3)} 米  ⏱ ${XG.fmtTime(S.t)}  摔 ${S.falls}  🪢${S.ropes}`, 20, 30);
    ctx.fillStyle = '#222'; ctx.fillRect(20, 42, 320, 18);
    ctx.fillStyle = '#5a1f1f'; ctx.fillRect(20 + 320 * S.maxSt / 100, 42, 320 * (1 - S.maxSt / 100), 18);
    ctx.fillStyle = S.st < 25 ? '#ff5d5d' : '#ffd84d'; ctx.fillRect(20, 42, 320 * Math.max(0, S.st) / 100, 18);
    ctx.fillStyle = '#000'; ctx.font = 'bold 11px sans-serif'; ctx.fillText(`体力 ${Math.max(0, S.st).toFixed(0)} / 上限 ${S.maxSt.toFixed(0)}`, 26, 55);
    ctx.fillStyle = '#fff'; ctx.fillRect(345, 10 + 60 * (1 - alt), 4, 60 * alt); // 高度条
    if (S.msgT > 0) { ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.font = 'bold 16px sans-serif'; const w = ctx.measureText(S.msg).width; ctx.fillRect(W / 2 - w / 2 - 10, H - 42, w + 20, 30); ctx.fillStyle = '#fff'; ctx.fillText(S.msg, W / 2, H - 21); }
  }

  const G = XG.game({
    id: '11-stamina-summit', title: '🧗 体力登顶', subtitle: '5 座越来越高的山峰。每一步都在消耗体力，挂在岩壁上也在流失，只有平台能喘口气。管理好体力，登上山顶！',
    cover: '../../assets/11-stamina-summit/cover.webp', music: 'epic', save: SAVE,
    tutorial: [
      { title: '攀爬', text: '<b>点击</b>绿圈高亮（够得着）的岩点移动过去；点平台可以在平台上走动。越远、越往上的移动越耗体力。', touch: '用手指点岩点即可。' },
      { title: '体力', text: '挂在岩点上体力会持续流失，越高流失越快；只有站在<b>平台</b>上才能回体力。体力耗尽会摔到下方平台并受伤，<b>体力上限</b>降低。上限低于 25 就失败。', touch: '' },
      { title: '危险岩点', text: '灰色带裂纹的岩点抓住 1.2 秒后会碎（6 秒后重新长出）；淡蓝色的<b>冰岩</b>挂着时体力流失加倍。高处有阵风，看到提示快去平台。', touch: '' },
      { title: '道具与评星', text: '🍎 恢复体力上限，🪢 安全绳能抵消一次摔伤。登顶得 1 星，用时达标和零摔落各再得 1 星。', touch: '' },
    ],
    onStart: pi => start(pi == null ? Math.min(SV.unlocked, PEAKS.length) - 1 : pi),
    onRestart: () => start(S.pi),
    onQuit: () => { if (S) S.over = true; SAVE.write(); },
    onMenu: () => menu(),
    pauseInfo: () => S ? `${S.P.name} · 海拔 ${Math.round(-S.py / 3)} 米` : '',
  });
  function menu() {
    const stars = Object.values(SV.stars).reduce((a, b) => a + b, 0);
    G.menu(`<div class="xg-stats"><span>已解锁山峰</span><b>${SV.unlocked} / ${PEAKS.length}</b><span>星星</span><b>${stars} / ${PEAKS.length * 3}</b><span>累计攀爬</span><b>${SV.meters} 米</b></div>`, [
      { label: `▶ 出发：${PEAKS[Math.min(SV.unlocked, PEAKS.length) - 1].name}`, primary: true, id: 'xgStart', onClick: () => G.start(Math.min(SV.unlocked, PEAKS.length) - 1) },
      { label: '🗺 选择山峰', id: 'xgLevels', onClick: () => G.levelSelect(PEAKS.map((p, i) => ({ name: `${i + 1}. ${p.name}`, sub: `${Math.round(p.height / 3)} 米`, locked: i >= SV.unlocked, stars: SV.stars['P' + i] || 0 })), i => G.start(i), '选择山峰') },
      { label: '📖 教程', onClick: () => G.tutorial(menu) },
    ]);
  }
  XG.fit(cv, { reserve: () => ({ w: 0, h: 16 }) });
  menu();
  let last = performance.now();
  function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__demo = { G, SV, get S() { return S; }, moveTo, reachable, gen, PEAKS, update, start, finish };
})();
