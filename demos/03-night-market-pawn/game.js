// 夜市旧货摊 Night Market Pawn — 7 夜经营战役：收货、卖货、鉴定仿品、核对失窃登记、应付便衣与巡查
// 趋势参考：2026 年 10 月 Steam Next Fest 热门的店主经营模拟（原创夜市主题）
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ITEMS = [
    { name: '古董怀表', emoji: '⏱️', base: 260 }, { name: '黑胶唱片机', emoji: '📻', base: 140 },
    { name: '胶片相机', emoji: '📷', base: 190 }, { name: '复古游戏机', emoji: '🎮', base: 100 },
    { name: '名牌皮夹克', emoji: '🧥', base: 210 }, { name: '航拍无人机', emoji: '🛸', base: 170 },
    { name: '机械键盘', emoji: '⌨️', base: 80 }, { name: '珍珠项链', emoji: '📿', base: 240 },
    { name: '铜制香炉', emoji: '🏺', base: 160 }, { name: '老式收音机', emoji: '📟', base: 90 },
  ];
  const NAMES = ['老周', '阿花', '老K', '小雨', '铁蛋', '夜猫', '阿杰', '方块', '红姐', '眼镜仔', '大刘', '胖虎', '阿梅', '老黄', '小北', '二毛'];
  const FACES = ['🧑', '🧓', '🧔', '👩‍🦰', '👨‍🦲', '👩', '👨‍🔧', '👩‍💻', '👵', '🧑‍🦱'];
  const TYPES = {
    normal: { label: '普通卖家', min: [0.55, 0.85], ask: [1.15, 1.6], pat: 3 },
    desperate: { label: '急着用钱', min: [0.35, 0.5], ask: [0.8, 1.1], pat: 2 },
    haggler: { label: '砍价高手', min: [0.75, 0.95], ask: [1.5, 2.0], pat: 5 },
    thief: { label: '眼神闪躲', min: [0.3, 0.45], ask: [0.7, 1.0], pat: 2 },
    regular: { label: '回头客', min: [0.6, 0.75], ask: [1.0, 1.3], pat: 4 },
    undercover: { label: '眼神闪躲', min: [0.3, 0.4], ask: [0.6, 0.9], pat: 3 },
    buyer: { label: '想买东西', pat: 3 },
  };
  const NIGHTS = 7;
  const RENT = [60, 90, 120, 160, 200, 250, 300];
  const SHOP = [
    { id: 'lamp', name: '🔦 鉴定灯', desc: '每晚扫描次数 +1', cost: l => [90, 180][l], max: 2 },
    { id: 'safe', name: '🔒 暗格保险柜', desc: '巡查时藏住 1 件可疑货', cost: () => 160, max: 1 },
    { id: 'sign', name: '🏮 霓虹招牌', desc: '声誉 +12，买家出价更高', cost: l => [100, 200, 320][l], max: 3 },
    { id: 'horn', name: '📣 吆喝喇叭', desc: '每晚顾客 +2', cost: l => [120, 240][l], max: 2 },
  ];
  const SAVE = XG.save('03-night-market-pawn', { tutorialSeen: false, best: 0, bestGrade: '', runs: 0, wins: 0, run: null });
  const D = SAVE.data;
  let R = null; // 当前这一局
  let cust = null, offer = 0, busy = false;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = XG.pick;
  function randSerial() { const L = 'ABCDEFGHJKLMNPRSTUVWXYZ'; return pick(L) + pick(L) + '-' + (1000 + ((Math.random() * 9000) | 0)); }
  function nearMiss(s) {
    const a = s.split(''), idx = pick([0, 1, 3, 4, 5, 6]), pool = idx < 2 ? 'ABCDEFGHJKLMNPRSTUVWXYZ' : '0123456789';
    let c; do { c = pick(pool); } while (c === a[idx]); a[idx] = c; return a.join('');
  }
  const condText = c => c > 0.85 ? '几乎全新' : c > 0.65 ? '有使用痕迹' : c > 0.45 ? '磨损明显' : '破破烂烂';
  const FAKE_CLUES = ['logo 的字体好像有点歪', '比想象中轻很多', '包装上有错别字', '缝线有点粗糙', '序列号贴纸是新贴的', '金属部分有股塑料味'];
  const REAL_CLUES = ['做工看起来很扎实', '有岁月留下的包浆', '配件齐全', '附带原装说明书'];

  function newRun() {
    R = { night: 1, money: 250, rep: 50, heat: 0, inv: [], up: { lamp: 0, safe: 0, sign: 0, horn: 0 }, deals: 0, profit: 0 };
    D.runs++; SAVE.write();
  }
  function saveRun() { D.run = JSON.parse(JSON.stringify(R)); SAVE.write(); }

  function startNight() {
    R.hot = Array.from({ length: 5 + Math.floor(R.night / 2) }, randSerial);
    R.remain = 6 + R.night + R.up.horn * 2; R.scans = 2 + R.up.lamp; R.nightLog = [];
    saveRun();
    $('log').innerHTML = '';
    log(`—— 第 ${R.night} 夜开张，打烊时交摊位费 $${RENT[R.night - 1]} ——`);
    render(); nextCustomer();
  }

  function makeItem(opts = {}) {
    const it = pick(ITEMS);
    const fake = opts.fake != null ? opts.fake : Math.random() < 0.12 + R.night * 0.02;
    const cond = opts.cond || rnd(0.3, 1);
    let serial, stolen = false;
    if (opts.stolen) { serial = pick(R.hot); stolen = true; }
    else if (Math.random() < 0.22) serial = nearMiss(pick(R.hot)); else serial = randSerial();
    const value = Math.round(it.base * (fake ? 0.15 : cond));
    let clue = '';
    if (fake && Math.random() < 0.7) clue = pick(FAKE_CLUES);
    else if (!fake && Math.random() < 0.15) clue = pick(FAKE_CLUES);
    else if (!fake && Math.random() < 0.4) clue = pick(REAL_CLUES);
    return { it, fake, cond, serial, stolen, value, clue };
  }

  function nextCustomer() {
    busy = false;
    if (R.remain <= 0) return endNight();
    R.remain--;
    const canBuy = R.inv.length > 0;
    const pBuyer = canBuy ? Math.min(0.65, 0.3 + R.rep / 300 + R.inv.length * 0.05) : 0;
    let type;
    const r = Math.random();
    if (r < pBuyer) type = 'buyer';
    else {
      const r2 = Math.random();
      type = R.night >= 2 && r2 < 0.1 ? 'undercover' : r2 < 0.3 ? 'thief' : r2 < 0.45 ? 'haggler' : r2 < 0.6 ? 'desperate' : r2 < 0.72 ? 'regular' : 'normal';
    }
    const T = TYPES[type];
    const c = { type, T, name: pick(NAMES), face: pick(FACES), patience: T.pat, scanned: false, lastOffer: null };
    if (type === 'buyer') {
      c.want = pick(R.inv);
      const repMul = 0.8 + R.rep / 250; // 声誉 50 → 1.0
      c.max = Math.round(Math.max(c.want.fake ? c.want.it.base * 0.6 : c.want.value, 20) * rnd(1.1, 1.7) * repMul);
      offer = Math.round(c.max * 1.2 / 10) * 10;
      say(c, `我想要你那件${c.want.it.name}，多少钱？`);
    } else {
      const stolen = type === 'thief' ? Math.random() < 0.7 : type === 'undercover' ? true : Math.random() < 0.12;
      const item = type === 'regular' ? makeItem({ fake: false, cond: rnd(0.75, 1) }) : makeItem({ stolen });
      Object.assign(c, item);
      c.min = Math.round(c.value * rnd(...T.min)); c.ask = Math.max(10, Math.round((c.fake ? c.it.base * rnd(0.6, 1) : c.value) * rnd(...T.ask) / 5) * 5);
      if (c.fake) c.min = Math.round(c.ask * rnd(0.3, 0.5));
      offer = Math.round(c.ask * 0.5 / 10) * 10;
      const lines = {
        normal: `想把这个${c.it.name}出了，$${c.ask} 怎么样？`, desperate: `求求你了，急着用钱……这${c.it.name} $${c.ask} 就行。`,
        haggler: `这可是好东西！${c.it.name}，少于 $${c.ask} 免谈。`, thief: `嘘……这${c.it.name}来路很正，$${c.ask} 拿走，快点。`,
        regular: `老板又见面了！这${c.it.name}保存得很好，$${c.ask}。`, undercover: `这个${c.it.name}……便宜卖你，$${c.ask}，别问来路。`,
      };
      say(c, lines[type]);
    }
    cust = c; XG.audio.sfx('select'); render();
  }

  function say(c, t) { $('cSay').textContent = '“' + t + '”'; }
  function log(t) { const d = document.createElement('div'); d.textContent = t; $('log').prepend(d); }
  function done(delay = 700) { cust = null; busy = true; render(); setTimeout(() => { if (G.state === 'play' || G.state === 'paused') nextCustomer(); }, delay); }

  function doOffer() {
    const c = cust; if (!c || busy || G.paused) return;
    if (offer <= 0) { say(c, '你在开玩笑吗？'); XG.audio.sfx('error'); return; }
    if (c.type === 'buyer') return quote(c);
    if (offer > R.money) { say(c, '你钱都不够啊老板。'); XG.audio.sfx('error'); return; }
    if (offer >= c.min) {
      R.money -= offer;
      if (c.type === 'undercover') {
        const fine = 150 + R.night * 20; R.money -= fine; R.heat++; R.rep = Math.max(0, R.rep - 10);
        say(c, '（亮出证件）便衣巡查！收赃物，罚款！'); XG.audio.sfx('siren'); log(`🚨 收购赃物被便衣抓到：罚款 $${fine}，关注度 +1`);
        if (checkFail()) return; return done(1400);
      }
      R.inv.push({ it: c.it, fake: c.fake, cond: c.cond, serial: c.serial, stolen: c.stolen, value: c.value, paid: offer, scanned: c.scanned });
      if (offer >= c.value * 0.7 && !c.fake) R.rep = Math.min(100, R.rep + 2);
      if (offer < c.value * 0.4 && c.type === 'desperate') R.rep = Math.max(0, R.rep - 3);
      R.deals++; XG.audio.sfx('coin');
      say(c, offer >= c.ask ? '爽快！合作愉快。' : '……行吧，成交。');
      log(`以 $${offer} 收下 ${c.it.name}${c.scanned ? '' : '（未鉴定）'}`);
      return done();
    }
    if (c.lastOffer != null && offer <= c.lastOffer) c.patience--;
    c.patience--; c.lastOffer = offer; XG.audio.sfx('tick');
    if (c.patience <= 0) { say(c, '浪费我时间！'); log(`${c.name} 气走了`); return done(); }
    const counter = Math.round((c.min + (c.ask - c.min) * rnd(0.25, 0.55)) / 5) * 5;
    say(c, `太低了。$${counter} 是底线……大概吧。`); render();
  }
  function quote(c) {
    const item = c.want;
    if (offer <= c.max) {
      R.money += offer; R.inv.splice(R.inv.indexOf(item), 1); R.deals++; R.profit += offer - item.paid;
      XG.audio.sfx('coin'); say(c, '成交！谢谢老板。');
      log(`卖出 ${item.it.name} $${offer}（成本 $${item.paid}，${offer - item.paid >= 0 ? '赚' : '亏'} $${Math.abs(offer - item.paid)}）`);
      if (item.fake) { R.rep = Math.max(0, R.rep - 8); log('⚠️ 卖出的是仿品，买家迟早会发现：声誉 -8'); }
      else R.rep = Math.min(100, R.rep + 1);
      return done();
    }
    if (c.lastOffer != null && offer >= c.lastOffer) c.patience--;
    c.patience--; c.lastOffer = offer; XG.audio.sfx('tick');
    if (c.patience <= 0) { say(c, '太贵了，不买了。'); log(`${c.name} 没买走就离开了`); return done(); }
    const counter = Math.round(c.max * rnd(0.82, 0.96) / 5) * 5;
    say(c, `太贵了！$${counter} 我就要。`); render();
  }
  function doScan() {
    const c = cust; if (!c || busy || c.type === 'buyer' || c.scanned || R.scans <= 0 || G.paused) return;
    R.scans--; c.scanned = true; XG.audio.sfx('pickup');
    say(c, c.fake ? `扫描结果：⚠️ 仿冒品！实际只值 $${c.value} 左右。` : `扫描结果：正品，成色 ${(c.cond * 100).toFixed(0)}%，估值约 $${c.value}。`);
    render();
  }
  function doReject() {
    const c = cust; if (!c || busy || G.paused) return;
    if (c.type === 'undercover') { R.money += 40; R.heat = Math.max(0, R.heat - 1); say(c, '（亮出证件）不错，很守规矩。这是线人奖励。'); log('👮 识破便衣巡查：奖励 $40，关注度 -1'); XG.audio.sfx('coin'); return done(1200); }
    XG.audio.sfx('click'); log(`请走了 ${c.name}`); done(400);
  }
  function doReport() {
    const c = cust; if (!c || busy || c.type === 'buyer' || G.paused) return;
    if (c.stolen) {
      const reward = c.type === 'undercover' ? 60 : 35;
      R.money += reward; R.heat = Math.max(0, R.heat - 1); R.rep = Math.min(100, R.rep + 3);
      say(c, c.type === 'undercover' ? '（亮出证件）好眼力！我就是来测试你的。' : '……你、你别乱来！（被巡逻队带走了）');
      log(`📢 举报赃物 ${c.serial} 成功：奖励 $${reward}，关注度 -1`); XG.audio.sfx('siren');
    } else {
      R.rep = Math.max(0, R.rep - 10); say(c, '你凭什么冤枉我！？我要去投诉你！'); log(`❌ 冤枉了好人（${c.serial} 不在登记表上）：声誉 -10`); XG.audio.sfx('error');
    }
    done(1100);
  }

  function checkFail() {
    if (R.heat >= 3) { finish(false, '🚓 摊位被查封', '警方关注度太高，摊位被查封了。'); return true; }
    if (R.money < 0) { finish(false, '💸 破产了', '欠钱太多，夜市管理处收回了你的摊位。'); return true; }
    return false;
  }

  function endNight() {
    const lines = [];
    // 巡查：库存里的赃物
    let hidden = R.up.safe;
    for (const x of R.inv.slice()) {
      if (!x.stolen) continue;
      if (hidden > 0) { hidden--; lines.push(`🔒 暗格藏住了 ${x.it.name}`); continue; }
      if (Math.random() < 0.35 + R.heat * 0.1) {
        const fine = Math.round(x.value * 1.5 + 30);
        R.money -= fine; R.heat++; R.inv.splice(R.inv.indexOf(x), 1);
        lines.push(`🚨 巡查查获赃物 ${x.it.name}（${x.serial}），没收并罚款 $${fine}`);
      }
    }
    if (!lines.some(l => l.startsWith('🚨')) && R.heat > 0 && Math.random() < 0.4) { R.heat--; lines.push('😮‍💨 今晚风平浪静，关注度 -1'); }
    const rent = RENT[R.night - 1]; R.money -= rent; lines.push(`🏠 摊位费 -$${rent}`);
    if (lines.some(l => l.startsWith('🚨'))) XG.audio.sfx('siren');
    if (checkFail()) return;
    if (R.night >= NIGHTS) {
      let w = 0; for (const x of R.inv) w += Math.round((x.fake ? x.it.base * 0.15 : x.value) * 0.6);
      if (R.inv.length) lines.push(`📦 剩余 ${R.inv.length} 件库存批发处理 +$${w}`);
      R.money += w; R.inv = [];
      return finish(true, '', lines.join('<br>'));
    }
    R.night++; D.run = null; saveRun();
    showShop(lines);
  }

  function showShop(lines) {
    G.setState('menu');
    const card = G.open(`<h2>🌃 第 ${R.night - 1} 夜打烊</h2><div class="xg-sub" style="text-align:left">${lines.join('<br>')}</div>
      <div class="xg-stats"><span>现金</span><b>$${R.money}</b><span>声誉</span><b>${R.rep}</b><span>关注度</span><b>${R.heat}/3</b><span>库存</span><b>${R.inv.length} 件</b></div>
      <h3 style="margin:6px 0">🛠 白天添置（可选）</h3><div id="shopBox" class="xg-body"></div>`, [{ label: `▶ 第 ${R.night} 夜开张`, primary: true, id: 'xgNextNight', onClick: () => { G.close(); G.setState('play'); startNight(); } }]);
    const box = card.querySelector('#shopBox');
    const draw = () => {
      box.innerHTML = '';
      for (const s of SHOP) {
        const lv = R.up[s.id], maxed = lv >= s.max, c = maxed ? 0 : s.cost(lv);
        const b = document.createElement('button'); b.className = 'xg-btn'; b.style.cssText = 'width:100%;margin:3px 0;text-align:left;font-size:13px';
        b.innerHTML = `${s.name} ${maxed ? '（已拥有）' : `· $${c}`}<br><small style="font-weight:400;opacity:.8">${s.desc}</small>`;
        b.disabled = maxed || R.money < c;
        b.onclick = () => { R.money -= c; R.up[s.id]++; if (s.id === 'sign') R.rep = Math.min(100, R.rep + 12); XG.audio.sfx('powerup'); saveRun(); draw(); card.querySelector('.xg-stats b').textContent = '$' + R.money; };
        box.appendChild(b);
      }
    };
    draw();
  }

  function grade(m) { return m >= 2000 ? 'S' : m >= 1200 ? 'A' : m >= 700 ? 'B' : 'C'; }
  function finish(win, title, detail) {
    D.run = null; cust = null;
    const g = win ? grade(R.money) : '';
    if (win) { D.wins++; if (R.money > D.best) { D.best = R.money; D.bestGrade = g; } }
    SAVE.write();
    G.end({ win, title: title || `🏆 撑过 ${NIGHTS} 夜！评级 ${g}`, sub: detail,
      stats: [['最终现金', '$' + R.money], ['成交次数', R.deals], ['卖货利润', '$' + R.profit], ['声誉', R.rep], ['历史最佳', '$' + D.best + (D.bestGrade ? `（${D.bestGrade}）` : '')]],
      buttons: [{ label: '🔁 新的一局', primary: true, id: 'xgAgain', onClick: () => G.start('new') }, { label: '🏠 菜单', onClick: () => G.menu() }] });
  }

  function render() {
    if (!R) return;
    $('night').textContent = R.night; $('money').textContent = '$' + R.money; $('rent').textContent = '$' + RENT[R.night - 1];
    $('remain').textContent = R.remain + (cust ? 1 : 0); $('rep').textContent = R.rep;
    $('heat').textContent = '🔥'.repeat(R.heat) + '·'.repeat(Math.max(0, 3 - R.heat));
    $('hot').innerHTML = (R.hot || []).map(s => `<li class="serial">${s}</li>`).join('');
    $('guide').innerHTML = ITEMS.map(i => `<li>${i.emoji} ${i.name}：$${i.base}</li>`).join('');
    $('inv').innerHTML = R.inv.length ? R.inv.map(x => `<li>${x.it.emoji} ${x.it.name} <span class="serial">${x.serial}</span> 成本 $${x.paid}${x.scanned ? (x.fake ? ' ⚠️仿' : ' ✅') : ''}</li>`).join('') : '<li style="opacity:.5">空</li>';
    const c = cust, has = !!c && !busy;
    $('bOffer').disabled = !has; $('bReject').disabled = !has;
    $('bScan').disabled = !has || c.type === 'buyer' || c.scanned || R.scans <= 0;
    $('bReport').disabled = !has || c.type === 'buyer';
    $('bScan').textContent = `🔍 扫描（剩 ${R.scans}）`;
    document.querySelectorAll('[data-d]').forEach(b => b.disabled = !has);
    if (c) {
      const portrait = { normal: 'normal', desperate: 'desperate', haggler: 'haggler', thief: 'thief', regular: 'regular', undercover: 'thief', buyer: 'buyer' }[c.type];
      $('cEmoji').innerHTML = `<img src="../../assets/03-night-market-pawn/cust-${portrait}.webp" alt=""><span>${c.type === 'buyer' ? '💵' : c.it.emoji}</span>`;
      $('cType').textContent = `${c.name} · ${c.T.label}`;
      const item = c.type === 'buyer' ? c.want : c;
      $('custTitle').textContent = c.type === 'buyer' ? '🛍 买家' : '📦 卖家';
      $('cItem').textContent = item.it.name; $('cSerial').textContent = item.serial;
      $('cCond').textContent = c.type === 'buyer' ? `你的成本 $${item.paid}` : c.scanned ? (c.fake ? `仿品！估值 $${c.value}` : `${(c.cond * 100).toFixed(0)}%（估值 $${c.value}）`) : condText(c.cond) + '（未扫描）';
      $('cClue').textContent = c.type !== 'buyer' && c.clue ? '👁 细节：' + c.clue : '';
      $('askLabel').textContent = c.type === 'buyer' ? '参考价' : '要价';
      $('cAsk').textContent = c.type === 'buyer' ? `市场价 $${item.it.base}` : '$' + c.ask;
      $('cPat').textContent = '❤️'.repeat(Math.max(0, c.patience));
      $('bOffer').textContent = c.type === 'buyer' ? '💬 报价卖出' : '💬 出价收购';
    } else { $('cEmoji').textContent = '⏳'; $('cType').textContent = ''; ['cItem', 'cSerial', 'cCond', 'cAsk', 'cPat'].forEach(id => $(id).textContent = '—'); $('cClue').textContent = ''; }
    $('offer').textContent = '$' + offer;
  }

  document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { offer = Math.max(0, offer + +b.dataset.d); XG.audio.sfx('tick'); render(); });
  $('bOffer').onclick = doOffer; $('bScan').onclick = doScan; $('bReject').onclick = doReject; $('bReport').onclick = doReport;
  window.addEventListener('keydown', e => {
    if (G.state !== 'play') return;
    if (e.code === 'Enter') doOffer(); if (e.code === 'KeyS') doScan(); if (e.code === 'KeyR') doReject();
    if (e.code === 'ArrowUp') { offer += 10; render(); } if (e.code === 'ArrowDown') { offer = Math.max(0, offer - 10); render(); }
  });

  const G = XG.game({
    id: '03-night-market-pawn', title: '🏮 夜市旧货摊', subtitle: '在霓虹夜市摆摊 7 个晚上：低价收货、高价卖出，识破仿品和赃物，别被便衣抓到，交得起摊位费。',
    cover: '../../assets/03-night-market-pawn/cover.webp', music: 'night', save: SAVE, noMKey: false,
    tutorial: [
      { title: '收货', text: '卖家报出要价，用 <b>±10 / ±50</b> 调整出价后点“出价收购”。出价低于对方心理底价会被还价，耐心 ❤️ 用完就走人。快捷键：↑↓ 调价，Enter 出价。', touch: '点按钮调价、出价。' },
      { title: '卖货', text: '库存里有货时会来<b>买家</b>。给他报价，报价不超过他心里的上限就能成交。声誉越高，买家愿意出的价越高。', touch: '' },
      { title: '仿品与鉴定', text: '有些货是<b>仿品</b>，只值很少的钱。留意“细节”提示（但它不一定准），或者用每晚有限次数的 <b>🔍 扫描</b> 确认。卖仿品给买家会掉声誉。', touch: '' },
      { title: '赃物与便衣', text: '序列号如果出现在<b>失窃登记表</b>上就是赃物：便宜、好卖，但打烊巡查时可能被查获罚款并增加关注度 🔥。注意“只差一位”的序列号是无辜的。可以<b>举报</b>赃物拿奖励；从第 2 夜起还有<b>便衣</b>来钓鱼。关注度满 3 摊位就会被封。', touch: '' },
      { title: '打烊与升级', text: '每晚打烊要交递增的摊位费，钱不够就破产。白天可以买鉴定灯、保险柜、招牌、喇叭。撑过 7 夜按现金评级（S ≥ $2000）。每晚开张时自动存档，可以下次继续。', touch: '' },
    ],
    onStart: mode => { if (mode === 'continue' && D.run) { R = D.run; } else newRun(); startNight(); },
    onRestart: () => { if (D.run) R = JSON.parse(JSON.stringify(D.run)); startNight(); },
    onQuit: () => { cust = null; },
    onMenu: () => menu(),
    pauseInfo: () => R ? `第 ${R.night} 夜 · 现金 $${R.money}（重新开始本局 = 从今晚开张重来）` : '',
  });
  function menu() {
    const btns = [];
    if (D.run) btns.push({ label: `▶ 继续：第 ${D.run.night} 夜（$${D.run.money}）`, primary: true, id: 'xgContinue', onClick: () => G.start('continue') });
    btns.push({ label: D.run ? '🆕 新的一局' : '▶ 开始营业', primary: !D.run, id: 'xgStart', onClick: () => { if (D.run && !confirmNew()) return; G.start('new'); } });
    btns.push({ label: '📖 教程', onClick: () => G.tutorial(menu) });
    G.menu(`<div class="xg-stats"><span>历史最佳</span><b>$${D.best}${D.bestGrade ? '（' + D.bestGrade + '）' : ''}</b><span>通关 / 开局</span><b>${D.wins} / ${D.runs}</b></div>`, btns);
  }
  function confirmNew() { return typeof window.confirm !== 'function' || window.__noConfirm || confirm('放弃当前存档的进度，开始新的一局？'); }
  menu();
  window.__demo = { G, D, get R() { return R; }, get cust() { return cust; }, setOffer: v => { offer = v; render(); }, doOffer, doReject, doScan, doReport, endNight };
})();
