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
};
module.exports.sleep = sleep; module.exports.canvasPt = canvasPt; module.exports.vbtn = vbtn;
