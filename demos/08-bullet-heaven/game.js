// 弹幕天堂 Mini — 幸存者类（Bullet Heaven）：3 个关卡、5 种武器、精英怪与宝箱、Boss、永久强化
// 趋势参考：2026 年 Steam 新增 "Bullet Heaven" 官方标签（原创实现）
(() => {
  'use strict';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const STAGES = [
    { name: '星光草原', time: 180, hp: 1, rate: 1, types: ['slime', 'bat', 'brute'], floor: '#14241a', grid: '#1d3a26', boss: 350 },
    { name: '迷雾墓园', time: 240, hp: 1.35, rate: 1.2, types: ['slime', 'bat', 'brute', 'spitter'], floor: '#18182a', grid: '#262642', boss: 900 },
    { name: '虚空深渊', time: 300, hp: 1.8, rate: 1.4, types: ['bat', 'brute', 'spitter', 'ghost'], floor: '#1c0f22', grid: '#311a3a', boss: 2000 },
  ];
  const META = [
    { id: 'hp', name: '❤️ 体魄', desc: '初始生命 +15', cost: l => 15 + l * 15, max: 8 },
    { id: 'dmg', name: '⚔️ 力量', desc: '伤害 +10%', cost: l => 20 + l * 20, max: 8 },
    { id: 'spd', name: '👟 敏捷', desc: '移速 +5%', cost: l => 15 + l * 15, max: 5 },
    { id: 'mag', name: '🧲 引力', desc: '拾取范围 +15%', cost: l => 10 + l * 10, max: 5 },
    { id: 'xp', name: '📚 学识', desc: '经验获取 +8%', cost: l => 25 + l * 25, max: 5 },
  ];
  const SAVE = XG.save('08-bullet-heaven', { tutorialSeen: false, coins: 0, meta: { hp: 0, dmg: 0, spd: 0, mag: 0, xp: 0 }, unlocked: 1, best: {}, clears: {}, runs: 0, kills: 0 });
  const SV = SAVE.data;
  let R = null; // 当前这一局
  let cards = [];
  const arenaImg = XG.img('../../assets/08-bullet-heaven/arena.webp'); let arenaPat = null;
  const TINT = ['rgba(20,60,30,.45)', 'rgba(20,20,60,.5)', 'rgba(60,10,60,.5)'];

  const UP = [
    { id: 'bolt', name: '🔮 魔弹', max: 7, desc: l => l ? '弹道 +1 / 射速提升' : '自动射向最近敌人', apply: () => R.w.bolt++ },
    { id: 'orbit', name: '🌀 旋刃', max: 5, desc: l => l ? '刀刃 +1，伤害提升' : '环绕身边的刀刃', apply: () => R.w.orbit++ },
    { id: 'pulse', name: '💥 冲击波', max: 5, desc: l => l ? '范围与伤害提升' : '定期释放范围冲击波并击退', apply: () => R.w.pulse++ },
    { id: 'chain', name: '⚡ 闪电链', max: 5, desc: l => l ? '跳跃次数 +1，伤害提升' : '闪电在敌人之间跳跃', apply: () => R.w.chain++ },
    { id: 'aura', name: '🔥 火焰光环', max: 5, desc: l => l ? '范围与灼烧伤害提升' : '持续灼烧身边的敌人', apply: () => R.w.aura++ },
    { id: 'hp', name: '❤️ 强壮', max: 99, desc: () => '最大生命 +25 并回满', apply: () => { R.p.maxHp += 25; R.p.hp = R.p.maxHp; } },
    { id: 'spd', name: '👟 疾行', max: 4, desc: () => '移动速度 +10%', apply: () => R.p.speed *= 1.1 },
    { id: 'mag', name: '🧲 磁铁', max: 4, desc: () => '拾取范围 +40%', apply: () => R.p.magnet *= 1.4 },
    { id: 'dmg', name: '⚔️ 力量', max: 5, desc: () => '所有伤害 +15%', apply: () => R.dmgMul *= 1.15 },
    { id: 'cd', name: '⏱ 急速', max: 4, desc: () => '武器冷却 -10%', apply: () => R.cdMul *= 0.9 },
    { id: 'regen', name: '🌿 再生', max: 3, desc: () => '每秒回复 1 点生命', apply: () => R.regen += 1 },
  ];

  function newRun(si) {
    const M = SV.meta, S = STAGES[si];
    R = {
      si, S, t: 0, kills: 0, lvl: 1, xp: 0, need: 5, coinsEarned: 0,
      p: { x: 0, y: 0, hp: 100 + M.hp * 15, maxHp: 100 + M.hp * 15, speed: 175 * (1 + M.spd * 0.05), inv: 0, magnet: 70 * (1 + M.mag * 0.15) },
      dmgMul: 1 + M.dmg * 0.1, xpMul: 1 + M.xp * 0.08, cdMul: 1, regen: 0,
      w: { bolt: 1, orbit: 0, pulse: 0, chain: 0, aura: 0 }, picked: {},
      boltCD: 0, pulseCD: 0, chainCD: 0, pulseFx: 0, orbitA: 0, bolts: [],
      enemies: [], shots: [], foes: [], gems: [], chests: [], texts: [], zaps: [], spawnT: 0, bossSpawned: false, over: false, mode: 'play', eliteT: 40,
    };
    SV.runs++; SAVE.write();
    setupTouch();
  }

  function rollCards() {
    const pool = UP.filter(u => (R.picked[u.id] || 0) < u.max && !(u.id === 'bolt' && R.w.bolt >= 7));
    XG.shuffle(pool); return pool.slice(0, 3);
  }
  function choose(i) {
    const u = cards[i]; if (!u || R.mode !== 'levelup') return;
    R.picked[u.id] = (R.picked[u.id] || 0) + 1; u.apply(); R.mode = 'play'; XG.audio.sfx('select');
  }
  window.addEventListener('keydown', e => { if (R && R.mode === 'levelup' && /^Digit[123]$/.test(e.code)) choose(+e.code.slice(5) - 1); });
  cv.addEventListener('pointerdown', e => {
    if (!R || R.mode !== 'levelup') return;
    const p = XG.canvasPos(cv, e);
    cards.forEach((c, i) => { const x = 120 + i * 240; if (p.x > x && p.x < x + 210 && p.y > 200 && p.y < 400) choose(i); });
  });

  const TYPES = {
    slime: { hp: 3, sp: 55, r: 12, dmg: 8, c: '#5fd35f', xp: 1 },
    bat: { hp: 2, sp: 110, r: 9, dmg: 6, c: '#c070ff', xp: 1 },
    brute: { hp: 22, sp: 42, r: 20, dmg: 16, c: '#ff7043', xp: 5 },
    spitter: { hp: 6, sp: 45, r: 13, dmg: 7, c: '#4fc3f7', xp: 2, ranged: true },
    ghost: { hp: 8, sp: 85, r: 13, dmg: 10, c: '#e0e0ff', xp: 2 },
    elite: { hp: 80, sp: 55, r: 22, dmg: 18, c: '#ffd54f', xp: 12 },
    boss: { hp: 700, sp: 48, r: 46, dmg: 30, c: '#ff2e63', xp: 0 },
  };
  function spawn(type) {
    const a = Math.random() * Math.PI * 2, d = Math.hypot(W, H) / 2 + 40;
    const T = TYPES[type], scale = type === 'boss' ? R.S.boss / T.hp : R.S.hp * (1 + R.t / 75);
    R.enemies.push({ x: R.p.x + Math.cos(a) * d, y: R.p.y + Math.sin(a) * d, type, hp: T.hp * scale, maxHp: T.hp * scale, sp: T.sp, r: T.r, dmg: T.dmg * (type === 'boss' ? 1 : 1 + R.t / 300), c: T.c, xp: T.xp, hit: 0, burn: 0, shootT: 2 + Math.random() * 2, ranged: T.ranged });
  }
  function damage(e, d, silent) {
    d *= R.dmgMul; e.hp -= d; e.hit = 0.08;
    if (!silent && Math.random() < 0.3) R.texts.push({ x: e.x, y: e.y - e.r, s: Math.round(d), life: 0.5 });
    if (!silent) XG.audio.sfxThrottled('hit', 70);
  }

  function update(dt) {
    if (!R || R.over || G.paused || R.mode !== 'play') return;
    R.t += dt; const p = R.p, S = R.S;
    let vx = 0, vy = 0;
    const st = XG.touch.sticks.move;
    if (st && st.active) { vx = st.x; vy = st.y; }
    else {
      if (XG.keys.has('KeyW') || XG.keys.has('ArrowUp')) vy--; if (XG.keys.has('KeyS') || XG.keys.has('ArrowDown')) vy++;
      if (XG.keys.has('KeyA') || XG.keys.has('ArrowLeft')) vx--; if (XG.keys.has('KeyD') || XG.keys.has('ArrowRight')) vx++;
    }
    const l = Math.hypot(vx, vy); if (l > 1) { vx /= l; vy /= l; }
    p.x += vx * p.speed * dt; p.y += vy * p.speed * dt;
    if (R.regen) p.hp = Math.min(p.maxHp, p.hp + R.regen * dt);
    // 刷怪
    R.spawnT -= dt;
    const rate = (0.9 + R.t / 20) * S.rate;
    while (R.spawnT <= 0 && R.t < S.time) {
      R.spawnT += 1 / rate;
      const r = Math.random(), ty = S.types;
      spawn(R.t > 45 && r < 0.1 && ty.includes('brute') ? 'brute' : R.t > 25 && r < 0.25 && ty.includes('spitter') ? 'spitter' : R.t > 15 && r < 0.5 ? (ty.includes('ghost') ? 'ghost' : 'bat') : ty.includes('slime') ? 'slime' : 'bat');
    }
    R.eliteT -= dt; if (R.eliteT <= 0 && R.t < S.time) { R.eliteT = 45; spawn('elite'); R.texts.push({ x: p.x, y: p.y - 60, s: '✨ 精英怪出现！击败掉落宝箱', life: 2 }); }
    if (R.t >= S.time && !R.bossSpawned) { R.bossSpawned = true; spawn('boss'); XG.audio.sfx('alarm'); R.texts.push({ x: p.x, y: p.y - 60, s: '⚠️ Boss 来了！', life: 2.5 }); }
    const near = () => R.enemies.slice().sort((a, b) => (a.x - p.x) ** 2 + (a.y - p.y) ** 2 - (b.x - p.x) ** 2 - (b.y - p.y) ** 2);
    // 魔弹
    R.boltCD -= dt;
    if (R.boltCD <= 0 && R.enemies.length) {
      R.boltCD = Math.max(0.16, 0.7 - R.w.bolt * 0.07) * R.cdMul;
      const sorted = near(), n = Math.min(sorted.length, Math.ceil(R.w.bolt / 2));
      for (let i = 0; i < n; i++) { const e = sorted[i], a = Math.atan2(e.y - p.y, e.x - p.x); R.shots.push({ x: p.x, y: p.y, vx: Math.cos(a) * 430, vy: Math.sin(a) * 430, life: 1.4, dmg: 2 + R.w.bolt * 0.7, pierce: R.w.bolt >= 4 ? 2 : 1 }); }
      XG.audio.sfxThrottled('laser', 120);
    }
    for (const s of R.shots) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      for (const e of R.enemies) if (s.pierce > 0 && e.hp > 0 && (e.x - s.x) ** 2 + (e.y - s.y) ** 2 < (e.r + 4) ** 2) { damage(e, s.dmg); s.pierce--; if (s.pierce <= 0) s.life = 0; }
    }
    R.shots = R.shots.filter(s => s.life > 0);
    // 旋刃
    if (R.w.orbit) {
      R.orbitA += dt * 3.2; const Rr = 70 + R.w.orbit * 6;
      for (let k = 0; k < R.w.orbit + 1; k++) {
        const a = R.orbitA + k * Math.PI * 2 / (R.w.orbit + 1), ox = p.x + Math.cos(a) * Rr, oy = p.y + Math.sin(a) * Rr;
        for (const e of R.enemies) if ((e.x - ox) ** 2 + (e.y - oy) ** 2 < (e.r + 12) ** 2) damage(e, (6 + R.w.orbit * 3) * dt * 3, true);
      }
    }
    // 冲击波
    if (R.w.pulse) {
      R.pulseCD -= dt;
      if (R.pulseCD <= 0) {
        R.pulseCD = Math.max(1.4, 3.2 - R.w.pulse * 0.35) * R.cdMul; R.pulseFx = 0.3; XG.audio.sfx('whoosh');
        const Rr = 110 + R.w.pulse * 25;
        for (const e of R.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < Rr + e.r) { damage(e, 5 + R.w.pulse * 4); if (e.type !== 'boss') { const a = Math.atan2(e.y - p.y, e.x - p.x); e.x += Math.cos(a) * 30; e.y += Math.sin(a) * 30; } }
      }
      if (R.pulseFx > 0) R.pulseFx -= dt;
    }
    // 闪电链
    if (R.w.chain) {
      R.chainCD -= dt;
      if (R.chainCD <= 0 && R.enemies.length) {
        R.chainCD = Math.max(0.8, 2.2 - R.w.chain * 0.25) * R.cdMul;
        let cur = { x: p.x, y: p.y }, hitSet = new Set(), jumps = 2 + R.w.chain;
        for (let j = 0; j < jumps; j++) {
          let best = null, bd = 260 ** 2;
          for (const e of R.enemies) { if (hitSet.has(e)) continue; const d = (e.x - cur.x) ** 2 + (e.y - cur.y) ** 2; if (d < bd) { bd = d; best = e; } }
          if (!best) break;
          R.zaps.push({ x1: cur.x, y1: cur.y, x2: best.x, y2: best.y, life: 0.15 }); damage(best, 6 + R.w.chain * 3); hitSet.add(best); cur = best;
        }
        XG.audio.noise({ dur: 0.08, vol: 0.12, filter: 'highpass', freq: 3000 });
      }
    }
    for (const z of R.zaps) z.life -= dt; R.zaps = R.zaps.filter(z => z.life > 0);
    // 火焰光环
    if (R.w.aura) { const Rr = 60 + R.w.aura * 14; for (const e of R.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < Rr + e.r) damage(e, (2 + R.w.aura * 1.6) * dt, true); }
    // 敌人
    for (const e of R.enemies) {
      const a = Math.atan2(p.y - e.y, p.x - e.x), d = Math.hypot(p.x - e.x, p.y - e.y);
      const sp = e.ranged && d < 260 ? -e.sp * 0.3 : e.sp;
      e.x += Math.cos(a) * sp * dt; e.y += Math.sin(a) * sp * dt;
      if (e.hit > 0) e.hit -= dt;
      if (e.ranged) { e.shootT -= dt; if (e.shootT <= 0 && d < 420) { e.shootT = 2.6; R.foes.push({ x: e.x, y: e.y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, life: 3, dmg: 9 }); } }
      if (e.type === 'boss') { e.shootT -= dt; if (e.shootT <= 0) { e.shootT = 2.2; for (let k = 0; k < 12; k++) { const aa = k * Math.PI / 6 + R.t; R.foes.push({ x: e.x, y: e.y, vx: Math.cos(aa) * 150, vy: Math.sin(aa) * 150, life: 4, dmg: 12 }); } } }
      if (p.inv <= 0 && d < e.r + 12) hurt(e.dmg);
    }
    for (const f of R.foes) { f.x += f.vx * dt; f.y += f.vy * dt; f.life -= dt; if (p.inv <= 0 && Math.hypot(f.x - p.x, f.y - p.y) < 14) { hurt(f.dmg); f.life = 0; } }
    R.foes = R.foes.filter(f => f.life > 0);
    for (const e of R.enemies) if (e.hp <= 0) {
      R.kills++;
      if (e.type === 'boss') { XG.audio.sfx('explosion'); return finish(true); }
      if (e.type === 'elite') R.chests.push({ x: e.x, y: e.y });
      R.gems.push({ x: e.x, y: e.y, v: e.xp });
    }
    R.enemies = R.enemies.filter(e => e.hp > 0);
    if (p.inv > 0) p.inv -= dt;
    for (const g of R.gems) {
      const d = Math.hypot(g.x - p.x, g.y - p.y);
      if (d < p.magnet) { g.x += (p.x - g.x) / d * 340 * dt; g.y += (p.y - g.y) / d * 340 * dt; }
      if (d < 16) { g.got = true; R.xp += g.v * R.xpMul; XG.audio.sfxThrottled('pickup', 60); }
    }
    R.gems = R.gems.filter(g => !g.got);
    for (const c of R.chests) if (!c.got && Math.hypot(c.x - p.x, c.y - p.y) < 24) { c.got = true; XG.audio.sfx('powerup'); levelUp(true); }
    R.chests = R.chests.filter(c => !c.got);
    if (R.xp >= R.need) { R.xp -= R.need; R.lvl++; R.need = Math.round(4 + R.lvl * 2.6); levelUp(false); }
    for (const t of R.texts) { t.life -= dt; t.y -= 30 * dt; }
    R.texts = R.texts.filter(t => t.life > 0);
  }
  function hurt(d) { R.p.hp -= d; R.p.inv = 0.5; XG.audio.sfx('hurt'); if (R.p.hp <= 0) finish(false); }
  function levelUp(chest) { cards = rollCards(); if (cards.length) { R.mode = 'levelup'; R.chestPick = chest; XG.audio.sfx('levelup'); } }

  function finish(win) {
    if (R.over) return; R.over = true;
    const key = 'S' + R.si;
    const earned = Math.floor(R.kills / 8) + (win ? 25 + R.si * 20 : 0);
    SV.coins += earned; SV.kills += R.kills;
    const score = Math.round(R.t * 10 + R.kills * 2 + (win ? 1000 : 0));
    const nb = !SV.best[key] || score > SV.best[key]; if (nb) SV.best[key] = score;
    if (win) { SV.clears[key] = (SV.clears[key] || 0) + 1; SV.unlocked = Math.max(SV.unlocked, Math.min(STAGES.length, R.si + 2)); }
    SAVE.write();
    const last = R.si === STAGES.length - 1;
    G.end({ win, title: win ? (last ? '🏆 深渊被你征服了！' : `🏆 ${R.S.name}通关！`) : '💀 倒下了……', sub: nb ? '新纪录！' : '',
      stats: [['存活', XG.fmtTime(R.t)], ['击杀', R.kills], ['等级', R.lvl], ['得分', score], ['获得星币', '⭐' + earned]],
      buttons: [...(win && !last ? [{ label: '▶ 下一关', primary: true, id: 'xgNext', onClick: () => G.start(R.si + 1) }] : []), { label: '🔁 再来一局', primary: !win || last, id: 'xgAgain', onClick: () => G.start(R.si) }, { label: '⭐ 永久强化', onClick: () => shop() }, { label: '🏠 菜单', onClick: () => G.menu() }] });
  }

  // ---------- 绘制 ----------
  function draw() {
    ctx.fillStyle = '#0d0d1a'; ctx.fillRect(0, 0, W, H);
    if (!R) return;
    const p = R.p, ox = W / 2 - p.x, oy = H / 2 - p.y;
    ctx.fillStyle = R.S.floor; ctx.fillRect(0, 0, W, H);
    if (XG.ready(arenaImg)) { if (!arenaPat) arenaPat = ctx.createPattern(arenaImg, 'repeat'); ctx.save(); ctx.translate(((ox % 512) + 512) % 512 - 512, ((oy % 512) + 512) % 512 - 512); ctx.fillStyle = arenaPat; ctx.fillRect(0, 0, W + 1024, H + 1024); ctx.restore(); ctx.fillStyle = TINT[R.si]; ctx.fillRect(0, 0, W, H); }
    ctx.strokeStyle = R.S.grid; ctx.lineWidth = 1;
    for (let x = ((ox % 60) + 60) % 60; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = ((oy % 60) + 60) % 60; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (R.w.aura) { const Rr = 60 + R.w.aura * 14; const g = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Rr); g.addColorStop(0, 'rgba(255,120,40,.0)'); g.addColorStop(1, 'rgba(255,120,40,.25)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, H / 2, Rr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#4fe3ff';
    for (const g of R.gems) { ctx.save(); ctx.translate(g.x + ox, g.y + oy); ctx.rotate(Math.PI / 4); const s = g.v >= 5 ? 6 : 4; ctx.fillRect(-s, -s, s * 2, s * 2); ctx.restore(); }
    ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
    for (const c of R.chests) ctx.fillText('🎁', c.x + ox, c.y + oy + 8);
    for (const e of R.enemies) {
      const x = e.x + ox, y = e.y + oy; if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
      ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.ellipse(x, y + e.r * 0.8, e.r, e.r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = e.hit > 0 ? '#fff' : e.c; ctx.beginPath(); ctx.arc(x, y, e.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x - e.r * 0.3, y - e.r * 0.15, Math.max(1.5, e.r * 0.14), 0, Math.PI * 2); ctx.arc(x + e.r * 0.3, y - e.r * 0.15, Math.max(1.5, e.r * 0.14), 0, Math.PI * 2); ctx.fill();
      if (e.type === 'boss' || e.type === 'brute' || e.type === 'elite') { ctx.fillStyle = '#000a'; ctx.fillRect(x - e.r, y - e.r - 9, e.r * 2, 4); ctx.fillStyle = '#f44'; ctx.fillRect(x - e.r, y - e.r - 9, e.r * 2 * Math.max(0, e.hp) / e.maxHp, 4); }
    }
    ctx.fillStyle = '#ff6b9a'; for (const f of R.foes) { ctx.beginPath(); ctx.arc(f.x + ox, f.y + oy, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ffe14d'; for (const s of R.shots) { ctx.beginPath(); ctx.arc(s.x + ox, s.y + oy, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#bff'; ctx.lineWidth = 3;
    for (const z of R.zaps) { ctx.globalAlpha = z.life * 6; ctx.beginPath(); ctx.moveTo(z.x1 + ox, z.y1 + oy); const mx = (z.x1 + z.x2) / 2 + (Math.random() - .5) * 20, my = (z.y1 + z.y2) / 2 + (Math.random() - .5) * 20; ctx.lineTo(mx + ox, my + oy); ctx.lineTo(z.x2 + ox, z.y2 + oy); ctx.stroke(); }
    ctx.globalAlpha = 1;
    if (R.w.orbit) { const Rr = 70 + R.w.orbit * 6; ctx.fillStyle = '#9ff'; for (let k = 0; k < R.w.orbit + 1; k++) { const a = R.orbitA + k * Math.PI * 2 / (R.w.orbit + 1); ctx.save(); ctx.translate(W / 2 + Math.cos(a) * Rr, H / 2 + Math.sin(a) * Rr); ctx.rotate(a * 3); ctx.fillRect(-10, -3, 20, 6); ctx.restore(); } }
    if (R.pulseFx > 0) { ctx.strokeStyle = `rgba(255,140,255,${R.pulseFx * 3})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(W / 2, H / 2, 110 + R.w.pulse * 25, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = p.inv > 0 ? 0.5 : 1;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(W / 2, H / 2, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7c5cff'; ctx.beginPath(); ctx.arc(W / 2, H / 2, 8, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif';
    for (const t of R.texts) { ctx.globalAlpha = Math.min(1, t.life * 2); ctx.fillText(t.s, t.x + ox, t.y + oy); }
    ctx.globalAlpha = 1;
    // HUD
    ctx.fillStyle = '#222'; ctx.fillRect(0, 0, W, 8); ctx.fillStyle = '#4fe3ff'; ctx.fillRect(0, 0, W * R.xp / R.need, 8);
    ctx.textAlign = 'left'; ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#fff';
    const left = Math.max(0, R.S.time - R.t);
    ctx.fillText(`${R.S.name}  Lv ${R.lvl}  ❤️ ${Math.ceil(p.hp)}/${p.maxHp}  ☠️ ${R.kills}  ${R.bossSpawned ? '击败 Boss！' : '⏳ ' + XG.fmtTime(left)}`, 12, 30);
    ctx.fillStyle = '#400'; ctx.fillRect(12, 38, 200, 6); ctx.fillStyle = '#f44'; ctx.fillRect(12, 38, 200 * Math.max(0, p.hp) / p.maxHp, 6);
    const wl = Object.entries(R.w).filter(([, v]) => v).map(([k, v]) => ({ bolt: '🔮', orbit: '🌀', pulse: '💥', chain: '⚡', aura: '🔥' })[k] + v).join(' ');
    ctx.font = '13px sans-serif'; ctx.fillText(wl, 12, 62);
    if (R.mode === 'levelup') {
      ctx.fillStyle = 'rgba(0,0,0,.68)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(R.chestPick ? '🎁 宝箱！选择一项强化' : `升级！Lv ${R.lvl} — 选择一项强化`, W / 2, 160);
      cards.forEach((c, i) => {
        const x = 120 + i * 240;
        ctx.fillStyle = '#26264a'; ctx.fillRect(x, 200, 210, 200); ctx.strokeStyle = '#7c5cff'; ctx.lineWidth = 3; ctx.strokeRect(x, 200, 210, 200);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(c.name, x + 105, 250);
        ctx.font = '13px sans-serif'; wrap(c.desc(R.picked[c.id] || 0), x + 105, 290, 180, 18);
        ctx.fillStyle = '#aaa'; ctx.fillText(XG.isTouch ? '点击选择' : `[${i + 1}]`, x + 105, 380);
      });
    }
  }
  function wrap(text, x, y, maxW, lh) { let line = ''; for (const ch of text) { if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, x, y); line = ch; y += lh; } else line += ch; } ctx.fillText(line, x, y); }

  function setupTouch() {
    if (!XG.touch.enabled) return;
    if (!XG.touch.sticks.move) XG.touch.stick('move', { hint: '按住任意位置拖动移动' });
    const r = cv.getBoundingClientRect(); XG.touch.place('move', { left: r.left, top: r.top + 70, width: r.width, height: r.height - 70 });
  }
  // 升级卡片出现时，摇杆层不能挡住点击
  setInterval(() => { const z = XG.touch.sticks.move; if (z) z.zone.style.pointerEvents = R && R.mode === 'levelup' ? 'none' : 'auto'; }, 100);

  function shop() {
    G.setState('menu');
    const card = G.open(`<h2>⭐ 永久强化</h2><div class="xg-sub">星币：<b id="metaCoins">⭐${SV.coins}</b>（每局按击杀和通关获得）</div><div id="metaBox"></div>`, [{ label: '← 返回', onClick: () => menu() }]);
    const box = card.querySelector('#metaBox');
    const drawShop = () => {
      box.innerHTML = '';
      for (const m of META) {
        const lv = SV.meta[m.id], maxed = lv >= m.max, c = m.cost(lv);
        const b = document.createElement('button'); b.className = 'xg-btn'; b.style.cssText = 'width:100%;margin:3px 0;text-align:left';
        b.innerHTML = `${m.name} Lv${lv}/${m.max} ${maxed ? '（满级）' : '· ⭐' + c}<br><small style="font-weight:400;opacity:.8">${m.desc}</small>`;
        b.disabled = maxed || SV.coins < c;
        b.onclick = () => { SV.coins -= c; SV.meta[m.id]++; SAVE.write(); XG.audio.sfx('powerup'); card.querySelector('#metaCoins').textContent = '⭐' + SV.coins; drawShop(); };
        box.appendChild(b);
      }
    };
    drawShop();
  }

  const G = XG.game({
    id: '08-bullet-heaven', title: '✨ 弹幕天堂 Mini', subtitle: '自动攻击、升级三选一、撑到 Boss 出现并击败它。3 个关卡越来越难，星币可以买永久强化。',
    cover: '../../assets/08-bullet-heaven/cover.webp', music: 'action', save: SAVE,
    tutorial: [
      { title: '移动就好', text: '用 <b>WASD / 方向键</b> 移动，武器会<b>自动攻击</b>。别让怪物碰到你，也躲开蓝色怪和 Boss 吐出的粉色子弹。', touch: '在画面任意位置按住拖动，出现的摇杆控制移动。' },
      { title: '升级', text: '捡起怪物掉落的 💎 经验，经验条满了就从 3 张卡里选一项强化（点击或按 1/2/3）：新武器、武器升级或属性。', touch: '直接点击卡片。' },
      { title: '精英与宝箱', text: '每 45 秒出现一只金色精英怪，击败后掉落 🎁 宝箱，捡到可以免费再选一次强化。', touch: '' },
      { title: '通关与成长', text: '撑到倒计时结束会出现 Boss，击败它就通关并解锁下一关。每局结束获得 ⭐ 星币，在「永久强化」里升级体魄、力量等属性。', touch: '' },
    ],
    onStart: si => newRun(si == null ? Math.min(SV.unlocked, STAGES.length) - 1 : si),
    onRestart: () => newRun(R.si),
    onQuit: () => { if (R) R.over = true; },
    onMenu: () => menu(),
    pauseInfo: () => R ? `${R.S.name} · 存活 ${XG.fmtTime(R.t)} · 击杀 ${R.kills}` : '',
  });
  function menu() {
    G.menu(`<div class="xg-stats"><span>星币</span><b>⭐${SV.coins}</b><span>已解锁关卡</span><b>${SV.unlocked} / ${STAGES.length}</b><span>累计击杀</span><b>${SV.kills}</b></div>`, [
      { label: `▶ 开始：${STAGES[Math.min(SV.unlocked, STAGES.length) - 1].name}`, primary: true, id: 'xgStart', onClick: () => G.start(Math.min(SV.unlocked, STAGES.length) - 1) },
      { label: '🗺 选择关卡', id: 'xgLevels', onClick: () => G.levelSelect(STAGES.map((s, i) => ({ name: `${i + 1}. ${s.name}`, sub: `${XG.fmtTime(s.time)} · 通关 ${SV.clears['S' + i] || 0} 次`, locked: i >= SV.unlocked })), i => G.start(i)) },
      { label: '⭐ 永久强化', id: 'xgShop', onClick: () => shop() },
      { label: '📖 教程', onClick: () => G.tutorial(menu) },
    ]);
  }
  XG.fit(cv, { reserve: () => ({ w: 0, h: 16 }), onResize: () => setupTouch() });
  menu();
  let last = performance.now();
  function loop(now) { const dt = Math.min(0.033, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__demo = { G, SV, get R() { return R; }, get mode() { return R && R.mode; }, newRun, choose, update, STAGES, finish };
})();
