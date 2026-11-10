// 骰运连连 Dice Gambit — "筹码 × 倍率" 计分的骰子 roguelike：8 轮 + Boss 规则、20 个护符、符咒、难度、续玩存档、无尽模式
// 趋势参考：2026 年仍大量涌现的 roguelike 计分构筑类（原创骰子规则）
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const BASE_TARGETS = [60, 140, 260, 420, 650, 950, 1350, 1650];
  const BOSSES = {
    2: { name: '🚫 禁一', desc: '点数为 1 的骰子不计分', id: 'noOne' },
    5: { name: '🪨 沉重', desc: '每次出手重掷次数 -1', id: 'heavy' },
    7: { name: '👑 骰王', desc: '只能出手 2 次，目标 ×1.15', id: 'king' },
  };
  const HANDS = [
    { id: 'five', name: '五连', chips: 100, mult: 12 }, { id: 'four', name: '四条', chips: 60, mult: 7 },
    { id: 'lstraight', name: '大顺', chips: 50, mult: 5 }, { id: 'full', name: '葫芦', chips: 40, mult: 4 },
    { id: 'sstraight', name: '小顺', chips: 30, mult: 3 }, { id: 'three', name: '三条', chips: 30, mult: 3 },
    { id: 'twopair', name: '两对', chips: 20, mult: 2 }, { id: 'pair', name: '一对', chips: 10, mult: 2 }, { id: 'high', name: '散点', chips: 5, mult: 1 },
  ];
  const sum = d => d.reduce((a, b) => a + b, 0);
  const CHARMS = [
    { id: 'six', name: '六六大顺', cost: 5, desc: '每颗 6 点 +8 筹码', fx: c => { c.chips += 8 * c.dice.filter(d => d === 6).length; } },
    { id: 'odd', name: '单数俱乐部', cost: 6, desc: '每颗奇数骰 +1 倍率', fx: c => { c.mult += c.dice.filter(d => d % 2).length; } },
    { id: 'even', name: '双数联盟', cost: 6, desc: '每颗偶数骰 +6 筹码', fx: c => { c.chips += 6 * c.dice.filter(d => d % 2 === 0).length; } },
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
    { id: 'big', name: '大数据', cost: 5, desc: '点数和 ≥ 22：+30 筹码', fx: c => { if (sum(c.dice) >= 22) c.chips += 30; } },
    { id: 'three', name: '三生万物', cost: 6, desc: '三条/葫芦/四条：+3 倍率', fx: c => { if (['three', 'full', 'four'].includes(c.hand.id)) c.mult += 3; } },
    { id: 'first', name: '开门红', cost: 5, desc: '每轮第一次出手：+40 筹码', fx: c => { if (S.hands === S.handsMax) c.chips += 40; } },
    { id: 'frugal', name: '节俭', cost: 5, desc: '没用重掷就出手：倍率 ×1.5', fx: c => { if (S.rerolls === S.rerollsMax) c.mult *= 1.5; } },
    { id: 'rich', name: '富贵命', cost: 7, desc: '过关奖励 +$3', passive: true },
    { id: 'lucky7', name: '幸运七', cost: 6, rare: true, desc: '点数和是 7 的倍数：倍率 ×2.5', fx: c => { if (sum(c.dice) % 7 === 0) c.mult *= 2.5; } },
    { id: 'chaos', name: '混沌骰', cost: 8, rare: true, desc: '五颗全不同：倍率 ×3', fx: c => { if (new Set(c.dice).size === 5) c.mult *= 3; } },
  ];
  const SPELLS = [
    { id: 'x2', name: '🔥 加倍符', cost: 4, desc: '下一次出手倍率 ×2' },
    { id: 'six', name: '🎯 定点符', cost: 3, desc: '把一颗未锁定的骰子变成 6' },
    { id: 'reroll', name: '🌀 回旋符', cost: 3, desc: '本次出手 +2 次重掷' },
  ];
  const SAVE = XG.save('09-dice-roguelike', { tutorialSeen: false, run: null, best: 0, wins: 0, runs: 0, seen: {}, hardWins: 0, endlessBest: 0 });
  const SV = SAVE.data;
  let S = null;
  const charmById = id => CHARMS.find(c => c.id === id);
  const has = id => S.charms.includes(id);
  const boss = () => BOSSES[S.round] && !S.endless ? BOSSES[S.round] : (S.endless && S.round % 3 === 2 ? Object.values(BOSSES)[S.round % 3] : null);
  const target = () => { const r = S.round; const base = r < 8 ? BASE_TARGETS[r] : Math.round(1650 * Math.pow(1.45, r - 7)); return Math.round(base * (S.hard ? 1.35 : 1) * (boss() && boss().id === 'king' ? 1.15 : 1)); };
  const handsPerRound = () => boss() && boss().id === 'king' ? 2 : 3 + (has('extra') ? 1 : 0);
  const rerollsPerHand = () => Math.max(0, 2 + (has('glove') ? 1 : 0) - (boss() && boss().id === 'heavy' ? 1 : 0));

  function classify(d) {
    const cnt = {}; d.forEach(x => cnt[x] = (cnt[x] || 0) + 1);
    const counts = Object.values(cnt).sort((a, b) => b - a), uniq = [...new Set(d)].sort((a, b) => a - b).join('');
    if (counts[0] === 5) return HANDS[0]; if (counts[0] === 4) return HANDS[1];
    if (uniq === '12345' || uniq === '23456') return HANDS[2];
    if (counts[0] === 3 && counts[1] === 2) return HANDS[3];
    if (/1234|2345|3456/.test(uniq)) return HANDS[4];
    if (counts[0] === 3) return HANDS[5]; if (counts[0] === 2 && counts[1] === 2) return HANDS[6]; if (counts[0] === 2) return HANDS[7];
    return HANDS[8];
  }
  function evaluate() {
    const hand = classify(S.dice), b = boss();
    const pipDice = b && b.id === 'noOne' ? S.dice.filter(x => x !== 1) : S.dice;
    const c = { dice: S.dice.slice(), hand, chips: hand.chips + sum(pipDice), mult: hand.mult };
    if (b && b.id === 'noOne' && S.dice.includes(1)) { c.chips -= 0; }
    for (const id of S.charms) { const ch = charmById(id); if (ch.fx) ch.fx(c); }
    if (S.x2) c.mult *= 2;
    c.mult = Math.round(c.mult * 10) / 10;
    c.total = Math.round(c.chips * c.mult);
    return c;
  }

  function newRun(hard) {
    S = { round: 0, score: 0, hands: 3, handsMax: 3, rerolls: 2, rerollsMax: 2, money: 4, dice: [1, 1, 1, 1, 1], held: [false, false, false, false, false], charms: [], spells: [], shop: [], phase: 'play', hard: !!hard, endless: false, x2: false, best: 0 };
    SV.runs++; SAVE.write(); startRound();
  }
  function saveRun() { SV.run = JSON.parse(JSON.stringify(S)); SAVE.write(); }
  function startRound() {
    S.score = 0; S.hands = S.handsMax = handsPerRound(); S.rerolls = S.rerollsMax = rerollsPerHand(); S.phase = 'play'; S.x2 = false;
    S.held = S.held.map(() => false);
    $('shop').style.display = 'none';
    roll(true);
    const b = boss();
    log(`第 ${S.round + 1} 轮开始，目标 ${target()} 分。${b ? 'Boss 规则：' + b.desc : ''}`);
    if (b) XG.audio.sfx('alarm');
    saveRun(); render();
  }
  function roll(all) {
    for (let i = 0; i < 5; i++) if (all || !S.held[i]) S.dice[i] = 1 + ((Math.random() * 6) | 0);
    XG.audio.sfx('dice'); renderDice(true);
  }
  function doReroll() {
    if (!S || S.phase !== 'play' || G.paused || S.rerolls <= 0 || S.held.every(Boolean)) return;
    S.rerolls--; roll(false); render();
  }
  function doScore() {
    if (!S || S.phase !== 'play' || G.paused) return;
    const c = evaluate();
    S.score += c.total; S.hands--; S.x2 = false;
    log(`${c.hand.name}：${c.chips} 筹码 × ${c.mult} 倍率 = ${c.total} 分`);
    XG.audio.sfx(c.total >= target() * 0.5 ? 'levelup' : 'coin');
    if (S.score >= target()) return clearRound();
    if (S.hands <= 0) return gameOver();
    S.rerolls = S.rerollsMax = rerollsPerHand(); S.held = S.held.map(() => false); roll(true); render();
  }
  function clearRound() {
    const reward = 4 + S.hands * 2 + Math.min(5, Math.floor(S.money / 5)) + (has('rich') ? 3 : 0) + (boss() ? 3 : 0);
    S.money += reward; S.best = Math.max(S.best, S.round + 1);
    if (S.round + 1 > SV.best) SV.best = S.round + 1;
    if (!S.endless && S.round >= BASE_TARGETS.length - 1) {
      S.phase = 'won'; SV.wins++; if (S.hard) SV.hardWins++; SV.run = null; SAVE.write(); render();
      return G.end({ win: true, title: `🏆 连过 8 轮！${S.hard ? '（困难）' : ''}`, sub: '要不要试试无尽模式，看你能走多远？',
        stats: [['护符', S.charms.map(id => charmById(id).name).join('、') || '无'], ['通关次数', SV.wins], ['最远轮次', SV.best]],
        buttons: [{ label: '♾ 继续无尽模式', primary: true, id: 'xgEndless', onClick: () => { G.close(); G.setState('play'); S.endless = true; S.phase = 'shop'; S.round++; openShop(); } }, { label: '🔁 新的一局', id: 'xgAgain', onClick: () => G.start('new') }, { label: '🏠 菜单', onClick: () => G.menu() }] });
    }
    log(`🎉 过关！获得 $${reward}`);
    S.round++; S.phase = 'shop'; openShop();
  }
  function gameOver() {
    S.phase = 'over'; SV.run = null;
    if (S.endless) SV.endlessBest = Math.max(SV.endlessBest, S.round + 1);
    SAVE.write(); render();
    G.end({ win: false, title: '💀 运气用完了', sub: `第 ${S.round + 1} 轮只拿到 ${S.score} / ${target()} 分。`, stats: [['到达轮次', S.round + 1], ['历史最远', SV.best], ['无尽最远', SV.endlessBest]],
      buttons: [{ label: '🔁 新的一局', primary: true, id: 'xgAgain', onClick: () => G.start(S.hard ? 'hard' : 'new') }, { label: '🏠 菜单', onClick: () => G.menu() }] });
  }

  function openShop() {
    const pool = CHARMS.filter(c => !has(c.id) && (!c.rare || Math.random() < 0.5));
    XG.shuffle(pool);
    S.shop = pool.slice(0, 3).map(c => ({ kind: 'charm', id: c.id }));
    S.shop.push({ kind: 'spell', id: XG.pick(SPELLS).id });
    $('shop').style.display = 'block'; saveRun(); renderShop(); render();
  }
  function buy(i) {
    const it = S.shop[i]; if (!it) return;
    const def = it.kind === 'charm' ? charmById(it.id) : SPELLS.find(s => s.id === it.id);
    if (S.money < def.cost) return XG.audio.sfx('error');
    if (it.kind === 'charm' && S.charms.length >= 5) return XG.toast('护符已满（可先卖出一个）');
    if (it.kind === 'spell' && S.spells.length >= 2) return XG.toast('符咒最多带 2 个');
    S.money -= def.cost; (it.kind === 'charm' ? S.charms : S.spells).push(it.id); S.shop.splice(i, 1);
    if (it.kind === 'charm') SV.seen[it.id] = true;
    XG.audio.sfx('coin'); saveRun(); renderShop(); render();
  }
  function sell(i) { const ch = charmById(S.charms[i]); S.money += Math.floor(ch.cost / 2); S.charms.splice(i, 1); XG.audio.sfx('card'); saveRun(); renderShop(); render(); }
  function useSpell(i) {
    if (S.phase !== 'play' || G.paused) return;
    const id = S.spells[i];
    if (id === 'x2') { if (S.x2) return; S.x2 = true; log('🔥 下一次出手倍率 ×2'); }
    if (id === 'six') { const k = S.dice.findIndex((d, j) => !S.held[j] && d !== 6); if (k < 0) return XG.toast('没有可以改的骰子'); S.dice[k] = 6; renderDice(false); }
    if (id === 'reroll') { S.rerolls += 2; }
    S.spells.splice(i, 1); XG.audio.sfx('powerup'); render();
  }
  function log(t) { $('log').textContent = t; }

  function renderDice(anim) {
    const el = $('dice'); el.innerHTML = ''; const b = boss();
    S.dice.forEach((d, i) => {
      const x = document.createElement('div');
      x.className = 'die' + (S.held[i] ? ' held' : '') + (anim && !S.held[i] ? ' rolling' : '') + (b && b.id === 'noOne' && d === 1 ? ' banned' : '');
      x.textContent = FACES[d]; x.title = d + ' 点';
      x.onclick = () => { if (S.phase !== 'play' || G.paused) return; S.held[i] = !S.held[i]; XG.audio.sfx('click'); renderDice(false); render(); };
      el.appendChild(x);
    });
  }
  function renderShop() {
    const box = $('shopItems'); box.innerHTML = '';
    S.shop.forEach((it, i) => {
      const def = it.kind === 'charm' ? charmById(it.id) : SPELLS.find(s => s.id === it.id);
      const d = document.createElement('div'); d.className = 'charm' + (def.rare ? ' rare' : '');
      d.innerHTML = `<div class="n">${it.kind === 'spell' ? '' : '🧿 '}${def.name} · $${def.cost}</div><div>${def.desc}</div>`;
      const b = document.createElement('button'); b.textContent = '购买'; b.disabled = S.money < def.cost; b.onclick = () => buy(i);
      d.appendChild(b); box.appendChild(d);
    });
    $('bReshop').disabled = S.money < 2;
  }
  function render() {
    if (!S) return;
    const b = boss();
    $('round').textContent = `${S.round + 1}${S.endless ? '（无尽）' : ' / 8'}`; $('target').textContent = target(); $('score').textContent = S.score;
    $('hands').textContent = S.hands; $('rerolls').textContent = S.rerolls; $('money').textContent = '$' + S.money;
    $('boss').textContent = b ? `${b.name} Boss 轮：${b.desc}` : (S.hard ? '困难模式：目标 ×1.35' : '');
    $('bReroll').disabled = S.phase !== 'play' || S.rerolls <= 0; $('bScore').disabled = S.phase !== 'play';
    if (S.phase === 'play') { const c = evaluate(); $('preview').innerHTML = `当前：<b>${c.hand.name}</b>　<b>${c.chips}</b> × <i>${c.mult}</i> = <b>${c.total}</b> 分${S.x2 ? ' 🔥' : ''}`; }
    else $('preview').textContent = S.phase === 'shop' ? '🛍 买点护符再出发吧' : '';
    $('mine').innerHTML = S.charms.length ? '' : '<span style="opacity:.6;font-size:13px">还没有护符</span>';
    S.charms.forEach((id, i) => {
      const c = charmById(id), d = document.createElement('div'); d.className = 'charm' + (c.rare ? ' rare' : '');
      d.innerHTML = `<div class="n">${c.name}</div><div>${c.desc}</div>`;
      const bt = document.createElement('button'); bt.className = 'blue'; bt.textContent = `卖出 +$${Math.floor(c.cost / 2)}`; bt.onclick = () => sell(i);
      d.appendChild(bt); $('mine').appendChild(d);
    });
    $('spells').innerHTML = S.spells.length ? '' : '<span style="opacity:.6;font-size:13px">无</span>';
    S.spells.forEach((id, i) => {
      const s = SPELLS.find(x => x.id === id), d = document.createElement('div'); d.className = 'charm';
      d.innerHTML = `<div class="n">${s.name}</div><div>${s.desc}</div>`;
      const bt = document.createElement('button'); bt.textContent = '使用'; bt.disabled = S.phase !== 'play'; bt.onclick = () => useSpell(i);
      d.appendChild(bt); $('spells').appendChild(d);
    });
  }

  $('table').innerHTML = HANDS.map(h => `<tr><td>${h.name}</td><td>${h.chips} 筹码</td><td>×${h.mult}</td></tr>`).join('') + '<tr><td colspan="3">五颗骰子的点数之和也计入筹码</td></tr>';
  $('bReroll').onclick = doReroll; $('bScore').onclick = doScore;
  $('bNext').onclick = () => { if (S && S.phase === 'shop') { XG.audio.sfx('select'); startRound(); } };
  $('bReshop').onclick = () => { if (S && S.money >= 2 && S.phase === 'shop') { S.money -= 2; openShop(); } };
  window.addEventListener('keydown', e => {
    if (G.state !== 'play' || !S) return;
    if (/^Digit[1-5]$/.test(e.code) && S.phase === 'play') { const i = +e.code.slice(5) - 1; S.held[i] = !S.held[i]; renderDice(false); render(); }
    if (e.code === 'KeyR') doReroll(); if (e.code === 'Enter') doScore();
  });

  const G = XG.game({
    id: '09-dice-roguelike', title: '🎲 骰运连连', subtitle: '掷骰凑牌型，筹码 × 倍率冲高分！连过 8 轮（含 3 个 Boss 轮）就通关，商店里的护符会彻底改变计分规则。',
    cover: '../../assets/09-dice-roguelike/cover.webp', music: 'mystery', save: SAVE,
    tutorial: [
      { title: '掷骰与锁定', text: '每次出手先掷 5 颗骰子。<b>点击骰子锁定</b>（或按 1–5），再点「重掷」只重掷没锁定的骰子。每次出手有 2 次重掷机会。', touch: '直接点骰子和按钮。' },
      { title: '计分', text: '点「计分出手」按牌型得分：<b>(牌型筹码 + 点数和) × 倍率</b>。每轮有 3 次出手，累计达到目标分就过关。', touch: '' },
      { title: '护符与符咒', text: '过关后进商店：<b>护符</b>永久改变计分（最多 5 个，可半价卖出）；<b>符咒</b>是一次性道具。剩余出手次数和存款会带来额外奖励。', touch: '' },
      { title: 'Boss 轮与存档', text: '第 3、6、8 轮是 Boss 轮，有特殊限制。每轮开始自动存档，下次打开可以继续。通关后还能玩无尽模式。', touch: '' },
    ],
    onStart: mode => { if (mode === 'continue' && SV.run) { S = SV.run; S.phase === 'shop' ? ($('shop').style.display = 'block', renderShop(), renderDice(false), render()) : startRound(); } else newRun(mode === 'hard'); },
    onRestart: () => newRun(S && S.hard),
    onQuit: () => { if (S && S.phase !== 'over' && S.phase !== 'won') saveRun(); },
    onMenu: () => menu(),
    pauseInfo: () => S ? `第 ${S.round + 1} 轮 · ${S.score}/${target()} 分（进度在每轮开始时自动保存）` : '',
  });
  function menu() {
    const btns = [];
    if (SV.run) btns.push({ label: `▶ 继续：第 ${SV.run.round + 1} 轮`, primary: true, id: 'xgContinue', onClick: () => G.start('continue') });
    btns.push({ label: '🎲 新的一局（普通）', primary: !SV.run, id: 'xgStart', onClick: () => G.start('new') });
    btns.push({ label: '🔥 困难模式', id: 'xgHard', onClick: () => G.start('hard') });
    btns.push({ label: '📖 教程', onClick: () => G.tutorial(menu) });
    const seen = Object.keys(SV.seen).length;
    G.menu(`<div class="xg-stats"><span>通关（困难）</span><b>${SV.wins}（${SV.hardWins}）</b><span>最远轮次</span><b>${SV.best}</b><span>无尽最远</span><b>${SV.endlessBest}</b><span>护符图鉴</span><b>${seen} / ${CHARMS.length}</b></div>`, btns);
  }
  menu();
  window.__demo = { G, SV, get S() { return S; }, classify, evaluate, doScore, doReroll, buy, startRound, CHARMS, target };
})();
