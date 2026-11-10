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
};
module.exports.sleep = sleep; module.exports.canvasPt = canvasPt; module.exports.vbtn = vbtn;
