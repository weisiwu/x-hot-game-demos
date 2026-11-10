// 刮刮大亨 Scratch Tycoon — 刮刮卡增量游戏：5 种卡、特殊符号、自动刮卡机、里程碑、成就、转生
// 趋势参考：Discord 2026-10-01 周榜上的刮刮卡增量游戏（原创实现，全部为虚构游戏币）
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cv = $('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const foil = document.createElement('canvas'); foil.width = W; foil.height = H;
  const fctx = foil.getContext('2d', { willReadFrequently: true });
  const GOAL = 1e6;
  const MILESTONES = [100, 1000, 10000, 100000, 1e6];
  const TIERS = [
    { name: '铜卡', cost: 2, color: '#c97b3a', unlock: 0 },
    { name: '银卡', cost: 10, color: '#9fb4c7', unlock: 80 },
    { name: '金卡', cost: 60, color: '#e0b43a', unlock: 800 },
    { name: '钻石卡', cost: 400, color: '#6fe0ff', unlock: 12000 },
    { name: '传奇卡', cost: 3000, color: '#ff6fd8', unlock: 150000 },
  ];
  const MULTS = [1, 2, 5, 20, 100];
  const BASEP = [0.22, 0.09, 0.035, 0.011, 0.0012];
  const DEF = { tutorialSeen: false, money: 30, tier: 0, luck: 0, brush: 0, auto: 0, speed: 0, gold: 0, cards: 0, lifetime: 0, stars: 0, bestWin: 0, milestone: 0, ach: {}, wonOnce: false, bankrupt: 0, prestiges: 0 };
  const SAVE = XG.save('04-scratch-tycoon', DEF);
  const S = SAVE.data;
  const GX = 25, GY = 85, CW = 120, CH = 100, GAP = 15;
  let card = null, autoT = 0, saveT = 0, playing = false;

  const fmt = n => '$' + (n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : Math.floor(n).toLocaleString());
  const luckMul = () => 1 + 0.08 * S.luck;
  const prizeMul = () => 1 + 0.05 * S.stars;
  const cost = {
    luck: () => Math.round(8 * Math.pow(2.2, S.luck)),
    brush: () => Math.round(10 * Math.pow(3, S.brush)),
    auto: () => Math.round(80 * Math.pow(2.7, S.auto)),
    speed: () => Math.round(400 * Math.pow(3, S.speed)),
    gold: () => Math.round(400 * Math.pow(3.5, S.gold)),
  };
  const MAX = { luck: 12, brush: 4, auto: 10, speed: 5, gold: 4 };
  const ACH = [
    { id: 'first', name: '首次中奖', test: () => S.bestWin > 0 },
    { id: 'c100', name: '刮了 100 张', test: () => S.cards >= 100 },
    { id: 'c1000', name: '刮了 1000 张', test: () => S.cards >= 1000 },
    { id: 'big', name: '中过 100 倍大奖', test: () => S.ach.bigHit },
    { id: 'gem', name: '刮出钻石格', test: () => S.ach.gemHit },
    { id: 'k10', name: '身家过万', test: () => S.money >= 1e4 },
    { id: 'mil', name: '百万富翁', test: () => S.wonOnce },
    { id: 'pre', name: '转生一次', test: () => S.prestiges > 0 },
  ];

  function rollOutcome(t) {
    const m = luckMul();
    let r = Math.random(), win = -1;
    for (let i = MULTS.length - 1; i >= 0; i--) { const p = BASEP[i] * m; if (r < p) { win = i; break; } r -= p; }
    const clover = Math.random() < 0.05 + 0.01 * S.gold;
    const gem = Math.random() < 0.004 + 0.002 * S.gold;
    const cells = [], counts = MULTS.map(() => 0);
    if (win >= 0) { for (let k = 0; k < 3; k++) cells.push(win); counts[win] = 3; }
    while (cells.length < 9) { const i = (Math.random() * MULTS.length) | 0; if (i === win || counts[i] >= 2) continue; counts[i]++; cells.push(i); }
    XG.shuffle(cells);
    const cloverCell = clover ? (Math.random() * 9) | 0 : -1;
    let gemCell = gem ? (Math.random() * 9) | 0 : -1; if (gemCell === cloverCell) gemCell = -1;
    const c = TIERS[t].cost;
    let prize = win >= 0 ? c * MULTS[win] * (clover ? 2 : 1) : 0;
    if (gemCell >= 0) prize += c * 25;
    prize = Math.round(prize * prizeMul());
    return { tier: t, cells, win, clover, cloverCell, gemCell, prize, done: false };
  }

  function unlockedTier(i) { return S.lifetime >= TIERS[i].unlock; }
  function buyCard(t) {
    if (!playing || G.paused || (card && !card.done)) return;
    const c = TIERS[t].cost;
    if (!unlockedTier(t) || S.money < c) { XG.audio.sfx('error'); return; }
    S.money -= c; S.tier = t; S.cards++;
    card = rollOutcome(t); drawFoil(); $('result').textContent = '刮开涂层看看吧！'; XG.audio.sfx('card'); render();
  }
  function drawFoil() {
    fctx.globalCompositeOperation = 'source-over'; fctx.clearRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) {
      const x = GX + (i % 3) * (CW + GAP), y = GY + ((i / 3) | 0) * (CH + GAP);
      const g = fctx.createLinearGradient(x, y, x + CW, y + CH);
      g.addColorStop(0, '#b8bec6'); g.addColorStop(.5, '#eef1f4'); g.addColorStop(1, '#9aa1aa');
      fctx.fillStyle = g; fctx.fillRect(x, y, CW, CH);
      fctx.fillStyle = '#8890998a'; fctx.font = 'bold 30px sans-serif'; fctx.textAlign = 'center'; fctx.fillText('?', x + CW / 2, y + CH / 2 + 10);
    }
  }
  function scratchAt(x, y) {
    if (!card || card.done) return;
    fctx.globalCompositeOperation = 'destination-out';
    fctx.beginPath(); fctx.arc(x, y, 16 + S.brush * 11, 0, Math.PI * 2); fctx.fill();
    XG.audio.sfxThrottled('scratch', 60);
  }
  function revealedFraction() {
    const w = CW * 3 + GAP * 2, d = fctx.getImageData(GX, GY, w, CH * 3 + GAP * 2).data;
    let clear = 0, total = 0;
    for (let i = 0; i < d.length; i += 4 * 9) {
      const px = (i / 4) % w, py = ((i / 4) / w) | 0;
      if ((px % (CW + GAP)) >= CW || (py % (CH + GAP)) >= CH) continue;
      total++; if (d[i + 3] < 30) clear++;
    }
    return total ? clear / total : 0;
  }
  function settle(o, manual) {
    o.done = true;
    let prize = o.prize;
    if (manual && prize > 0) prize = Math.round(prize * 1.25); // 手刮奖励 +25%
    S.money += prize; S.lifetime += prize;
    if (prize > S.bestWin) S.bestWin = prize;
    if (o.win === 4) S.ach.bigHit = true;
    if (o.gemCell >= 0) S.ach.gemHit = true;
    if (manual) {
      fctx.clearRect(0, 0, W, H);
      if (prize > 0) {
        const ratio = prize / TIERS[o.tier].cost;
        $('result').textContent = `🎉 中奖 ${fmt(prize)}${o.clover ? ' · 🍀翻倍' : ''}${o.gemCell >= 0 ? ' · 💎头奖格' : ''}（含手刮 +25%）`;
        XG.audio.sfx(ratio >= 20 ? 'win' : ratio >= 5 ? 'levelup' : 'coin');
        if (ratio >= 20) burst(60);
      } else { $('result').textContent = '😶 没中，再来一张？'; XG.audio.sfx('click'); }
    }
    afterChange();
  }
  let particles = [];
  function burst(n) { for (let i = 0; i < n; i++) particles.push({ x: W / 2, y: H / 2, vx: (Math.random() - .5) * 500, vy: (Math.random() - .8) * 500, life: 1.4, c: XG.pick(['#ffe066', '#ff6fd8', '#6fe0ff', '#fff']) }); }

  function afterChange() {
    // 里程碑
    while (S.milestone < MILESTONES.length && S.money >= MILESTONES[S.milestone]) {
      S.milestone++; XG.audio.sfx('powerup'); XG.toast(`🏁 达成里程碑 ${fmt(MILESTONES[S.milestone - 1])}！`);
    }
    for (const a of ACH) if (!S.ach['a_' + a.id] && a.test()) { S.ach['a_' + a.id] = true; XG.toast('🏅 成就解锁：' + a.name); }
    if (S.money >= GOAL && !S.wonOnce) { S.wonOnce = true; SAVE.write(); return winScreen(); }
    // 破产：买不起最便宜的卡、没有进行中的卡
    if (S.money < TIERS[0].cost && (!card || card.done)) { SAVE.write(); return bankrupt(); }
    render();
  }
  function starsGain() { return Math.floor(Math.sqrt(S.lifetime / 20000)); }
  function winScreen() {
    playing = false; burst(120);
    G.end({ win: true, title: '🏆 百万富翁！', sub: `你用 ${S.cards} 张刮刮卡赚到了 ${fmt(S.money)}。可以继续无尽模式，或者转生换取永久加成的幸运星。`,
      stats: [['累计收入', fmt(S.lifetime)], ['最大单张奖金', fmt(S.bestWin)], ['转生可得幸运星', '⭐' + starsGain()]],
      buttons: [{ label: '♾ 继续刮（无尽）', primary: true, id: 'xgAgain', onClick: () => G.start() }, { label: '🌟 转生', onClick: () => prestige() }, { label: '🏠 菜单', onClick: () => G.menu() }] });
  }
  function bankrupt() {
    playing = false; S.bankrupt++;
    G.end({ win: false, title: '💸 破产了', sub: '口袋里的钱连一张铜卡都买不起了。运气是会变的，升级幸运能让期望收益转正。',
      stats: [['已刮卡片', S.cards], ['破产次数', S.bankrupt]],
      buttons: [{ label: '🙏 领 $10 救济金继续', primary: true, id: 'xgAgain', onClick: () => { S.money += 10; SAVE.write(); G.start(); } }, { label: '🔄 重新开始', onClick: () => { resetRun(false); G.start(); } }, { label: '🏠 菜单', onClick: () => G.menu() }] });
  }
  function resetRun(keepStars) {
    const stars = keepStars ? S.stars : 0, ach = S.ach, pre = S.prestiges, seen = S.tutorialSeen, won = S.wonOnce;
    Object.assign(S, JSON.parse(JSON.stringify(DEF)), { stars, ach, prestiges: pre, tutorialSeen: seen, wonOnce: keepStars ? won : won });
    card = null; SAVE.write();
  }
  function prestige() {
    const g = starsGain();
    if (g <= 0) { XG.toast('累计收入至少 $20,000 才能转生'); return; }
    const total = S.stars + g;
    resetRun(true); S.stars = total; S.prestiges++; SAVE.write();
    XG.audio.sfx('levelup'); XG.toast(`🌟 转生成功！幸运星 ${total}，所有奖金 +${total * 5}%`);
    G.start();
  }

  function drawCard() {
    ctx.clearRect(0, 0, W, H);
    const tier = card ? TIERS[card.tier] : TIERS[S.tier];
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, tier.color); g.addColorStop(1, '#00000080');
    ctx.fillStyle = tier.color; ctx.fillRect(0, 0, W, H); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0006'; ctx.fillRect(10, 10, W - 20, H - 20);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${tier.name} · ${fmt(tier.cost)}`, W / 2, 46);
    ctx.font = '12px sans-serif'; ctx.fillText('三个相同金额即中奖 · 🍀 奖金翻倍 · 💎 额外 25 倍', W / 2, 68);
    if (!card) { ctx.font = 'bold 20px sans-serif'; ctx.fillText('在右侧买一张卡开始', W / 2, H / 2); ctx.font = '14px sans-serif'; ctx.fillText('（手机上在下方）', W / 2, H / 2 + 26); return; }
    for (let i = 0; i < 9; i++) {
      const x = GX + (i % 3) * (CW + GAP), y = GY + ((i / 3) | 0) * (CH + GAP), mi = card.cells[i];
      const isWin = card.done && mi === card.win;
      ctx.fillStyle = isWin ? '#fff3a8' : '#f4f1e6'; ctx.fillRect(x, y, CW, CH);
      ctx.fillStyle = isWin ? '#d12' : '#333'; ctx.font = 'bold 22px sans-serif';
      ctx.fillText(fmt(tier.cost * MULTS[mi]), x + CW / 2, y + CH / 2 + 8);
      if (i === card.cloverCell) { ctx.font = '22px sans-serif'; ctx.fillText('🍀', x + CW - 18, y + 24); }
      if (i === card.gemCell) { ctx.font = '22px sans-serif'; ctx.fillText('💎', x + 18, y + 24); }
    }
    ctx.drawImage(foil, 0, 0);
  }

  let down = false, moves = 0, lastP = null;
  cv.addEventListener('pointerdown', e => { if (!playing || G.paused) return; down = true; lastP = XG.canvasPos(cv, e); scratchAt(lastP.x, lastP.y); try { cv.setPointerCapture(e.pointerId); } catch (_) { /* 合成事件 */ } });
  cv.addEventListener('pointermove', e => {
    if (!down || !playing || G.paused) return;
    const p = XG.canvasPos(cv, e), steps = Math.ceil(Math.hypot(p.x - lastP.x, p.y - lastP.y) / 6);
    for (let k = 1; k <= steps; k++) scratchAt(lastP.x + (p.x - lastP.x) * k / steps, lastP.y + (p.y - lastP.y) * k / steps);
    lastP = p;
    if (++moves % 8 === 0 && card && !card.done && revealedFraction() > 0.62) settle(card, true);
  });
  const up = () => { if (!down) return; down = false; if (card && !card.done && revealedFraction() > 0.62) settle(card, true); };
  window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  window.addEventListener('keydown', e => { if (G.state === 'play' && e.code === 'Space') { e.preventDefault(); if (!card || card.done) buyCard(S.tier); } });

  function upgrade(k) {
    const c = cost[k]();
    if (S.money < c || S[k] >= MAX[k]) { XG.audio.sfx('error'); return; }
    S.money -= c; S[k]++; XG.audio.sfx('powerup'); SAVE.write(); afterChange();
  }
  ['luck', 'brush', 'auto', 'speed', 'gold'].forEach(k => { $('u' + k[0].toUpperCase() + k.slice(1)).onclick = () => upgrade(k); });
  TIERS.forEach((t, i) => { const b = document.createElement('button'); b.id = 't' + i; b.onclick = () => buyCard(i); $('tiers').appendChild(b); });

  function setBtn(b, html, dis, sel) { if (b.innerHTML !== html) b.innerHTML = html; if (b.disabled !== dis) b.disabled = dis; b.classList.toggle('sel', !!sel); }
  function render() {
    $('big').textContent = fmt(S.money);
    $('count').textContent = S.cards.toLocaleString(); $('stars').textContent = '⭐' + S.stars;
    const next = MILESTONES[Math.min(S.milestone, MILESTONES.length - 1)];
    $('nextGoal').textContent = S.milestone >= MILESTONES.length ? '已全部达成' : fmt(next);
    $('goalFill').style.width = Math.min(100, Math.log10(Math.max(1, S.money)) / 6 * 100) + '%';
    const busy = card && !card.done;
    TIERS.forEach((t, i) => setBtn($('t' + i), unlockedTier(i) ? `${t.name} ${fmt(t.cost)}` : `🔒 ${t.name}<br><small>累计 ${fmt(t.unlock)}</small>`, busy || !unlockedTier(i) || S.money < t.cost, i === S.tier));
    const autoRate = S.auto * 0.35 * (1 + 0.5 * S.speed);
    const lab = {
      luck: `🍀 幸运 Lv${S.luck}<br><small>中奖率 ×${luckMul().toFixed(2)}</small>`, brush: `🖌️ 大刷子 Lv${S.brush}<br><small>刮得更快</small>`,
      auto: `🤖 自动刮卡机 ×${S.auto}<br><small>${autoRate.toFixed(1)} 张/秒（当前卡种）</small>`, speed: `⚡ 刮卡机提速 Lv${S.speed}`,
      gold: `✨ 金色涂层 Lv${S.gold}<br><small>🍀/💎 出现率提高</small>`,
    };
    for (const k of Object.keys(MAX)) { const maxed = S[k] >= MAX[k]; setBtn($('u' + k[0].toUpperCase() + k.slice(1)), maxed ? lab[k] + ' （满级）' : `${lab[k]} — ${fmt(cost[k]())}`, maxed || S.money < cost[k]()); }
    const achHtml = ACH.map(a => (S.ach['a_' + a.id] ? '✅ ' : '⬜ ') + a.name).join('<br>');
    if ($('ach').innerHTML !== achHtml) $('ach').innerHTML = achHtml;
  }

  let last = performance.now(), uiT = 0;
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (playing && !G.paused) {
      if (S.auto > 0) {
        autoT += dt * S.auto * 0.35 * (1 + 0.5 * S.speed);
        let n = 0;
        while (autoT >= 1 && n < 200) {
          autoT -= 1; n++;
          const t = S.tier, c = TIERS[t].cost;
          if (S.money >= c) { S.money -= c; S.cards++; const o = rollOutcome(t); o.done = true; S.money += o.prize; S.lifetime += o.prize; if (o.prize > S.bestWin) S.bestWin = o.prize; if (o.win === 4) S.ach.bigHit = true; if (o.gemCell >= 0) S.ach.gemHit = true; }
        }
        if (n) { if (S.money < TIERS[0].cost && (!card || card.done)) afterChange(); else if (S.money >= GOAL && !S.wonOnce) afterChange(); }
      }
      if (!S.wonOnce && S.money >= GOAL) afterChange();
      saveT += dt; if (saveT > 4) { saveT = 0; SAVE.write(); }
    }
    drawCard();
    for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, p.life); ctx.fillRect(p.x, p.y, 6, 6); }
    ctx.globalAlpha = 1; particles = particles.filter(p => p.life > 0);
    uiT += dt; if (uiT > 0.2) { uiT = 0; render(); afterChangeLight(); }
    requestAnimationFrame(loop);
  }
  function afterChangeLight() { if (!playing) return; while (S.milestone < MILESTONES.length && S.money >= MILESTONES[S.milestone]) { S.milestone++; XG.toast(`🏁 达成里程碑 ${fmt(MILESTONES[S.milestone - 1])}！`); XG.audio.sfx('powerup'); } }

  const G = XG.game({
    id: '04-scratch-tycoon', title: '🎟️ 刮刮大亨', subtitle: '从 $30 起步，刮出百万身家！升级幸运、刷子和自动刮卡机，解锁更贵的卡种。进度自动保存。（纯虚构游戏币）',
    cover: '../../assets/04-scratch-tycoon/cover.svg', music: 'upbeat', save: SAVE,
    tutorial: [
      { title: '刮卡', text: '买一张卡，然后在卡面上<b>按住鼠标来回刮</b>。刮开约 60% 自动结算。九宫格里出现 <b>3 个相同金额</b>就赢得该金额。手刮的中奖额外 +25%。空格键 = 再买一张当前卡种。', touch: '手指在卡面上来回涂抹。' },
      { title: '特殊符号', text: '🍀 让这张卡奖金翻倍；💎 头奖格额外送 25 倍卡价。', touch: '' },
      { title: '升级与期望', text: '一开始期望收益略小于 1（会慢慢亏）。买 <b>幸运</b> 后中奖率提高，期望收益就会转正。<b>自动刮卡机</b>会按当前选中的卡种自动刮。累计收入达标后解锁更贵的卡。', touch: '' },
      { title: '目标', text: '依次达成 $100 → $1,000 → $10,000 → $100,000 → <b>$1,000,000</b> 通关。之后可以继续无尽模式，或者<b>转生</b>：清空进度，换取永久增加奖金的幸运星。没钱买卡就算破产。', touch: '' },
    ],
    onStart: () => { playing = true; card = card && !card.done ? card : null; if (!card) drawFoil(); render(); },
    onRestart: () => { resetRun(true); playing = true; render(); },
    onPause: () => { SAVE.write(); },
    onQuit: () => { playing = false; SAVE.write(); },
    onMenu: () => menu(),
    pauseInfo: () => `现金 ${fmt(S.money)} · 已刮 ${S.cards} 张（进度已自动保存；“重新开始本局”会清空金钱与升级，保留幸运星）`,
  });
  function menu() {
    playing = false;
    G.menu(`<div class="xg-stats"><span>现金</span><b>${fmt(S.money)}</b><span>累计收入</span><b>${fmt(S.lifetime)}</b><span>已刮卡片</span><b>${S.cards.toLocaleString()}</b><span>幸运星</span><b>⭐${S.stars}</b></div>`, [
      { label: S.cards ? '▶ 继续刮' : '▶ 开始游戏', primary: true, id: 'xgStart', onClick: () => G.start() },
      { label: '🌟 转生', disabled: starsGain() <= 0, onClick: () => prestige() },
      { label: '📖 教程', onClick: () => G.tutorial(menu) },
      { label: '🗑 清空存档', onClick: () => { if (confirm('确定清空刮刮大亨的全部存档？')) { SAVE.reset(); card = null; menu(); } } },
    ]);
  }
  XG.fit(cv, { reserve: () => XG.landscape() && window.innerWidth > 700 ? { w: 330, h: 90 } : { w: 0, h: XG.landscape() ? 90 : 420 }, maxScale: 1.3 });
  drawFoil(); render(); menu();
  requestAnimationFrame(loop);
  window.__demo = { G, S, get card() { return card; }, buyCard, settle, rollOutcome, upgrade, prestige };
})();
