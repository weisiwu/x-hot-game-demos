// 机甲布阵 — 布阵自走棋 / auto-battler（趋势参考：Discord 2026-10-01 周榜上的机甲自走棋类游戏）
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cv = $('c'), ctx = cv.getContext('2d');
  const N = 8, CELL = cv.width / N, WAVES = 7;
  const TYPES = {
    guard: { name: '🛡️ 重盾卫士', icon: '🛡️', cost: 3, hp: 240, dmg: 12, range: 1.1, cd: 0.9, speed: 0.9, desc: '高血量前排' },
    gunner: { name: '🔫 速射枪手', icon: '🔫', cost: 3, hp: 90, dmg: 9, range: 3.6, cd: 0.45, speed: 1.0, desc: '中程持续输出' },
    artillery: { name: '💣 重炮', icon: '💣', cost: 4, hp: 70, dmg: 26, range: 5.5, cd: 1.8, speed: 0.7, splash: 1.2, desc: '远程溅射' },
    raider: { name: '⚡ 突袭者', icon: '⚡', cost: 4, hp: 120, dmg: 18, range: 1.1, cd: 0.6, speed: 2.2, assassin: true, desc: '优先切后排' },
    medic: { name: '🔧 维修机', icon: '🔧', cost: 4, hp: 80, dmg: 0, range: 3, cd: 1.0, speed: 1.0, heal: 22, desc: '治疗血最少的友军' },
  };
  const S = { wave: 1, gold: 12, hp: 20, board: [], sel: 'guard', sell: false, phase: 'build', units: [], fx: [], log: '', over: false };
  const cap = () => 3 + S.wave;
  const lvMul = lv => 1 + (lv - 1) * 0.65;

  // 侧栏商店
  const shop = $('shop');
  for (const k in TYPES) {
    const b = document.createElement('button'); b.id = 'b_' + k;
    b.innerHTML = `${TYPES[k].name} · ${TYPES[k].cost}能源<br><small style="opacity:.7">${TYPES[k].desc}</small>`;
    b.onclick = () => { S.sel = k; S.sell = false; render(); };
    shop.appendChild(b);
  }
  $('bSell').onclick = () => { S.sell = !S.sell; render(); };
  $('bGo').onclick = startBattle;

  const at = (x, y) => S.board.find(u => u.x === x && u.y === y);
  function cellFromEvent(e) {
    const r = cv.getBoundingClientRect();
    return { x: Math.floor((e.clientX - r.left) * cv.width / r.width / CELL), y: Math.floor((e.clientY - r.top) * cv.height / r.height / CELL) };
  }
  function sellAt(c) {
    const u = at(c.x, c.y); if (!u) return;
    const refund = Math.floor(TYPES[u.type].cost * (1 + (u.lv - 1) * 1.5) * 0.7);
    S.gold += refund; S.board.splice(S.board.indexOf(u), 1); log(`回收 ${TYPES[u.type].name}，+${refund} 能源`);
  }
  cv.addEventListener('click', e => {
    if (S.phase !== 'build' || S.over) return;
    const c = cellFromEvent(e);
    if (c.y < N / 2) return log('只能部署在下半场');
    if (S.sell) { sellAt(c); return render(); }
    const u = at(c.x, c.y), T = TYPES[S.sel];
    if (u) {
      if (u.type !== S.sel) return log('格子已被占用（可回收后再放）');
      if (u.lv >= 3) return log('已满级');
      const price = Math.ceil(T.cost * 1.5 * u.lv);
      if (S.gold < price) return log(`升级需要 ${price} 能源`);
      S.gold -= price; u.lv++; log(`${T.name} 升到 Lv${u.lv}`);
    } else {
      if (S.board.length >= cap()) return log(`部署上限 ${cap()}`);
      if (S.gold < T.cost) return log('能源不足');
      S.gold -= T.cost; S.board.push({ type: S.sel, x: c.x, y: c.y, lv: 1 });
    }
    render();
  });
  cv.addEventListener('contextmenu', e => { e.preventDefault(); if (S.phase === 'build' && !S.over) { sellAt(cellFromEvent(e)); render(); } });

  function enemyArmy(w) {
    let budget = 6 + w * 6 + (w === WAVES ? 10 : 0);
    const keys = Object.keys(TYPES), army = [], used = new Set();
    while (budget >= 3 && army.length < 3 + w) {
      const k = keys[(Math.random() * keys.length) | 0], c = TYPES[k].cost;
      if (c > budget) continue;
      let x, y; do { x = (Math.random() * N) | 0; y = k === 'artillery' || k === 'medic' ? (Math.random() * 2) | 0 : 1 + ((Math.random() * 3) | 0); } while (used.has(x + ',' + y));
      used.add(x + ',' + y); budget -= c;
      army.push({ type: k, x, y, lv: w >= 5 && Math.random() < 0.4 ? 2 : 1 });
    }
    if (w === WAVES) army.push({ type: 'guard', x: 3, y: 2, lv: 3, boss: true });
    return army;
  }

  function spawn(u, team) {
    const T = TYPES[u.type], m = lvMul(u.lv) * (u.boss ? 2.2 : 1);
    return { ...u, team, px: u.x + .5, py: u.y + .5, hp: T.hp * m, maxHp: T.hp * m, dmg: T.dmg * lvMul(u.lv), cdT: Math.random() * 0.4, T };
  }

  function startBattle() {
    if (S.phase !== 'build' || S.over) return;
    if (!S.board.length) return log('先部署至少一台机甲');
    S.units = [...S.board.map(u => spawn(u, 0)), ...enemyArmy(S.wave).map(u => spawn(u, 1))];
    S.phase = 'battle'; S.battleT = 0; log(`第 ${S.wave} 波开战！`); render();
  }

  function stepBattle(dt) {
    S.battleT += dt;
    const alive = S.units.filter(u => u.hp > 0);
    for (const u of alive) {
      const foes = alive.filter(o => o.team !== u.team && o.hp > 0);
      if (!foes.length) break;
      const d = o => Math.hypot(o.px - u.px, o.py - u.py);
      if (u.T.heal) {
        const allies = alive.filter(o => o.team === u.team && o !== u && o.hp > 0 && o.hp < o.maxHp);
        const tgt = allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        u.cdT -= dt;
        if (tgt && d(tgt) <= u.T.range) { if (u.cdT <= 0) { u.cdT = u.T.cd; tgt.hp = Math.min(tgt.maxHp, tgt.hp + u.T.heal * lvMul(u.lv)); S.fx.push({ x1: u.px, y1: u.py, x2: tgt.px, y2: tgt.py, c: '#6fff9f', t: .2 }); } }
        else { const near = (tgt || foes.sort((a, b) => d(a) - d(b))[0]); moveToward(u, near, dt, tgt ? 0 : 2.5); }
        continue;
      }
      let tgt = u.T.assassin ? foes.sort((a, b) => (a.T.range > 2 ? 0 : 1) - (b.T.range > 2 ? 0 : 1) || d(a) - d(b))[0] : foes.sort((a, b) => d(a) - d(b))[0];
      u.cdT -= dt;
      if (d(tgt) > u.T.range) moveToward(u, tgt, dt, u.T.range * 0.9);
      else if (u.cdT <= 0) {
        u.cdT = u.T.cd;
        if (u.T.splash) for (const o of foes) { if (Math.hypot(o.px - tgt.px, o.py - tgt.py) <= u.T.splash) o.hp -= u.dmg * (o === tgt ? 1 : 0.5); }
        else tgt.hp -= u.dmg;
        S.fx.push({ x1: u.px, y1: u.py, x2: tgt.px, y2: tgt.py, c: u.team ? '#ff6b6b' : '#6bc7ff', t: .12, boom: !!u.T.splash });
      }
    }
    // 简单分离，避免叠在一起
    for (const a of alive) for (const b of alive) if (a !== b) {
      const dx = a.px - b.px, dy = a.py - b.py, dd = Math.hypot(dx, dy);
      if (dd < 0.7 && dd > 0.001) { a.px += dx / dd * (0.7 - dd) * 0.5; a.py += dy / dd * (0.7 - dd) * 0.5; }
    }
    for (const u of alive) { u.px = Math.max(.3, Math.min(N - .3, u.px)); u.py = Math.max(.3, Math.min(N - .3, u.py)); }
    const mine = S.units.filter(u => u.team === 0 && u.hp > 0).length, theirs = S.units.filter(u => u.team === 1 && u.hp > 0).length;
    if (!mine || !theirs || S.battleT > 45) endBattle(mine, theirs);
  }
  function moveToward(u, t, dt, stop) {
    const dx = t.px - u.px, dy = t.py - u.py, d = Math.hypot(dx, dy);
    if (d > stop) { u.px += dx / d * u.T.speed * dt; u.py += dy / d * u.T.speed * dt; }
  }

  function endBattle(mine, theirs) {
    S.phase = 'build';
    if (!theirs && mine) {
      const income = 8 + S.wave * 2 + Math.min(4, Math.floor(S.gold / 5));
      log(`✅ 第 ${S.wave} 波胜利！存活 ${mine} 台，获得 ${income} 能源`);
      if (S.wave >= WAVES) { S.over = true; log('🏆 全部 7 波击退！基地保住了！'); }
      S.wave++; S.gold += income;
    } else {
      const loss = 2 + theirs * 2;
      S.hp -= loss; S.gold += 6 + S.wave;
      log(`❌ 第 ${S.wave} 波失利，剩余敌人 ${theirs}，基地 -${loss}`);
      if (S.hp <= 0) { S.over = true; log('💥 基地被摧毁……刷新页面重来'); }
    }
    S.units = []; render();
  }

  function log(t) { S.log = t; $('log').textContent = t; }

  function render() {
    $('wave').textContent = `${Math.min(S.wave, WAVES)} / ${WAVES}`;
    $('gold').textContent = S.gold; $('hp').textContent = Math.max(0, S.hp);
    $('cap').textContent = `${S.board.length} / ${cap()}`;
    for (const k in TYPES) { const b = $('b_' + k); b.classList.toggle('sel', S.sel === k && !S.sell); b.disabled = S.phase !== 'build' || S.over; }
    $('bSell').classList.toggle('sel', S.sell); $('bSell').disabled = S.phase !== 'build' || S.over;
    $('bGo').disabled = S.phase !== 'build' || S.over;
    $('bGo').textContent = S.over ? (S.hp > 0 ? '🏆 胜利' : '💥 失败') : S.phase === 'battle' ? '战斗中…' : `⚔️ 开战（第 ${S.wave} 波）`;
  }

  function drawUnit(x, y, type, lv, team, hpFrac, boss) {
    const cx = x * CELL, cy = y * CELL;
    ctx.fillStyle = team ? '#5a2430' : '#1f3f5c';
    ctx.beginPath(); ctx.arc(cx, cy, CELL * (boss ? 0.45 : 0.36), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = team ? '#ff6b6b' : '#6bc7ff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = `${boss ? 30 : 24}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(TYPES[type].icon, cx, cy + 8);
    if (lv > 1) { ctx.fillStyle = '#ffcc4d'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('★'.repeat(lv - 1), cx, cy - CELL * 0.26); }
    if (hpFrac != null) { ctx.fillStyle = '#000a'; ctx.fillRect(cx - 22, cy + 22, 44, 5); ctx.fillStyle = team ? '#ff6b6b' : '#6fff9f'; ctx.fillRect(cx - 22, cy + 22, 44 * Math.max(0, hpFrac), 5); }
  }

  function draw() {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      ctx.fillStyle = y < N / 2 ? ((x + y) % 2 ? '#2a1f26' : '#2f2329') : ((x + y) % 2 ? '#1c2630' : '#212d38');
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
    ctx.fillStyle = '#ffcc4d33'; ctx.fillRect(0, N / 2 * CELL - 2, cv.width, 4);
    if (S.phase === 'build') {
      for (const u of S.board) drawUnit(u.x + .5, u.y + .5, u.type, u.lv, 0, null);
      ctx.fillStyle = '#ffffff55'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(S.over ? '' : '敌方阵地（开战后出现）', cv.width / 2, CELL * 2);
    } else {
      for (const u of S.units) if (u.hp > 0) drawUnit(u.px, u.py, u.type, u.lv, u.team, u.hp / u.maxHp, u.boss);
    }
    for (const f of S.fx) {
      ctx.strokeStyle = f.c; ctx.lineWidth = f.boom ? 3 : 2; ctx.globalAlpha = Math.min(1, f.t * 6);
      ctx.beginPath(); ctx.moveTo(f.x1 * CELL, f.y1 * CELL); ctx.lineTo(f.x2 * CELL, f.y2 * CELL); ctx.stroke();
      if (f.boom) { ctx.beginPath(); ctx.arc(f.x2 * CELL, f.y2 * CELL, CELL * 0.6, 0, Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    if (S.over) {
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(S.hp > 0 ? '🏆 防线坚不可摧！' : '💥 基地失守', cv.width / 2, cv.height / 2);
      ctx.font = '16px sans-serif'; ctx.fillText('刷新页面再来一局', cv.width / 2, cv.height / 2 + 32);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (S.phase === 'battle') { for (let i = 0; i < 2; i++) if (S.phase === 'battle') stepBattle(dt / 2); }
    for (const f of S.fx) f.t -= dt; S.fx = S.fx.filter(f => f.t > 0);
    draw(); requestAnimationFrame(loop);
  }
  render(); log('选择机甲，点击下半场部署。'); requestAnimationFrame(loop);
  window.__demo = { S, startBattle, TYPES };
})();
