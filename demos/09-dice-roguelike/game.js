// 骰运连连 — "筹码 × 倍率" 计分的 roguelike 构筑（趋势参考：2026 年仍大量涌现的 roguelike 计分构筑类，原创骰子规则）
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const TARGETS = [60, 130, 240, 400, 650, 1000, 1550, 2400];
  const HANDS = [
    { id: 'five', name: '五连', chips: 100, mult: 12 },
    { id: 'four', name: '四条', chips: 60, mult: 7 },
    { id: 'lstraight', name: '大顺', chips: 50, mult: 5 },
    { id: 'full', name: '葫芦', chips: 40, mult: 4 },
    { id: 'sstraight', name: '小顺', chips: 30, mult: 3 },
    { id: 'three', name: '三条', chips: 30, mult: 3 },
    { id: 'twopair', name: '两对', chips: 20, mult: 2 },
    { id: 'pair', name: '一对', chips: 10, mult: 2 },
    { id: 'high', name: '散点', chips: 5, mult: 1 },
  ];
  const CHARMS = [
    { id: 'six', name: '六六大顺', cost: 5, desc: '每颗 6 点额外 +8 筹码', fx: c => { c.chips += 8 * c.dice.filter(d => d === 6).length; } },
    { id: 'odd', name: '单数俱乐部', cost: 6, desc: '每颗奇数骰 +1 倍率', fx: c => { c.mult += c.dice.filter(d => d % 2).length; } },
    { id: 'gourd', name: '葫芦藤', cost: 6, desc: '葫芦：倍率 ×2', fx: c => { if (c.hand.id === 'full') c.mult *= 2; } },
    { id: 'wind', name: '顺风耳', cost: 5, desc: '小顺/大顺：+4 倍率', fx: c => { if (c.hand.id.includes('straight')) c.mult += 4; } },
    { id: 'glove', name: '赌徒手套', cost: 5, desc: '每次出手 +1 次重掷', passive: true },
    { id: 'extra', name: '加时赛', cost: 7, desc: '每轮 +1 次出手', passive: true },
    { id: 'small', name: '小确幸', cost: 4, desc: '散点/一对：+25 筹码', fx: c => { if (['high', 'pair'].includes(c.hand.id)) c.chips += 25; } },
    { id: 'interest', name: '利滚利', cost: 6, desc: '每持有 $5 +1 倍率', fx: c => { c.mult += Math.floor(S.money / 5); } },
    { id: 'collector', name: '护符收藏家', cost: 6, desc: '每个护符 +2 倍率', fx: c => { c.mult += 2 * S.charms.length; } },
    { id: 'lastshot', name: '最后一搏', cost: 6, desc: '本轮最后一次出手：倍率 ×3', fx: c => { if (S.hands === 1) c.mult *= 3; } },
    { id: 'twins', name: '双子星', cost: 6, desc: '两对/四条：倍率 ×2', fx: c => { if (['twopair', 'four'].includes(c.hand.id)) c.mult *= 2; } },
    { id: 'one', name: '一点灵犀', cost: 5, desc: '每颗 1 点 +4 倍率', fx: c => { c.mult += 4 * c.dice.filter(d => d === 1).length; } },
    { id: 'big', name: '大数据', cost: 5, desc: '骰子点数总和 ≥ 22：+30 筹码', fx: c => { if (c.dice.reduce((a, b) => a + b, 0) >= 22) c.chips += 30; } },
  ];

  const S = { round: 0, score: 0, hands: 3, rerolls: 2, money: 4, dice: [1, 1, 1, 1, 1], held: [false, false, false, false, false], charms: [], shop: [], phase: 'play', rolled: false };
  const has = id => S.charms.some(c => c.id === id);
  const handsPerRound = () => 3 + (has('extra') ? 1 : 0);
  const rerollsPerHand = () => 2 + (has('glove') ? 1 : 0);

  function classify(d) {
    const cnt = {}; d.forEach(x => cnt[x] = (cnt[x] || 0) + 1);
    const counts = Object.values(cnt).sort((a, b) => b - a);
    const uniq = [...new Set(d)].sort((a, b) => a - b).join('');
    if (counts[0] === 5) return HANDS[0];
    if (counts[0] === 4) return HANDS[1];
    if (uniq === '12345' || uniq === '23456') return HANDS[2];
    if (counts[0] === 3 && counts[1] === 2) return HANDS[3];
    if (/1234|2345|3456/.test(uniq)) return HANDS[4];
    if (counts[0] === 3) return HANDS[5];
    if (counts[0] === 2 && counts[1] === 2) return HANDS[6];
    if (counts[0] === 2) return HANDS[7];
    return HANDS[8];
  }

  function evaluate() {
    const hand = classify(S.dice);
    const c = { dice: S.dice.slice(), hand, chips: hand.chips + S.dice.reduce((a, b) => a + b, 0), mult: hand.mult };
    for (const ch of S.charms) if (ch.fx) ch.fx(c);
    c.total = Math.round(c.chips * c.mult);
    return c;
  }

  function roll(all) {
    for (let i = 0; i < 5; i++) if (all || !S.held[i]) S.dice[i] = 1 + ((Math.random() * 6) | 0);
    renderDice(true);
  }

  function startRound() {
    S.score = 0; S.hands = handsPerRound(); S.rerolls = rerollsPerHand(); S.phase = 'play';
    S.held = S.held.map(() => false);
    $('shop').style.display = 'none';
    roll(true); log(`第 ${S.round + 1} 轮开始，目标 ${TARGETS[S.round]} 分。`); render();
  }

  function doReroll() {
    if (S.phase !== 'play' || S.rerolls <= 0 || S.held.every(Boolean)) return;
    S.rerolls--; roll(false); render();
  }

  function doScore() {
    if (S.phase !== 'play') return;
    const c = evaluate();
    S.score += c.total; S.hands--;
    log(`${c.hand.name}：${c.chips} 筹码 × ${c.mult} 倍率 = ${c.total} 分`);
    if (S.score >= TARGETS[S.round]) return clearRound();
    if (S.hands <= 0) { S.phase = 'over'; log(`💀 没能达到 ${TARGETS[S.round]} 分。止步第 ${S.round + 1} 轮。`); render(); showRestart(); return; }
    S.rerolls = rerollsPerHand(); S.held = S.held.map(() => false); roll(true); render();
  }

  function clearRound() {
    const reward = 4 + S.hands * 2 + Math.min(5, Math.floor(S.money / 5));
    S.money += reward;
    if (S.round >= TARGETS.length - 1) { S.phase = 'won'; log(`🏆 通关全部 ${TARGETS.length} 轮！最终护符：${S.charms.map(c => c.name).join('、') || '无'}`); render(); showRestart(); return; }
    S.phase = 'shop';
    log(`🎉 过关！获得 $${reward}（含剩余出手奖励与利息）`);
    rollShop(); $('shop').style.display = 'block'; render();
  }

  function showRestart() {
    const b = document.createElement('button'); b.textContent = '🔁 重新开始'; b.onclick = () => location.reload();
    $('log').appendChild(document.createElement('br')); $('log').appendChild(b);
  }

  function rollShop() {
    const pool = CHARMS.filter(c => !has(c.id));
    S.shop = [];
    while (S.shop.length < 3 && pool.length) S.shop.push(pool.splice((Math.random() * pool.length) | 0, 1)[0]);
    renderShop();
  }
  function buy(i) {
    const c = S.shop[i]; if (!c || S.money < c.cost || S.charms.length >= 5) return;
    S.money -= c.cost; S.charms.push(c); S.shop.splice(i, 1); renderShop(); render();
  }
  function sell(i) { const c = S.charms[i]; S.money += Math.floor(c.cost / 2); S.charms.splice(i, 1); render(); renderShop(); }

  function log(t) { $('log').textContent = t; }

  function renderDice(anim) {
    const el = $('dice'); el.innerHTML = '';
    S.dice.forEach((d, i) => {
      const x = document.createElement('div');
      x.className = 'die' + (S.held[i] ? ' held' : '') + (anim && !S.held[i] ? ' rolling' : '');
      x.textContent = FACES[d]; x.title = d + ' 点';
      x.onclick = () => { if (S.phase !== 'play') return; S.held[i] = !S.held[i]; renderDice(false); render(); };
      el.appendChild(x);
    });
  }
  function renderShop() {
    $('shopItems').innerHTML = '';
    S.shop.forEach((c, i) => {
      const d = document.createElement('div'); d.className = 'charm';
      d.innerHTML = `<div class="n">${c.name} · $${c.cost}</div><div>${c.desc}</div>`;
      const b = document.createElement('button'); b.textContent = '购买'; b.disabled = S.money < c.cost || S.charms.length >= 5; b.onclick = () => buy(i);
      d.appendChild(b); $('shopItems').appendChild(d);
    });
    $('bReshop').disabled = S.money < 2;
  }
  function render() {
    $('round').textContent = `${S.round + 1} / ${TARGETS.length}`;
    $('target').textContent = TARGETS[S.round];
    $('score').textContent = S.score;
    $('hands').textContent = S.hands;
    $('rerolls').textContent = S.rerolls;
    $('money').textContent = '$' + S.money;
    $('bReroll').disabled = S.phase !== 'play' || S.rerolls <= 0;
    $('bScore').disabled = S.phase !== 'play';
    if (S.phase === 'play') {
      const c = evaluate();
      $('preview').innerHTML = `当前牌型：<b>${c.hand.name}</b>　预计 <b>${c.chips}</b> × <i>${c.mult}</i> = <b>${c.total}</b> 分`;
    } else $('preview').textContent = '';
    $('mine').innerHTML = S.charms.length ? '' : '<span style="opacity:.6;font-size:13px">还没有护符</span>';
    S.charms.forEach((c, i) => {
      const d = document.createElement('div'); d.className = 'charm';
      d.innerHTML = `<div class="n">${c.name}</div><div>${c.desc}</div>`;
      const b = document.createElement('button'); b.className = 'blue'; b.textContent = `卖出 +$${Math.floor(c.cost / 2)}`; b.onclick = () => sell(i);
      d.appendChild(b); $('mine').appendChild(d);
    });
  }

  $('table').innerHTML = HANDS.map(h => `<tr><td>${h.name}</td><td>${h.chips} 筹码</td><td>×${h.mult}</td></tr>`).join('') + '<tr><td colspan="3">所有骰子点数之和也计入筹码</td></tr>';
  $('bReroll').onclick = doReroll; $('bScore').onclick = doScore;
  $('bNext').onclick = () => { if (S.phase === 'shop') { S.round++; startRound(); } };
  $('bReshop').onclick = () => { if (S.money >= 2 && S.phase === 'shop') { S.money -= 2; rollShop(); render(); } };
  addEventListener('keydown', e => {
    if (/^Digit[1-5]$/.test(e.code) && S.phase === 'play') { const i = +e.code.slice(5) - 1; S.held[i] = !S.held[i]; renderDice(false); render(); }
    if (e.code === 'KeyR') doReroll();
    if (e.code === 'Enter') doScore();
  });
  startRound();
  window.__demo = { S, classify, evaluate, doScore, doReroll };
})();
