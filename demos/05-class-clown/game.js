// 课堂捣蛋王 Class Clown — 6 节课的潜行恶作剧：背身写板书的老师、会巡逻的老师、告密的班长
// 趋势参考：2026 年 10 月 Steam Next Fest 热门的教室恶作剧派对游戏（原创单人潜行实现）
(() => {
  'use strict';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const desks = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) desks.push({ x: 150 + c * 150, y: 250 + r * 100, w: 80, h: 40, kid: XG.pick(['🧒', '👧', '👦', '🧒🏻', '👧🏽']) });
  const MY = 12;
  const floorImg = XG.img('../../assets/05-class-clown/floor.webp');
  const mySeat = { x: desks[MY].x, y: desks[MY].y + 42 };
  const POOL = {
    boardL: { x: 250, y: 75, name: '黑板上画小猪', need: 3.0, icon: '🐷' },
    boardR: { x: 650, y: 75, name: '黑板写“明天放假”', need: 2.6, icon: '📝' },
    lectern: { x: 420, y: 165, name: '讲台放假蟑螂', need: 2.2, icon: '🪳' },
    cup: { x: 490, y: 165, name: '茶杯里丢泡腾片', need: 1.8, icon: '🫧' },
    window: { x: 862, y: 300, name: '窗台放闹钟', need: 2.0, icon: '⏰' },
    trash: { x: 45, y: 505, name: '垃圾桶塞纸飞机', need: 1.6, icon: '✈️' },
    shelf: { x: 45, y: 250, name: '把地球仪倒过来', need: 2.0, icon: '🌍' },
    clock: { x: 840, y: 78, name: '挂钟拨快十分钟', need: 2.4, icon: '🕙' },
  };
  const LEVELS = [
    { name: '语文课', pranks: ['boardL', 'window', 'trash'], chairs: 1, monitors: [], mode: 'board', write: [3, 6], fake: 0.15, watch: [1.5, 2.4], glance: 0, time: 150 },
    { name: '数学课', pranks: ['boardR', 'lectern', 'shelf', 'trash'], chairs: 1, monitors: [6], mode: 'board', write: [2.6, 5], fake: 0.25, watch: [1.4, 2.4], glance: 0, time: 150 },
    { name: '英语课', pranks: ['boardL', 'cup', 'window', 'clock'], chairs: 1, monitors: [8], mode: 'board', write: [2.3, 4.5], fake: 0.3, watch: [1.2, 2.2], glance: 0.18, time: 145 },
    { name: '科学课', pranks: ['boardR', 'lectern', 'cup', 'shelf', 'clock'], chairs: 1, monitors: [6, 3], mode: 'board', write: [2.1, 4.2], fake: 0.3, watch: [1.3, 2.4], glance: 0.22, time: 160 },
    { name: '美术课', pranks: ['boardL', 'window', 'trash', 'shelf'], chairs: 2, monitors: [7], mode: 'patrol', speed: 62, time: 160 },
    { name: '期末考', pranks: ['boardR', 'lectern', 'cup', 'clock', 'trash'], chairs: 2, monitors: [6, 9], mode: 'mixed', write: [2.2, 4], fake: 0.3, watch: [1.3, 2.2], glance: 0.3, speed: 72, time: 180 },
  ];
  const PATH = [[450, 185], [75, 200], [75, 500], [375, 505], [375, 300], [525, 300], [525, 505], [825, 500], [825, 200]];
  const SAVE = XG.save('05-class-clown', { tutorialSeen: false, unlocked: 1, stars: {}, best: {}, totalPranks: 0 });
  const SV = SAVE.data;

  let S = null;
  function startLevel(li) {
    const L = LEVELS[li];
    const pranks = L.pranks.map(k => ({ ...POOL[k], prog: 0, done: false }));
    const pool = desks.map((d, i) => i).filter(i => i !== MY && !L.monitors.includes(i));
    XG.shuffle(pool);
    for (let k = 0; k < L.chairs; k++) { const d = desks[pool[k]]; pranks.push({ x: d.x, y: d.y + 42, name: '同学椅子放放屁垫', need: 1.5, icon: '💨', prog: 0, done: false }); }
    S = {
      li, L, t: 0, strikes: 0, over: false, pranks,
      p: { x: mySeat.x, y: mySeat.y, hide: false, stepT: 0 },
      T: { mode: L.mode === 'patrol' ? 'patrol' : 'board', state: 'writing', timer: 3, x: 450, y: 105, a: Math.PI / 2, wp: 0, pause: 0, mixT: 0, alertT: 0 },
      monitors: L.monitors.map(i => ({ desk: desks[i], looking: false, timer: 1 + Math.random() * 2, alert: 0 })),
      flash: 0, msg: `${L.name}开始了！溜出去搞点事情吧。`, msgT: 3, chalkT: 0,
    };
    if (L.mode === 'patrol') { S.T.x = PATH[0][0]; S.T.y = PATH[0][1]; }
    setupTouch();
  }
  const say = m => { S.msg = m; S.msgT = 2.6; };
  const inSeat = () => Math.hypot(S.p.x - mySeat.x, S.p.y - mySeat.y) < 20;
  const nearDesk = () => desks.some(d => S.p.x > d.x - d.w / 2 - 24 && S.p.x < d.x + d.w / 2 + 24 && S.p.y > d.y - d.h / 2 - 24 && S.p.y < d.y + d.h / 2 + 32);
  const atPrank = () => S.pranks.find(p => !p.done && Math.hypot(S.p.x - p.x, S.p.y - p.y) < 30);
  const blocked = (x, y) => desks.some(d => x > d.x - d.w / 2 - 6 && x < d.x + d.w / 2 + 6 && y > d.y - d.h / 2 - 6 && y < d.y + d.h / 2 + 6);

  function caught(reason) {
    S.strikes++; S.flash = 0.6; S.p.x = mySeat.x; S.p.y = mySeat.y;
    XG.audio.sfx('whistle'); XG.audio.sfx('hurt');
    say(`被抓了！${reason}（${S.strikes}/3）`);
    if (S.T.mode === 'board') { S.T.state = 'watching'; S.T.timer = 2.5; } else { S.T.pause = 1.5; }
    if (S.strikes >= 3) finish(false, '📞 被叫家长了……');
  }

  function inCone(T, x, y, range, half) {
    const dx = x - T.x, dy = y - T.y, d = Math.hypot(dx, dy);
    if (d > range) return false;
    let da = Math.atan2(dy, dx) - T.a; da = Math.atan2(Math.sin(da), Math.cos(da));
    return Math.abs(da) < half;
  }

  function update(dt) {
    if (!S || S.over || G.paused) return;
    const L = S.L; S.t += dt;
    if (S.t >= L.time) return finish(false, '🔔 下课了，恶作剧没做完');
    const pr = atPrank();
    const pranking = XG.keys.has('Space') && pr;
    S.p.hide = (XG.keys.has('ShiftLeft') || XG.keys.has('ShiftRight')) && nearDesk() && !pranking;
    let moving = false;
    if (!S.p.hide && !pranking) {
      let vx = 0, vy = 0;
      const st = XG.touch.sticks.move;
      if (st && st.active) { vx = st.x; vy = st.y; }
      else {
        if (XG.keys.has('KeyW') || XG.keys.has('ArrowUp')) vy--; if (XG.keys.has('KeyS') || XG.keys.has('ArrowDown')) vy++;
        if (XG.keys.has('KeyA') || XG.keys.has('ArrowLeft')) vx--; if (XG.keys.has('KeyD') || XG.keys.has('ArrowRight')) vx++;
      }
      const l = Math.hypot(vx, vy); if (l > 1) { vx /= l; vy /= l; }
      if (l > 0.1) {
        moving = true;
        const sp = 190, nx = XG.clamp(S.p.x + vx * sp * dt, 20, W - 20), ny = XG.clamp(S.p.y + vy * sp * dt, 60, H - 20);
        if (!blocked(nx, S.p.y)) S.p.x = nx; if (!blocked(S.p.x, ny)) S.p.y = ny;
        S.p.stepT += dt; if (S.p.stepT > 0.28) { S.p.stepT = 0; XG.audio.sfx('step'); }
      }
    }
    if (pranking) {
      pr.prog += dt; XG.audio.sfxThrottled('tick', 220);
      if (pr.prog >= pr.need) { pr.done = true; SV.totalPranks++; XG.audio.sfx('pop'); XG.audio.sfx('coin'); say(`✅ 完成：${pr.name}`); }
    }
    // 班长
    for (const m of S.monitors) {
      m.timer -= dt;
      if (m.timer <= 0) { m.looking = !m.looking; m.timer = m.looking ? 1.2 + Math.random() : 2 + Math.random() * 3; }
      const near = Math.hypot(S.p.x - m.desk.x, S.p.y - m.desk.y) < 140;
      if (m.looking && near && !S.p.hide && !inSeat() && (moving || pranking)) {
        m.alert += dt;
        if (m.alert > 0.5) {
          m.alert = 0; say('班长举手：“老师！有人乱跑！”'); XG.audio.sfx('alarm');
          if (S.T.mode === 'board' && S.T.state === 'writing') { S.T.state = 'turning'; S.T.timer = 0.4; }
          else if (S.T.mode === 'patrol') { S.T.chase = { x: S.p.x, y: S.p.y, t: 4 }; }
        }
      } else m.alert = Math.max(0, m.alert - dt);
    }
    // 老师
    const T = S.T;
    if (L.mode === 'mixed') {
      T.mixT += dt;
      if (T.mixT > 18) { T.mixT = 0; T.mode = T.mode === 'board' ? 'patrol' : 'toBoard'; say(T.mode === 'patrol' ? '老师走下讲台开始巡视了！' : '老师回讲台了'); XG.audio.sfx('alarm'); }
    }
    if (T.mode === 'toBoard') {
      const dx = 450 - T.x, dy = 105 - T.y, d = Math.hypot(dx, dy);
      if (d < 5) { T.mode = 'board'; T.state = 'writing'; T.timer = 2; } else { T.x += dx / d * 120 * dt; T.y += dy / d * 120 * dt; T.a = Math.atan2(dy, dx); }
      checkCone(T, pranking);
    } else if (T.mode === 'board') {
      T.timer -= dt;
      if (T.timer <= 0) {
        if (T.state === 'writing') {
          if (L.glance && Math.random() < L.glance) { T.state = 'turning'; T.timer = 0.4; T.quick = true; } else { T.state = 'turning'; T.timer = 0.75 + Math.random() * 0.35; T.quick = false; }
          XG.audio.sfx('tick');
        } else if (T.state === 'turning') {
          if (Math.random() < L.fake) { T.state = 'writing'; T.timer = 2 + Math.random() * 2; say('……虚惊一场，老师又转回去了'); }
          else { T.state = 'watching'; T.timer = T.quick ? 0.8 : XG.rand(...L.watch); }
        } else { T.state = 'writing'; T.timer = XG.rand(...L.write) - Math.min(1, S.t / 150); }
      }
      if (T.state === 'writing') { S.chalkT -= dt; if (S.chalkT <= 0) { S.chalkT = 0.6 + Math.random(); XG.audio.noise({ dur: 0.12, vol: 0.04, filter: 'bandpass', freq: 3200, q: 4 }); } }
      if (T.state === 'watching') {
        if (pranking) caught('正在恶作剧被当场看到');
        else if (!inSeat() && !S.p.hide) caught('不在座位上');
      }
    } else { // patrol
      const sp = L.speed || 62;
      let tx, ty;
      if (T.chase) { tx = T.chase.x; ty = T.chase.y; T.chase.t -= dt; if (T.chase.t <= 0 || Math.hypot(tx - T.x, ty - T.y) < 10) T.chase = null; }
      else { [tx, ty] = PATH[T.wp]; }
      if (T.pause > 0) { T.pause -= dt; T.a += Math.sin(S.t * 2.2) * dt * 1.6; }
      else {
        const dx = tx - T.x, dy = ty - T.y, d = Math.hypot(dx, dy);
        if (d < 4) { if (!T.chase) { T.wp = (T.wp + 1) % PATH.length; T.pause = 0.8 + Math.random() * 1.2; } }
        else { T.x += dx / d * sp * (T.chase ? 1.6 : 1) * dt; T.y += dy / d * sp * (T.chase ? 1.6 : 1) * dt; const ta = Math.atan2(dy, dx); let da = ta - T.a; da = Math.atan2(Math.sin(da), Math.cos(da)); T.a += da * Math.min(1, dt * 6); }
      }
      checkCone(T, pranking);
    }
    if (S.pranks.every(p => p.done)) return finish(true);
    if (S.flash > 0) S.flash -= dt; if (S.msgT > 0) S.msgT -= dt;
  }
  function checkCone(T, pranking) {
    const range = 230, half = 0.62;
    const seen = inCone(T, S.p.x, S.p.y, S.p.hide ? 50 : range, half);
    if (!seen) { T.alertT = Math.max(0, T.alertT - S._dt); return; }
    if (pranking) return caught('恶作剧时被巡视的老师看到');
    if (!inSeat() && !S.p.hide) { T.alertT += S._dt; if (T.alertT > 0.35) { T.alertT = 0; caught('在过道里乱晃被看到'); } }
  }

  function finish(win, title) {
    if (S.over) return; S.over = true;
    const li = S.li, key = 'L' + li;
    if (win) {
      const stars = S.strikes === 0 ? 3 : S.strikes === 1 ? 2 : 1;
      const left = Math.round(S.L.time - S.t), score = stars * 1000 + left * 10;
      const nb = !SV.best[key] || score > SV.best[key]; if (nb) SV.best[key] = score;
      SV.stars[key] = Math.max(SV.stars[key] || 0, stars); SV.unlocked = Math.max(SV.unlocked, Math.min(LEVELS.length, li + 2)); SAVE.write();
      XG.audio.sfx('bell');
      const last = li === LEVELS.length - 1;
      G.end({ win: true, title: last ? '🏆 全校闻名的捣蛋王！' : `😈 ${S.L.name}大成功！`, sub: `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}${nb ? ' · 新纪录' : ''}`,
        stats: [['被抓次数', S.strikes], ['剩余时间', left + ' 秒'], ['得分', score], ['累计恶作剧', SV.totalPranks]],
        buttons: [...(last ? [] : [{ label: '▶ 下一节课', primary: true, id: 'xgNext', onClick: () => G.start(li + 1) }]), { label: '🔁 再来一次', primary: last, id: 'xgAgain', onClick: () => G.start(li) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
    } else {
      SAVE.write();
      G.end({ win: false, title, sub: `完成了 ${S.pranks.filter(p => p.done).length}/${S.pranks.length} 个恶作剧。`, buttons: [{ label: '🔁 再来一次', primary: true, id: 'xgAgain', onClick: () => G.start(li) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
    }
  }

  // ---------- 绘制 ----------
  function draw() {
    // 地板
    ctx.fillStyle = '#cdb68a'; ctx.fillRect(0, 0, W, H);
    if (XG.ready(floorImg)) ctx.drawImage(floorImg, 0, 40, W, H);
    else { ctx.strokeStyle = '#bfa676'; ctx.lineWidth = 1; for (let y = 130; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } }
    ctx.fillStyle = '#efe4cc'; ctx.fillRect(0, 0, W, 125);
    ctx.fillStyle = '#1f4d36'; ctx.fillRect(100, 20, 700, 92); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 6; ctx.strokeRect(100, 20, 700, 92);
    ctx.fillStyle = '#e7f0e0'; ctx.font = '16px sans-serif'; ctx.textAlign = 'left';
    if (S) ctx.fillText(`今日：${S.L.name} · 请认真听讲`, 130, 60);
    ctx.fillStyle = '#9fd6ff'; ctx.fillRect(884, 190, 12, 240);
    ctx.fillStyle = '#7a5530'; ctx.fillRect(390, 145, 130, 38); ctx.fillStyle = '#8d6539'; ctx.fillRect(390, 145, 130, 8);
    ctx.fillStyle = '#8a6a3a'; ctx.fillRect(10, 215, 30, 80); ctx.fillStyle = '#596a7a'; ctx.fillRect(30, 480, 30, 40);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(840, 50, 16, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();
    if (!S) return;
    ctx.textAlign = 'center';
    for (let i = 0; i < desks.length; i++) {
      const d = desks[i];
      ctx.fillStyle = '#0002'; ctx.fillRect(d.x - d.w / 2 + 4, d.y - d.h / 2 + 5, d.w, d.h);
      ctx.fillStyle = '#b08955'; ctx.fillRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h); ctx.fillStyle = '#c29a63'; ctx.fillRect(d.x - d.w / 2, d.y - d.h / 2, d.w, 6);
      if (i !== MY) { const mon = S.monitors.find(m => m.desk === d); ctx.font = '22px sans-serif'; ctx.fillText(mon ? '🤓' : d.kid, d.x, d.y + 40); }
    }
    for (const m of S.monitors) if (m.looking) {
      ctx.fillStyle = m.alert > 0 ? 'rgba(255,60,60,.22)' : 'rgba(255,80,80,.1)'; ctx.beginPath(); ctx.arc(m.desk.x, m.desk.y, 140, 0, Math.PI * 2); ctx.fill();
      ctx.font = '16px sans-serif'; ctx.fillText('👓', m.desk.x + 20, m.desk.y + 26);
    }
    ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 3; ctx.strokeRect(mySeat.x - 20, mySeat.y - 18, 40, 36);
    for (const p of S.pranks) {
      ctx.font = '22px sans-serif'; ctx.fillText(p.done ? p.icon : '⭐', p.x, p.y + 8);
      if (!p.done && p.prog > 0) { ctx.fillStyle = '#0008'; ctx.fillRect(p.x - 20, p.y - 26, 40, 6); ctx.fillStyle = '#ffd400'; ctx.fillRect(p.x - 20, p.y - 26, 40 * p.prog / p.need, 6); }
      if (!p.done) { ctx.fillStyle = '#3a2a10'; ctx.font = '11px sans-serif'; ctx.fillText(p.name, p.x, p.y + 26); }
    }
    // 老师
    const T = S.T;
    if (T.mode !== 'board') {
      ctx.fillStyle = T.alertT > 0 ? 'rgba(255,40,40,.28)' : 'rgba(255,230,80,.18)';
      ctx.beginPath(); ctx.moveTo(T.x, T.y); ctx.arc(T.x, T.y, 230, T.a - 0.62, T.a + 0.62); ctx.closePath(); ctx.fill();
      ctx.font = '36px sans-serif'; ctx.fillText('🧑‍🏫', T.x, T.y + 12);
      if (T.chase) { ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#e00'; ctx.fillText('❗', T.x + 22, T.y - 18); }
    } else {
      ctx.font = '40px sans-serif'; ctx.fillText(T.state === 'writing' ? '🧍' : '🧑‍🏫', T.x, T.y + 14);
      if (T.state === 'turning') { ctx.font = 'bold 30px sans-serif'; ctx.fillStyle = '#e00'; ctx.fillText('❗', T.x + 30, T.y - 10); }
      if (T.state === 'watching') {
        ctx.fillStyle = 'rgba(255,0,0,.1)'; ctx.beginPath(); ctx.moveTo(T.x, T.y); ctx.lineTo(0, H); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
        ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#900'; ctx.fillText('👀 老师在看！', T.x, T.y - 30);
      } else if (T.state === 'writing') { ctx.font = '13px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('（写板书中…）', T.x, T.y - 30); }
    }
    // 玩家
    ctx.globalAlpha = S.p.hide ? 0.55 : 1; ctx.font = S.p.hide ? '20px sans-serif' : '28px sans-serif';
    ctx.fillText('😈', S.p.x, S.p.y + 10); ctx.globalAlpha = 1;
    if (S.p.hide) { ctx.font = '11px sans-serif'; ctx.fillStyle = '#222'; ctx.fillText('趴下中', S.p.x, S.p.y - 14); }
    const pr = atPrank();
    if (pr && !S.over) { ctx.fillStyle = '#000'; ctx.font = 'bold 13px sans-serif'; ctx.fillText((XG.isTouch ? '按住「恶作剧」：' : '按住空格：') + pr.name, S.p.x, S.p.y - 22); }
    // HUD
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(8, H - 44, 470, 36);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`📚 ${S.L.name}  ⏰ ${XG.fmtTime(S.L.time - S.t)}  😈 ${S.pranks.filter(p => p.done).length}/${S.pranks.length}  ❌ ${S.strikes}/3`, 18, H - 20);
    if (S.msgT > 0) { ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = 'rgba(0,0,0,.55)'; const w = ctx.measureText(S.msg).width; ctx.fillRect(W - w - 24, H - 44, w + 16, 36); ctx.fillStyle = '#ffe'; ctx.fillText(S.msg, W - 16, H - 20); }
    if (S.flash > 0) { ctx.fillStyle = `rgba(255,0,0,${S.flash * 0.5})`; ctx.fillRect(0, 0, W, H); }
  }

  function setupTouch() {
    if (!XG.touch.enabled || XG.touch.sticks.move) return placeTouch();
    XG.touch.stick('move', { hint: '拖动移动' });
    XG.touch.button('prank', { label: '恶作剧<br>(按住)', key: 'Space', size: 86, pos: { right: '20px', bottom: '24px' } });
    XG.touch.button('hide', { label: '趴下<br>(按住)', key: 'ShiftLeft', size: 70, pos: { right: '120px', bottom: '20px' } });
    placeTouch();
  }
  function placeTouch() { if (!XG.touch.sticks.move) return; const r = cv.getBoundingClientRect(); XG.touch.place('move', { left: r.left, top: r.top, width: r.width * 0.6, height: r.height }); }

  const G = XG.game({
    id: '05-class-clown', title: '🏫 课堂捣蛋王', subtitle: '6 节课，6 种老师。趁老师不注意溜出座位搞恶作剧，别被抓到，也别被班长告状！',
    cover: '../../assets/05-class-clown/cover.webp', music: 'retro', save: SAVE,
    tutorial: [
      { title: '溜出座位', text: '老师背对全班<b>写板书</b>时，用 WASD / 方向键离开座位（黄框）。', touch: '在画面左侧拖动摇杆移动。' },
      { title: '恶作剧', text: '走到 ⭐ 处，<b>按住空格</b>直到进度条满。进度会保留，可以分几次完成。', touch: '按住右下角「恶作剧」按钮。' },
      { title: '老师回头', text: '老师头顶出现 <b>❗</b> 就要转身了：赶紧回到座位，或贴着课桌<b>按住 Shift 趴下</b>。老师有时只是虚晃一枪，有时会突然快速回头。', touch: '「趴下」按钮在恶作剧按钮左边。' },
      { title: '班长与巡逻', text: '🤓 班长左顾右盼时（周围变红），你在他附近乱跑会被举报。美术课和期末考的老师会<b>下讲台巡逻</b>，黄色扇形是视野：别在视野里恶作剧，也别在过道里晃。', touch: '' },
      { title: '过关', text: '下课前完成全部恶作剧过关；被抓 3 次失败。被抓次数越少星星越多，Esc 暂停。', touch: '右上角 ⏸ 暂停。' },
    ],
    onStart: li => startLevel(li == null ? Math.min(SV.unlocked, LEVELS.length) - 1 : li),
    onRestart: () => startLevel(S.li),
    onQuit: () => { if (S) S.over = true; },
    onMenu: () => menu(),
    pauseInfo: () => S ? `${S.L.name} · 已完成 ${S.pranks.filter(p => p.done).length}/${S.pranks.length}` : '',
  });
  function menu() {
    const totalStars = Object.values(SV.stars).reduce((a, b) => a + b, 0);
    G.menu(`<div class="xg-stats"><span>已解锁</span><b>${SV.unlocked} / ${LEVELS.length}</b><span>星星</span><b>${totalStars} / ${LEVELS.length * 3}</b><span>累计恶作剧</span><b>${SV.totalPranks}</b></div>`, [
      { label: SV.unlocked > 1 ? `▶ 继续：${LEVELS[Math.min(SV.unlocked, LEVELS.length) - 1].name}` : '▶ 开始上课', primary: true, id: 'xgStart', onClick: () => G.start(Math.min(SV.unlocked, LEVELS.length) - 1) },
      { label: '🗺 选择课程', id: 'xgLevels', onClick: () => G.levelSelect(LEVELS.map((L, i) => ({ name: `${i + 1}. ${L.name}`, sub: L.mode === 'board' ? '讲台型老师' : L.mode === 'patrol' ? '巡逻型老师' : '混合型', locked: i >= SV.unlocked, stars: SV.stars['L' + i] || 0 })), i => G.start(i)) },
      { label: '📖 教程', onClick: () => G.tutorial(menu) },
    ]);
  }
  XG.fit(cv, { reserve: () => ({ w: 0, h: 16 }), onResize: () => placeTouch() });
  menu();
  let last = performance.now();
  function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; if (S) S._dt = dt; update(dt); draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__demo = { G, SV, get S() { return S; }, LEVELS, startLevel, finish };
})();
