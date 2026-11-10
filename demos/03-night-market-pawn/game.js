// 夜市旧货摊 — 店主经营 + 证件核验式玩法（趋势参考：2026 年 10 月 Next Fest 热门的店主经营模拟类 demo；原创夜市主题）
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ITEMS = [
    { name: '古董怀表', emoji: '⏱️', base: 260 },
    { name: '黑胶唱片机', emoji: '📻', base: 120 },
    { name: '胶片相机', emoji: '📷', base: 180 },
    { name: '复古游戏机', emoji: '🎮', base: 90 },
    { name: '名牌皮夹克', emoji: '🧥', base: 210 },
    { name: '无人机', emoji: '🛸', base: 150 },
    { name: '老式机械键盘', emoji: '⌨️', base: 70 },
    { name: '珍珠项链', emoji: '📿', base: 230 },
  ];
  const NAMES = ['老周', '阿花', '老K', '小雨', '铁蛋', '夜猫', '阿杰', '方块', '红姐', '眼镜仔', '大刘', '胖虎'];
  const FACES = ['🧑‍🎤', '🧓', '🧔', '👩‍🦰', '👨‍🦲', '🥷', '👨‍🔧', '👩‍💻', '👵', '🕵️'];
  const DAYS = 5, CUSTOMERS_PER_DAY = 6;
  const condText = c => c > 0.85 ? '几乎全新' : c > 0.65 ? '有些使用痕迹' : c > 0.45 ? '磨损明显' : '破破烂烂';

  const S = { day: 1, money: 220, heat: 0, inv: [], hot: [], remain: CUSTOMERS_PER_DAY, scans: 3, cust: null, offer: 0, over: false };
  const rentFor = d => 70 + (d - 1) * 45;

  function randSerial() {
    const L = 'ABCDEFGHJKLMNPRSTUVWXYZ';
    return L[(Math.random() * L.length) | 0] + L[(Math.random() * L.length) | 0] + '-' + String(1000 + ((Math.random() * 9000) | 0));
  }
  function nearMiss(s) {
    // 生成与失窃登记号只差一位的"无辜"序列号，考验眼力
    const arr = s.split(''); const idx = [0, 1, 3, 4, 5, 6][(Math.random() * 6) | 0];
    const pool = idx < 2 ? 'ABCDEFGHJKLMNPRSTUVWXYZ' : '0123456789';
    let c; do { c = pool[(Math.random() * pool.length) | 0]; } while (c === arr[idx]);
    arr[idx] = c; return arr.join('');
  }

  function newDay() {
    S.hot = Array.from({ length: 5 }, randSerial);
    S.remain = CUSTOMERS_PER_DAY; S.scans = 3;
    log(`—— 第 ${S.day} 天开张。今晚摊位费 $${rentFor(S.day)} ——`);
    nextCustomer();
  }

  function nextCustomer() {
    if (S.remain <= 0) return endDay();
    S.remain--;
    const it = ITEMS[(Math.random() * ITEMS.length) | 0];
    const cond = 0.3 + Math.random() * 0.7;
    const roll = Math.random();
    let serial, stolen = false;
    if (roll < 0.3) { serial = S.hot[(Math.random() * S.hot.length) | 0]; stolen = true; }
    else if (roll < 0.5) serial = nearMiss(S.hot[(Math.random() * S.hot.length) | 0]);
    else serial = randSerial();
    const value = Math.round(it.base * cond);
    // 卖家心理底价：赃物卖家更急
    const minAccept = Math.round(value * (stolen ? 0.35 + Math.random() * 0.2 : 0.55 + Math.random() * 0.3));
    const ask = Math.round(value * (1.1 + Math.random() * 0.6));
    S.cust = {
      name: NAMES[(Math.random() * NAMES.length) | 0], face: FACES[(Math.random() * FACES.length) | 0],
      item: it, cond, serial, stolen, value, minAccept, ask, patience: 3, scanned: false, lastOffer: 0,
    };
    S.offer = Math.round(ask * 0.5 / 10) * 10;
    say(stolen ? `嘿……这${it.name}来路很正，真的。$${ask} 拿走，要快。` : `我想当掉这个${it.name}，$${ask} 怎么样？`);
    render();
  }

  function endDay() {
    let income = 0, fines = 0;
    const lines = [];
    for (const x of S.inv) {
      const sale = Math.round(x.value * (x.stolen ? 1.7 : 1.25) * (0.9 + Math.random() * 0.2));
      if (x.stolen && Math.random() < 0.45 + S.heat * 0.1) {
        const fine = Math.round(x.value * 1.5);
        fines += fine; S.heat++;
        lines.push(`🚨 警方查获赃物 ${x.item.name}（${x.serial}），罚款 $${fine}`);
      } else { income += sale; lines.push(`卖出 ${x.item.name} +$${sale}`); }
    }
    S.inv = [];
    const rent = rentFor(S.day);
    S.money += income - fines - rent;
    lines.push(`支付摊位费 -$${rent}`);
    lines.forEach(log);
    let html = `<h2>🏮 第 ${S.day} 天打烊</h2><p>${lines.join('<br>')}</p><p>现金：<b>$${S.money}</b></p>`;
    if (S.money < 0) {
      S.over = true; html += `<h3>💸 交不起摊位费，旧货摊关门了。</h3><button onclick="location.reload()">重新开始</button>`;
    } else if (S.heat >= 3) {
      S.over = true; html += `<h3>🚓 警方关注度过高，摊位被查封。</h3><button onclick="location.reload()">重新开始</button>`;
    } else if (S.day >= DAYS) {
      S.over = true; html += `<h3>🏆 你撑过了 ${DAYS} 天！最终现金 $${S.money}</h3><button onclick="location.reload()">再来一局</button>`;
    } else html += `<button id="bNext">开始第 ${S.day + 1} 天</button>`;
    $('ovBox').innerHTML = html; $('overlay').style.display = 'flex';
    const bn = $('bNext');
    if (bn) bn.onclick = () => { $('overlay').style.display = 'none'; $('ovBox').innerHTML = ''; S.day++; newDay(); };
    render();
  }

  function say(t) { $('cSay').textContent = '“' + t + '”'; }
  function log(t) { const d = document.createElement('div'); d.textContent = t; $('log').prepend(d); }

  function doOffer() {
    const c = S.cust; if (!c || S.over) return;
    if (S.offer > S.money) { say('你钱都不够，出什么价？'); return; }
    if (S.offer <= 0) { say('你在开玩笑吗？'); return; }
    if (S.offer >= c.minAccept) {
      S.money -= S.offer; S.inv.push({ ...c, paid: S.offer });
      log(`以 $${S.offer} 收下 ${c.item.name}${c.scanned ? '' : '（未鉴定）'}`);
      say(S.offer >= c.ask ? '爽快！合作愉快。' : '……行吧，成交。');
      S.cust = null; render(); setTimeout(nextCustomer, 700);
      return;
    }
    if (S.offer <= c.lastOffer) { c.patience--; }
    c.patience--; c.lastOffer = S.offer;
    if (c.patience <= 0) { say('浪费我时间！'); log(`${c.name} 气走了`); S.cust = null; render(); setTimeout(nextCustomer, 700); return; }
    const counter = Math.round((c.minAccept + (c.ask - c.minAccept) * (0.3 + Math.random() * 0.3)) / 5) * 5;
    say(`太低了。$${counter} 是我的底线……大概吧。`);
    render();
  }

  function doScan() {
    const c = S.cust; if (!c || c.scanned || S.scans <= 0) return;
    S.scans--; c.scanned = true;
    say(`扫描结果：成色 ${(c.cond * 100).toFixed(0)}%，估值约 $${c.value}`);
    render();
  }

  function doReject() {
    const c = S.cust; if (!c) return;
    if (c.stolen) { log(`拒收了赃物 ${c.serial}，警方关注度 -1`); S.heat = Math.max(0, S.heat - 1); }
    else log(`请走了 ${c.name}`);
    S.cust = null; render(); setTimeout(nextCustomer, 400);
  }

  function render() {
    const c = S.cust;
    $('dayTitle').textContent = `第 ${S.day} / ${DAYS} 天`;
    $('money').textContent = '$' + S.money;
    $('rent').textContent = '$' + rentFor(S.day);
    $('remain').textContent = S.remain + (c ? 1 : 0);
    $('scans').textContent = S.scans;
    $('heat').textContent = '🔥'.repeat(S.heat) + '·'.repeat(Math.max(0, 3 - S.heat)) + ` (${S.heat}/3)`;
    $('hot').innerHTML = S.hot.map(s => `<li class="serial">${s}</li>`).join('');
    $('guide').innerHTML = ITEMS.map(i => `<li>${i.emoji} ${i.name}：$${i.base}</li>`).join('');
    $('inv').innerHTML = S.inv.length ? S.inv.map(x => `<li>${x.item.emoji} ${x.item.name} <span class="serial">${x.serial}</span> 付 $${x.paid}</li>`).join('') : '<li style="opacity:.5">空</li>';
    const has = !!c && !S.over;
    ['bOffer', 'bReject'].forEach(id => $(id).disabled = !has);
    $('bScan').disabled = !has || c.scanned || S.scans <= 0;
    document.querySelectorAll('[data-d]').forEach(b => b.disabled = !has);
    if (c) {
      $('cEmoji').textContent = c.face + c.item.emoji;
      $('cName').textContent = c.name; $('cItem').textContent = c.item.name;
      $('cSerial').textContent = c.serial;
      $('cCond').textContent = c.scanned ? `${(c.cond * 100).toFixed(0)}%（估值 $${c.value}）` : condText(c.cond) + '（未扫描）';
      $('cAsk').textContent = '$' + c.ask;
      $('cPat').textContent = '❤️'.repeat(Math.max(0, c.patience));
    } else { $('cEmoji').textContent = '⏳'; ['cName', 'cItem', 'cSerial', 'cCond', 'cAsk', 'cPat'].forEach(id => $(id).textContent = '—'); }
    $('offer').textContent = '$' + S.offer;
  }

  document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { S.offer = Math.max(0, S.offer + +b.dataset.d); render(); });
  $('bOffer').onclick = doOffer; $('bScan').onclick = doScan; $('bReject').onclick = doReject;
  newDay();
  window.__demo = { S, doOffer, doReject, doScan };
})();
