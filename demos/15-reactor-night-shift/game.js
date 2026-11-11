// 反应堆夜班 Reactor Night Shift — 单人多任务：控制功率、冷却、补水、泄压，同时处理起火、漏水和值班电话
// 灵感来源：2026 年 10 月 Steam Next Fest 派对榜上的“多人合作看管反应堆”demo（X 佐证弱；原创单人实现）
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cv = $('c'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
  const roomImg = XG.img('../../assets/15-reactor-night-shift/room.webp');
  const NIGHTS = [
    { name: '第一夜·熟悉设备', len: 90, quota: 520, band: [45, 75], events: 0.0, heat: 1.0 },
    { name: '第二夜·小火苗', len: 100, quota: 650, band: [50, 75], events: 0.06, heat: 1.05, kinds: ['fire'] },
    { name: '第三夜·漏水', len: 110, quota: 700, band: [50, 72], events: 0.08, heat: 1.1, kinds: ['fire', 'leak'] },
    { name: '第四夜·查岗电话', len: 120, quota: 860, band: [52, 72], events: 0.1, heat: 1.15, kinds: ['fire', 'leak', 'call'] },
    { name: '第五夜·暴雨', len: 130, quota: 960, band: [55, 72], events: 0.12, heat: 1.22, kinds: ['fire', 'leak', 'call'] },
    { name: '第六夜·一切都在响', len: 140, quota: 1080, band: [58, 72], events: 0.15, heat: 1.3, kinds: ['fire', 'leak', 'call'] },
  ];
  const SAVE = XG.save('15-reactor-night-shift', { tutorialSeen: false, unlocked: 1, stars: {}, best: {}, shifts: 0, mwh: 0 });
  const SV = SAVE.data;
  let S = null;

  function start(ni) {
    S = { ni, N: NIGHTS[ni], t: 0, temp: 30, pres: 20, cool: 100, energy: 0, rod: 40, pump: false, refill: false, ventCD: 0, events: [], over: false, steam: 0, warnT: 0, maxTemp: 30, alarmT: 0 };
    $('rod').value = 40; render();
  }
  function spawnEvent() {
    const k = XG.pick(S.N.kinds);
    if (S.events.filter(e => e.k === k).length >= 2) return;
    if (k === 'fire') S.events.push({ k, x: 120 + Math.random() * 660, y: 300 + Math.random() * 80, hp: 3 });
    if (k === 'leak') S.events.push({ k, x: 100 + Math.random() * 700, y: 120 + Math.random() * 60, hp: 2 });
    if (k === 'call') { if (S.events.some(e => e.k === 'call')) return; S.events.push({ k, x: 800, y: 60, t: 6 }); XG.audio.sfx('ring'); }
    if (k === 'fire') XG.audio.sfx('alarm');
  }

  function update(dt) {
    if (!S || S.over || G.paused) return;
    const N = S.N; S.t += dt;
    S.pump = (XG.keys.has('Digit1') || XG.keys.has('Numpad1') || hold.pump) && S.cool > 0 && !S.refill;
    S.refill = XG.keys.has('Digit2') || XG.keys.has('Numpad2') || hold.refill;
    if (XG.keys.has('ArrowUp')) setRod(S.rod + 40 * dt); if (XG.keys.has('ArrowDown')) setRod(S.rod - 40 * dt);
    const P = S.rod / 100, fires = S.events.filter(e => e.k === 'fire').length, leaks = S.events.filter(e => e.k === 'leak').length;
    // 温度：功率越高升得越快；冷却泵降温；起火额外加热
    S.temp += (P * 8.5 * N.heat - 2 - (S.pump ? 11 : 0) + fires * 2) * dt;
    S.temp = Math.max(15, S.temp);
    if (S.pump) S.cool = Math.max(0, S.cool - 9 * dt);
    if (S.refill) S.cool = Math.min(100, S.cool + 14 * dt);
    S.cool = Math.max(0, S.cool - leaks * 3 * dt);
    // 压力随温度上升
    S.pres += (S.temp / 100) * 3.2 * dt - (S.temp < 40 ? 1.5 * dt : 0); S.pres = Math.max(0, S.pres);
    if (S.ventCD > 0) S.ventCD -= dt;
    // 发电：在绿色区间内全额，区间外只有一半
    const inBand = S.rod >= N.band[0] && S.rod <= N.band[1];
    S.energy += P * 10 * (inBand ? 1 : 0.5) * dt;
    // 事件
    if (N.events && Math.random() < N.events * dt * 3) spawnEvent();
    for (const e of S.events) if (e.k === 'call') { e.t -= dt; if (e.t <= 0) { e.gone = true; S.energy = Math.max(0, S.energy - 40); XG.toast('☎️ 没接查岗电话，被扣了 40 发电量'); XG.audio.sfx('error'); } }
    S.events = S.events.filter(e => !e.gone);
    if (S.steam > 0) S.steam -= dt;
    S.maxTemp = Math.max(S.maxTemp, S.temp);
    if ((S.temp > 85 || S.pres > 85) && (S.alarmT -= dt) <= 0) { S.alarmT = 1; XG.audio.sfx('alarm'); }
    if (S.temp >= 100) return finish(false, '🔥 核心过热，紧急停堆！');
    if (S.pres >= 100) return finish(false, '💥 压力爆表，管道炸开了！');
    if (S.t >= N.len) return finish(S.energy >= N.quota, S.energy >= N.quota ? '' : '📉 发电量没达标');
  }
  function setRod(v) { S.rod = XG.clamp(v, 0, 100); $('rod').value = Math.round(S.rod); $('rodVal').textContent = Math.round(S.rod) + '%'; }
  function vent() {
    if (!S || S.over || G.paused || S.ventCD > 0) return;
    S.pres = Math.max(0, S.pres - 40); S.temp = Math.max(15, S.temp - 4); S.ventCD = 4; S.steam = 1.2; XG.audio.sfx('whoosh');
  }
  function finish(win, why) {
    if (S.over) return; S.over = true;
    const ni = S.ni, key = 'N' + ni; SV.shifts++; SV.mwh += Math.round(S.energy);
    if (win) {
      const stars = 1 + (S.energy >= S.N.quota * 1.2 ? 1 : 0) + (S.maxTemp < 85 ? 1 : 0);
      const nb = !SV.best[key] || S.energy > SV.best[key]; if (nb) SV.best[key] = Math.round(S.energy);
      SV.stars[key] = Math.max(SV.stars[key] || 0, stars); SV.unlocked = Math.max(SV.unlocked, Math.min(NIGHTS.length, ni + 2)); SAVE.write();
      const last = ni === NIGHTS.length - 1;
      G.end({ win: true, title: last ? '🏆 熬过了最难的一夜，你是值班之王！' : `🌅 ${S.N.name}：平安交班`, sub: `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}（★ 超额 20%，★ 全程温度不超过 85）${nb ? ' · 新纪录' : ''}`,
        stats: [['发电量', `${Math.round(S.energy)} / ${S.N.quota}`], ['最高温度', Math.round(S.maxTemp) + '%'], ['累计发电', SV.mwh]],
        buttons: [...(last ? [] : [{ label: '▶ 下一个夜班', primary: true, id: 'xgNext', onClick: () => G.start(ni + 1) }]), { label: '🔁 再值一次', primary: last, id: 'xgAgain', onClick: () => G.start(ni) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
    } else {
      SAVE.write();
      G.end({ win: false, title: why, sub: `发电 ${Math.round(S.energy)} / ${S.N.quota}，坚持了 ${Math.round(S.t)} 秒。功率别贪高，冷却液要记得补。`, buttons: [{ label: '🔁 再试一次', primary: true, id: 'xgAgain', onClick: () => G.start(ni) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
    }
  }

  // ---------- 输入 ----------
  const hold = { pump: false, refill: false };
  const bindHold = (id, k) => {
    const b = $(id);
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) { /* 合成事件 */ } hold[k] = true; b.classList.add('on'); XG.audio.init(); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { hold[k] = false; b.classList.remove('on'); }));
  };
  bindHold('bPump', 'pump'); bindHold('bRefill', 'refill');
  $('bVent').addEventListener('click', vent);
  $('rod').addEventListener('input', e => { if (S) { S.rod = +e.target.value; $('rodVal').textContent = S.rod + '%'; } });
  window.addEventListener('keydown', e => { if (G.state === 'play' && (e.code === 'Digit3' || e.code === 'Numpad3')) vent(); });
  cv.addEventListener('pointerdown', e => {
    if (!S || S.over || G.paused || G.state !== 'play') return;
    const p = XG.canvasPos(cv, e);
    for (const ev of S.events) if (Math.hypot(ev.x - p.x, ev.y - p.y) < 40) {
      if (ev.k === 'call') { ev.gone = true; S.energy += 15; XG.audio.sfx('select'); XG.toast('☎️ “一切正常！”查岗通过 +15'); }
      else { ev.hp--; XG.audio.sfx(ev.k === 'fire' ? 'splash' : 'thud'); if (ev.hp <= 0) { ev.gone = true; XG.audio.sfx('coin'); } }
      S.events = S.events.filter(x => !x.gone); return;
    }
  });

  // ---------- 绘制 ----------
  function gauge(x, label, v, color, warn) {
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x, 20, 46, 200);
    const h = 190 * XG.clamp(v / 100, 0, 1);
    ctx.fillStyle = warn && v > 80 && (performance.now() % 400 < 200) ? '#ff3b3b' : color; ctx.fillRect(x + 5, 215 - h, 36, h);
    ctx.strokeStyle = '#fff6'; ctx.strokeRect(x, 20, 46, 200);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, x + 23, 238); ctx.fillText(Math.round(v) + '%', x + 23, 254);
  }
  function draw() {
    if (XG.ready(roomImg)) ctx.drawImage(roomImg, 0, (H - W * roomImg.naturalHeight / roomImg.naturalWidth) / 2, W, W * roomImg.naturalHeight / roomImg.naturalWidth);
    else { ctx.fillStyle = '#123'; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = 'rgba(5,15,20,.45)'; ctx.fillRect(0, 0, W, H);
    if (!S) return;
    const N = S.N, P = S.rod / 100;
    // 反应堆核心
    const cx = W / 2, cy = 175, glow = 0.4 + P * 0.6, hot = S.temp / 100;
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
    g.addColorStop(0, `rgba(${180 + hot * 75},${255 - hot * 160},${160 - hot * 120},${glow})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 120, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#9fe'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, 64, 0, Math.PI * 2); ctx.stroke();
    const shake = S.temp > 80 ? (Math.random() - .5) * 4 : 0;
    ctx.fillStyle = `hsl(${140 - hot * 140},90%,${50 + hot * 10}%)`; ctx.beginPath(); ctx.arc(cx + shake, cy, 44, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${Math.round(P * 100)}%`, cx, cy + 6);
    if (S.steam > 0) { ctx.fillStyle = `rgba(230,240,240,${S.steam * 0.5})`; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(cx - 120 + i * 34, 60 - S.steam * 20, 18 + i % 3 * 6, 0, Math.PI * 2); ctx.fill(); } }
    gauge(30, '🌡 温度', S.temp, '#ff8a3d', true); gauge(90, '🎈 压力', S.pres, '#ffd34d', true); gauge(W - 76, '💧 冷却液', S.cool, '#5fd3ff');
    // 发电与时间
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(160, 290, 580, 70);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`${N.name}   ⏱ ${XG.fmtTime(N.len - S.t)}   ⚡ ${Math.round(S.energy)} / ${N.quota}`, 172, 314);
    ctx.fillStyle = '#333'; ctx.fillRect(172, 326, 556, 12); ctx.fillStyle = S.energy >= N.quota ? '#7dffb0' : '#ffcc4d'; ctx.fillRect(172, 326, 556 * Math.min(1, S.energy / N.quota), 12);
    // 控制棒绿色区间
    ctx.fillStyle = '#333'; ctx.fillRect(172, 344, 556, 8);
    ctx.fillStyle = '#3fbf6f'; ctx.fillRect(172 + 556 * N.band[0] / 100, 344, 556 * (N.band[1] - N.band[0]) / 100, 8);
    ctx.fillStyle = '#fff'; ctx.fillRect(172 + 556 * P - 2, 341, 4, 14);
    ctx.font = '11px sans-serif'; ctx.fillStyle = '#cfe'; ctx.fillText('控制棒在绿色区间内发电效率翻倍', 172, 374);
    // 事件
    ctx.textAlign = 'center';
    for (const e of S.events) {
      if (e.k === 'fire') { ctx.font = `${30 + e.hp * 6}px sans-serif`; ctx.fillText('🔥', e.x, e.y + Math.sin(performance.now() / 90) * 2); }
      if (e.k === 'leak') { ctx.font = '30px sans-serif'; ctx.fillText('💦', e.x, e.y); ctx.fillStyle = 'rgba(95,211,255,.6)'; ctx.fillRect(e.x - 2, e.y + 6, 4, 40); }
      if (e.k === 'call') { ctx.font = '40px sans-serif'; ctx.fillText('☎️', e.x, e.y + 14); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(`点我接听 ${Math.ceil(e.t)}s`, e.x, e.y + 34); }
    }
    if (S.temp > 85 || S.pres > 85) { ctx.fillStyle = `rgba(255,0,0,${0.12 + 0.1 * Math.sin(performance.now() / 120)})`; ctx.fillRect(0, 0, W, H); }
  }
  function render() { if (!S) return; $('rodVal').textContent = Math.round(S.rod) + '%'; }

  const G = XG.game({
    id: '15-reactor-night-shift', title: '☢️ 反应堆夜班', subtitle: '一个人看管整座（卡通）反应堆：调功率发电、按住冷却、记得补水、按时泄压，还要灭火、堵漏、接查岗电话。撑过 6 个夜班！',
    cover: '../../assets/15-reactor-night-shift/cover.webp', music: 'tense', save: SAVE,
    tutorial: [
      { title: '发电', text: '拖动<b>控制棒</b>调功率（键盘 ↑↓）。功率越高发电越快，但温度也升得越快。控制棒放在<b>绿色区间</b>里发电效率翻倍。夜班结束前发电量达标就过关。', touch: '拖动底部滑杆。' },
      { title: '冷却与补水', text: '<b>按住冷却泵</b>（键 1）降温，会消耗冷却液；<b>按住补水</b>（键 2）给冷却液加满，补水时冷却泵不工作。', touch: '用手指按住按钮不放。' },
      { title: '压力', text: '温度越高压力涨得越快，压力满了会爆管。点<b>泄压阀</b>（键 3）立刻降压，之后要冷却 4 秒。', touch: '' },
      { title: '突发状况', text: '从第二夜开始：<b>🔥 起火</b>会额外加热（点 3 下扑灭）；<b>💦 漏水</b>会流失冷却液（点 2 下堵住）；<b>☎️ 查岗电话</b>要在 6 秒内点接听。温度或压力到 100% 就失败。', touch: '直接点画面里的图标。' },
    ],
    onStart: ni => start(ni == null ? Math.min(SV.unlocked, NIGHTS.length) - 1 : ni),
    onRestart: () => start(S.ni),
    onQuit: () => { if (S) S.over = true; },
    onMenu: () => menu(),
    onPause: () => { hold.pump = hold.refill = false; },
    pauseInfo: () => S ? `${S.N.name} · 发电 ${Math.round(S.energy)}/${S.N.quota}` : '',
  });
  function menu() {
    const stars = Object.values(SV.stars).reduce((a, b) => a + b, 0);
    G.menu(`<div class="xg-stats"><span>已解锁夜班</span><b>${SV.unlocked} / ${NIGHTS.length}</b><span>星星</span><b>${stars} / ${NIGHTS.length * 3}</b><span>累计发电</span><b>${SV.mwh}</b></div>`, [
      { label: `▶ 上班：${NIGHTS[Math.min(SV.unlocked, NIGHTS.length) - 1].name}`, primary: true, id: 'xgStart', onClick: () => G.start(Math.min(SV.unlocked, NIGHTS.length) - 1) },
      { label: '🗓 选择夜班', id: 'xgLevels', onClick: () => G.levelSelect(NIGHTS.map((n, i) => ({ name: `${i + 1}. ${n.name.split('·')[1]}`, sub: `目标 ${n.quota}`, locked: i >= SV.unlocked, stars: SV.stars['N' + i] || 0 })), i => G.start(i), '选择夜班') },
      { label: '📖 教程', onClick: () => G.tutorial(menu) },
    ]);
  }
  XG.fit(cv, { reserve: () => ({ w: 0, h: $('panel').offsetHeight + 24 }), onResize: () => { $('panel').style.width = cv.style.width; } });
  menu();
  let last = performance.now();
  function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__demo = { G, SV, get S() { return S; }, NIGHTS, start, update, finish, setRod: v => setRod(v), vent, hold };
})();
