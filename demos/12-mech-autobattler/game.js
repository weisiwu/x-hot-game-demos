// 机甲布阵 Mech Formation — 布阵自走棋：10 波战役 + 无尽、6 种机甲、三星升级、同类羁绊、利息与连胜、续玩存档
// 趋势参考：Discord 2026-10-01 周榜上的机甲自走棋类游戏（原创实现）
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cv = $('c'), ctx = cv.getContext('2d');
  const N = 8, CELL = cv.width / N, WAVES = 10;
  const A = '../../assets/12-mech-autobattler/';
  const TYPES = {
    guard: { name: '重盾卫士', cost: 3, hp: 240, dmg: 12, range: 1.1, cd: 0.9, speed: 0.9, desc: '高血量前排', syn: '2 台：全体卫士生命 +20%' },
    gunner: { name: '速射枪手', cost: 3, hp: 90, dmg: 9, range: 3.6, cd: 0.45, speed: 1.0, desc: '中程持续输出', syn: '2 台：枪手攻速 +20%' },
    artillery: { name: '重炮', cost: 4, hp: 70, dmg: 26, range: 5.5, cd: 1.8, speed: 0.7, splash: 1.2, desc: '远程溅射', syn: '2 台：溅射范围 +40%' },
    raider: { name: '突袭者', cost: 4, hp: 120, dmg: 18, range: 1.1, cd: 0.6, speed: 2.2, assassin: true, desc: '优先切后排', syn: '2 台：突袭者伤害 +25%' },
    medic: { name: '维修机', cost: 4, hp: 80, dmg: 0, range: 3, cd: 1.0, speed: 1.0, heal: 22, desc: '治疗血最少的友军', syn: '2 台：治疗量 +30%' },
    sniper: { name: '狙击机', cost: 5, hp: 65, dmg: 55, range: 7.5, cd: 2.6, speed: 0.6, desc: '超远程单体高伤', syn: '2 台：狙击暴击率 30%' },
  };
  const ICON = {}; Object.keys(TYPES).forEach(k => ICON[k] = XG.img(`${A}mech-${k}.webp`));
  const deckImg = XG.img(`${A}deck.webp`);
  const SAVE = XG.save('12-mech-autobattler', { tutorialSeen: false, run: null, bestWave: 0, wins: 0, runs: 0, endlessBest: 0, speed: 1 });
  const SV = SAVE.data;
  let S = null;
  const cap = () => Math.min(12, 3 + S.wave);
  const lvMul = lv => 1 + (lv - 1) * 0.7;

  const shop = $('shop');
  for (const k in TYPES) {
    const b = document.createElement('button'); b.id = 'b_' + k;
    b.innerHTML = `<img src="${A}mech-${k}.webp" alt=""><span><b>${TYPES[k].name}</b> ${TYPES[k].cost}⚡<br><small style="opacity:.75">${TYPES[k].desc}</small></span>`;
    b.onclick = () => { if (!S) return; S.sel = k; S.sell = false; XG.audio.sfx('click'); render(); };
    shop.appendChild(b);
  }
  $('bSell').onclick = () => { if (!S) return; S.sell = !S.sell; render(); };
  $('bSpeed').onclick = () => { SV.speed = SV.speed === 1 ? 2 : SV.speed === 2 ? 3 : 1; SAVE.write(); render(); };
  $('bGo').onclick = () => startBattle();

  function newRun() { S = { wave: 1, gold: 12, hp: 20, board: [], sel: 'guard', sell: false, phase: 'build', units: [], fx: [], streak: 0, endless: false }; SV.runs++; saveRun(); log('选择机甲，点击下半场部署。同类机甲再点一次 = 升级。'); render(); }
  function saveRun() { const c = JSON.parse(JSON.stringify({ ...S, units: [], fx: [] })); SV.run = c; SAVE.write(); }
  const at = (x, y) => S.board.find(u => u.x === x && u.y === y);
  const counts = () => { const c = {}; S.board.forEach(u => c[u.type] = (c[u.type] || 0) + 1); return c; };
  function sellAt(c) {
    const u = at(c.x, c.y); if (!u) return;
    const refund = Math.floor(TYPES[u.type].cost * (1 + (u.lv - 1) * 1.5) * 0.7);
    S.gold += refund; S.board.splice(S.board.indexOf(u), 1); log(`回收 ${TYPES[u.type].name}，+${refund} 能源`); XG.audio.sfx('coin');
  }
  function clickCell(c, right) {
    if (!S || S.phase !== 'build' || G.paused || G.state !== 'play') return;
    if (c.y < N / 2) return log('只能部署在下半场');
    if (S.sell || right) { sellAt(c); saveRun(); return render(); }
    const u = at(c.x, c.y), T = TYPES[S.sel];
    if (u) {
      if (u.type !== S.sel) return log('格子已被占用（可回收后再放）');
      if (u.lv >= 3) return log('已经三星满级');
      const price = Math.ceil(T.cost * 1.5 * u.lv);
      if (S.gold < price) { XG.audio.sfx('error'); return log(`升级需要 ${price} 能源`); }
      S.gold -= price; u.lv++; XG.audio.sfx('powerup'); log(`${T.name} 升到 ${'★'.repeat(u.lv)}`);
    } else {
      if (S.board.length >= cap()) { XG.audio.sfx('error'); return log(`部署上限 ${cap()}（每波 +1）`); }
      if (S.gold < T.cost) { XG.audio.sfx('error'); return log('能源不足'); }
      S.gold -= T.cost; S.board.push({ type: S.sel, x: c.x, y: c.y, lv: 1 }); XG.audio.sfx('thud');
    }
    saveRun(); render();
  }
  const cellOf = e => { const p = XG.canvasPos(cv, e); return { x: Math.floor(p.x / CELL), y: Math.floor(p.y / CELL) }; };
  cv.addEventListener('pointerdown', e => { if (e.button === 2) return; clickCell(cellOf(e), false); });
  cv.addEventListener('contextmenu', e => { e.preventDefault(); clickCell(cellOf(e), true); });

  function enemyArmy(w) {
    const boss = w % 5 === 0;
    let budget = 6 + w * 6.5 + (w > WAVES ? (w - WAVES) * 8 : 0);
    const keys = Object.keys(TYPES), army = [], used = new Set();
    const lvChance = Math.min(0.6, Math.max(0, (w - 3) * 0.08));
    while (budget >= 3 && army.length < Math.min(14, 3 + w)) {
      const k = keys[(Math.random() * keys.length) | 0], c = TYPES[k].cost; if (c > budget) continue;
      let x, y, tries = 0; do { x = (Math.random() * N) | 0; y = ['artillery', 'medic', 'sniper'].includes(k) ? (Math.random() * 2) | 0 : 1 + ((Math.random() * 3) | 0); } while (used.has(x + ',' + y) && ++tries < 40);
      if (used.has(x + ',' + y)) break;
      used.add(x + ',' + y); budget -= c;
      army.push({ type: k, x, y, lv: Math.random() < lvChance ? (Math.random() < lvChance / 2 ? 3 : 2) : 1 });
    }
    if (boss) army.push({ type: 'guard', x: 3, y: 2, lv: 3, boss: true });
    return army;
  }
  function synergy(team, list) {
    const c = {}; list.forEach(u => c[u.type] = (c[u.type] || 0) + 1);
    return t => (c[t] || 0) >= 2;
  }
  function spawn(u, team, syn) {
    const T = TYPES[u.type], m = lvMul(u.lv) * (u.boss ? 2.4 : 1) * (u.type === 'guard' && syn('guard') ? 1.2 : 1);
    return { ...u, team, px: u.x + .5, py: u.y + .5, hp: T.hp * m, maxHp: T.hp * m, dmg: T.dmg * lvMul(u.lv) * (u.type === 'raider' && syn('raider') ? 1.25 : 1),
      cdMax: T.cd / (u.type === 'gunner' && syn('gunner') ? 1.2 : 1), splash: T.splash ? T.splash * (syn('artillery') ? 1.4 : 1) : 0, heal: T.heal ? T.heal * (syn('medic') ? 1.3 : 1) : 0,
      crit: u.type === 'sniper' && syn('sniper') ? 0.3 : 0, cdT: Math.random() * 0.4, T };
  }
  function startBattle() {
    if (!S || S.phase !== 'build' || G.paused || G.state !== 'play') return;
    if (!S.board.length) return log('先部署至少一台机甲');
    const enemy = enemyArmy(S.wave);
    const sm = synergy(0, S.board), se = synergy(1, enemy);
    S.units = [...S.board.map(u => spawn(u, 0, sm)), ...enemy.map(u => spawn(u, 1, se))];
    S.phase = 'battle'; S.battleT = 0; XG.audio.sfx('alarm'); log(`第 ${S.wave} 波开战！${S.wave % 5 === 0 ? '⚠️ Boss 波' : ''}`); render();
  }
  function stepBattle(dt) {
    S.battleT += dt;
    const alive = S.units.filter(u => u.hp > 0);
    const d = (u, o) => Math.hypot(o.px - u.px, o.py - u.py);
    for (const u of alive) {
      const foes = alive.filter(o => o.team !== u.team && o.hp > 0); if (!foes.length) break;
      u.cdT -= dt;
      if (u.heal) {
        const allies = alive.filter(o => o.team === u.team && o !== u && o.hp > 0 && o.hp < o.maxHp).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
        const t = allies[0];
        if (t && d(u, t) <= u.T.range) { if (u.cdT <= 0) { u.cdT = u.cdMax; t.hp = Math.min(t.maxHp, t.hp + u.heal * lvMul(u.lv)); S.fx.push({ x1: u.px, y1: u.py, x2: t.px, y2: t.py, c: '#6fff9f', t: .2 }); } }
        else moveToward(u, t || foes.sort((a, b) => d(u, a) - d(u, b))[0], dt, t ? 0 : 2.5);
        continue;
      }
      const tgt = u.T.assassin ? foes.sort((a, b) => (a.T.range > 2 ? 0 : 1) - (b.T.range > 2 ? 0 : 1) || d(u, a) - d(u, b))[0] : foes.sort((a, b) => d(u, a) - d(u, b))[0];
      if (d(u, tgt) > u.T.range) moveToward(u, tgt, dt, u.T.range * 0.9);
      else if (u.cdT <= 0) {
        u.cdT = u.cdMax;
        let dmg = u.dmg; if (u.crit && Math.random() < u.crit) dmg *= 2;
        if (u.splash) for (const o of foes) { if (Math.hypot(o.px - tgt.px, o.py - tgt.py) <= u.splash) o.hp -= dmg * (o === tgt ? 1 : 0.5); }
        else tgt.hp -= dmg;
        S.fx.push({ x1: u.px, y1: u.py, x2: tgt.px, y2: tgt.py, c: u.team ? '#ff6b6b' : '#6bc7ff', t: .12, boom: !!u.splash, snipe: u.type === 'sniper' });
        XG.audio.sfxThrottled(u.splash ? 'explosion' : 'laser', u.splash ? 300 : 90);
        if (tgt.hp <= 0) XG.audio.sfxThrottled('hit', 100);
      }
    }
    for (const a of alive) for (const b of alive) if (a !== b) {
      const dx = a.px - b.px, dy = a.py - b.py, dd = Math.hypot(dx, dy);
      if (dd < 0.7 && dd > 0.001) { a.px += dx / dd * (0.7 - dd) * 0.5; a.py += dy / dd * (0.7 - dd) * 0.5; }
    }
    for (const u of alive) { u.px = XG.clamp(u.px, .3, N - .3); u.py = XG.clamp(u.py, .3, N - .3); }
    const mine = S.units.filter(u => u.team === 0 && u.hp > 0).length, theirs = S.units.filter(u => u.team === 1 && u.hp > 0).length;
    if (!mine || !theirs || S.battleT > 45) endBattle(mine, theirs);
  }
  function moveToward(u, t, dt, stop) { if (!t) return; const dx = t.px - u.px, dy = t.py - u.py, d = Math.hypot(dx, dy); if (d > stop) { u.px += dx / d * u.T.speed * dt; u.py += dy / d * u.T.speed * dt; } }
  function endBattle(mine, theirs) {
    S.phase = 'build'; S.units = [];
    const interest = Math.min(5, Math.floor(S.gold / 5));
    if (!theirs && mine) {
      S.streak = Math.max(1, S.streak + 1);
      const income = 8 + S.wave * 2 + interest + Math.min(3, S.streak - 1);
      XG.audio.sfx('levelup'); log(`✅ 第 ${S.wave} 波胜利！存活 ${mine} 台，能源 +${income}（含利息 ${interest}）`);
      if (S.wave > SV.bestWave) SV.bestWave = S.wave;
      if (!S.endless && S.wave >= WAVES) { SV.wins++; SV.run = null; SAVE.write(); render(); return winScreen(); }
      if (S.endless) SV.endlessBest = Math.max(SV.endlessBest, S.wave);
      S.wave++; S.gold += income;
    } else {
      S.streak = Math.min(0, S.streak) - 1;
      const loss = 2 + theirs * 2; S.hp -= loss; S.gold += 6 + S.wave + interest;
      XG.audio.sfx('hurt'); log(`❌ 第 ${S.wave} 波失利，剩余敌人 ${theirs}，基地 -${loss}`);
      if (S.hp <= 0) { SV.run = null; SAVE.write(); render(); return G.end({ win: false, title: '💥 基地失守', sub: `坚持到第 ${S.wave} 波。前排多放卫士，后排配维修机试试。`, stats: [['最远波次', SV.bestWave], ['无尽最远', SV.endlessBest]], buttons: [{ label: '🔁 新的一局', primary: true, id: 'xgAgain', onClick: () => G.start('new') }, { label: '🏠 菜单', onClick: () => G.menu() }] }); }
    }
    saveRun(); render();
  }
  function winScreen() {
    G.end({ win: true, title: '🏆 10 波全部击退！', sub: '防线坚不可摧。要不要挑战无尽模式？', stats: [['基地剩余耐久', S.hp], ['通关次数', SV.wins]],
      buttons: [{ label: '♾ 无尽模式', primary: true, id: 'xgEndless', onClick: () => { G.close(); G.setState('play'); S.endless = true; S.wave++; S.gold += 20; saveRun(); render(); } }, { label: '🔁 新的一局', id: 'xgAgain', onClick: () => G.start('new') }, { label: '🏠 菜单', onClick: () => G.menu() }] });
  }
  function log(t) { $('log').textContent = t; }
  function render() {
    if (!S) return;
    $('wave').textContent = S.endless ? `${S.wave}（无尽）` : `${Math.min(S.wave, WAVES)} / ${WAVES}${S.wave % 5 === 0 ? ' ⚠️Boss' : ''}`;
    $('gold').textContent = S.gold; $('hp').textContent = Math.max(0, S.hp); $('cap').textContent = `${S.board.length} / ${cap()}`;
    for (const k in TYPES) { const b = $('b_' + k); b.classList.toggle('sel', S.sel === k && !S.sell); b.disabled = S.phase !== 'build'; }
    $('bSell').classList.toggle('sel', S.sell); $('bSell').disabled = S.phase !== 'build';
    $('bSpeed').textContent = `⏩ 战斗速度 ×${SV.speed}`;
    $('bGo').disabled = S.phase !== 'build'; $('bGo').textContent = S.phase === 'battle' ? '战斗中…' : `⚔️ 开战（第 ${S.wave} 波）`;
    const c = counts();
    $('syn').innerHTML = Object.keys(TYPES).filter(k => c[k]).map(k => `${c[k] >= 2 ? '🔗' : '·'} ${TYPES[k].name} ×${c[k]}${c[k] >= 2 ? '：' + TYPES[k].syn.split('：')[1] : '（再 1 台激活羁绊）'}`).join('<br>');
  }
  function drawUnit(x, y, type, lv, team, hpFrac, boss) {
    const cx = x * CELL, cy = y * CELL, r = CELL * (boss ? 0.46 : 0.38);
    ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.8, r, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.fillStyle = team ? '#5a2430' : '#1f3f5c'; ctx.fill(); ctx.clip();
    const im = ICON[type];
    if (XG.ready(im)) ctx.drawImage(im, cx - r, cy - r, r * 2, r * 2);
    if (team) { ctx.fillStyle = 'rgba(255,40,60,.28)'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); }
    ctx.restore();
    ctx.strokeStyle = boss ? '#ffcc4d' : team ? '#ff6b6b' : '#6bc7ff'; ctx.lineWidth = boss ? 4 : 2.5; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    if (lv > 1) { ctx.fillStyle = '#ffcc4d'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★'.repeat(lv), cx, cy - r - 2); }
    if (hpFrac != null) { ctx.fillStyle = '#000a'; ctx.fillRect(cx - 22, cy + r + 2, 44, 5); ctx.fillStyle = team ? '#ff6b6b' : '#6fff9f'; ctx.fillRect(cx - 22, cy + r + 2, 44 * Math.max(0, hpFrac), 5); }
  }
  function draw() {
    if (XG.ready(deckImg)) ctx.drawImage(deckImg, 0, 0, cv.width, cv.height);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      ctx.fillStyle = y < N / 2 ? ((x + y) % 2 ? 'rgba(90,30,40,.45)' : 'rgba(110,40,50,.35)') : ((x + y) % 2 ? 'rgba(20,50,80,.45)' : 'rgba(30,70,100,.35)');
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i <= N; i++) { ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, cv.height); ctx.moveTo(0, i * CELL); ctx.lineTo(cv.width, i * CELL); ctx.stroke(); }
    ctx.fillStyle = '#ffcc4d55'; ctx.fillRect(0, N / 2 * CELL - 2, cv.width, 4);
    if (!S) return;
    if (S.phase === 'build') {
      for (const u of S.board) drawUnit(u.x + .5, u.y + .5, u.type, u.lv, 0, null);
      ctx.fillStyle = '#ffffff88'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`敌方阵地（第 ${S.wave} 波，开战后出现）`, cv.width / 2, CELL * 2);
    } else for (const u of S.units) if (u.hp > 0) drawUnit(u.px, u.py, u.type, u.lv, u.team, u.hp / u.maxHp, u.boss);
    for (const f of S.fx) {
      ctx.strokeStyle = f.c; ctx.lineWidth = f.boom ? 3 : f.snipe ? 4 : 2; ctx.globalAlpha = Math.min(1, f.t * 6);
      ctx.beginPath(); ctx.moveTo(f.x1 * CELL, f.y1 * CELL); ctx.lineTo(f.x2 * CELL, f.y2 * CELL); ctx.stroke();
      if (f.boom) { ctx.beginPath(); ctx.arc(f.x2 * CELL, f.y2 * CELL, CELL * 0.6, 0, Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
  }

  const G = XG.game({
    id: '12-mech-autobattler', title: '🤖 机甲布阵', subtitle: '用能源部署机甲、搭配羁绊、升级三星，然后看它们自动作战。击退 10 波敌军（第 5、10 波有 Boss），还有无尽模式。',
    cover: '../../assets/12-mech-autobattler/cover.webp', music: 'epic', save: SAVE,
    tutorial: [
      { title: '部署', text: '在右侧选择机甲，点击<b>下半场</b>的格子部署。部署上限每波 +1。', touch: '点按钮选择，点格子部署。' },
      { title: '升级与回收', text: '对已有的同类机甲<b>再点一次</b>就会升级（最高三星，属性大幅提升）。右键或「回收模式」可以卖掉机甲，返还 70%。', touch: '用「回收模式」按钮代替右键。' },
      { title: '羁绊', text: '同类机甲 2 台以上会激活<b>羁绊</b>：卫士更肉、枪手更快、重炮溅射更大、突袭者更痛、维修机奶量更大、狙击能暴击。', touch: '' },
      { title: '战斗与经济', text: '点「开战」后自动战斗，可以切换 ×1/×2/×3 速度。胜利获得能源，<b>每存 5 能源 +1 利息</b>（最多 5），连胜有奖励；失败会扣基地耐久。每个准备阶段自动存档，下次可以继续。', touch: '' },
    ],
    onStart: mode => { if (mode === 'continue' && SV.run) { S = { ...SV.run, units: [], fx: [], phase: 'build' }; log('继续上次的战役。'); render(); } else newRun(); },
    onRestart: () => newRun(),
    onQuit: () => { if (S && S.phase === 'build' && SV.run) saveRun(); },
    onMenu: () => menu(),
    pauseInfo: () => S ? `第 ${S.wave} 波 · 基地 ${S.hp}（准备阶段自动存档）` : '',
  });
  function menu() {
    const btns = [];
    if (SV.run) btns.push({ label: `▶ 继续：第 ${SV.run.wave} 波`, primary: true, id: 'xgContinue', onClick: () => G.start('continue') });
    btns.push({ label: SV.run ? '🆕 新的一局' : '▶ 开始战役', primary: !SV.run, id: 'xgStart', onClick: () => G.start('new') });
    btns.push({ label: '📖 教程', onClick: () => G.tutorial(menu) });
    G.menu(`<div class="xg-stats"><span>通关次数</span><b>${SV.wins}</b><span>最远波次</span><b>${SV.bestWave}</b><span>无尽最远</span><b>${SV.endlessBest}</b></div>`, btns);
  }
  XG.fit(cv, { reserve: () => XG.landscape() && window.innerWidth > 640 ? { w: 300, h: 70 } : { w: 0, h: XG.landscape() ? 70 : 430 }, maxScale: 1.4 });
  menu();
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (S && S.phase === 'battle' && !G.paused) { const steps = 2 * SV.speed; for (let i = 0; i < steps; i++) if (S.phase === 'battle') stepBattle(dt / 2); }
    if (S) { for (const f of S.fx) f.t -= dt; S.fx = S.fx.filter(f => f.t > 0); }
    draw(); requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__demo = { G, SV, get S() { return S; }, startBattle, clickCell, stepBattle, TYPES, enemyArmy, newRun };
})();
