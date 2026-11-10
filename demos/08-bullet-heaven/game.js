// 弹幕天堂 — 幸存者类 / Bullet Heaven + 局外成长（趋势参考：2026 年 Steam 新增 "Bullet Heaven" 官方标签）
(() => {
  'use strict';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const SURVIVE = 180;
  const META_KEY = 'xhgd_bullet_heaven_meta';
  const store = {
    load() { try { return JSON.parse(localStorage.getItem(META_KEY)) || { coins: 0, hp: 0, dmg: 0 }; } catch { return { coins: 0, hp: 0, dmg: 0 }; } },
    save(m) { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch { /* file:// 下某些浏览器不可用，忽略 */ } },
  };
  let meta = store.load();
  const metaCost = { hp: () => 15 + meta.hp * 15, dmg: () => 20 + meta.dmg * 20 };

  let G; // 当前对局
  let mode = 'title'; // title | play | levelup | end
  let cards = [];

  function newGame() {
    G = {
      t: 0, kills: 0, lvl: 1, xp: 0, need: 5,
      p: { x: 0, y: 0, hp: 100 + meta.hp * 15, maxHp: 100 + meta.hp * 15, speed: 175, inv: 0, magnet: 70 },
      dmgMul: 1 + meta.dmg * 0.12,
      w: { bolt: 1, orbit: 0, pulse: 0 },
      boltCD: 0, pulseCD: 0, pulseFx: 0, orbitA: 0,
      enemies: [], shots: [], gems: [], texts: [], spawnT: 0, bossSpawned: false, win: false,
    };
    mode = 'play';
  }

  const UPGRADES = [
    { id: 'bolt', name: '🔮 魔弹', desc: lv => `自动射向最近敌人 · Lv${lv + 1}：更多弹道/射速`, max: 6, apply: () => G.w.bolt++ },
    { id: 'orbit', name: '🌀 旋刃', desc: lv => lv ? `环绕刀刃 +1，伤害提升` : '获得环绕身边的刀刃', max: 5, apply: () => G.w.orbit++ },
    { id: 'pulse', name: '💥 冲击波', desc: lv => lv ? '冲击波范围与伤害提升' : '定期释放范围冲击波', max: 5, apply: () => G.w.pulse++ },
    { id: 'hp', name: '❤️ 强壮', desc: () => '最大生命 +25 并回满', max: 99, apply: () => { G.p.maxHp += 25; G.p.hp = G.p.maxHp; } },
    { id: 'spd', name: '👟 疾行', desc: () => '移动速度 +12%', max: 4, apply: () => G.p.speed *= 1.12 },
    { id: 'mag', name: '🧲 磁铁', desc: () => '拾取范围 +50%', max: 4, apply: () => G.p.magnet *= 1.5 },
    { id: 'dmg', name: '⚔️ 力量', desc: () => '所有伤害 +15%', max: 5, apply: () => G.dmgMul *= 1.15 },
  ];
  const picked = {};
  function rollCards() {
    const pool = UPGRADES.filter(u => (picked[u.id] || 0) < u.max && (u.id !== 'bolt' || G.w.bolt < 7));
    const out = [];
    while (out.length < 3 && pool.length) out.push(pool.splice((Math.random() * pool.length) | 0, 1)[0]);
    return out;
  }
  function choose(i) {
    const u = cards[i]; if (!u) return;
    picked[u.id] = (picked[u.id] || 0) + 1; u.apply(); mode = 'play';
  }

  const keys = new Set();
  addEventListener('keydown', e => {
    keys.add(e.code);
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    if (mode === 'levelup' && /^Digit[123]$/.test(e.code)) choose(+e.code.slice(5) - 1);
    if (mode === 'title' && e.code === 'Space') { Object.keys(picked).forEach(k => delete picked[k]); newGame(); }
    if (mode === 'title' && e.code === 'Digit1') buyMeta('hp');
    if (mode === 'title' && e.code === 'Digit2') buyMeta('dmg');
    if (mode === 'end' && e.code === 'Space') mode = 'title';
  });
  addEventListener('keyup', e => keys.delete(e.code));
  cv.addEventListener('click', e => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
    if (mode === 'levelup') cards.forEach((c, i) => { const cx = 120 + i * 240; if (x > cx && x < cx + 210 && y > 200 && y < 400) choose(i); });
    else if (mode === 'title') {
      if (y > 330 && y < 380 && x > 250 && x < 650) { Object.keys(picked).forEach(k => delete picked[k]); newGame(); }
      if (y > 400 && y < 440) { if (x > 150 && x < 440) buyMeta('hp'); if (x > 460 && x < 750) buyMeta('dmg'); }
    } else if (mode === 'end') mode = 'title';
  });
  function buyMeta(k) { const c = metaCost[k](); if (meta.coins >= c) { meta.coins -= c; meta[k]++; store.save(meta); } }

  function spawnEnemy(type) {
    const a = Math.random() * Math.PI * 2, d = Math.hypot(W, H) / 2 + 40;
    const T = {
      slime: { hp: 3, sp: 55, r: 12, dmg: 8, c: '#5fd35f', xp: 1 },
      bat: { hp: 2, sp: 115, r: 9, dmg: 6, c: '#c070ff', xp: 1 },
      brute: { hp: 22, sp: 42, r: 20, dmg: 16, c: '#ff7043', xp: 5 },
      boss: { hp: 900, sp: 50, r: 46, dmg: 30, c: '#ff2e63', xp: 0 },
    }[type];
    const hpScale = 1 + G.t / 70;
    G.enemies.push({ x: G.p.x + Math.cos(a) * d, y: G.p.y + Math.sin(a) * d, type, hp: T.hp * (type === 'boss' ? 1 : hpScale), maxHp: T.hp * (type === 'boss' ? 1 : hpScale), sp: T.sp, r: T.r, dmg: T.dmg, c: T.c, xp: T.xp, hit: 0 });
  }

  function damage(e, d) {
    d *= G.dmgMul; e.hp -= d; e.hit = 0.08;
    if (Math.random() < 0.3) G.texts.push({ x: e.x, y: e.y - e.r, s: Math.round(d), life: 0.5 });
  }

  function update(dt) {
    if (mode !== 'play') return;
    G.t += dt;
    const p = G.p;
    let vx = 0, vy = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) vy--; if (keys.has('KeyS') || keys.has('ArrowDown')) vy++;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) vx--; if (keys.has('KeyD') || keys.has('ArrowRight')) vx++;
    const l = Math.hypot(vx, vy) || 1; p.x += vx / l * p.speed * dt; p.y += vy / l * p.speed * dt;
    // 刷怪
    G.spawnT -= dt;
    const rate = 0.9 + G.t / 22;
    while (G.spawnT <= 0 && G.t < SURVIVE) {
      G.spawnT += 1 / rate;
      const r = Math.random();
      spawnEnemy(G.t > 50 && r < 0.12 ? 'brute' : G.t > 20 && r < 0.45 ? 'bat' : 'slime');
    }
    if (G.t >= SURVIVE && !G.bossSpawned) { G.bossSpawned = true; spawnEnemy('boss'); G.texts.push({ x: p.x, y: p.y - 60, s: '⚠️ 大怪来了！', life: 2 }); }
    // 魔弹
    G.boltCD -= dt;
    if (G.boltCD <= 0 && G.enemies.length) {
      G.boltCD = Math.max(0.18, 0.7 - G.w.bolt * 0.07);
      const sorted = G.enemies.slice().sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
      const n = Math.min(sorted.length, Math.ceil(G.w.bolt / 2));
      for (let i = 0; i < n; i++) {
        const e = sorted[i], a = Math.atan2(e.y - p.y, e.x - p.x);
        G.shots.push({ x: p.x, y: p.y, vx: Math.cos(a) * 430, vy: Math.sin(a) * 430, life: 1.4, dmg: 2 + G.w.bolt * 0.6, pierce: G.w.bolt >= 4 ? 2 : 1 });
      }
    }
    for (const s of G.shots) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      for (const e of G.enemies) if (s.pierce > 0 && e.hp > 0 && (e.x - s.x) ** 2 + (e.y - s.y) ** 2 < (e.r + 4) ** 2) { damage(e, s.dmg); s.pierce--; if (s.pierce <= 0) s.life = 0; }
    }
    G.shots = G.shots.filter(s => s.life > 0);
    // 旋刃
    if (G.w.orbit) {
      G.orbitA += dt * 3.2;
      const R = 70 + G.w.orbit * 6;
      for (let k = 0; k < G.w.orbit + 1; k++) {
        const a = G.orbitA + k * Math.PI * 2 / (G.w.orbit + 1), ox = p.x + Math.cos(a) * R, oy = p.y + Math.sin(a) * R;
        for (const e of G.enemies) if ((e.x - ox) ** 2 + (e.y - oy) ** 2 < (e.r + 12) ** 2) damage(e, (6 + G.w.orbit * 3) * dt * 3);
      }
    }
    // 冲击波
    if (G.w.pulse) {
      G.pulseCD -= dt;
      if (G.pulseCD <= 0) {
        G.pulseCD = Math.max(1.4, 3.2 - G.w.pulse * 0.35);
        const R = 110 + G.w.pulse * 25; G.pulseFx = 0.3;
        for (const e of G.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < R + e.r) { damage(e, 5 + G.w.pulse * 4); const a = Math.atan2(e.y - p.y, e.x - p.x); if (e.type !== 'boss') { e.x += Math.cos(a) * 30; e.y += Math.sin(a) * 30; } }
      }
      if (G.pulseFx > 0) G.pulseFx -= dt;
    }
    // 敌人
    for (const e of G.enemies) {
      const a = Math.atan2(p.y - e.y, p.x - e.x); e.x += Math.cos(a) * e.sp * dt; e.y += Math.sin(a) * e.sp * dt;
      if (e.hit > 0) e.hit -= dt;
      if (p.inv <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < e.r + 12) { p.hp -= e.dmg; p.inv = 0.5; }
    }
    for (const e of G.enemies) if (e.hp <= 0) {
      G.kills++;
      if (e.type === 'boss') { G.win = true; endGame(); return; }
      G.gems.push({ x: e.x, y: e.y, v: e.xp });
    }
    G.enemies = G.enemies.filter(e => e.hp > 0);
    if (p.inv > 0) p.inv -= dt;
    // 宝石
    for (const g of G.gems) {
      const d = Math.hypot(g.x - p.x, g.y - p.y);
      if (d < p.magnet) { g.x += (p.x - g.x) / d * 320 * dt; g.y += (p.y - g.y) / d * 320 * dt; }
      if (d < 16) { g.got = true; G.xp += g.v; }
    }
    G.gems = G.gems.filter(g => !g.got);
    if (G.xp >= G.need) { G.xp -= G.need; G.lvl++; G.need = Math.round(5 + G.lvl * 4.5); cards = rollCards(); if (cards.length) mode = 'levelup'; }
    for (const t of G.texts) { t.life -= dt; t.y -= 30 * dt; }
    G.texts = G.texts.filter(t => t.life > 0);
    if (p.hp <= 0) { G.win = false; endGame(); }
  }

  function endGame() {
    G.earned = Math.floor(G.kills / 8) + (G.win ? 25 : 0);
    meta.coins += G.earned; store.save(meta);
    mode = 'end';
  }

  function draw() {
    ctx.fillStyle = '#0d0d1a'; ctx.fillRect(0, 0, W, H);
    if (mode === 'title') return drawTitle();
    const p = G.p, ox = W / 2 - p.x, oy = H / 2 - p.y;
    // 背景网格
    ctx.strokeStyle = '#1b1b33'; ctx.lineWidth = 1;
    for (let x = ((ox % 60) + 60) % 60; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = ((oy % 60) + 60) % 60; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = '#4fe3ff';
    for (const g of G.gems) { ctx.save(); ctx.translate(g.x + ox, g.y + oy); ctx.rotate(Math.PI / 4); ctx.fillRect(-4, -4, 8, 8); ctx.restore(); }
    for (const e of G.enemies) {
      ctx.fillStyle = e.hit > 0 ? '#fff' : e.c; ctx.beginPath(); ctx.arc(e.x + ox, e.y + oy, e.r, 0, Math.PI * 2); ctx.fill();
      if (e.type === 'boss' || e.type === 'brute') { ctx.fillStyle = '#000a'; ctx.fillRect(e.x + ox - e.r, e.y + oy - e.r - 9, e.r * 2, 4); ctx.fillStyle = '#f44'; ctx.fillRect(e.x + ox - e.r, e.y + oy - e.r - 9, e.r * 2 * e.hp / e.maxHp, 4); }
    }
    ctx.fillStyle = '#ffe14d';
    for (const s of G.shots) { ctx.beginPath(); ctx.arc(s.x + ox, s.y + oy, 4, 0, Math.PI * 2); ctx.fill(); }
    if (G.w.orbit) {
      const R = 70 + G.w.orbit * 6; ctx.fillStyle = '#9ff';
      for (let k = 0; k < G.w.orbit + 1; k++) { const a = G.orbitA + k * Math.PI * 2 / (G.w.orbit + 1); ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a) * R, H / 2 + Math.sin(a) * R, 9, 0, Math.PI * 2); ctx.fill(); }
    }
    if (G.pulseFx > 0) { ctx.strokeStyle = `rgba(255,140,255,${G.pulseFx * 3})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(W / 2, H / 2, 110 + G.w.pulse * 25, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = p.inv > 0 ? 0.5 : 1;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(W / 2, H / 2, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7c5cff'; ctx.beginPath(); ctx.arc(W / 2, H / 2, 7, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    for (const t of G.texts) { ctx.globalAlpha = Math.min(1, t.life * 2); ctx.fillText(t.s, t.x + ox, t.y + oy); }
    ctx.globalAlpha = 1;
    // HUD
    ctx.fillStyle = '#222'; ctx.fillRect(0, 0, W, 8); ctx.fillStyle = '#4fe3ff'; ctx.fillRect(0, 0, W * G.xp / G.need, 8);
    ctx.textAlign = 'left'; ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#fff';
    const left = Math.max(0, SURVIVE - G.t);
    ctx.fillText(`Lv ${G.lvl}   ❤️ ${Math.ceil(G.p.hp)}/${G.p.maxHp}   ☠️ ${G.kills}   ${G.bossSpawned ? '击败大怪！' : `⏳ ${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`}`, 12, 30);
    ctx.fillStyle = '#400'; ctx.fillRect(12, 38, 200, 6); ctx.fillStyle = '#f44'; ctx.fillRect(12, 38, 200 * Math.max(0, G.p.hp) / G.p.maxHp, 6);
    if (mode === 'levelup') {
      ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 28px sans-serif'; ctx.fillText(`升级！Lv ${G.lvl} — 选择一项强化`, W / 2, 160);
      cards.forEach((c, i) => {
        const x = 120 + i * 240;
        ctx.fillStyle = '#26264a'; ctx.fillRect(x, 200, 210, 200); ctx.strokeStyle = '#7c5cff'; ctx.lineWidth = 3; ctx.strokeRect(x, 200, 210, 200);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(c.name, x + 105, 250);
        ctx.font = '13px sans-serif'; wrap(c.desc(picked[c.id] || 0), x + 105, 290, 180, 18);
        ctx.fillStyle = '#aaa'; ctx.fillText(`[${i + 1}]`, x + 105, 380);
      });
    }
    if (mode === 'end') {
      ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 36px sans-serif';
      ctx.fillText(G.win ? '🏆 你活下来了，还干掉了大怪！' : '💀 倒下了……', W / 2, H / 2 - 30);
      ctx.font = '18px sans-serif';
      ctx.fillText(`存活 ${G.t.toFixed(0)}s · 击杀 ${G.kills} · 获得星币 ⭐${G.earned}`, W / 2, H / 2 + 10);
      ctx.fillText('点击或按空格返回开始界面', W / 2, H / 2 + 45);
    }
  }
  function wrap(text, x, y, maxW, lh) {
    let line = '';
    for (const ch of text) { if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, x, y); line = ch; y += lh; } else line += ch; }
    ctx.fillText(line, x, y);
  }
  function drawTitle() {
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 44px sans-serif'; ctx.fillText('✨ 弹幕天堂 Mini', W / 2, 180);
    ctx.font = '16px sans-serif'; ctx.fillText('自动攻击 · 升级三选一 · 坚持 3 分钟', W / 2, 220);
    ctx.fillText(`⭐ 星币：${meta.coins}　永久强化：生命 Lv${meta.hp} / 伤害 Lv${meta.dmg}`, W / 2, 280);
    ctx.fillStyle = '#7c5cff'; ctx.fillRect(250, 330, 400, 50);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('开始游戏（空格）', W / 2, 363);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = meta.coins >= metaCost.hp() ? '#3a8f5a' : '#333'; ctx.fillRect(150, 400, 290, 40);
    ctx.fillStyle = meta.coins >= metaCost.dmg() ? '#3a8f5a' : '#333'; ctx.fillRect(460, 400, 290, 40);
    ctx.fillStyle = '#fff';
    ctx.fillText(`[1] 初始生命 +15 — ⭐${metaCost.hp()}`, 295, 426); ctx.fillText(`[2] 伤害 +12% — ⭐${metaCost.dmg()}`, 605, 426);
  }

  let last = performance.now();
  function loop(now) { const dt = Math.min(0.033, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__demo = { get G() { return G; }, get mode() { return mode; }, newGame, choose };
})();
