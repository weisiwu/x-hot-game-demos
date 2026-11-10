// 落叶清扫队 — 合作 + 增量清洁玩法（趋势参考：2026 年 10 月走红的合作增量清洁类游戏；原创落叶公园主题）
(() => {
  'use strict';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const CS = 6, GW = W / CS, GH = H / CS;
  const dust = new Float32Array(GW * GH);
  const img = new ImageData(GW, GH);
  const dustCanvas = document.createElement('canvas'); dustCanvas.width = GW; dustCanvas.height = GH;
  const dctx = dustCanvas.getContext('2d');
  const depot = { x: W / 2, y: H / 2, r: 38 };

  let initialDust = 0;
  // 生成公园落叶：噪声 + 树下落叶堆
  const piles = Array.from({ length: 14 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 20 + Math.random() * 50 }));
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
    const x = gx * CS, y = gy * CS;
    let v = 0.35 + 0.25 * Math.sin(x * 0.013 + Math.sin(y * 0.02)) * Math.cos(y * 0.017) + Math.random() * 0.2;
    for (const c of piles) { const d = Math.hypot(x - c.x, y - c.y); if (d < c.r) v += 0.35 * (1 - d / c.r); }
    if (Math.hypot(x - depot.x, y - depot.y) < depot.r + 8) v = 0;
    v = Math.max(0, Math.min(1, v));
    dust[gy * GW + gx] = v; initialDust += v;
  }

  const team = { money: 0, brush: 0, bag: 0, boots: 0, drones: 0, refinery: 0, sold: 0 };
  const stats = () => ({
    radius: 7 + team.brush * 6,          // 像素
    rate: 2.2 + team.brush * 0.8,        // 每格每秒扫叶量
    cap: 12 + team.bag * 14,
    speed: 120 + team.boots * 28,
    price: 1 + team.refinery * 0.5,
  });
  const UPG = [
    { key: 'brush', name: '🧹 换更大的扫帚', base: 15, mult: 1.9, max: 8 },
    { key: 'bag', name: '🎒 加大落叶袋', base: 12, mult: 1.8, max: 8 },
    { key: 'boots', name: '👟 轻便跑鞋', base: 20, mult: 1.9, max: 6 },
    { key: 'drones', name: '🤖 买一台扫地机器人', base: 60, mult: 1.7, max: 8 },
    { key: 'refinery', name: '🏭 堆肥加工（卖价↑）', base: 40, mult: 2.1, max: 5 },
  ];
  const costOf = u => Math.round(u.base * Math.pow(u.mult, team[u.key]));

  const shop = document.getElementById('shop');
  UPG.forEach((u, i) => {
    const b = document.createElement('button'); b.id = 'u_' + u.key;
    b.onclick = () => buy(i); shop.appendChild(b);
  });
  function buy(i) {
    const u = UPG[i]; const c = costOf(u);
    if (team[u.key] >= u.max || team.money < c || game.over) return;
    team.money -= c; team[u.key]++;
    if (u.key === 'drones') drones.push(makeDrone());
    toast(`${u.name} → Lv${team[u.key]}`);
  }
  function refreshShop() {
    UPG.forEach(u => {
      const b = document.getElementById('u_' + u.key);
      const maxed = team[u.key] >= u.max;
      const txt = maxed ? `${u.name}（满级）` : `${u.name} Lv${team[u.key]} · $${costOf(u)}`;
      if (b.textContent !== txt) b.textContent = txt;
      const dis = maxed || team.money < costOf(u) || game.over;
      if (b.disabled !== dis) b.disabled = dis;
    });
  }

  const players = [
    { x: depot.x - 60, y: depot.y, bag: 0, color: '#ffd166', keys: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }, active: true, name: 'P1' },
    { x: depot.x + 60, y: depot.y, bag: 0, color: '#06d6a0', keys: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, active: false, name: 'P2' },
  ];
  const drones = [];
  function makeDrone() { return { x: depot.x, y: depot.y, bag: 0, cap: 10, tx: null, ty: null, mode: 'seek' }; }

  const keys = new Set();
  addEventListener('keydown', e => {
    keys.add(e.code);
    if (e.code.startsWith('Arrow')) e.preventDefault();
    if (e.code === 'KeyP') { players[1].active = !players[1].active; toast(players[1].active ? 'P2 加入！方向键移动' : 'P2 离开'); }
    if (/^Digit[1-5]$/.test(e.code)) buy(+e.code.slice(5) - 1);
    if (e.code === 'KeyR' && game.over) location.reload();
  });
  addEventListener('keyup', e => keys.delete(e.code));

  const game = { t: 0, over: false, toast: '', toastT: 0, cleaned: 0 };
  function toast(s) { game.toast = s; game.toastT = 2.2; }

  function suck(x, y, radius, rate, dt, room) {
    // 在半径内扫落叶，返回吸到的量
    let got = 0;
    const g0x = Math.max(0, ((x - radius) / CS) | 0), g1x = Math.min(GW - 1, ((x + radius) / CS) | 0);
    const g0y = Math.max(0, ((y - radius) / CS) | 0), g1y = Math.min(GH - 1, ((y + radius) / CS) | 0);
    for (let gy = g0y; gy <= g1y && got < room; gy++) for (let gx = g0x; gx <= g1x && got < room; gx++) {
      const cx = gx * CS + CS / 2, cy = gy * CS + CS / 2;
      if ((cx - x) ** 2 + (cy - y) ** 2 > radius * radius) continue;
      const i = gy * GW + gx;
      const take = Math.min(dust[i], rate * dt, room - got);
      dust[i] -= take; got += take;
    }
    return got;
  }

  function sell(amount) {
    const s = stats();
    const earned = amount * s.price;
    team.money += earned; team.sold += amount;
    return earned;
  }

  function findDustTarget(d) {
    // 随机采样若干格子，挑落叶多且近的
    let best = null, bestScore = -1;
    for (let k = 0; k < 40; k++) {
      const gx = (Math.random() * GW) | 0, gy = (Math.random() * GH) | 0;
      const v = dust[gy * GW + gx];
      if (v < 0.05) continue;
      const x = gx * CS + 3, y = gy * CS + 3;
      const score = v / (1 + Math.hypot(x - d.x, y - d.y) / 200);
      if (score > bestScore) { bestScore = score; best = { x, y }; }
    }
    return best;
  }

  function update(dt) {
    if (game.over) return;
    game.t += dt;
    const s = stats();
    for (const p of players) {
      if (!p.active) continue;
      let vx = 0, vy = 0;
      if (keys.has(p.keys.up)) vy--; if (keys.has(p.keys.down)) vy++;
      if (keys.has(p.keys.left)) vx--; if (keys.has(p.keys.right)) vx++;
      const l = Math.hypot(vx, vy) || 1;
      const slow = p.bag >= s.cap ? 0.75 : 1;
      p.x = Math.max(8, Math.min(W - 8, p.x + vx / l * s.speed * slow * dt));
      p.y = Math.max(8, Math.min(H - 8, p.y + vy / l * s.speed * slow * dt));
      if (p.bag < s.cap) p.bag += suck(p.x, p.y, s.radius, s.rate, dt, s.cap - p.bag);
      if (Math.hypot(p.x - depot.x, p.y - depot.y) < depot.r && p.bag > 0.01) {
        const e = sell(p.bag); p.bag = 0; toast(`${p.name} 卖出落叶 +$${e.toFixed(0)}`);
      }
    }
    for (const d of drones) {
      const dspeed = 70 + team.boots * 10;
      if (d.mode === 'seek') {
        if (d.tx == null || Math.random() < 0.004) { const t = findDustTarget(d); if (t) { d.tx = t.x; d.ty = t.y; } }
        if (d.tx != null) {
          const dx = d.tx - d.x, dy = d.ty - d.y, dist = Math.hypot(dx, dy);
          if (dist > 3) { d.x += dx / dist * dspeed * dt; d.y += dy / dist * dspeed * dt; }
          const got = suck(d.x, d.y, 8, 1.5, dt, d.cap - d.bag); d.bag += got;
          if (dist <= 3 && got < 0.001) d.tx = null;
        }
        if (d.bag >= d.cap - 0.01) d.mode = 'return';
      } else {
        const dx = depot.x - d.x, dy = depot.y - d.y, dist = Math.hypot(dx, dy);
        if (dist < depot.r * 0.6) { sell(d.bag); d.bag = 0; d.mode = 'seek'; d.tx = null; }
        else { d.x += dx / dist * dspeed * 1.3 * dt; d.y += dy / dist * dspeed * 1.3 * dt; }
      }
    }
    let rem = 0; for (let i = 0; i < dust.length; i++) rem += dust[i];
    game.cleaned = 1 - rem / initialDust;
    if (game.cleaned >= 0.95) { game.over = true; game.win = true; }
    if (game.toastT > 0) game.toastT -= dt;
  }

  function draw() {
    const d = img.data;
    for (let i = 0; i < dust.length; i++) {
      const v = dust[i];
      d[i * 4] = 52 + v * 170; d[i * 4 + 1] = 110 - v * 5; d[i * 4 + 2] = 48 - v * 20; d[i * 4 + 3] = 255;
    }
    dctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(dustCanvas, 0, 0, W, H);
    // 堆肥站
    ctx.fillStyle = '#5a3d1e'; ctx.beginPath(); ctx.arc(depot.x, depot.y, depot.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e0913a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ffe7c2'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('堆肥站', depot.x, depot.y + 4);
    const s = stats();
    for (const dr of drones) {
      ctx.fillStyle = '#ff7ab6'; ctx.fillRect(dr.x - 5, dr.y - 5, 10, 10);
      ctx.fillStyle = '#fff'; ctx.fillRect(dr.x - 5, dr.y + 7, 10 * dr.bag / dr.cap, 2);
    }
    for (const p of players) {
      if (!p.active) continue;
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, s.radius, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
      // 落叶袋条
      ctx.fillStyle = '#000a'; ctx.fillRect(p.x - 14, p.y - 18, 28, 5);
      ctx.fillStyle = p.bag >= s.cap ? '#ff5555' : '#ffffff'; ctx.fillRect(p.x - 14, p.y - 18, 28 * Math.min(1, p.bag / s.cap), 5);
      ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.fillText(p.name, p.x, p.y + 20);
    }
    // HUD
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(8, 8, 300, 62);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`💰 $${Math.floor(team.money)}    🧹 清洁度 ${(game.cleaned * 100).toFixed(1)}% / 95%`, 16, 28);
    ctx.font = '13px sans-serif';
    ctx.fillText(`⏱ ${game.t.toFixed(0)}s   落叶袋 ${Math.floor(players[0].bag)}/${s.cap}   卖价 $${s.price}/单位   机器人 ${drones.length}`, 16, 50);
    ctx.fillStyle = '#e0913a'; ctx.fillRect(16, 58, 280 * Math.min(1, game.cleaned / 0.95), 6);
    if (game.toastT > 0) {
      ctx.textAlign = 'center'; ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = `rgba(255,230,140,${Math.min(1, game.toastT)})`;
      ctx.fillText(game.toast, W / 2, H - 20);
    }
    if (game.over) {
      ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 34px sans-serif';
      ctx.fillText('🍂 公园清扫完成！', W / 2, H / 2 - 20);
      ctx.font = '18px sans-serif';
      ctx.fillText(`用时 ${game.t.toFixed(0)} 秒，共回收 ${team.sold.toFixed(0)} 单位落叶。按 R 重开`, W / 2, H / 2 + 20);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); draw(); refreshShop();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__demo = { team, game, players, drones, dust };
})();
