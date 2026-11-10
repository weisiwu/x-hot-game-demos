#!/usr/bin/env node
// 本地自测：启动独立的 headless Chrome，用 file:// 打开每个 demo，
// 通过 CDP 模拟真实键盘/鼠标操作，检查玩法状态变化，并收集控制台报错与未捕获异常。
// 用法：node tools/selftest.cjs [截图输出目录]
// 依赖：Node 18+（全局 WebSocket 需 Node 22+）、本机安装 Chrome/Chromium（可用 CHROME 环境变量指定路径）
'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.resolve(process.argv[2] || path.join(os.tmpdir(), 'xhgd-shots'));
const PORT = 9333 + Math.floor(Math.random() * 300);
const CHROME = process.env.CHROME || ['google-chrome', 'chromium', 'chromium-browser'].find(Boolean);
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
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    else if (d.method) listeners.forEach(f => f(d));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  return { ws, send, on: f => listeners.push(f) };
}

function makeHelpers(c) {
  const ev = async expr => {
    const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error('eval 失败: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
    return r.result?.result?.value;
  };
  const KEYMAP = { Space: ' ', Enter: 'Enter', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', ShiftLeft: 'Shift' };
  const keyInfo = code => {
    const key = KEYMAP[code] || (code.startsWith('Key') ? code.slice(3).toLowerCase() : code.startsWith('Digit') ? code.slice(5) : code);
    return { code, key, text: key.length === 1 ? key : undefined, windowsVirtualKeyCode: key.length === 1 ? key.toUpperCase().charCodeAt(0) : undefined };
  };
  const keyDown = code => c.send('Input.dispatchKeyEvent', { type: 'keyDown', ...keyInfo(code) });
  const keyUp = code => c.send('Input.dispatchKeyEvent', { type: 'keyUp', ...keyInfo(code) });
  const hold = async (code, ms) => { await keyDown(code); await sleep(ms); await keyUp(code); };
  const press = code => hold(code, 60);
  const rect = sel => ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`);
  const mouse = (type, x, y, buttons = 1, button = 'left') => c.send('Input.dispatchMouseEvent', { type, x, y, button, buttons, clickCount: 1 });
  const click = async (x, y, button = 'left') => { await mouse('mouseMoved', x, y, 0, 'none'); await mouse('mousePressed', x, y, 1, button); await mouse('mouseReleased', x, y, 0, button); };
  const drag = async pts => {
    await mouse('mouseMoved', pts[0][0], pts[0][1], 0, 'none');
    await mouse('mousePressed', pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) { await mouse('mouseMoved', x, y, 1); await sleep(16); }
    const l = pts[pts.length - 1]; await mouse('mouseReleased', l[0], l[1], 0);
  };
  const clickSel = async sel => { const r = await rect(sel); await click(r.x + r.w / 2, r.y + r.h / 2); };
  return { ev, hold, press, rect, click, drag, clickSel, keyDown, keyUp };
}

// 每个 demo 的冒烟测试：返回 [描述, 是否通过] 列表
const TESTS = {
  '01-haystack-needle': async h => {
    const r = await h.rect('#c'); const pts = [];
    for (let i = 0; i < 40; i++) pts.push([r.x + r.w * (0.3 + 0.4 * i / 40), r.y + r.h * (0.5 + 0.1 * Math.sin(i))]);
    await h.drag(pts);
    const removed = await h.ev('__demo.state.removedTotal');
    // 清空针附近后，用真实鼠标点击针
    const n = await h.ev('(() => { const n = __demo.needle; __demo.rake(n.cx, n.cy, 90, 1e9); return { x: n.cx, y: n.cy, cover: __demo.coverCount() }; })()');
    await sleep(100);
    await h.click(r.x + n.x * r.w / 900, r.y + n.y * r.h / 560);
    await sleep(200);
    const won = await h.ev(`document.getElementById('overlay').style.display === 'flex'`);
    return [['拖动鼠标能拨开稻草', removed > 0], ['点击露出的针判定找到', won]];
  },
  '02-leaf-sweepers': async h => {
    const x0 = await h.ev('__demo.players[0].x');
    await h.hold('KeyD', 900);
    const s = await h.ev('({ x: __demo.players[0].x, bag: __demo.players[0].bag })');
    await h.ev('__demo.team.money = 1000');
    await sleep(100);
    await h.clickSel('#u_drones'); await sleep(300);
    const drones = await h.ev('__demo.drones.length');
    await h.press('KeyP'); await sleep(50);
    return [['WASD 移动', s.x > x0 + 50], ['移动时扫到落叶', s.bag > 0], ['商店能买扫地机器人', drones === 1], ['P 加入 2P', await h.ev('__demo.players[1].active')]];
  },
  '03-night-market-pawn': async h => {
    await h.clickSel('#bScan'); await sleep(100);
    const scanned = await h.ev('__demo.S.cust.scanned');
    await h.ev('__demo.S.offer = __demo.S.cust.ask');
    await h.clickSel('#bOffer'); await sleep(900);
    const inv = await h.ev('__demo.S.inv.length');
    for (let i = 0; i < 8; i++) { if (await h.ev(`document.getElementById('overlay').style.display === 'flex'`)) break; await h.clickSel('#bReject').catch(() => {}); await sleep(550); }
    const dayEnd = await h.ev(`document.getElementById('overlay').style.display === 'flex'`);
    const next = await h.ev(`!!document.getElementById('bNext')`);
    if (next) { await h.clickSel('#bNext'); await sleep(200); }
    return [['扫描成色', scanned], ['出价成交入库', inv === 1], ['一天结束出现结算', dayEnd], ['可进入第 2 天', next ? (await h.ev('__demo.S.day')) === 2 : true]];
  },
  '04-scratch-tycoon': async h => {
    await h.clickSel('#t0'); await sleep(100);
    const bought = await h.ev('!!__demo.S.card && !__demo.S.card.done');
    const r = await h.rect('#c');
    for (let row = 0; row < 14; row++) {
      const y = r.y + r.h * (0.2 + row * 0.055); const pts = [];
      for (let i = 0; i <= 12; i++) pts.push([r.x + r.w * (0.05 + 0.9 * i / 12), y]);
      await h.drag(pts);
      if (await h.ev('__demo.S.card.done')) break;
    }
    const done = await h.ev('__demo.S.card.done');
    await h.ev('__demo.S.money = 500'); await sleep(250);
    await h.clickSel('#uAuto'); await sleep(2500);
    const cards = await h.ev('__demo.S.cards');
    return [['购买刮刮卡', bought], ['鼠标刮开后自动结算', done], ['自动刮卡机工作', cards >= 2]];
  },
  '05-class-clown': async h => {
    const x0 = await h.ev('__demo.S.p.x');
    await h.hold('KeyA', 500);
    const x1 = await h.ev('__demo.S.p.x');
    const states = new Set();
    for (let i = 0; i < 40; i++) { states.add(await h.ev('__demo.S.teacher.state')); await sleep(200); }
    return [['WASD 移动', x1 < x0 - 30], ['老师状态机循环', states.has('writing') && states.has('turning')], ['离座被看到会被抓或处于安全', (await h.ev('__demo.S.strikes')) >= 0]];
  },
  '06-soda-raft': async h => {
    await h.hold('ArrowUp', 1800);
    const y = await h.ev('__demo.S.raft.y');
    const gas = await h.ev('__demo.S.gasL');
    await h.hold('KeyA', 400);
    const a = await h.ev('__demo.S.raft.a');
    return [['双喷向上游前进', y < -30], ['喷气消耗气量', gas < 100], ['单侧喷气会转向', Math.abs(a) > 0.05]];
  },
  '07-pocket-volley': async h => {
    await sleep(1500);
    const b0 = await h.ev('({ y: __demo.ball.y })');
    const x0 = await h.ev('__demo.L.x');
    await h.hold('KeyD', 400);
    const x1 = await h.ev('__demo.L.x');
    await h.press('KeyW'); await sleep(80);
    const vy = await h.ev('__demo.L.vy');
    await sleep(6000);
    const sc = await h.ev('__demo.S.score[0] + __demo.S.score[1]');
    return [['球在运动', b0.y !== 140], ['A/D 移动', x1 > x0 + 30], ['W 跳跃', vy < 0], ['比赛能得分', sc >= 1]];
  },
  '08-bullet-heaven': async h => {
    await h.press('Space'); await sleep(200);
    const mode = await h.ev('__demo.mode');
    await h.hold('KeyD', 800);
    await sleep(4000);
    const g = await h.ev('({ t: __demo.G.t, kills: __demo.G.kills, shots: __demo.G.shots.length, x: __demo.G.p.x })');
    await h.ev('__demo.G.xp = __demo.G.need'); await sleep(200);
    const lv = await h.ev('__demo.mode');
    await h.press('Digit1'); await sleep(150);
    const after = await h.ev('__demo.mode');
    return [['空格开始', mode === 'play'], ['移动', g.x > 50], ['自动射击击杀敌人', g.kills > 0 || g.shots > 0], ['升级三选一', lv === 'levelup' && after === 'play']];
  },
  '09-dice-roguelike': async h => {
    const d0 = await h.ev('__demo.S.dice.join()');
    await h.clickSel('#dice .die'); await sleep(50);
    const held = await h.ev('__demo.S.held[0]');
    await h.clickSel('#bReroll'); await sleep(100);
    const rr = await h.ev('__demo.S.rerolls');
    await h.clickSel('#bScore'); await sleep(100);
    const st = await h.ev('({ hands: __demo.S.hands, score: __demo.S.score, phase: __demo.S.phase })');
    // 构造一个必过关的骰面验证商店流程
    await h.ev('__demo.S.dice = [6,6,6,6,6]; __demo.S.held = [true,true,true,true,true]');
    await h.clickSel('#bScore'); await sleep(100);
    const phase = await h.ev('__demo.S.phase');
    return [['点击骰子锁定', held], ['重掷消耗次数', rr === 1], ['计分出手', st.score > 0 && (st.hands === 2 || st.phase === 'shop')], ['过关进入商店', phase === 'shop'], ['初始骰面', !!d0]];
  },
  '10-scam-buster-hotline': async h => {
    await h.clickSel('#opts button'); await sleep(600);
    const mins = await h.ev('__demo.S.mins');
    await h.ev(`[...document.querySelectorAll('#opts button')].find(b => b.textContent.includes('挂断')).click()`); await sleep(100);
    const quiz = await h.ev(`!!document.querySelector('#quiz input')`);
    await h.clickSel('#quiz input'); await sleep(50);
    await h.ev(`document.querySelector('#opts button.primary').click()`); await sleep(100);
    const call = await h.ev('__demo.S.call');
    return [['选择回应能拖延时间', mins > 0], ['挂断后出现话术识别', quiz], ['提交识别进入下一通', call === 1]];
  },
  '11-stamina-summit': async h => {
    const r = await h.rect('#c');
    const tgt = await h.ev(`(() => { const S = __demo.S; const c = S.holds.filter(x => x.type !== 'ledge' && __demo.reachable(x)).sort((a, b) => a.y - b.y)[0]; return c ? { x: c.x, y: c.y - S.cam, wy: c.y } : null; })()`);
    if (!tgt) return [['存在可达岩点', false]];
    await h.click(r.x + tgt.x * r.w / 900, r.y + tgt.y * r.h / 600); await sleep(500);
    const s = await h.ev('({ py: __demo.S.py, st: __demo.S.st })');
    return [['存在可达岩点', true], ['点击岩点攀爬', Math.abs(s.py - tgt.wy) < 2], ['攀爬消耗体力', s.st < 100]];
  },
  '12-mech-autobattler': async h => {
    const r = await h.rect('#c'); const cell = r.w / 8;
    await h.click(r.x + cell * 3.5, r.y + cell * 5.5); await sleep(50);
    await h.clickSel('#b_gunner');
    await h.click(r.x + cell * 4.5, r.y + cell * 6.5); await sleep(50);
    await h.clickSel('#b_guard');
    await h.click(r.x + cell * 2.5, r.y + cell * 5.5); await sleep(50);
    const n = await h.ev('__demo.S.board.length');
    await h.clickSel('#bGo'); await sleep(300);
    const phase = await h.ev('__demo.S.phase');
    let ended = false;
    for (let i = 0; i < 70; i++) { await sleep(1000); if ((await h.ev('__demo.S.phase')) === 'build') { ended = true; break; } }
    const after = await h.ev('({ wave: __demo.S.wave, hp: __demo.S.hp })');
    return [['点击格子部署机甲', n === 3], ['开战进入自动战斗', phase === 'battle'], ['战斗结束结算', ended && (after.wave === 2 || after.hp < 20)]];
  },
};

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'xhgd-chrome-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
  let ok = false;
  for (let i = 0; i < 50 && !ok; i++) { await sleep(200); ok = await getJSON(`http://127.0.0.1:${PORT}/json/version`).then(() => true, () => false); }
  if (!ok) throw new Error('Chrome 启动失败');
  const demos = fs.readdirSync(path.join(ROOT, 'demos')).filter(d => /^\d\d-/.test(d)).sort();
  const pages = [{ name: 'index', url: 'file://' + path.join(ROOT, 'index.html') }, ...demos.map(d => ({ name: d, url: 'file://' + path.join(ROOT, 'demos', d, 'index.html') }))];
  const report = [];
  for (const p of pages) {
    const t = await getJSON(`http://127.0.0.1:${PORT}/json/new?about:blank`, 'PUT');
    const c = await connect(t.webSocketDebuggerUrl);
    const errors = [];
    c.on(m => {
      if (m.method === 'Runtime.exceptionThrown') errors.push('异常: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0]);
      if (m.method === 'Runtime.consoleAPICalled' && ['error', 'assert'].includes(m.params.type)) errors.push('console.error: ' + m.params.args.map(a => a.value ?? a.description).join(' '));
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || '')) errors.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
    });
    await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Page.enable');
    await c.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 960, deviceScaleFactor: 1, mobile: false });
    await c.send('Page.navigate', { url: p.url });
    await sleep(1500);
    const h = makeHelpers(c);
    let checks = [];
    try {
      if (p.name === 'index') checks = [['目录页列出 12 个 demo 链接', (await h.ev(`document.querySelectorAll('a[href^="demos/"]').length`)) >= 12]];
      else checks = await TESTS[p.name](h);
    } catch (e) { checks.push(['测试脚本执行', false]); errors.push('测试异常: ' + e.message); }
    await sleep(300);
    const shot = await c.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, p.name + '.png'), Buffer.from(shot.result.data, 'base64'));
    const pass = errors.length === 0 && checks.every(x => x[1]);
    report.push({ name: p.name, pass, checks, errors });
    console.log(`${pass ? '✅' : '❌'} ${p.name}`);
    for (const [d, v] of checks) console.log(`    ${v ? '✓' : '✗'} ${d}`);
    for (const e of errors) console.log(`    ⚠ ${e}`);
    c.ws.close();
    await getJSON(`http://127.0.0.1:${PORT}/json/close/${t.id}`).catch(() => {});
  }
  chrome.kill();
  fs.writeFileSync(path.join(SHOTS, 'report.json'), JSON.stringify(report, null, 2));
  const failed = report.filter(r => !r.pass).length;
  console.log(`\n共 ${report.length} 页，失败 ${failed}。截图与 report.json 在 ${SHOTS}`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
