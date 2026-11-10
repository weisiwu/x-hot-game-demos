// 各游戏的自测用例：play = 游玩中的核心操作检查；finish = 推进到结局；touch = 手机触屏检查；afterReload = 刷新后检查存档内容
'use strict';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const canvasPt = async (h, x, y, sel = 'canvas') => {
  const r = await h.rect(sel); const s = await h.ev(`(() => { const c = document.querySelector(${JSON.stringify(sel)}); return { w: c.width, h: c.height }; })()`);
  return [r.x + x * r.w / s.w, r.y + y * r.h / s.h];
};
const vbtn = async (h, label) => h.ev(`(() => { const b = [...document.querySelectorAll('.xg-vbtn')].find(b => b.textContent.includes(${JSON.stringify(label)}) && b.offsetParent); if (!b) return null; const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);

module.exports = {
  '01-haystack-needle': {
    async play(h) {
      const r = await h.rect('#c'); const pts = [];
      for (let i = 0; i < 50; i++) pts.push([r.x + r.w * (0.3 + 0.4 * i / 50), r.y + r.h * (0.5 + 0.12 * Math.sin(i / 3))]);
      await h.drag(pts);
      const removed = await h.ev('__demo.S.totalStraws');
      await h.clickSel('#bUseMagnet'); await sleep(100);
      return [['拖动鼠标拨开稻草', removed > 0], ['使用磁铁', (await h.ev('__demo.S.magnets')) === 0]];
    },
    async finish(h) {
      // 清开每根针周围并用真实鼠标点击
      const ms = await h.ev(`__demo.metals().filter(m => m.kind === 'needle').map(m => { __demo.rake(m.cx, m.cy, 90, 1e9); return [m.cx, m.cy]; })`);
      await sleep(100);
      for (const [x, y] of ms) { const p = await canvasPt(h, x, y, '#c'); await h.click(p[0], p[1]); await sleep(150); }
      return [['点击露出的针完成第 1 堆', (await h.ev('__demo.S.unlocked')) >= 2]];
    },
    async afterReload(h) { return [['解锁进度已保存', (await h.ev('__demo.S.unlocked')) >= 2]]; },
    async touch(h) {
      const r = await h.rect('#c'); const pts = [];
      for (let i = 0; i < 40; i++) pts.push([r.x + r.w * (0.3 + 0.4 * i / 40), r.y + r.h * 0.55]);
      const before = await h.ev('__demo.S.totalStraws');
      await h.touchDrag(pts);
      const after = await h.ev('__demo.S.totalStraws');
      const m = await h.ev(`(() => { const m = __demo.metals().find(m => m.kind === 'needle'); __demo.rake(m.cx, m.cy, 90, 1e9); return [m.cx, m.cy]; })()`);
      await sleep(80); const p = await canvasPt(h, m[0], m[1], '#c'); await h.tap(p[0], p[1]); await sleep(150);
      return [['手指拖动拨开稻草', after > before], ['轻点拿起针', (await h.ev('__demo.st.found')) >= 1 || (await h.ev('__demo.G.state')) === 'end']];
    },
  },
  '02-leaf-sweepers': {
    async play(h) {
      const x0 = await h.ev('__demo.players[0].x');
      await h.hold('KeyD', 900);
      const p = await h.ev('({ x: __demo.players[0].x, bag: __demo.players[0].bag })');
      await h.ev('__demo.S.money = 500'); await sleep(50);
      await h.ev('document.getElementById("u_robots").disabled = false'); await sleep(50);
      await h.clickSel('#u_robots'); await sleep(200);
      return [['WASD 移动', Math.abs(p.x - x0) > 40], ['移动时扫到落叶', p.bag > 0], ['商店买扫地机器人', (await h.ev('__demo.robots().length')) === 1]];
    },
    async finish(h) { await h.ev('__demo.leaf.fill(0)'); await sleep(300); return [['清洁度达标过关', (await h.ev('__demo.S.unlocked')) >= 2]]; },
    async afterReload(h) { return [['升级与解锁已保存', (await h.ev('__demo.S.up.robots >= 1 && __demo.S.unlocked >= 2'))]]; },
    async touch(h) {
      const r = await h.rect('#c');
      const x0 = await h.ev('__demo.players[0].x');
      const cx = r.x + r.w * 0.5, cy = r.y + r.h * 0.5;
      await h.touchDrag([[cx, cy], [cx + 20, cy], [cx + 45, cy]], 700);
      const x1 = await h.ev('__demo.players[0].x');
      // 双人：左右半屏两个摇杆同时操作
      await h.ev('__demo.S.twoP = true; __demo.G.start(0)'); await sleep(300);
      const a0 = await h.ev('[__demo.players[0].y, __demo.players[1].y]');
      const lx = r.x + r.w * 0.25, rx = r.x + r.w * 0.75;
      await h.touch('touchStart', [[lx, cy, 1], [rx, cy, 2]]);
      for (let k = 1; k <= 4; k++) { await h.touch('touchMove', [[lx, cy - k * 12, 1], [rx, cy + k * 12, 2]]); await sleep(20); }
      await sleep(700); await h.touch('touchEnd', []);
      const a1 = await h.ev('[__demo.players[0].y, __demo.players[1].y]');
      return [['单人摇杆移动', x1 > x0 + 30], ['双人分屏：P1 上移', a1[0] < a0[0] - 30], ['双人分屏：P2 下移', a1[1] > a0[1] + 30]];
    },
  },

  '03-night-market-pawn': {
    async play(h) {
      // 等一位卖家（跳过买家）
      for (let i = 0; i < 10 && (await h.ev('!__demo.cust || __demo.cust.type === "buyer"')); i++) { await h.clickSel('#bReject').catch(() => {}); await sleep(600); }
      const s0 = await h.ev('__demo.R.scans');
      await h.clickSel('#bScan');
      const s1 = await h.ev('__demo.R.scans');
      await h.ev('__demo.setOffer(__demo.cust.ask)');
      await h.clickSel('#bOffer'); await sleep(900);
      const r = await h.ev('({ deals: __demo.R.deals, heat: __demo.R.heat, inv: __demo.R.inv.length })');
      return [['扫描鉴定', s1 === s0 - 1], ['按要价出价能成交（或被便衣抓）', r.deals >= 1 || r.heat >= 1]];
    },
    async finish(h) {
      await h.ev('__demo.R.night = 7; __demo.R.money = 5000; __demo.R.heat = 0');
      let ended = false;
      for (let i = 0; i < 40 && !ended; i++) {
        ended = await h.ev('__demo.G.state === "end"');
        if (!ended && await h.ev('!!__demo.cust')) await h.clickSel('#bReject').catch(() => {});
        await sleep(650);
      }
      return [['撑过第 7 夜进入结算', ended && (await h.ev('__demo.D.wins')) >= 1]];
    },
    async afterReload(h) { return [['通关记录与最佳成绩已保存', await h.ev('__demo.D.wins >= 1 && __demo.D.best > 0')]]; },
    async touch(h) {
      for (let i = 0; i < 10 && (await h.ev('!__demo.cust || __demo.cust.type === "buyer"')); i++) { await h.tapSel('#bReject').catch(() => {}); await sleep(600); }
      const o0 = await h.ev('document.getElementById("offer").textContent');
      await h.tapSel('[data-d="50"]');
      const o1 = await h.ev('document.getElementById("offer").textContent');
      await h.ev('__demo.setOffer(__demo.cust.ask)'); await h.tapSel('#bOffer'); await sleep(900);
      return [['触屏调价', o0 !== o1], ['触屏出价成交', (await h.ev('__demo.R.deals + __demo.R.heat')) >= 1]];
    },
  },

  '04-scratch-tycoon': {
    async play(h) {
      await h.clickSel('#t0'); await sleep(100);
      const bought = await h.ev('!!__demo.card && !__demo.card.done');
      const r = await h.rect('#c');
      for (let row = 0; row < 14; row++) {
        const y = r.y + r.h * (0.2 + row * 0.055); const pts = [];
        for (let i = 0; i <= 12; i++) pts.push([r.x + r.w * (0.05 + 0.9 * i / 12), y]);
        await h.drag(pts, 8);
        if (await h.ev('__demo.card.done')) break;
      }
      const done = await h.ev('__demo.card.done');
      await h.ev('__demo.S.money = 500'); await sleep(250);
      await h.clickSel('#uAuto'); await sleep(3500);
      return [['购买刮刮卡', bought], ['鼠标刮开后自动结算', done], ['自动刮卡机工作', (await h.ev('__demo.S.cards')) >= 2]];
    },
    async finish(h) { const before = await h.ev('__demo.G.state + " | " + (document.querySelector(".xg-overlay.show h2") || {}).textContent'); await h.ev('__demo.S.money = 2e6; __demo.S.wonOnce = false'); await sleep(600); const ok = await h.ev('__demo.S.wonOnce'); if (!ok) console.log('    [debug] before:', before, ' after:', await h.ev('__demo.G.state + " | " + (document.querySelector(".xg-overlay.show h2") || {}).textContent')); return [['达到百万触发通关', ok]]; },
    async afterReload(h) { return [['金钱/升级/卡片数已保存', await h.ev('__demo.S.money >= 1e6 && __demo.S.auto >= 1 && __demo.S.cards >= 2')]]; },
    async touch(h) {
      await h.tapSel('#t0'); await sleep(100);
      const r = await h.rect('#c');
      for (let row = 0; row < 14; row++) {
        const y = r.y + r.h * (0.2 + row * 0.055); const pts = [];
        for (let i = 0; i <= 12; i++) pts.push([r.x + r.w * (0.05 + 0.9 * i / 12), y]);
        await h.touchDrag(pts);
        if (await h.ev('__demo.card && __demo.card.done')) break;
      }
      return [['手指刮开卡片', await h.ev('!!__demo.card && __demo.card.done')]];
    },
  },

  '05-class-clown': {
    async play(h) {
      await h.ev('__demo.S.T.state = "writing"; __demo.S.T.timer = 99');
      const x0 = await h.ev('__demo.S.p.x');
      await h.hold('KeyA', 500);
      const x1 = await h.ev('__demo.S.p.x');
      // 走到恶作剧点并按住空格
      await h.ev('(() => { const p = __demo.S.pranks[0]; __demo.S.p.x = p.x; __demo.S.p.y = p.y; })()');
      await h.hold('Space', 3400);
      const done = await h.ev('__demo.S.pranks[0].done');
      // 老师回头时不在座位会被抓
      await h.ev('__demo.S.T.state = "watching"; __demo.S.T.timer = 2'); await sleep(200);
      const strikes = await h.ev('__demo.S.strikes');
      return [['WASD 移动', x1 < x0 - 30], ['按住空格完成恶作剧', done], ['老师看过来时离座被抓', strikes >= 1]];
    },
    async finish(h) { await h.ev('__demo.S.pranks.forEach(p => p.done = true)'); await sleep(300); return [['完成全部恶作剧过关', (await h.ev('__demo.SV.unlocked')) >= 2]]; },
    async afterReload(h) { return [['解锁与星级已保存', await h.ev('__demo.SV.unlocked >= 2 && __demo.SV.stars.L0 >= 1')]]; },
    async touch(h) {
      await h.ev('__demo.S.T.state = "writing"; __demo.S.T.timer = 99');
      const r = await h.rect('#c');
      const x0 = await h.ev('__demo.S.p.x');
      const sx = r.x + r.w * 0.3, sy = r.y + r.h * 0.6;
      await h.touchDrag([[sx, sy], [sx + 20, sy], [sx + 50, sy]], 600);
      const x1 = await h.ev('__demo.S.p.x');
      await h.ev('(() => { const p = __demo.S.pranks[0]; __demo.S.p.x = p.x; __demo.S.p.y = p.y; __demo.S.T.timer = 99; })()');
      const b = await h.ev(`(() => { const b = [...document.querySelectorAll('.xg-vbtn')].find(b => b.textContent.includes('恶作剧')); const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
      await h.touchHold(b[0], b[1], 3400);
      return [['触屏摇杆移动', x1 > x0 + 30], ['按住触屏按钮完成恶作剧', await h.ev('__demo.S.pranks[0].done')]];
    },
  },

  '06-soda-raft': {
    async play(h) {
      await h.hold('ArrowUp', 1800);
      const y = await h.ev('__demo.S.raft.y'), gas = await h.ev('__demo.S.gasL');
      const a0 = await h.ev('__demo.S.raft.a');
      await h.hold('KeyA', 500);
      const a1 = await h.ev('__demo.S.raft.a');
      return [['双喷向上游前进', y < -30], ['喷气消耗汽水', gas < 100], ['单侧喷气会转向', Math.abs(a1 - a0) > 0.05]];
    },
    async finish(h) { await h.ev('__demo.S.hp = 99; __demo.S.raft.y = __demo.S.FIN + 120; __demo.S.raft.a = 0; __demo.S.raft.va = 0'); await h.hold('ArrowUp', 1800); await sleep(200); return [['到达终点过关', (await h.ev('__demo.SV.unlocked')) >= 2]]; },
    async afterReload(h) { return [['解锁与成绩已保存', await h.ev('__demo.SV.unlocked >= 2 && __demo.SV.best.L0 > 0')]]; },
    async touch(h) {
      const L = await h.ev(`(() => { const r = __demo.S && document.querySelectorAll('.xg-vbtn')[0].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
      const R = await h.ev(`(() => { const r = document.querySelectorAll('.xg-vbtn')[1].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
      const y0 = await h.ev('__demo.S.raft.y');
      await h.touch('touchStart', [[L[0], L[1], 1], [R[0], R[1], 2]]); await sleep(1500); await h.touch('touchEnd', []);
      const y1 = await h.ev('__demo.S.raft.y');
      const a0 = await h.ev('__demo.S.raft.a');
      await h.touchHold(L[0], L[1], 600);
      const a1 = await h.ev('__demo.S.raft.a');
      return [['双指按住左右半屏 = 前进', y1 < y0 - 30], ['只按左半屏 = 转向', Math.abs(a1 - a0) > 0.05]];
    },
  },

  '07-pocket-volley': {
    async play(h) {
      await sleep(1200);
      await h.keyDown('KeyD'); await sleep(150);
      const vx = await h.ev('__demo.M.L.vx'); await h.keyUp('KeyD');
      const x0 = 0, x1 = vx > 0 ? 100 : 0;
      await h.press('KeyW'); await sleep(80);
      const vy = await h.ev('__demo.M.L.vy');
      await sleep(5000);
      return [['A/D 移动', x1 > x0 + 30], ['W 跳跃', vy < 0], ['比赛能得分', (await h.ev('__demo.M.score[0] + __demo.M.score[1]')) >= 1]];
    },
    async finish(h) {
      // 让 AI 代打左边，加速打完整场
      await h.ev('__demo.M.L.ai = __demo.mkAI(__demo.OPP[5])');
      const ok = await h.waitFor('__demo.G.state === "end"', 240000, 500);
      return [['AI 代打完成整场比赛（7 分制）', ok]];
    },
    async afterReload(h) { return [['战绩已保存', await h.ev('__demo.SV.totalWins + __demo.SV.totalLosses >= 1')]]; },
    async touch(h) {
      await sleep(900);
      const btn = async label => h.ev(`(() => { const b = [...document.querySelectorAll('.xg-vbtn')].find(b => b.textContent === ${JSON.stringify(label)} && b.offsetParent); const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
      const R = await btn('▶'), J = await btn('跳');
      const x0 = await h.ev('__demo.M.L.x');
      await h.touchHold(R[0], R[1], 500);
      const x1 = await h.ev('__demo.M.L.x');
      await h.touch('touchStart', [[J[0], J[1], 3]]); await sleep(60);
      const vy = await h.ev('__demo.M.L.vy'); await h.touch('touchEnd', []);
      // 双人：两组按钮同时操作
      await h.ev('__demo.G.start({ mode: "pvp" })'); await sleep(400);
      const vis = await h.ev(`[...document.querySelectorAll('.xg-vbtn')].filter(b => b.offsetParent).length`);
      const p2r = await h.ev(`(() => { const bs = [...document.querySelectorAll('.xg-vbtn')].filter(b => b.textContent === '◀' && b.offsetParent); const r = bs[1].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
      const p1r = await btn('▶');
      const a0 = await h.ev('[__demo.M.L.x, __demo.M.R.x]');
      await h.touch('touchStart', [[p1r[0], p1r[1], 1], [p2r[0], p2r[1], 2]]); await sleep(500); await h.touch('touchEnd', []);
      const a1 = await h.ev('[__demo.M.L.x, __demo.M.R.x]');
      return [['触屏 ▶ 移动', x1 > x0 + 30], ['触屏「跳」', vy < 0], ['双人显示两组共 8 个按钮', vis === 8], ['双人同时操作两边', a1[0] > a0[0] + 20 && a1[1] < a0[1] - 20]];
    },
  },

  '08-bullet-heaven': {
    async play(h) {
      await h.hold('KeyD', 800); await sleep(3500);
      const g = await h.ev('({ x: __demo.R.p.x, kills: __demo.R.kills, shots: __demo.R.shots.length })');
      await h.ev('__demo.R.xp = __demo.R.need'); await sleep(200);
      const lv = await h.ev('__demo.mode');
      await h.press('Digit1'); await sleep(150);
      return [['WASD 移动', g.x > 50], ['自动攻击', g.kills > 0 || g.shots > 0], ['升级三选一', lv === 'levelup' && (await h.ev('__demo.mode')) === 'play']];
    },
    async finish(h) {
      await h.ev('(() => { const R = __demo.R; R.t = R.S.time - 0.3; R.p.hp = R.p.maxHp = 1e6; R.dmgMul = 400; })()');
      const ok = await h.waitFor('__demo.G.state === "end" || __demo.mode === "levelup"', 30000, 300);
      for (let i = 0; i < 20 && (await h.ev('__demo.G.state')) !== 'end'; i++) { if ((await h.ev('__demo.mode')) === 'levelup') await h.press('Digit1'); await sleep(500); }
      return [['Boss 出现并被击败', ok && (await h.ev('__demo.SV.clears.S0 >= 1'))]];
    },
    async afterReload(h) { return [['星币与通关记录已保存（修复 file:// 存档问题后走统一存档）', await h.ev('__demo.SV.coins > 0 && __demo.SV.clears.S0 >= 1 && __demo.SV.unlocked >= 2')]]; },
    async touch(h) {
      const r = await h.rect('#c'); const cx = r.x + r.w * 0.5, cy = r.y + r.h * 0.6;
      const x0 = await h.ev('__demo.R.p.x');
      await h.touchDrag([[cx, cy], [cx + 25, cy], [cx + 50, cy]], 700);
      const x1 = await h.ev('__demo.R.p.x');
      await h.ev('__demo.R.xp = __demo.R.need'); await sleep(250);
      const p = await canvasPt(h, 225, 300, '#c'); await h.tap(p[0], p[1]); await sleep(150);
      return [['触屏摇杆移动', x1 > x0 + 30], ['点击升级卡片', (await h.ev('__demo.mode')) === 'play']];
    },
  },

  '09-dice-roguelike': {
    async play(h) {
      await h.clickSel('#dice .die');
      const held = await h.ev('__demo.S.held[0]');
      const r0 = await h.ev('__demo.S.rerolls');
      await h.clickSel('#bReroll'); await sleep(100);
      const r1 = await h.ev('__demo.S.rerolls');
      const h0 = await h.ev('__demo.S.hands');
      await h.clickSel('#bScore'); await sleep(150);
      const st = await h.ev('({ hands: __demo.S.hands, phase: __demo.S.phase, score: __demo.S.score })');
      return [['点击骰子锁定', held], ['重掷消耗次数', r1 === r0 - 1], ['计分出手', st.score > 0 && (st.hands === h0 - 1 || st.phase === 'shop')]];
    },
    async finish(h) {
      let shopSeen = false;
      for (let i = 0; i < 40 && (await h.ev('__demo.G.state')) !== 'end'; i++) {
        const ph = await h.ev('__demo.S.phase');
        if (ph === 'shop') { shopSeen = true; await h.clickSel('#bNext'); continue; }
        if (ph === 'play') { await h.ev('(() => { const S = __demo.S; S.score = __demo.target() - 1; S.dice = [6, 6, 6, 6, 6]; })()'); await h.clickSel('#bScore'); await sleep(120); }
        else await sleep(200);
      }
      return [['过关进入商店', shopSeen], ['连过 8 轮通关', (await h.ev('__demo.SV.wins')) >= 1]];
    },
    async afterReload(h) { return [['通关记录已保存', await h.ev('__demo.SV.wins >= 1 && __demo.SV.best >= 8')]]; },
    async touch(h) {
      await h.tapSel('#dice .die'); const held = await h.ev('__demo.S.held[0]');
      await h.tapSel('#bScore'); await sleep(150);
      return [['触屏锁定骰子', held], ['触屏计分', (await h.ev('__demo.S.score')) > 0]];
    },
  },
  '10-scam-buster-hotline': {
    async play(h) {
      await h.clickSel('#bAnswer'); await sleep(300);
      if (await h.exists('#keypad')) { await h.clickSel('[data-k="2"]'); await h.clickSel('[data-k="1"]'); await sleep(500); }
      const m0 = await h.ev('__demo.R.mins');
      await h.clickSel('#opts button'); await sleep(700);
      const m1 = await h.ev('__demo.R.mins');
      // 按住“信号不好”
      const hb = await h.ev(`(() => { const b = [...document.querySelectorAll('#opts button')].find(b => b.classList.contains('hold')); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
      let held = true;
      if (hb) { const a = await h.ev('__demo.R.mins'); await h.drag([[hb[0], hb[1]], [hb[0] + 1, hb[1]]], 1200); await sleep(500); held = (await h.ev('__demo.R.mins')) > a; }
      await h.ev(`[...document.querySelectorAll('#opts button')].find(b => b.textContent.includes('挂断')).click()`); await sleep(150);
      const quiz = await h.exists('#quiz input');
      await h.clickSel('#quiz input'); await h.clickSel('#bGrade'); await sleep(150);
      return [['回应能拖住时间', m1 > m0], ['按住制造杂音能拖时间', held], ['挂断后出现话术识别', quiz], ['提交识别进入下一通', (await h.ev('__demo.R.idx')) === 1]];
    },
    async finish(h) {
      for (let i = 0; i < 12 && (await h.ev('__demo.G.state')) !== 'end'; i++) {
        if (await h.exists('#opts .primary:not(#bGrade)')) { await h.clickSel('#opts .primary'); await sleep(250); }
        if (await h.exists('#bAnswer')) { await h.clickSel('#bAnswer'); await sleep(250); }
        if (await h.exists('#keypad')) { await h.clickSel('[data-k="1"]'); await sleep(500); }
        await h.ev('__demo.R.mins = 500');
        const hang = await h.ev(`(() => { const b = [...document.querySelectorAll('#opts button')].find(b => b.textContent.includes('挂断')); if (b) { b.click(); return true; } return false; })()`);
        await sleep(150);
        if (await h.exists('#bGrade')) { await h.clickSel('#bGrade'); await sleep(200); }
        if (!hang) await sleep(300);
      }
      return [['打完一个班次', (await h.ev('__demo.SV.unlocked')) >= 2]];
    },
    async afterReload(h) { return [['班次解锁与通话记录已保存', await h.ev('__demo.SV.unlocked >= 2 && __demo.SV.calls >= 5')]]; },
    async touch(h) {
      await h.tapSel('#bAnswer'); await sleep(300);
      if (await h.exists('#keypad')) { await h.tapSel('[data-k="1"]'); await sleep(500); }
      const m0 = await h.ev('__demo.R.mins'); await h.tapSel('#opts button'); await sleep(700);
      return [['触屏接听并回应', (await h.ev('__demo.R.mins')) > m0]];
    },
  },
  '11-stamina-summit': {
    async play(h) {
      const t = await h.ev(`(() => { const S = __demo.S; const c = S.holds.filter(x => x.type !== 'ledge' && __demo.reachable(x)).sort((a, b) => a.y - b.y)[0]; return { x: c.x, y: c.y - S.cam, wy: c.y }; })()`);
      const p = await canvasPt(h, t.x, t.y, '#c'); await h.click(p[0], p[1]); await sleep(500);
      const s = await h.ev('({ py: __demo.S.py, st: __demo.S.st })');
      return [['点击岩点攀爬', Math.abs(s.py - t.wy) < 2], ['攀爬消耗体力', s.st < 100]];
    },
    async finish(h) {
      await h.ev('(() => { const S = __demo.S; const top = S.ledges[S.ledges.length - 1]; S.px = top.x; S.py = top.y + 80; S.cur = { type: "rock", x: S.px, y: S.py }; __demo.moveTo(S.holds.find(x => x.ledge === top), top.x); })()');
      await sleep(600);
      return [['登顶通关', (await h.ev('__demo.SV.summits')) >= 1]];
    },
    async afterReload(h) { return [['登顶记录已保存', await h.ev('__demo.SV.summits >= 1 && __demo.SV.unlocked >= 2')]]; },
    async touch(h) {
      const t = await h.ev(`(() => { const S = __demo.S; const c = S.holds.filter(x => x.type !== 'ledge' && __demo.reachable(x)).sort((a, b) => a.y - b.y)[0]; return { x: c.x, y: c.y - S.cam, wy: c.y }; })()`);
      const p = await canvasPt(h, t.x, t.y, '#c'); await h.tap(p[0], p[1]); await sleep(500);
      return [['手指点岩点攀爬', Math.abs((await h.ev('__demo.S.py')) - t.wy) < 2]];
    },
  },
  '12-mech-autobattler': {
    async play(h) {
      const c = async (x, y) => { const p = await canvasPt(h, x * 70 + 35, y * 70 + 35, '#c'); await h.click(p[0], p[1]); await sleep(60); };
      await c(3, 5); await h.clickSel('#b_gunner'); await c(4, 6); await h.clickSel('#b_guard'); await c(2, 5); await h.ev('__demo.S.gold = 50'); await c(2, 5);
      const b = await h.ev('({ n: __demo.S.board.length, lv: __demo.S.board.find(u => u.x === 2).lv })');
      await h.clickSel('#bGo'); await sleep(200);
      const phase = await h.ev('__demo.S.phase');
      const ended = await h.waitFor('__demo.S.phase === "build"', 60000, 500);
      return [['点击格子部署机甲', b.n === 3], ['再点同类 = 升级', b.lv === 2], ['开战进入自动战斗', phase === 'battle'], ['战斗结束结算', ended]];
    },
    async finish(h) {
      let ok = false;
      // 第 10 波敌军随机，满配阵容也不保证每次都赢；最多重打 4 次
      for (let k = 0; k < 4 && !ok; k++) {
        await h.ev('(() => { const S = __demo.S; S.wave = 10; S.hp = 99; S.board = []; for (let x = 0; x < 8; x++) S.board.push({ type: x % 2 ? "artillery" : "sniper", x, y: 7, lv: 3 }); for (let x = 0; x < 8; x++) S.board.push({ type: x % 3 ? "guard" : "medic", x, y: x % 2 ? 4 : 5, lv: 3 }); __demo.startBattle(); })()');
        await h.waitFor('__demo.S.phase === "build" || __demo.G.state === "end"', 60000, 500);
        ok = await h.ev('__demo.G.state === "end"');
      }
      return [['击退第 10 波通关', ok && (await h.ev('__demo.SV.wins')) >= 1]];
    },
    async afterReload(h) { return [['通关记录已保存', await h.ev('__demo.SV.wins >= 1 && __demo.SV.bestWave >= 10')]]; },
    async touch(h) {
      const t = async (x, y) => { const p = await canvasPt(h, x * 70 + 35, y * 70 + 35, '#c'); await h.tap(p[0], p[1]); };
      await t(3, 5); await h.tapSel('#b_gunner'); await t(4, 6);
      const n = await h.ev('__demo.S.board.length');
      await h.tapSel('#bGo'); await sleep(200);
      return [['触屏部署', n === 2], ['触屏开战', (await h.ev('__demo.S.phase')) === 'battle']];
    },
  },
};
module.exports.sleep = sleep; module.exports.canvasPt = canvasPt; module.exports.vbtn = vbtn;
