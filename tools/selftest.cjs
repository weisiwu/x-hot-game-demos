#!/usr/bin/env node
// 无头浏览器自测（Chrome DevTools Protocol）
// 对每个游戏：通过本地 http 服务器打开 → 开始界面 → 首次教程 → 用真实键鼠/触屏输入游玩 → 暂停/继续 →
// 打到结局（胜利或失败结算界面）→ 刷新页面检查存档仍在；同时收集未捕获异常、console.error 和资源加载错误。
// 另外用 file:// 打开每个页面做一次冒烟检查，并用触屏模拟（手机视口）验证触屏能独立完成核心操作。
// 用法：node tools/selftest.cjs [截图目录] [只测的游戏编号，如 01,06]
'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.resolve(process.argv[2] || path.join(os.tmpdir(), 'xhgd-shots'));
const ONLY = (process.argv[3] || '').split(',').filter(Boolean);
const PORT = 9333 + Math.floor(Math.random() * 300);
let HPORT = 0; // 运行时挑一个空闲端口
const CHROME = process.env.CHROME || 'google-chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const getJSON = (u, method = 'GET') => new Promise((res, rej) => {
  const req = http.request(u, { method }, r => { let b = ''; r.on('data', d => b += d); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } }); });
  req.on('error', rej); req.end();
});

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map(); const listeners = [];
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method) listeners.forEach(f => f(d));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  return { ws, send, on: f => listeners.push(f) };
}

function makeHelpers(c) {
  const ev = async expr => {
    const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error('eval 失败: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text).split('\n')[0] + ' :: ' + expr.slice(0, 80));
    return r.result?.result?.value;
  };
  const KEYMAP = { Space: ' ', Enter: 'Enter', Escape: 'Escape', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', ShiftLeft: 'Shift' };
  const keyInfo = code => {
    const key = KEYMAP[code] || (code.startsWith('Key') ? code.slice(3).toLowerCase() : code.startsWith('Digit') ? code.slice(5) : code);
    return { code, key, text: key.length === 1 ? key : undefined, windowsVirtualKeyCode: code === 'Escape' ? 27 : key.length === 1 ? key.toUpperCase().charCodeAt(0) : undefined };
  };
  const keyDown = code => c.send('Input.dispatchKeyEvent', { type: 'keyDown', ...keyInfo(code) });
  const keyUp = code => c.send('Input.dispatchKeyEvent', { type: 'keyUp', ...keyInfo(code) });
  const hold = async (code, ms) => { await keyDown(code); await sleep(ms); await keyUp(code); };
  const press = code => hold(code, 60);
  const rect = sel => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`);
  const mouse = (type, x, y, buttons = 1, button = 'left') => c.send('Input.dispatchMouseEvent', { type, x, y, button, buttons, clickCount: 1 });
  const click = async (x, y) => { await mouse('mouseMoved', x, y, 0, 'none'); await mouse('mousePressed', x, y, 1); await mouse('mouseReleased', x, y, 0); };
  const drag = async (pts, stepMs = 16) => {
    await mouse('mouseMoved', pts[0][0], pts[0][1], 0, 'none'); await mouse('mousePressed', pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) { await mouse('mouseMoved', x, y, 1); await sleep(stepMs); }
    const l = pts[pts.length - 1]; await mouse('mouseReleased', l[0], l[1], 0);
  };
  const clickSel = async sel => { const r = await rect(sel); if (!r) throw new Error('找不到元素 ' + sel); await click(r.x + r.w / 2, r.y + r.h / 2); await sleep(60); };
  const exists = sel => ev(`!!document.querySelector(${JSON.stringify(sel)})`);
  // 触屏：多点触控
  const touch = (type, points) => c.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((p, i) => ({ x: p[0], y: p[1], id: p[2] ?? i, radiusX: 4, radiusY: 4, force: 1 })) });
  const tap = async (x, y) => { await touch('touchStart', [[x, y]]); await sleep(50); await touch('touchEnd', []); await sleep(60); };
  const tapSel = async sel => { const r = await rect(sel); if (!r) throw new Error('找不到元素 ' + sel); await tap(r.x + r.w / 2, r.y + r.h / 2); };
  const touchHold = async (x, y, ms) => { await touch('touchStart', [[x, y]]); await sleep(ms); await touch('touchEnd', []); };
  const touchDrag = async (pts, holdMs = 0) => {
    await touch('touchStart', [pts[0]]);
    for (const p of pts.slice(1)) { await touch('touchMove', [p]); await sleep(16); }
    if (holdMs) await sleep(holdMs);
    await touch('touchEnd', []);
  };
  const state = () => ev('window.__demo && __demo.G ? __demo.G.state : null');
  // 通过开始界面 + 首次教程进入游戏
  const startGame = async (sel = '#xgStart', viaTouch = false) => {
    if (viaTouch) await tapSel(sel); else await clickSel(sel);
    for (let i = 0; i < 8; i++) {
      await sleep(120);
      if ((await state()) === 'play') return true;
      const done = await exists('#xgTutDone');
      const sel2 = done ? '#xgTutDone' : '.xg-overlay.show .xg-btn.primary';
      if (viaTouch) await tapSel(sel2); else await clickSel(sel2);
    }
    return (await state()) === 'play';
  };
  const waitFor = async (expr, ms = 10000, step = 200) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr)) return true; await sleep(step); } return false; };
  return { ev, hold, press, rect, click, drag, clickSel, exists, keyDown, keyUp, touch, tap, tapSel, touchHold, touchDrag, startGame, state, waitFor };
}

// 通用：暂停→继续
async function pauseResume(h) {
  await h.press('Escape'); await sleep(150);
  const paused = (await h.state()) === 'paused' && await h.exists('#xgResume');
  await h.clickSel('#xgResume'); await sleep(100);
  return paused && (await h.state()) === 'play';
}
const endShown = h => h.ev(`__demo.G.state === 'end' && !!document.querySelector('.xg-overlay.show h2')`);

const TESTS = require('./selftest-cases.cjs');

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  HPORT = await new Promise(res => { const srv = require('node:net').createServer(); srv.listen(0, '127.0.0.1', () => { const p = srv.address().port; srv.close(() => res(p)); }); });
  const server = spawn('python3', ['-m', 'http.server', String(HPORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { const up = await new Promise(r => http.get(`http://127.0.0.1:${HPORT}/index.html`, x => { x.resume(); r(x.statusCode === 200); }).on('error', () => r(false))); if (up) break; await sleep(100); }
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'xhgd-chrome-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
  let ok = false;
  for (let i = 0; i < 50 && !ok; i++) { await sleep(200); ok = await getJSON(`http://127.0.0.1:${PORT}/json/version`).then(() => true, () => false); }
  if (!ok) throw new Error('Chrome 启动失败');
  const demos = fs.readdirSync(path.join(ROOT, 'demos')).filter(d => /^\d\d-/.test(d)).sort().filter(d => !ONLY.length || ONLY.includes(d.slice(0, 2)));
  const report = [];

  async function runPage(name, url, fn, opt = {}) {
    const t = await getJSON(`http://127.0.0.1:${PORT}/json/new?about:blank`, 'PUT');
    const c = await connect(t.webSocketDebuggerUrl);
    const errors = [];
    c.on(m => {
      if (m.method === 'Runtime.exceptionThrown') errors.push('异常: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0]);
      if (m.method === 'Runtime.consoleAPICalled' && ['error', 'assert'].includes(m.params.type)) errors.push('console.error: ' + m.params.args.map(a => a.value ?? a.description).join(' '));
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || '')) errors.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
    });
    await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Page.enable');
    if (opt.mobile) {
      await c.send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 1, mobile: true });
      await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    } else await c.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await c.send('Page.navigate', { url }); await sleep(1300);
    const h = makeHelpers(c);
    h.reload = async () => { await c.send('Page.reload', {}); await sleep(1300); };
    let checks = [];
    try { checks = await fn(h); } catch (e) { checks.push(['测试脚本执行', false]); errors.push('测试异常: ' + e.message); }
    await sleep(200);
    const shot = await c.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(shot.result.data, 'base64'));
    const pass = errors.length === 0 && checks.every(x => x[1]);
    report.push({ name, pass, checks, errors });
    console.log(`${pass ? '✅' : '❌'} ${name}`);
    for (const [d, v] of checks) console.log(`    ${v ? '✓' : '✗'} ${d}`);
    for (const e of errors) console.log(`    ⚠ ${e}`);
    c.ws.close();
    await getJSON(`http://127.0.0.1:${PORT}/json/close/${t.id}`).catch(() => {});
  }

  const base = `http://127.0.0.1:${HPORT}`;
  if (!ONLY.length) await runPage('index', base + '/index.html', async h => [['目录页列出 15 个游戏', (await h.ev(`document.querySelectorAll('a[href^="demos/"]').length`)) >= 15]]);
  for (const d of demos) {
    const T = TESTS[d];
    if (!T) { console.log('⚠ 没有测试用例：' + d); continue; }
    // 1) http 完整流程
    await runPage(d, `${base}/demos/${d}/index.html`, async h => {
      const checks = [];
      checks.push(['开始界面出现', await h.exists('.xg-overlay.show #xgStart')]);
      checks.push(['开始→(教程)→进入游戏', await h.startGame()]);
      checks.push(...await T.play(h));
      checks.push(['暂停与继续', await pauseResume(h)]);
      checks.push(...await T.finish(h));
      checks.push(['出现结算界面', await h.waitFor(`__demo.G.state === 'end' && !!document.querySelector('.xg-overlay.show h2')`, 8000)]);
      const key = await h.ev(`Object.keys(localStorage).find(k => k === 'xhgd:${d}')`);
      await h.reload();
      checks.push(['刷新后存档仍在（http）', !!key && await h.ev(`!!localStorage.getItem('xhgd:${d}') && JSON.parse(localStorage.getItem('xhgd:${d}')).tutorialSeen === true`)]);
      if (T.afterReload) checks.push(...await T.afterReload(h));
      return checks;
    });
    // 2) 触屏（手机横屏视口 + 触摸事件）
    if (T.touch) await runPage(d + '-touch', `${base}/demos/${d}/index.html?fresh=1`, async h => {
      await h.ev(`localStorage.setItem('xhgd:${d}', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('xhgd:${d}') || '{}'), { tutorialSeen: true })))`);
      await h.reload();
      const checks = [['触屏点击开始进入游戏', await h.startGame('#xgStart', true)]];
      checks.push(['触屏模式已启用', await h.ev('XG.isTouch && document.querySelector(".xg-touch-layer.show") !== null')]);
      checks.push(...await T.touch(h));
      return checks;
    }, { mobile: true });
    // 3) file:// 冒烟
    await runPage(d + '-file', `file://${ROOT}/demos/${d}/index.html`, async h => [['file:// 打开开始界面', await h.exists('.xg-overlay.show #xgStart')], ['file:// 可进入游戏', await h.startGame()]]);
  }
  chrome.kill(); server.kill();
  fs.writeFileSync(path.join(SHOTS, 'report.json'), JSON.stringify(report, null, 2));
  const failed = report.filter(r => !r.pass).length;
  console.log(`\n共 ${report.length} 项，失败 ${failed}。截图与 report.json 在 ${SHOTS}`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
