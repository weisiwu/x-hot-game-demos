// 刮刮大亨 — 刮刮卡 + 增量升级（趋势参考：Discord 2026-10-01 周榜上的刮刮卡增量类游戏）
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cv = $('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const foil = document.createElement('canvas'); foil.width = W; foil.height = H;
  const fctx = foil.getContext('2d');
  const GOAL = 1e6;
  const TIERS = [
    { name: '铜卡', cost: 2, color: '#c97b3a' },
    { name: '银卡', cost: 15, color: '#9fb4c7' },
    { name: '金卡', cost: 100, color: '#e0b43a' },
    { name: '钻石卡', cost: 800, color: '#6fe0ff' },
    { name: '传奇卡', cost: 6000, color: '#ff6fd8' },
  ];
  const MULTS = [1, 2, 5, 20, 100];
  const BASEP = [0.22, 0.10, 0.04, 0.012, 0.0015];
  const S = { money: 20, tier: 0, luck: 0, brush: 0, auto: 0, speed: 0, cards: 0, card: null, won: false, autoT: 0, relief: 0 };
  const GX = 25, GY = 85, CW = 120, CH = 100, GAP = 15;

  const fmt = n => '$' + Math.floor(n).toLocaleString();
  const luckMul = () => 1 + 0.18 * S.luck;
  const cost = {
    luck: () => Math.round(10 * Math.pow(2.4, S.luck)),
    brush: () => Math.round(8 * Math.pow(3, S.brush)),
    auto: () => Math.round(40 * Math.pow(2.6, S.auto)),
    speed: () => Math.round(150 * Math.pow(3, S.speed)),
  };
  const MAX = { luck: 12, brush: 4, auto: 10, speed: 5 };

  function rollOutcome(tier) {
    const m = luckMul();
    let r = Math.random(), win = -1;
    for (let i = MULTS.length - 1; i >= 0; i--) { const p = BASEP[i] * m; if (r < p) { win = i; break; } r -= p; }
    const clover = Math.random() < 0.05 + 0.005 * S.luck;
    // 生成九宫格：中奖金额恰好出现 3 次，其他金额最多 2 次
    const cells = [];
    const counts = MULTS.map(() => 0);
    if (win >= 0) { for (let k = 0; k < 3; k++) cells.push(win); counts[win] = 3; }
    while (cells.length < 9) {
      const i = (Math.random() * MULTS.length) | 0;
      if (i === win || counts[i] >= 2) continue;
      counts[i]++; cells.push(i);
    }
    for (let i = cells.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [cells[i], cells[j]] = [cells[j], cells[i]]; }
    const cloverCell = clover ? (Math.random() * 9) | 0 : -1;
    const prize = win >= 0 ? TIERS[tier].cost * MULTS[win] * (clover ? 2 : 1) : 0;
    return { tier, cells, win, clover, cloverCell, prize };
  }

  function buyCard(t) {
    if (S.card && !S.card.done) return;
    const c = TIERS[t].cost;
    if (S.money < c) return;
    S.money -= c; S.tier = t;
    S.card = rollOutcome(t); S.card.done = false; S.cards++;
    drawFoil(); $('result').textContent = '刮开涂层看看吧！';
    render();
  }

  function drawFoil() {
    fctx.globalCompositeOperation = 'source-over';
    fctx.clearRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) {
      const x = GX + (i % 3) * (CW + GAP), y = GY + ((i / 3) | 0) * (CH + GAP);
      const g = fctx.createLinearGradient(x, y, x + CW, y + CH);
      g.addColorStop(0, '#b8bec6'); g.addColorStop(.5, '#e6eaef'); g.addColorStop(1, '#9aa1aa');
      fctx.fillStyle = g; fctx.fillRect(x, y, CW, CH);
      fctx.fillStyle = '#8890998a'; fctx.font = 'bold 28px sans-serif'; fctx.textAlign = 'center'; fctx.fillText('?', x + CW / 2, y + CH / 2 + 10);
    }
  }

  function scratchAt(x, y) {
    if (!S.card || S.card.done) return;
    fctx.globalCompositeOperation = 'destination-out';
    fctx.beginPath(); fctx.arc(x, y, 14 + S.brush * 10, 0, Math.PI * 2); fctx.fill();
  }

  function revealedFraction() {
    const d = fctx.getImageData(GX, GY, CW * 3 + GAP * 2, CH * 3 + GAP * 2).data;
    let clear = 0, total = 0;
    const w = CW * 3 + GAP * 2;
    for (let i = 0; i < d.length; i += 4 * 9) {
      const px = (i / 4) % w, py = ((i / 4) / w) | 0;
      const inCell = (px % (CW + GAP)) < CW && (py % (CH + GAP)) < CH;
      if (!inCell) continue;
      total++; if (d[i + 3] < 30) clear++;
    }
    return total ? clear / total : 0;
  }

  function settle(card, manual) {
    card.done = true;
    S.money += card.prize;
    if (manual) {
      fctx.clearRect(0, 0, W, H);
      $('result').textContent = card.prize > 0
        ? `🎉 中奖！${fmt(card.prize)}${card.clover ? '（🍀 翻倍）' : ''}`
        : '😶 没中，再来一张？';
    }
    checkEnd();
  }

  function checkEnd() {
    if (S.money >= GOAL && !S.won) {
      S.won = true;
      const r = $('result');
      r.innerHTML = `🏆 恭喜成为刮刮大亨！共刮了 ${S.cards} 张卡。<br><button onclick="location.reload()" style="width:auto">重新开始</button>`;
      r.style.fontSize = '20px';
    }
    // 破产保护：没钱也没卡时给一点低保
    if (S.money < TIERS[0].cost && (!S.card || S.card.done) && S.auto === 0) {
      S.money += 5; S.relief++;
      $('result').textContent = '💸 你破产了……街坊塞给你 $5 低保。';
    }
  }

  function drawCard() {
    ctx.clearRect(0, 0, W, H);
    const tier = S.card ? TIERS[S.card.tier] : TIERS[S.tier];
    ctx.fillStyle = tier.color; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0006'; ctx.fillRect(10, 10, W - 20, H - 20);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${tier.name} · ${fmt(tier.cost)}`, W / 2, 46);
    ctx.font = '12px sans-serif'; ctx.fillText('三个相同金额即中奖 · 🍀 奖金翻倍', W / 2, 68);
    if (!S.card) {
      ctx.font = 'bold 20px sans-serif'; ctx.fillText('← 在右侧买一张卡开始', W / 2, H / 2);
      return;
    }
    for (let i = 0; i < 9; i++) {
      const x = GX + (i % 3) * (CW + GAP), y = GY + ((i / 3) | 0) * (CH + GAP);
      const mi = S.card.cells[i];
      const isWin = S.card.done && mi === S.card.win;
      ctx.fillStyle = isWin ? '#fff3a8' : '#f4f1e6'; ctx.fillRect(x, y, CW, CH);
      ctx.fillStyle = isWin ? '#d12' : '#333'; ctx.font = 'bold 24px sans-serif';
      ctx.fillText(fmt(tier.cost * MULTS[mi]), x + CW / 2, y + CH / 2 + 8);
      if (i === S.card.cloverCell) { ctx.font = '22px sans-serif'; ctx.fillText('🍀', x + CW - 18, y + 24); }
    }
    ctx.drawImage(foil, 0, 0);
  }

  function pos(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
  let down = false, moves = 0, lastP = null;
  cv.addEventListener('pointerdown', e => { down = true; lastP = pos(e); scratchAt(lastP.x, lastP.y); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => {
    if (!down) return;
    const p = pos(e);
    // 沿路径插值，快速划动也不会漏
    const steps = Math.ceil(Math.hypot(p.x - lastP.x, p.y - lastP.y) / 6);
    for (let k = 1; k <= steps; k++) scratchAt(lastP.x + (p.x - lastP.x) * k / steps, lastP.y + (p.y - lastP.y) * k / steps);
    lastP = p;
    if (++moves % 8 === 0 && S.card && !S.card.done && revealedFraction() > 0.62) { settle(S.card, true); render(); }
  });
  addEventListener('pointerup', () => {
    down = false;
    if (S.card && !S.card.done && revealedFraction() > 0.62) { settle(S.card, true); render(); }
  });

  function upgrade(k) {
    const c = cost[k]();
    if (S.money < c || S[k] >= MAX[k]) return;
    S.money -= c; S[k]++; render();
  }
  $('uLuck').onclick = () => upgrade('luck');
  $('uBrush').onclick = () => upgrade('brush');
  $('uAuto').onclick = () => upgrade('auto');
  $('uSpeed').onclick = () => upgrade('speed');

  const tiersEl = $('tiers');
  TIERS.forEach((t, i) => { const b = document.createElement('button'); b.id = 't' + i; b.onclick = () => buyCard(i); tiersEl.appendChild(b); });

  function setBtn(b, txt, dis, sel) {
    if (b.textContent !== txt) b.textContent = txt;
    if (b.disabled !== dis) b.disabled = dis;
    b.classList.toggle('sel', !!sel);
  }
  function render() {
    $('big').textContent = fmt(S.money);
    $('count').textContent = S.cards;
    $('goalFill').style.width = Math.min(100, Math.log10(Math.max(1, S.money)) / 6 * 100) + '%';
    const busy = S.card && !S.card.done;
    TIERS.forEach((t, i) => setBtn($('t' + i), `${t.name} ${fmt(t.cost)}`, busy || S.money < t.cost, i === S.tier));
    const lab = { luck: `🍀 幸运 Lv${S.luck}（中奖率 ×${luckMul().toFixed(2)}）`, brush: `🖌️ 大刷子 Lv${S.brush}`, auto: `🤖 自动刮卡机 ×${S.auto}`, speed: `⚡ 刮卡机提速 Lv${S.speed}` };
    for (const k of ['luck', 'brush', 'auto', 'speed']) {
      const maxed = S[k] >= MAX[k];
      setBtn($('u' + k[0].toUpperCase() + k.slice(1)), maxed ? lab[k] + '（满级）' : `${lab[k]} — ${fmt(cost[k]())}`, maxed || S.money < cost[k]());
    }
  }

  let last = performance.now(), uiT = 0;
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    // 自动刮卡机：每台按周期刮当前选中卡种（钱够才刮）
    if (S.auto > 0) {
      S.autoT += dt * S.auto * (1 + 0.5 * S.speed);
      while (S.autoT >= 2) {
        S.autoT -= 2;
        const t = S.tier, c = TIERS[t].cost;
        if (S.money >= c) { S.money -= c; S.cards++; const o = rollOutcome(t); settle(o, false); }
      }
    }
    drawCard();
    if (!S.won && S.money >= GOAL) checkEnd();
    uiT += dt; if (uiT > 0.15) { uiT = 0; render(); }
    requestAnimationFrame(loop);
  }
  drawFoil(); render(); requestAnimationFrame(loop);
  window.__demo = { S, buyCard, settle, rollOutcome };
})();
