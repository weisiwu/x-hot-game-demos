// 课堂捣蛋王 — 潜行恶作剧（趋势参考：2026 年 10 月 Steam Next Fest 热门的教室恶作剧派对游戏；原创单人潜行实现）
(() => {
  'use strict';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const CLASS_TIME = 150;

  const desks = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) desks.push({ x: 150 + c * 150, y: 250 + r * 100, w: 80, h: 40 });
  const mySeat = { x: desks[12].x, y: desks[12].y + 42 }; // 第三排中间
  const monitorDesk = desks[6];
  const PRANKS = [
    { name: '讲台放假蟑螂', x: 450, y: 165, need: 2.4 },
    { name: '黑板上画小猪', x: 250, y: 75, need: 3.2 },
    { name: '窗台放闹钟', x: 860, y: 300, need: 2.0 },
    { name: '同学椅子放坐垫', x: desks[3].x, y: desks[3].y + 42, need: 1.6 },
    { name: '垃圾桶里塞纸飞机', x: 60, y: 480, need: 1.8 },
  ].map(p => ({ ...p, prog: 0, done: false }));

  const S = {
    t: 0, strikes: 0, over: false, win: false,
    p: { x: mySeat.x, y: mySeat.y, hide: false },
    teacher: { state: 'writing', timer: 3, x: 450, y: 105 },
    monitor: { looking: false, timer: 2, alert: 0 },
    flash: 0, msg: '溜出去搞点事情吧！', msgT: 3,
  };
  const keys = new Set();
  addEventListener('keydown', e => { keys.add(e.code); if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); if (e.code === 'KeyR' && S.over) restart(); });
  addEventListener('keyup', e => keys.delete(e.code));

  function restart() {
    Object.assign(S, { t: 0, strikes: 0, over: false, win: false, flash: 0 });
    S.p = { x: mySeat.x, y: mySeat.y, hide: false };
    S.teacher = { state: 'writing', timer: 3, x: 450, y: 105 };
    PRANKS.forEach(p => { p.prog = 0; p.done = false; });
    say('重新上课！');
  }
  function say(m) { S.msg = m; S.msgT = 2.5; }

  const inSeat = () => Math.hypot(S.p.x - mySeat.x, S.p.y - mySeat.y) < 20;
  const nearDesk = () => desks.some(d => S.p.x > d.x - d.w / 2 - 22 && S.p.x < d.x + d.w / 2 + 22 && S.p.y > d.y - d.h / 2 - 22 && S.p.y < d.y + d.h / 2 + 30);
  const atPrank = () => PRANKS.find(p => !p.done && Math.hypot(S.p.x - p.x, S.p.y - p.y) < 28);
  function blocked(x, y) { return desks.some(d => x > d.x - d.w / 2 - 6 && x < d.x + d.w / 2 + 6 && y > d.y - d.h / 2 - 6 && y < d.y + d.h / 2 + 6); }

  function caught(reason) {
    S.strikes++; S.flash = 0.6;
    S.p.x = mySeat.x; S.p.y = mySeat.y;
    say(`被抓了！${reason}（${S.strikes}/3）`);
    S.teacher.state = 'watching'; S.teacher.timer = 2.5;
    if (S.strikes >= 3) { S.over = true; S.win = false; }
  }

  function update(dt) {
    if (S.over) return;
    S.t += dt;
    if (S.t >= CLASS_TIME) { S.over = true; S.win = false; return; }
    // 玩家
    const pr = atPrank();
    const pranking = keys.has('Space') && pr;
    S.p.hide = (keys.has('ShiftLeft') || keys.has('ShiftRight')) && nearDesk() && !pranking;
    if (!S.p.hide && !pranking) {
      let vx = 0, vy = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) vy--; if (keys.has('KeyS') || keys.has('ArrowDown')) vy++;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) vx--; if (keys.has('KeyD') || keys.has('ArrowRight')) vx++;
      const l = Math.hypot(vx, vy) || 1, sp = 190;
      const nx = Math.max(20, Math.min(W - 20, S.p.x + vx / l * sp * dt));
      const ny = Math.max(60, Math.min(H - 20, S.p.y + vy / l * sp * dt));
      if (!blocked(nx, S.p.y)) S.p.x = nx;
      if (!blocked(S.p.x, ny)) S.p.y = ny;
    }
    if (pranking) {
      pr.prog += dt;
      if (pr.prog >= pr.need) { pr.done = true; say(`✅ 完成：${pr.name}`); }
    }
    // 班长：周期性左顾右盼，看到附近在搞事会举手
    const m = S.monitor; m.timer -= dt;
    if (m.timer <= 0) { m.looking = !m.looking; m.timer = m.looking ? 1.2 + Math.random() : 2 + Math.random() * 3; }
    const nearMonitor = Math.hypot(S.p.x - monitorDesk.x, S.p.y - monitorDesk.y) < 150;
    if (m.looking && nearMonitor && !S.p.hide && !inSeat() && S.teacher.state === 'writing') {
      m.alert += dt;
      if (m.alert > 0.5) { m.alert = 0; say('班长举手：“老师！有人乱跑！”'); S.teacher.state = 'turning'; S.teacher.timer = 0.45; }
    } else m.alert = Math.max(0, m.alert - dt);
    // 老师状态机
    const T = S.teacher; T.timer -= dt;
    if (T.timer <= 0) {
      if (T.state === 'writing') { T.state = 'turning'; T.timer = 0.75 + Math.random() * 0.35; }
      else if (T.state === 'turning') {
        if (Math.random() < 0.25) { T.state = 'writing'; T.timer = 2 + Math.random() * 2; say('……虚惊一场，老师又转回去了'); }
        else { T.state = 'watching'; T.timer = 1.4 + Math.random() * 1.8; }
      } else { T.state = 'writing'; T.timer = 2.6 + Math.random() * 3.4 - Math.min(1.2, S.t / 120); }
    }
    if (T.state === 'watching') {
      if (pranking) caught('正在恶作剧被当场看到');
      else if (!inSeat() && !S.p.hide) caught('不在座位上');
    }
    if (PRANKS.every(p => p.done)) { S.over = true; S.win = true; }
    if (S.flash > 0) S.flash -= dt;
    if (S.msgT > 0) S.msgT -= dt;
  }

  function draw() {
    ctx.fillStyle = '#c9b48a'; ctx.fillRect(0, 0, W, H); // 地板
    ctx.fillStyle = '#1f4d36'; ctx.fillRect(100, 20, 700, 90); // 黑板
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 6; ctx.strokeRect(100, 20, 700, 90);
    ctx.fillStyle = '#e7f0e0'; ctx.font = '16px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('今日课题：牛顿第三定律  F = -F\'', 130, 60);
    if (PRANKS[1].done) { ctx.font = '36px sans-serif'; ctx.fillText('🐷', 230, 95); }
    // 讲台
    ctx.fillStyle = '#7a5530'; ctx.fillRect(390, 140, 120, 40);
    // 窗户
    ctx.fillStyle = '#9fd6ff'; ctx.fillRect(880, 200, 14, 220);
    // 课桌
    for (const d of desks) {
      ctx.fillStyle = d === monitorDesk ? '#a67c4a' : '#b08955';
      ctx.fillRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
      if (d !== desks[12]) { ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(d === monitorDesk ? '🤓' : '🧒', d.x, d.y + 40); }
    }
    // 班长视线
    if (S.monitor.looking) {
      ctx.fillStyle = 'rgba(255,80,80,.12)'; ctx.beginPath(); ctx.arc(monitorDesk.x, monitorDesk.y, 150, 0, Math.PI * 2); ctx.fill();
      ctx.font = '16px sans-serif'; ctx.fillText('👓', monitorDesk.x + 20, monitorDesk.y + 26);
    }
    // 我的座位
    ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 3; ctx.strokeRect(mySeat.x - 20, mySeat.y - 18, 40, 36);
    // 恶作剧点
    ctx.textAlign = 'center';
    for (const p of PRANKS) {
      ctx.font = '22px sans-serif';
      ctx.fillText(p.done ? '✅' : '⭐', p.x, p.y + 8);
      if (!p.done && p.prog > 0) { ctx.fillStyle = '#0008'; ctx.fillRect(p.x - 20, p.y - 26, 40, 6); ctx.fillStyle = '#ffd400'; ctx.fillRect(p.x - 20, p.y - 26, 40 * p.prog / p.need, 6); }
      ctx.fillStyle = '#3a2a10'; ctx.font = '11px sans-serif'; ctx.fillText(p.name, p.x, p.y + 26);
    }
    if (PRANKS[0].done) { ctx.font = '18px sans-serif'; ctx.fillText('🪳', 470, 160); }
    // 老师
    const T = S.teacher;
    ctx.font = '40px sans-serif';
    ctx.fillText(T.state === 'writing' ? '🧍' : '🧑‍🏫', T.x, T.y + 14);
    if (T.state === 'turning') { ctx.font = 'bold 30px sans-serif'; ctx.fillStyle = '#e00'; ctx.fillText('❗', T.x + 30, T.y - 10); }
    if (T.state === 'watching') {
      ctx.fillStyle = 'rgba(255,0,0,.10)'; ctx.beginPath(); ctx.moveTo(T.x, T.y); ctx.lineTo(0, H); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#900'; ctx.fillText('👀 老师在看！', T.x, T.y - 30);
    } else if (T.state === 'writing') { ctx.font = '13px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('（写板书中…）', T.x, T.y - 30); }
    // 玩家
    ctx.font = S.p.hide ? '20px sans-serif' : '28px sans-serif';
    ctx.globalAlpha = S.p.hide ? 0.55 : 1;
    ctx.fillText('😈', S.p.x, S.p.y + 10); ctx.globalAlpha = 1;
    if (S.p.hide) { ctx.font = '11px sans-serif'; ctx.fillStyle = '#222'; ctx.fillText('趴下中', S.p.x, S.p.y - 14); }
    const pr = atPrank();
    if (pr && !S.over) { ctx.fillStyle = '#000'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('按住空格：' + pr.name, S.p.x, S.p.y - 22); }
    // HUD
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(8, H - 44, 520, 36);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 15px sans-serif';
    const done = PRANKS.filter(p => p.done).length;
    ctx.fillText(`⏰ 距下课 ${Math.max(0, CLASS_TIME - S.t).toFixed(0)}s   😈 恶作剧 ${done}/5   ❌ 被抓 ${S.strikes}/3`, 18, H - 20);
    if (S.msgT > 0) { ctx.textAlign = 'right'; ctx.fillStyle = '#ffe'; ctx.font = 'bold 15px sans-serif'; ctx.fillText(S.msg, W - 14, H - 20); }
    if (S.flash > 0) { ctx.fillStyle = `rgba(255,0,0,${S.flash * 0.5})`; ctx.fillRect(0, 0, W, H); }
    if (S.over) {
      ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 34px sans-serif';
      ctx.fillText(S.win ? '🏆 完美的一节课（对你来说）！' : (S.strikes >= 3 ? '📞 被叫家长了……' : '🔔 下课了，恶作剧没做完'), W / 2, H / 2 - 10);
      ctx.font = '18px sans-serif'; ctx.fillText('按 R 重新开始', W / 2, H / 2 + 30);
    }
  }

  let last = performance.now();
  function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__demo = { S, PRANKS };
})();
