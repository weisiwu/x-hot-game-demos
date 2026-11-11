// 梦境漂流 Dream Drift — 伪 3D 纵深水道：乘小船穿过 8 个梦境世界，每个世界有一条专属规则
// 灵感来源：2026-11 X 上高互动的“浏览器可玩、乘船穿过 8 个梦幻世界”demo 帖（原创实现，不使用原帖素材）
(() => {
  'use strict';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height, HOR = 210, BOT = H - 40;
  const A = '../../assets/13-dream-drift/';
  const WORLDS = [
    { name: '灯湖', rule: '新手世界：收集光点，避开浮木', sky: ['#1b1440', '#ff9a5a'], water: ['#2a2560', '#121034'], len: 20, target: 22, rock: 0.25, music: 'calm' },
    { name: '糖果岸', rule: '侧风：每隔几秒会把船往一边吹', sky: ['#ff8fc7', '#ffe0f0'], water: ['#ff7fb8', '#a24a8a'], len: 22, target: 26, rock: 0.3, wind: true, music: 'cozy' },
    { name: '星海', rule: '星座：一次收完同一组光点额外 +5', sky: ['#060a24', '#2a3a8a'], water: ['#101a50', '#04061a'], len: 22, target: 45, rock: 0.3, constel: true, music: 'mystery' },
    { name: '水母林', rule: '水母会左右漂移', sky: ['#0a3a4a', '#4fd0c8'], water: ['#0f5a6a', '#05232c'], len: 24, target: 30, rock: 0.25, drift: 0.35, music: 'mystery' },
    { name: '竹雾', rule: '浓雾：远处的东西很晚才看得见', sky: ['#3a5040', '#c8d8c0'], water: ['#3c5a4c', '#1a2a22'], len: 24, target: 26, rock: 0.32, fog: true, music: 'calm' },
    { name: '齿轮城', rule: '齿轮闸门只留一个缺口；金色加速带', sky: ['#4a2a10', '#ffcc66'], water: ['#5a3a18', '#24140a'], len: 26, target: 30, rock: 0.2, gates: 0.12, music: 'retro' },
    { name: '书页海', rule: '翻页时左右操作会反转', sky: ['#5a3a2a', '#ffe8c0'], water: ['#6a5040', '#2a1a12'], len: 26, target: 34, rock: 0.35, mirror: true, music: 'night' },
    { name: '晨光', rule: '终章：所有规则混合，速度更快', sky: ['#ff8a5a', '#ffe9a8'], water: ['#3a7ac8', '#123a6a'], len: 30, target: 36, rock: 0.32, wind: true, drift: 0.3, gates: 0.07, mirror: true, fast: 1.1, music: 'epic' },
  ];
  const bg = WORLDS.map((_, i) => XG.img(`${A}w${i + 1}.webp`));
  const SAVE = XG.save('13-dream-drift', { tutorialSeen: false, unlocked: 1, stars: {}, best: {}, orbsTotal: 0 });
  const SV = SAVE.data;
  let S = null;

  function start(wi) {
    const Wd = WORLDS[wi];
    S = { wi, Wd, x: 0, vx: 0, dist: 0, t: 0, hp: 3, inv: 0, orbs: 0, spawned: 0, energy: 50, objs: [], spawnT: 0.5, windT: 4, wind: 0, mirrorT: 9, mirror: 0, over: false, fx: [], groups: {}, gid: 0, msg: Wd.rule, msgT: 3 };
    XG.audio.music(Wd.music); setupTouch();
  }
  const project = (x, z) => { const p = 1 / (1 + z * 6); return { sx: W / 2 + x * 330 * p, sy: HOR + (BOT - HOR) * p, s: p }; };
  function spawn() {
    const Wd = S.Wd, r = Math.random();
    if (Wd.gates && Math.random() < Wd.gates) { // 齿轮闸门：一排障碍只留一个缺口，缺口里放光点
      const gap = (Math.random() * 5) | 0;
      for (let k = 0; k < 5; k++) { const x = -0.8 + k * 0.4; if (k === gap) { S.objs.push({ t: 'orb', x, z: 1 }); S.spawned++; } else S.objs.push({ t: 'gear', x, z: 1 }); }
      if (Math.random() < 0.5) S.objs.push({ t: 'boost', x: -0.8 + gap * 0.4, z: 1.08 });
      return;
    }
    if (Wd.constel && r < 0.3) { // 星座：一组 4 个光点
      const g = ++S.gid, x0 = -0.6 + Math.random() * 1.2; S.groups[g] = { n: 4, got: 0 };
      for (let k = 0; k < 4; k++) { S.objs.push({ t: 'orb', x: XG.clamp(x0 + Math.sin(k * 1.3) * 0.25, -0.85, 0.85), z: 1 + k * 0.07, g }); S.spawned++; }
      return;
    }
    if (r < Wd.rock) S.objs.push({ t: Wd.drift ? 'jelly' : 'rock', x: -0.85 + Math.random() * 1.7, z: 1, vx: Wd.drift ? (Math.random() < 0.5 ? -1 : 1) * Wd.drift : 0 });
    else { const x = -0.85 + Math.random() * 1.7; S.objs.push({ t: 'orb', x, z: 1 }); S.spawned++; if (Math.random() < 0.35) { S.objs.push({ t: 'orb', x: XG.clamp(x + 0.15, -0.85, 0.85), z: 1.06 }); S.spawned++; } }
  }

  function update(dt) {
    if (!S || S.over || G.paused) return;
    const Wd = S.Wd; S.t += dt;
    let dir = 0;
    if (XG.keys.has('KeyA') || XG.keys.has('ArrowLeft')) dir--; if (XG.keys.has('KeyD') || XG.keys.has('ArrowRight')) dir++;
    if (S.mirror > 0) dir = -dir;
    const dash = (XG.keys.has('Space') || XG.keys.has('ArrowUp') || XG.keys.has('KeyW')) && S.energy > 0;
    if (dash) S.energy = Math.max(0, S.energy - 22 * dt);
    S.vx += (dir * 3.2 - S.vx * 4) * dt; S.x += (S.vx + S.wind) * dt;
    if (Math.abs(S.x) > 0.92) { S.x = Math.sign(S.x) * 0.92; S.vx *= -0.3; }
    const speed = 0.42 * (Wd.fast || 1) * (dash ? 1.7 : 1) * (S.boostT > 0 ? 1.5 : 1);
    S.dist += speed * dt; if (S.boostT > 0) S.boostT -= dt;
    // 规则：侧风 / 翻页反转
    if (Wd.wind) { S.windT -= dt; if (S.windT <= 0) { S.windT = 5 + Math.random() * 3; S.wind = (Math.random() < 0.5 ? -1 : 1) * 0.45; S.windDur = 1.6; XG.audio.sfx('wind'); say(S.wind < 0 ? '← 一阵侧风！' : '侧风！ →'); } if (S.windDur > 0) { S.windDur -= dt; if (S.windDur <= 0) S.wind = 0; } }
    if (Wd.mirror) { S.mirrorT -= dt; if (S.mirrorT <= 0) { if (S.mirror > 0) { S.mirror = 0; S.mirrorT = 7 + Math.random() * 3; say('书页翻回来了'); } else { S.mirror = 1; S.mirrorT = 4; XG.audio.sfx('card'); say('📖 翻页！左右反转'); } } }
    // 生成
    S.spawnT -= dt;
    if (S.spawnT <= 0 && S.dist < Wd.len - 1) { S.spawnT = 0.55 / (Wd.fast || 1) / (dash ? 1.4 : 1); spawn(); }
    for (const o of S.objs) {
      o.z -= speed * dt * 1.1;
      if (o.vx) { o.x += o.vx * dt; if (Math.abs(o.x) > 0.9) o.vx *= -1; }
      if (o.z < 0.04 && !o.done) {
        o.done = true;
        if (Math.abs(o.x - S.x) < (o.t === 'orb' ? 0.16 : o.t === 'boost' ? 0.2 : o.t === 'gear' ? 0.12 : 0.14)) {
          if (o.t === 'orb') {
            S.orbs++; S.energy = Math.min(100, S.energy + 6); XG.audio.sfxThrottled('pickup', 50); burst(o, '#fff6a8');
            if (o.g && S.groups[o.g] && ++S.groups[o.g].got === S.groups[o.g].n) { S.orbs += 5; say('✨ 星座完成 +5'); XG.audio.sfx('levelup'); }
          } else if (o.t === 'boost') { S.boostT = 2; XG.audio.sfx('powerup'); }
          else if (S.inv <= 0) { S.hp--; S.inv = 1.5; XG.audio.sfx('hurt'); burst(o, '#ff7a7a'); if (S.hp <= 0) return finish(false); }
        }
      }
    }
    S.objs = S.objs.filter(o => o.z > -0.05 && !o.done);
    if (S.inv > 0) S.inv -= dt;
    for (const f of S.fx) { f.life -= dt; f.x += f.vx * dt; f.y += f.vy * dt; }
    S.fx = S.fx.filter(f => f.life > 0);
    if (S.msgT > 0) S.msgT -= dt;
    if (S.dist >= Wd.len && !S.objs.some(o => o.z < 1)) finish(S.orbs >= Wd.target);
  }
  function say(m) { S.msg = m; S.msgT = 2; }
  function burst(o, c) { const p = project(o.x, 0.02); for (let i = 0; i < 10; i++) S.fx.push({ x: p.sx, y: p.sy - 20, vx: (Math.random() - .5) * 200, vy: -Math.random() * 160, life: 0.6, c }); }

  function finish(win) {
    if (S.over) return; S.over = true;
    const wi = S.wi, key = 'W' + wi, Wd = S.Wd;
    SV.orbsTotal += S.orbs;
    if (win) {
      const ratio = S.orbs / Math.max(1, S.spawned + 1);
      const stars = 1 + (ratio >= 0.6 ? 1 : 0) + (S.hp === 3 ? 1 : 0);
      const nb = !SV.best[key] || S.orbs > SV.best[key]; if (nb) SV.best[key] = S.orbs;
      SV.stars[key] = Math.max(SV.stars[key] || 0, stars); SV.unlocked = Math.max(SV.unlocked, Math.min(WORLDS.length, wi + 2)); SAVE.write();
      const last = wi === WORLDS.length - 1;
      G.end({ win: true, title: last ? '🌅 你穿过了全部 8 个梦境！' : `🌙 ${Wd.name}之梦完成`, sub: `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}（★ 收集 ≥ 60% 光点，★ 无伤）${nb ? ' · 新纪录' : ''}`,
        stats: [['光点', `${S.orbs}（目标 ${Wd.target}）`], ['剩余生命', S.hp], ['累计光点', SV.orbsTotal]],
        buttons: [...(last ? [] : [{ label: '▶ 下一个梦', primary: true, id: 'xgNext', onClick: () => G.start(wi + 1) }]), { label: '🔁 再漂一次', primary: last, id: 'xgAgain', onClick: () => G.start(wi) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
    } else {
      SAVE.write();
      G.end({ win: false, title: S.hp <= 0 ? '💥 小船撞散了，梦醒了……' : '😴 光点不够，梦醒了……', sub: `收集 ${S.orbs} / 目标 ${Wd.target}`, buttons: [{ label: '🔁 再试一次', primary: true, id: 'xgAgain', onClick: () => G.start(wi) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
    }
  }

  function draw() {
    ctx.fillStyle = '#0b0820'; ctx.fillRect(0, 0, W, H);
    if (!S) return;
    const Wd = S.Wd, img = bg[S.wi];
    if (XG.ready(img)) ctx.drawImage(img, 0, -40, W, W * img.naturalHeight / img.naturalWidth);
    else { const g = ctx.createLinearGradient(0, 0, 0, HOR); g.addColorStop(0, Wd.sky[0]); g.addColorStop(1, Wd.sky[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HOR); }
    // 水面
    const g2 = ctx.createLinearGradient(0, HOR, 0, H); g2.addColorStop(0, Wd.water[0]); g2.addColorStop(1, Wd.water[1]);
    ctx.globalAlpha = 0.92; ctx.fillStyle = g2; ctx.fillRect(0, HOR, W, H - HOR); ctx.globalAlpha = 1;
    // 透视水纹
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 14; k++) { const z = ((k / 14 - S.dist * 0.6) % 1 + 1) % 1, p = project(0, z); ctx.globalAlpha = 0.25 * p.s + 0.05; ctx.beginPath(); ctx.moveTo(W / 2 - 420 * p.s, p.sy); ctx.lineTo(W / 2 + 420 * p.s, p.sy); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // 河道边线
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
    for (const side of [-1, 1]) { const a = project(side, 1), b = project(side, 0); ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke(); }
    // 物体（远的先画）
    const objs = S.objs.slice().sort((a, b) => b.z - a.z);
    for (const o of objs) {
      if (o.z > 1.02) continue;
      const p = project(o.x, Math.max(0, o.z)); let a = 1;
      if (Wd.fog) a = XG.clamp((0.75 - o.z) / 0.3, 0, 1); else a = XG.clamp((1.02 - o.z) / 0.15, 0, 1);
      ctx.globalAlpha = a; const r = 26 * p.s;
      if (o.t === 'orb') { const gg = ctx.createRadialGradient(p.sx, p.sy - r, 1, p.sx, p.sy - r, r * 1.6); gg.addColorStop(0, '#fffbe0'); gg.addColorStop(0.4, '#ffe066'); gg.addColorStop(1, 'rgba(255,224,102,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p.sx, p.sy - r, r * 1.6, 0, Math.PI * 2); ctx.fill(); if (o.g) { ctx.strokeStyle = '#9ad8ff'; ctx.lineWidth = 2 * p.s; ctx.beginPath(); ctx.arc(p.sx, p.sy - r, r * 0.9, 0, Math.PI * 2); ctx.stroke(); } }
      else if (o.t === 'boost') { ctx.fillStyle = 'rgba(255,200,60,.7)'; ctx.beginPath(); ctx.ellipse(p.sx, p.sy, r * 2.2, r * 0.6, 0, 0, Math.PI * 2); ctx.fill(); }
      else if (o.t === 'gear') { ctx.save(); ctx.translate(p.sx, p.sy - r); ctx.rotate(S.t * 2); ctx.fillStyle = '#c9952e'; for (let k = 0; k < 8; k++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-r * 0.25, -r * 1.25, r * 0.5, r * 0.5); } ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#5a3a18'; ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      else if (o.t === 'jelly') { ctx.fillStyle = 'rgba(255,140,220,.85)'; ctx.beginPath(); ctx.arc(p.sx, p.sy - r * 1.4, r, Math.PI, 0); ctx.fill(); ctx.strokeStyle = 'rgba(255,170,230,.8)'; ctx.lineWidth = 2 * p.s; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(p.sx + k * r * 0.35, p.sy - r * 1.4); ctx.quadraticCurveTo(p.sx + k * r * 0.35 + Math.sin(S.t * 4 + k) * 5 * p.s, p.sy - r * 0.6, p.sx + k * r * 0.35, p.sy); ctx.stroke(); } }
      else { ctx.fillStyle = '#6b4a2a'; ctx.beginPath(); ctx.ellipse(p.sx, p.sy - r * 0.4, r * 1.6, r * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8a6238'; ctx.beginPath(); ctx.ellipse(p.sx - r * 0.3, p.sy - r * 0.6, r * 0.9, r * 0.3, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    // 小船
    const bp = project(S.x, 0.02), bx = bp.sx, by = bp.sy - 6;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(S.vx * 0.12);
    if (S.inv > 0 && ((S.inv * 10) | 0) % 2) ctx.globalAlpha = 0.45;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 12, 58, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6f1e4'; ctx.beginPath(); ctx.moveTo(-60, -8); ctx.lineTo(60, -8); ctx.lineTo(36, 14); ctx.lineTo(-36, 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e0d6bf'; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, -62); ctx.lineTo(30, -14); ctx.closePath(); ctx.fill();
    const lg = ctx.createRadialGradient(-26, -30, 2, -26, -30, 30); lg.addColorStop(0, '#fff3b0'); lg.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(-26, -30, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffcc4d'; ctx.fillRect(-30, -36, 8, 12);
    ctx.restore(); ctx.globalAlpha = 1;
    if (S.boostT > 0 || ((XG.keys.has('Space') || XG.keys.has('ArrowUp') || XG.keys.has('KeyW')) && S.energy > 0)) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(bx - 40 + i * 16, by + 20); ctx.lineTo(bx - 40 + i * 16, by + 40); ctx.stroke(); } }
    for (const f of S.fx) { ctx.fillStyle = f.c; ctx.globalAlpha = Math.max(0, f.life * 1.6); ctx.fillRect(f.x, f.y, 4, 4); }
    ctx.globalAlpha = 1;
    if (S.mirror > 0) { ctx.fillStyle = 'rgba(255,240,200,.08)'; ctx.fillRect(0, 0, W, H); }
    // HUD
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(10, 10, 330, 66);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`🌙 ${S.wi + 1}. ${Wd.name}   ✨ ${S.orbs} / ${Wd.target}   ${'❤️'.repeat(Math.max(0, S.hp))}`, 20, 32);
    ctx.fillStyle = '#333'; ctx.fillRect(20, 42, 150, 8); ctx.fillStyle = '#9ad8ff'; ctx.fillRect(20, 42, 150 * Math.min(1, S.dist / Wd.len), 8);
    ctx.fillStyle = '#333'; ctx.fillRect(180, 42, 150, 8); ctx.fillStyle = '#ffd34d'; ctx.fillRect(180, 42, 1.5 * S.energy, 8);
    ctx.font = '11px sans-serif'; ctx.fillStyle = '#ddd'; ctx.fillText('航程', 20, 66); ctx.fillText('梦能（冲刺）', 180, 66);
    if (S.msgT > 0) { ctx.textAlign = 'center'; ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = `rgba(255,255,255,${Math.min(1, S.msgT)})`; ctx.fillText(S.msg, W / 2, 110); }
  }

  function setupTouch() {
    if (!XG.touch.enabled) return;
    if (!XG.touch.buttons.L) {
      XG.touch.button('L', { label: '◀ 左', key: 'ArrowLeft', wide: true });
      XG.touch.button('R', { label: '右 ▶', key: 'ArrowRight', wide: true });
      XG.touch.button('D', { label: '冲刺', key: 'Space', size: 78 });
      [XG.touch.buttons.L, XG.touch.buttons.R].forEach(b => Object.assign(b.el.style, { background: 'rgba(255,255,255,.03)', borderColor: 'rgba(255,255,255,.14)', color: 'rgba(255,255,255,.45)' }));
    }
    placeTouch();
  }
  function placeTouch() {
    if (!XG.touch.buttons.L) return;
    const r = cv.getBoundingClientRect();
    XG.touch.place('L', { left: r.left, top: r.top + r.height * 0.3, width: r.width * 0.42, height: r.height * 0.7 });
    XG.touch.place('R', { left: r.left + r.width * 0.58, top: r.top + r.height * 0.3, width: r.width * 0.42, height: r.height * 0.7 });
    XG.touch.place('D', { left: r.left + r.width / 2 - 39, top: r.top + r.height - 92, width: 78, height: 78 });
  }

  const G = XG.game({
    id: '13-dream-drift', title: '🌙 梦境漂流', subtitle: '乘一只纸船穿过 8 个梦境世界：收集光点、避开障碍，每个世界都有一条怪规则。',
    cover: '../../assets/13-dream-drift/cover.webp', music: 'calm', save: SAVE,
    tutorial: [
      { title: '转向', text: '用 <b>A / D</b>（或 ← →）左右转向，让小船接住飘来的 <b>光点</b>，避开浮木、水母和齿轮。', touch: '按住屏幕左侧 / 右侧转向。' },
      { title: '冲刺', text: '按住 <b>空格</b>（或 ↑ / W）冲刺，会消耗黄色的<b>梦能</b>；收集光点能回复梦能。', touch: '按住底部中间的「冲刺」。' },
      { title: '梦境规则', text: '每个世界都有一条规则：侧风、星座组合、漂移水母、浓雾、齿轮闸门、左右反转……开局会在屏幕上提示。', touch: '' },
      { title: '醒来', text: '航程结束时光点达到目标才能进入下一个梦；撞 3 次就会醒。收集率 ≥ 60% 和无伤各多 1 颗星。', touch: '' },
    ],
    onStart: wi => start(wi == null ? Math.min(SV.unlocked, WORLDS.length) - 1 : wi),
    onRestart: () => start(S.wi),
    onQuit: () => { if (S) S.over = true; },
    onMenu: () => menu(),
    pauseInfo: () => S ? `${S.Wd.name} · 光点 ${S.orbs}/${S.Wd.target}` : '',
  });
  function menu() {
    const stars = Object.values(SV.stars).reduce((a, b) => a + b, 0);
    G.menu(`<div class="xg-stats"><span>已解锁梦境</span><b>${SV.unlocked} / ${WORLDS.length}</b><span>星星</span><b>${stars} / ${WORLDS.length * 3}</b><span>累计光点</span><b>${SV.orbsTotal}</b></div>`, [
      { label: `▶ 入梦：${WORLDS[Math.min(SV.unlocked, WORLDS.length) - 1].name}`, primary: true, id: 'xgStart', onClick: () => G.start(Math.min(SV.unlocked, WORLDS.length) - 1) },
      { label: '🗺 选择梦境', id: 'xgLevels', onClick: () => G.levelSelect(WORLDS.map((w, i) => ({ name: `${i + 1}. ${w.name}`, sub: w.rule.split('：')[0], locked: i >= SV.unlocked, stars: SV.stars['W' + i] || 0 })), i => G.start(i), '选择梦境') },
      { label: '📖 教程', onClick: () => G.tutorial(menu) },
    ]);
  }
  XG.fit(cv, { reserve: () => ({ w: 0, h: 16 }), onResize: () => placeTouch() });
  menu();
  let last = performance.now();
  function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__demo = { G, SV, get S() { return S; }, WORLDS, start, update, finish };
})();
