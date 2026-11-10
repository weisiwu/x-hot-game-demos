// 口袋排球 — 极简街机体育（趋势参考：2026 年 10 月 Next Fest 热门的街机排球 demo）
(() => {
  'use strict';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const GROUND = 420, NET_X = W / 2, NET_TOP = 290, NET_W = 10;
  const G = 1100, BG = G * 0.62, BR = 14, PR = 30, WIN = 7;

  const mk = (x, color, name) => ({ x, y: GROUND, vx: 0, vy: 0, color, name, onGround: true, spikeCD: 0 });
  let L = mk(200, '#ff8a3d', '你'), R = mk(W - 200, '#3dc7ff', 'CPU');
  const ball = { x: 200, y: 150, vx: 0, vy: 0 };
  const S = { score: [0, 0], touches: [0, 0], side: 0, pause: 1, server: 0, over: false, twoP: false, msg: '', msgT: 0 };

  const keys = new Set();
  addEventListener('keydown', e => {
    keys.add(e.code);
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    if (e.code === 'Digit2') { S.twoP = !S.twoP; R.name = S.twoP ? 'P2' : 'CPU'; flash(S.twoP ? '本地双人模式' : '人机模式'); }
    if (e.code === 'KeyR' && S.over) { S.score = [0, 0]; S.over = false; serve(0); }
  });
  addEventListener('keyup', e => keys.delete(e.code));
  function flash(m) { S.msg = m; S.msgT = 1.6; }

  function serve(who) {
    S.server = who; S.touches = [0, 0]; S.pause = 0.9;
    L.x = 200; R.x = W - 200; L.y = R.y = GROUND; L.vx = R.vx = L.vy = R.vy = 0;
    ball.x = who === 0 ? 200 : W - 200; ball.y = 140; ball.vx = 0; ball.vy = 0;
    S.side = who;
  }

  function point(winner, why) {
    S.score[winner]++;
    flash(`${winner === 0 ? L.name : R.name} 得分！${why}`);
    if (S.score[winner] >= WIN) { S.over = true; return; }
    serve(winner);
  }

  function predictLandingX() {
    // 无碰撞弹道预测（含墙面反弹）
    let x = ball.x, y = ball.y, vx = ball.vx, vy = ball.vy;
    for (let i = 0; i < 240; i++) {
      const dt = 1 / 60; vy += BG * dt; x += vx * dt; y += vy * dt;
      if (x < BR) { x = BR; vx = -vx; } if (x > W - BR) { x = W - BR; vx = -vx; }
      if (y > GROUND - PR - 30) return x;
    }
    return x;
  }

  function controlPlayer(p, left, right, jump, spike, minX, maxX, dt) {
    const sp = 330;
    p.vx = (keys.has(right) ? sp : 0) - (keys.has(left) ? sp : 0);
    if (keys.has(jump) && p.onGround) { p.vy = -560; p.onGround = false; }
    if (keys.has(spike)) trySpike(p);
    move(p, minX, maxX, dt);
  }
  function move(p, minX, maxX, dt) {
    p.vy += G * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.y >= GROUND) { p.y = GROUND; p.vy = 0; p.onGround = true; }
    p.x = Math.max(minX + PR, Math.min(maxX - PR, p.x));
    if (p.spikeCD > 0) p.spikeCD -= dt;
  }
  function trySpike(p) {
    if (p.onGround || p.spikeCD > 0) return;
    const cy = p.y - PR;
    if (Math.hypot(ball.x - p.x, ball.y - cy) < PR + BR + 40 && ball.y < cy + 10) {
      const dir = p === L ? 1 : -1;
      ball.vx = dir * 620; ball.vy = 380; p.spikeCD = 0.6;
      registerTouch(p === L ? 0 : 1);
      flash('💥 扣球！');
    }
  }

  function ai(dt) {
    const p = R, sp = 290;
    const lx = predictLandingX();
    let target = W * 0.75;
    if (ball.x > NET_X - 40 || lx > NET_X) target = lx + 16; // 站在球的右边一点，把球顶向左边
    const d = target - p.x;
    p.vx = Math.abs(d) < 6 ? 0 : Math.sign(d) * sp;
    const cy = p.y - PR;
    if (p.onGround && ball.x > NET_X && Math.abs(ball.x - p.x) < 60 && ball.y < cy - 20 && ball.y > cy - 190 && ball.vy > -100) { p.vy = -540; p.onGround = false; }
    if (!p.onGround && Math.random() < 0.06) trySpike(p);
    move(p, NET_X + NET_W / 2, W, dt);
  }

  function registerTouch(side) {
    if (S.side !== side) { S.side = side; S.touches = [0, 0]; }
    S.touches[side]++;
    if (S.touches[side] > 3) point(1 - side, '（对方超过 3 次触球）');
  }

  function collide(p) {
    const cx = p.x, cy = p.y - PR;
    const dx = ball.x - cx, dy = ball.y - cy, d = Math.hypot(dx, dy);
    if (d < PR + BR && d > 0) {
      const nx = dx / d, ny = dy / d;
      ball.x = cx + nx * (PR + BR + 0.5); ball.y = cy + ny * (PR + BR + 0.5);
      const rvx = ball.vx - p.vx, rvy = ball.vy - p.vy, dot = rvx * nx + rvy * ny;
      if (dot < 0) { ball.vx -= 1.9 * dot * nx; ball.vy -= 1.9 * dot * ny; }
      ball.vx += p.vx * 0.3; ball.vy += Math.min(0, p.vy) * 0.3;
      const s = Math.hypot(ball.vx, ball.vy);
      if (s < 480) { ball.vx = ball.vx / s * 480; ball.vy = ball.vy / s * 480; }
      if (s > 900) { ball.vx = ball.vx / s * 900; ball.vy = ball.vy / s * 900; }
      if (!p._touching) registerTouch(p === L ? 0 : 1);
      p._touching = true;
    } else p._touching = false;
  }

  function update(dt) {
    if (S.msgT > 0) S.msgT -= dt;
    if (S.over) return;
    controlPlayer(L, 'KeyA', 'KeyD', 'KeyW', 'KeyS', 0, NET_X - NET_W / 2, dt);
    if (S.twoP) controlPlayer(R, 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', NET_X + NET_W / 2, W, dt); else ai(dt);
    if (S.pause > 0) { S.pause -= dt; return; }
    ball.vy += BG * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    if (ball.x < BR) { ball.x = BR; ball.vx = Math.abs(ball.vx); }
    if (ball.x > W - BR) { ball.x = W - BR; ball.vx = -Math.abs(ball.vx); }
    if (ball.y < BR) { ball.y = BR; ball.vy = Math.abs(ball.vy); }
    // 网
    if (ball.x > NET_X - NET_W / 2 - BR && ball.x < NET_X + NET_W / 2 + BR && ball.y > NET_TOP - BR) {
      if (ball.y < NET_TOP && Math.abs(ball.x - NET_X) < NET_W / 2 + 2) { ball.y = NET_TOP - BR; ball.vy = -Math.abs(ball.vy) * 0.7; }
      else if (ball.x < NET_X) { ball.x = NET_X - NET_W / 2 - BR; ball.vx = -Math.abs(ball.vx) * 0.8; }
      else { ball.x = NET_X + NET_W / 2 + BR; ball.vx = Math.abs(ball.vx) * 0.8; }
    }
    const curSide = ball.x < NET_X ? 0 : 1;
    if (curSide !== S.side && S.touches[S.side] > 0) { S.touches = [0, 0]; }
    S.side = curSide;
    collide(L); collide(R);
    if (ball.y > GROUND - BR) point(ball.x < NET_X ? 1 : 0, '');
  }

  function drawPlayer(p, faceRight) {
    ctx.fillStyle = '#0003'; ctx.beginPath(); ctx.ellipse(p.x, GROUND + 6, PR, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y - PR, PR, Math.PI, 0); ctx.lineTo(p.x + PR, p.y); ctx.lineTo(p.x - PR, p.y); ctx.closePath(); ctx.fill();
    const ex = p.x + (faceRight ? 12 : -12), ey = p.y - PR - 8;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000'; const a = Math.atan2(ball.y - ey, ball.x - ex);
    ctx.beginPath(); ctx.arc(ex + Math.cos(a) * 3, ey + Math.sin(a) * 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(p.name, p.x, p.y - PR * 2 - 8);
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffb86b'); g.addColorStop(1, '#ffdca8');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e8c27a'; ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = '#fff'; ctx.fillRect(NET_X - NET_W / 2, NET_TOP, NET_W, GROUND - NET_TOP);
    ctx.fillStyle = '#c33'; ctx.fillRect(NET_X - NET_W / 2 - 2, NET_TOP - 4, NET_W + 4, 6);
    drawPlayer(L, true); drawPlayer(R, false);
    // 球
    ctx.fillStyle = '#0002'; ctx.beginPath(); ctx.ellipse(ball.x, GROUND + 4, BR * Math.max(0.3, 1 - (GROUND - ball.y) / 500), 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(ball.x, ball.y, BR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2c6fd1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ball.x, ball.y, BR - 3, 0.3, 2.4); ctx.stroke();
    if (ball.y < 0) { ctx.fillStyle = '#c33'; ctx.beginPath(); ctx.moveTo(ball.x, 4); ctx.lineTo(ball.x - 8, 16); ctx.lineTo(ball.x + 8, 16); ctx.fill(); }
    // 分数
    ctx.fillStyle = '#3a2410'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${S.score[0]}  :  ${S.score[1]}`, W / 2, 60);
    ctx.font = '13px sans-serif';
    ctx.fillText(`触球 ${S.touches[0]}/3`, W * 0.25, GROUND + 40); ctx.fillText(`触球 ${S.touches[1]}/3`, W * 0.75, GROUND + 40);
    if (S.msgT > 0) { ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#7a1d00'; ctx.fillText(S.msg, W / 2, 100); }
    if (S.over) {
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 36px sans-serif';
      ctx.fillText(S.score[0] > S.score[1] ? `🏆 ${L.name}赢了！` : `${R.name} 获胜`, W / 2, H / 2);
      ctx.font = '18px sans-serif'; ctx.fillText('按 R 再来一局', W / 2, H / 2 + 36);
    }
  }

  serve(0);
  let last = performance.now();
  function loop(now) { const dt = Math.min(0.033, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__demo = { S, ball, L, R };
})();
