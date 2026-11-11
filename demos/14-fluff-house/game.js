// 毛球小屋 Fluff House — 收集养成小屋：摆家具吸引毛球来访，赚莓果、收礼物、完成每日委托
// 灵感来源：2026 年 10 月 Next Fest 上的收集/养成向桌面小屋 demo（X 与 Steam 两侧都有讨论；原创实现）
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cv = $('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height, A = '../../assets/14-fluff-house/';
  const FLOORS = [190, 390, 585]; // 三层地板的 y
  const SLOTS = [[170, 0], [420, 0], [680, 0], [170, 1], [420, 1], [680, 1], [260, 2], [560, 2]].map(([x, f]) => ({ x, f, y: FLOORS[f], item: null }));
  const CRITTERS = [
    { id: 'c1', name: '桃团', likes: 'cushion', rate: 0.35, rare: 0 }, { id: 'c2', name: '芽团', likes: 'plant', rate: 0.4, rare: 0 },
    { id: 'c3', name: '云团', likes: 'hammock', rate: 0.45, rare: 0 }, { id: 'c4', name: '星团', likes: 'starlamp', rate: 0.55, rare: 1 },
    { id: 'c5', name: '围巾团', likes: 'yarn', rate: 0.6, rare: 1 }, { id: 'c6', name: '饼干团', likes: 'cookie', rate: 0.65, rare: 1 },
    { id: 'c7', name: '皇冠团', likes: 'throne', rate: 1.1, rare: 2, need: '同时有 4 只毛球在家' }, { id: 'c8', name: '月团', likes: 'moon', rate: 1.5, rare: 3, need: '第 6 天起才会出现' },
  ];
  const ITEMS = [
    { id: 'cushion', name: '软垫', icon: '🛋️', cost: 12 }, { id: 'plant', name: '盆栽', icon: '🪴', cost: 20 }, { id: 'hammock', name: '吊床', icon: '🛏️', cost: 32 },
    { id: 'starlamp', name: '星星灯', icon: '🌟', cost: 48 }, { id: 'yarn', name: '毛线篮', icon: '🧶', cost: 64 }, { id: 'cookie', name: '饼干罐', icon: '🍪', cost: 80 },
    { id: 'throne', name: '小王座', icon: '👑', cost: 160 }, { id: 'moon', name: '月光窗', icon: '🌙', cost: 240 },
  ];
  const GIFTS = ['🎀', '🧁', '🐚', '🍄', '🔔', '🧩', '🪁', '💎', '🌸', '🎐', '🪀', '🍩'];
  const DAYS = 10, DAY_LEN = 90;
  const IMG = {}; CRITTERS.forEach(c => IMG[c.id] = XG.img(`${A}${c.id}.webp`));
  const roomImg = XG.img(`${A}room.webp`);
  const SAVE = XG.save('14-fluff-house', { tutorialSeen: false, berries: 20, slots: Array(SLOTS.length).fill(null), album: {}, gifts: {}, unlocked: 1, stars: {}, pets: 0, done: false });
  const SV = SAVE.data;
  let S = null, sel = null;

  function reqsFor(day) {
    const pool = [];
    const common = CRITTERS.filter(c => c.rare <= Math.min(1, Math.floor(day / 3)));
    const host = XG.pick(day >= 8 ? CRITTERS.slice(4, 7) : day >= 5 ? CRITTERS.slice(2, 6) : common);
    pool.push({ type: 'host', c: host.id, text: `让「${host.name}」来做客` });
    pool.push({ type: 'berries', n: 60 + day * 60, text: `今天赚到 ${60 + day * 60} 颗莓果` });
    const pn = Math.round(5 + day * 3.5); pool.push({ type: 'pets', n: pn, text: `摸摸毛球 ${pn} 次` });
    pool.push({ type: 'gifts', n: 1 + Math.floor(day / 2), text: `收下 ${1 + Math.floor(day / 2)} 份礼物` });
    const gn = Math.min(8, 2 + Math.ceil(day * 0.7)); pool.push({ type: 'guests', n: gn, text: `同时有 ${gn} 只毛球在家` });
    if (day >= 6) pool.push({ type: 'host', c: 'c7', text: '请来「皇冠团」' });
    XG.shuffle(pool);
    const out = [pool[0]]; for (const r of pool) { if (out.length >= 3) break; if (!out.some(o => o.type === r.type)) out.push(r); }
    return out;
  }
  function startDay(day) {
    S = { day, t: DAY_LEN, earned: 0, pets: 0, giftsGot: 0, maxGuests: 0, guests: [], gifts: [], fx: [], reqs: reqsFor(day), over: false, arriveT: 1.5 };
    // 已摆好的家具会让一部分喜欢它的毛球一开门就在
    for (const c of CRITTERS) if (canCome(c) && Math.random() < 0.5) arrive(c, true);
    render();
  }
  const placed = id => SV.slots.includes(id);
  const home = id => S.guests.some(g => g.c.id === id);
  function canCome(c) {
    if (!placed(c.likes) || home(c.id)) return false;
    if (c.id === 'c7' && S.guests.length < 4) return false;
    if (c.id === 'c8' && S.day < 6) return false;
    return true;
  }
  function arrive(c, quiet) {
    const si = SV.slots.indexOf(c.likes), slot = SLOTS[si];
    S.guests.push({ c, x: slot.x + (Math.random() - .5) * 80, f: slot.f, vx: (Math.random() < .5 ? -1 : 1) * 20, bob: Math.random() * 6, petCD: 0, stay: 30 + Math.random() * 40 });
    if (!SV.album[c.id]) { SV.album[c.id] = true; if (!quiet) XG.toast(`📔 新毛球：${c.name}！`); }
    if (!quiet) { XG.audio.sfx('pop'); hint(`${c.name} 来做客了`); }
  }
  function hint(t) { $('hint').textContent = t; }

  function update(dt) {
    if (!S || S.over || G.paused) return;
    S.t -= dt;
    // 来访
    S.arriveT -= dt;
    if (S.arriveT <= 0) {
      S.arriveT = 2.5 + Math.random() * 2;
      const cand = CRITTERS.filter(canCome);
      if (cand.length) { const c = XG.pick(cand); if (Math.random() < [0.8, 0.6, 0.45, 0.3][c.rare]) arrive(c); }
    }
    for (const g of S.guests) {
      g.x += g.vx * dt; if (g.x < 80 || g.x > 820) g.vx *= -1; if (Math.random() < 0.01) g.vx = (Math.random() - .5) * 50;
      g.bob += dt * 4; if (g.petCD > 0) g.petCD -= dt;
      const earn = g.c.rate * dt; SV.berries += earn; S.earned += earn;
      g.stay -= dt;
      if (Math.random() < dt * 0.025 * (1 + g.c.rare * 0.5) && S.gifts.length < 4) S.gifts.push({ x: g.x, y: FLOORS[g.f] - 20, g: XG.pick(GIFTS), life: 14 });
    }
    // 久留的毛球会离开，给新访客腾位置
    const leaving = S.guests.filter(g => g.stay <= 0); if (leaving.length) { S.guests = S.guests.filter(g => g.stay > 0); hint(`${leaving[0].c.name} 回家了`); }
    S.maxGuests = Math.max(S.maxGuests, S.guests.length);
    for (const gf of S.gifts) gf.life -= dt; S.gifts = S.gifts.filter(g => g.life > 0);
    for (const f of S.fx) { f.life -= dt; f.y -= 30 * dt; } S.fx = S.fx.filter(f => f.life > 0);
    checkReqs();
    if (S.t <= 0) endDay();
  }
  function checkReqs() {
    for (const r of S.reqs) {
      if (r.done) continue;
      const ok = r.type === 'host' ? home(r.c) : r.type === 'berries' ? S.earned >= r.n : r.type === 'pets' ? S.pets >= r.n : r.type === 'gifts' ? S.giftsGot >= r.n : S.guests.length >= r.n;
      if (ok) { r.done = true; XG.audio.sfx('levelup'); XG.toast('✅ 委托完成：' + r.text); }
    }
  }
  function endDay() {
    S.over = true;
    const n = S.reqs.filter(r => r.done).length, win = n >= 2, key = 'D' + S.day;
    if (win) {
      SV.stars[key] = Math.max(SV.stars[key] || 0, n === 3 ? 3 : 2); SV.unlocked = Math.max(SV.unlocked, Math.min(DAYS, S.day + 1)); SV.berries += 20 * n;
      if (S.day === DAYS) SV.done = true;
    }
    SAVE.write();
    const albumN = Object.keys(SV.album).length, giftN = Object.keys(SV.gifts).length, last = S.day === DAYS;
    G.end({ win, title: win ? (last ? '🏡 小屋成了毛球们最爱的家！' : `🌙 第 ${S.day} 天圆满结束`) : '😿 委托没完成，毛球们有点失望', sub: `完成委托 ${n} / 3${win ? `，奖励 ${20 * n} 莓果` : '（至少要完成 2 个）'}`,
      stats: [['今日赚到莓果', Math.floor(S.earned)], ['最多同时在家', S.maxGuests], ['毛球图鉴', `${albumN} / ${CRITTERS.length}`], ['礼物图鉴', `${giftN} / ${GIFTS.length}`]],
      buttons: [...(win && !last ? [{ label: '▶ 下一天', primary: true, id: 'xgNext', onClick: () => G.start(S.day + 1) }] : []), { label: win ? '🔁 再过一次这一天' : '🔁 再试一次', primary: !win || last, id: 'xgAgain', onClick: () => G.start(S.day) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
  }

  // ---------- 交互 ----------
  cv.addEventListener('pointerdown', e => {
    if (!S || S.over || G.paused || G.state !== 'play') return;
    const p = XG.canvasPos(cv, e);
    for (const gf of S.gifts) if (Math.hypot(gf.x - p.x, gf.y - p.y) < 30) { gf.life = 0; S.giftsGot++; SV.gifts[gf.g] = true; SV.berries += 3; S.earned += 3; XG.audio.sfx('coin'); S.fx.push({ x: gf.x, y: gf.y, s: gf.g + ' +3', life: 1 }); return render(); }
    for (const g of S.guests) {
      const gy = FLOORS[g.f] - 46;
      if (Math.hypot(g.x - p.x, gy - p.y) < 48) {
        if (g.petCD > 0) return;
        g.petCD = 3; S.pets++; SV.pets++; SV.berries += 1; S.earned += 1; g.stay += 6; XG.audio.sfx('heal');
        S.fx.push({ x: g.x, y: gy - 40, s: '💗', life: 1 }); return render();
      }
    }
    for (let i = 0; i < SLOTS.length; i++) {
      const s = SLOTS[i];
      if (Math.abs(p.x - s.x) < 55 && p.y > s.y - 80 && p.y < s.y + 10) return placeAt(i);
    }
  });
  function placeAt(i) {
    if (!sel) { hint('先在右侧选一件家具，再点空位摆放。点已摆好的家具会显示它吸引谁。'); const it = SV.slots[i]; if (it) { const c = CRITTERS.find(c => c.likes === it); hint(`${ITEMS.find(x => x.id === it).name} 会吸引「${c.name}」${c.need ? '（' + c.need + '）' : ''}`); } return; }
    const it = ITEMS.find(x => x.id === sel);
    if (placed(sel)) { hint(`${it.name} 已经摆过了`); return; }
    if (SV.berries < it.cost) { XG.audio.sfx('error'); hint('莓果不够'); return; }
    const old = SV.slots[i];
    if (old) { SV.berries += Math.floor(ITEMS.find(x => x.id === old).cost / 2); S.guests = S.guests.filter(g => g.c.likes !== old); }
    SV.berries -= it.cost; SV.slots[i] = sel; sel = null; XG.audio.sfx('thud'); SAVE.write();
    const c = CRITTERS.find(c => c.likes === it.id); hint(`摆好了 ${it.icon}${it.name}，等「${c.name}」来做客吧${c.need ? '（' + c.need + '）' : ''}`);
    render();
  }

  // ---------- 绘制 ----------
  function draw() {
    if (XG.ready(roomImg)) ctx.drawImage(roomImg, 0, 0, W, H); else { ctx.fillStyle = '#6a4632'; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = 'rgba(40,20,20,.18)'; ctx.fillRect(0, 0, W, H);
    for (const y of FLOORS) { ctx.fillStyle = '#8a5a34'; ctx.fillRect(30, y, W - 60, 12); ctx.fillStyle = '#a8703f'; ctx.fillRect(30, y, W - 60, 4); }
    ctx.textAlign = 'center';
    SLOTS.forEach((s, i) => {
      const it = SV.slots[i];
      if (it) { ctx.font = '54px sans-serif'; ctx.fillText(ITEMS.find(x => x.id === it).icon, s.x, s.y - 8); }
      else { ctx.strokeStyle = sel ? 'rgba(255,207,122,.9)' : 'rgba(255,255,255,.35)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeRect(s.x - 45, s.y - 74, 90, 70); ctx.setLineDash([]); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '12px sans-serif'; ctx.fillText(sel ? '点这里摆放' : '空位', s.x, s.y - 34); }
    });
    if (!S) return;
    for (const g of S.guests) {
      const y = FLOORS[g.f] - 4 - Math.abs(Math.sin(g.bob)) * 6, im = IMG[g.c.id];
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(g.x, FLOORS[g.f], 34, 7, 0, 0, Math.PI * 2); ctx.fill();
      if (XG.ready(im)) { ctx.save(); ctx.translate(g.x, y); if (g.vx < 0) ctx.scale(-1, 1); ctx.drawImage(im, -46, -88, 92, 92); ctx.restore(); }
      else { ctx.fillStyle = '#ffb6d5'; ctx.beginPath(); ctx.arc(g.x, y - 36, 34, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.fillText(g.c.name, g.x, y + 14);
    }
    ctx.font = '26px sans-serif';
    for (const gf of S.gifts) { ctx.globalAlpha = Math.min(1, gf.life); ctx.fillText(gf.g, gf.x, gf.y + Math.sin(performance.now() / 200) * 3); }
    ctx.globalAlpha = 1; ctx.font = 'bold 16px sans-serif';
    for (const f of S.fx) { ctx.globalAlpha = Math.max(0, f.life); ctx.fillStyle = '#fff'; ctx.fillText(f.s, f.x, f.y); }
    ctx.globalAlpha = 1;
  }
  function render() {
    if (!S) return;
    $('day').textContent = `${S.day} / ${DAYS} 天`; $('time').textContent = XG.fmtTime(Math.max(0, S.t)); $('berries').textContent = Math.floor(SV.berries); $('guests').textContent = S.guests.length;
    $('reqs').innerHTML = S.reqs.map(r => `<div class="${r.done ? 'done' : ''}">${r.done ? '✅' : '⬜'} ${r.text}</div>`).join('');
    const box = $('shop');
    if (!box.children.length) ITEMS.forEach(it => { const b = document.createElement('button'); b.id = 'i_' + it.id; b.onclick = () => { sel = sel === it.id ? null : it.id; XG.audio.sfx('click'); hint(sel ? `选中 ${it.name}，点画面里的空位摆放` : ''); render(); }; box.appendChild(b); });
    ITEMS.forEach(it => { const b = $('i_' + it.id), c = CRITTERS.find(c => c.likes === it.id); const own = placed(it.id); const html = `${it.icon} ${it.name} ${own ? '✔' : '🍓' + it.cost}<br><small>吸引 ${SV.album[c.id] ? c.name : '？？？'}</small>`; if (b.innerHTML !== html) b.innerHTML = html; b.disabled = own || SV.berries < it.cost; b.classList.toggle('sel', sel === it.id); });
  }
  $('bAlbum').onclick = () => {
    const was = G.state === 'play'; if (was) G.pause(true);
    G.open(`<h2>📔 图鉴</h2><div class="xg-body center"><b>毛球</b><br>${CRITTERS.map(c => SV.album[c.id] ? `<span style="display:inline-block;margin:4px;text-align:center"><img src="${A}${c.id}.webp" style="width:56px;height:56px"><br>${c.name}</span>` : `<span style="display:inline-block;margin:4px;opacity:.4;width:56px">❔<br>？？？</span>`).join('')}<br><b>礼物</b><br><span style="font-size:26px;letter-spacing:4px">${GIFTS.map(g => SV.gifts[g] ? g : '▫️').join('')}</span></div>`,
      [{ label: '关闭', primary: true, id: 'xgAlbumClose', onClick: () => { if (was) G.resume(); else menu(); } }]);
    if (was) G.setState('paused');
  };

  const G = XG.game({
    id: '14-fluff-house', title: '🏡 毛球小屋', subtitle: '摆家具、等毛球来做客：赚莓果、收礼物、完成访客委托，把小屋变成毛球们最爱的家。',
    cover: '../../assets/14-fluff-house/cover.webp', music: 'cozy', save: SAVE,
    tutorial: [
      { title: '摆家具', text: '在右侧选一件家具，再点小屋里的<b>虚线空位</b>摆放。每件家具会吸引一种毛球来做客。', touch: '点家具按钮，再点空位。' },
      { title: '毛球与莓果', text: '在家的毛球会持续产出 🍓 莓果。<b>点毛球摸摸它</b>：多给 1 颗莓果，还会让它多待一会儿。毛球偶尔会掉礼物，<b>点礼物</b>收进图鉴。', touch: '直接点毛球和礼物。' },
      { title: '每日委托', text: '每天 90 秒，有 3 个访客委托，<b>完成 2 个</b>就算过关（3 个全完成得 3 星）。稀有毛球有特殊条件，比如皇冠团要家里同时有 4 只毛球。', touch: '' },
      { title: '目标', text: '撑过 10 天、集齐 8 只毛球和 12 件礼物。莓果、家具和图鉴都会自动保存。', touch: '' },
    ],
    onStart: d => { startDay(d == null ? Math.min(SV.unlocked, DAYS) : d); },
    onRestart: () => startDay(S.day),
    onQuit: () => { if (S) S.over = true; SAVE.write(); },
    onPause: () => SAVE.write(),
    onMenu: () => menu(),
    pauseInfo: () => S ? `第 ${S.day} 天 · 委托 ${S.reqs.filter(r => r.done).length}/3` : '',
  });
  function menu() {
    const stars = Object.values(SV.stars).reduce((a, b) => a + b, 0);
    G.menu(`<div class="xg-stats"><span>进度</span><b>第 ${SV.unlocked} / ${DAYS} 天</b><span>星星</span><b>${stars} / ${DAYS * 3}</b><span>毛球图鉴</span><b>${Object.keys(SV.album).length} / ${CRITTERS.length}</b><span>礼物图鉴</span><b>${Object.keys(SV.gifts).length} / ${GIFTS.length}</b><span>莓果</span><b>${Math.floor(SV.berries)}</b></div>`, [
      { label: `▶ 开门营业：第 ${Math.min(SV.unlocked, DAYS)} 天`, primary: true, id: 'xgStart', onClick: () => G.start(Math.min(SV.unlocked, DAYS)) },
      { label: '🗓 选择天数', id: 'xgLevels', onClick: () => G.levelSelect(Array.from({ length: DAYS }, (_, i) => ({ name: `第 ${i + 1} 天`, locked: i + 1 > SV.unlocked, stars: SV.stars['D' + (i + 1)] || 0 })), i => G.start(i + 1), '选择天数') },
      { label: '📖 教程', onClick: () => G.tutorial(menu) },
    ]);
  }
  XG.fit(cv, { reserve: () => XG.landscape() && window.innerWidth > 700 ? { w: 300, h: 70 } : { w: 0, h: XG.landscape() ? 70 : 480 }, maxScale: 1.2 });
  menu();
  let last = performance.now(), uiT = 0;
  function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); draw(); uiT += dt; if (uiT > 0.25) { uiT = 0; render(); } requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__demo = { G, SV, get S() { return S; }, CRITTERS, ITEMS, SLOTS, startDay, update, endDay, placeAt, setSel: v => { sel = v; } };
})();
