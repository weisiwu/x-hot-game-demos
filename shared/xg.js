/* XG — 12 个小游戏共用的轻量框架（纯前端、无依赖）
 * - XG.storage / XG.save：localStorage 存档，检测不可用时回退内存并给出提示
 * - XG.audio：WebAudio 合成音效 + 程序化背景音乐，静音状态会记住
 * - XG.game()：开始界面、暂停、教程、结算、关卡选择、顶栏按钮
 * - XG.touch：触屏虚拟摇杆 / 按钮（通过派发键盘事件驱动游戏，与键盘操作共用一套逻辑）
 * - XG.fit()：画布按视口等比缩放
 */
(function () {
  'use strict';
  const XG = (window.XG = {});
  const $el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  XG.el = $el;
  XG.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  XG.rand = (a, b) => a + Math.random() * (b - a);
  XG.pick = arr => arr[(Math.random() * arr.length) | 0];
  XG.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  XG.fmtTime = s => { s = Math.max(0, s); const m = Math.floor(s / 60); return m + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };
  XG.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || /[?&]touch=1/.test(location.search);
  if (XG.isTouch) document.documentElement.classList.add('xg-touch-device');

  /* ---------------- 存档 ---------------- */
  XG.storage = (() => {
    let ok = false;
    const mem = {};
    try { const k = '__xg_probe__'; localStorage.setItem(k, '1'); ok = localStorage.getItem(k) === '1'; localStorage.removeItem(k); } catch (e) { ok = false; }
    const isFile = location.protocol === 'file:';
    return {
      persistent: ok, isFile,
      get(key, def) { try { const v = ok ? localStorage.getItem(key) : mem[key]; return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
      set(key, val) { const s = JSON.stringify(val); mem[key] = s; if (ok) { try { localStorage.setItem(key, s); } catch (e) { /* 配额满等情况忽略 */ } } },
      remove(key) { delete mem[key]; if (ok) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } } },
      notice() {
        if (!ok) return '⚠️ 当前浏览器环境无法写入本地存档（常见于 file:// 直接打开或隐私模式），本次进度只保存在内存里，关闭页面会丢失。建议在仓库目录运行 <code>python3 -m http.server 8000</code> 后用 http://localhost:8000 访问。';
        if (isFile) return '提示：你正在用 file:// 打开，存档能否保留取决于浏览器（Chrome 通常可以，Safari 等可能不行）。想要稳定存档，请用 <code>python3 -m http.server</code> 本地服务器访问。';
        return '';
      },
    };
  })();
  XG.save = (gameId, defaults) => {
    const key = 'xhgd:' + gameId;
    const loaded = XG.storage.get(key, null);
    const data = Object.assign(JSON.parse(JSON.stringify(defaults)), loaded || {});
    return {
      data, key,
      write() { XG.storage.set(key, data); },
      reset() { const d = JSON.parse(JSON.stringify(defaults)); Object.keys(data).forEach(k => delete data[k]); Object.assign(data, d); XG.storage.set(key, data); },
    };
  };
  const settings = XG.storage.get('xhgd:settings', { muted: false, music: true });

  /* ---------------- 音频 ---------------- */
  const A = (XG.audio = { ctx: null, muted: !!settings.muted, musicOn: settings.music !== false, theme: null });
  A.init = () => {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    A.ctx = new AC();
    A.master = A.ctx.createGain(); A.master.gain.value = A.muted ? 0 : 0.9; A.master.connect(A.ctx.destination);
    A.sfxBus = A.ctx.createGain(); A.sfxBus.gain.value = 0.55; A.sfxBus.connect(A.master);
    A.musicBus = A.ctx.createGain(); A.musicBus.gain.value = A.musicOn ? 0.22 : 0; A.musicBus.connect(A.master);
    const len = A.ctx.sampleRate * 1.0; A.noiseBuf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
    const d = A.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (A.pendingTheme) { A.music(A.pendingTheme); A.pendingTheme = null; }
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => A.init(), { passive: true }));
  function saveSettings() { XG.storage.set('xhgd:settings', { muted: A.muted, music: A.musicOn }); }
  A.setMuted = m => { A.muted = m; if (A.master) A.master.gain.setTargetAtTime(m ? 0 : 0.9, A.ctx.currentTime, 0.02); saveSettings(); XG._syncTopbar && XG._syncTopbar(); };
  A.setMusic = on => { A.musicOn = on; if (A.musicBus) A.musicBus.gain.setTargetAtTime(on ? 0.22 : 0, A.ctx.currentTime, 0.05); saveSettings(); XG._syncTopbar && XG._syncTopbar(); };

  function tone(o) {
    if (!A.ctx || A.muted) return;
    const t = A.ctx.currentTime + (o.delay || 0);
    const osc = A.ctx.createOscillator(), g = A.ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + o.dur);
    const v = (o.vol == null ? 0.3 : o.vol);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g); g.connect(o.bus || A.sfxBus); osc.start(t); osc.stop(t + o.dur + 0.02);
  }
  function noise(o) {
    if (!A.ctx || A.muted) return;
    const t = A.ctx.currentTime + (o.delay || 0);
    const src = A.ctx.createBufferSource(); src.buffer = A.noiseBuf;
    const f = A.ctx.createBiquadFilter(); f.type = o.filter || 'lowpass'; f.frequency.value = o.freq || 2000; f.Q.value = o.q || 0.8;
    const g = A.ctx.createGain(); const v = o.vol == null ? 0.3 : o.vol;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); g.connect(o.bus || A.sfxBus); src.start(t, Math.random() * 0.5); src.stop(t + o.dur + 0.02);
  }
  A.tone = tone; A.noise = noise;
  const DTMF = { 1: [697, 1209], 2: [697, 1336], 3: [697, 1477], 4: [770, 1209], 5: [770, 1336], 6: [770, 1477], 7: [852, 1209], 8: [852, 1336], 9: [852, 1477], '*': [941, 1209], 0: [941, 1336], '#': [941, 1477] };
  const SFX = {
    click: () => tone({ type: 'triangle', f0: 660, dur: 0.06, vol: 0.18 }),
    select: () => { tone({ type: 'triangle', f0: 520, dur: 0.06, vol: 0.2 }); tone({ type: 'triangle', f0: 780, dur: 0.08, vol: 0.2, delay: 0.05 }); },
    coin: () => { tone({ type: 'square', f0: 988, dur: 0.07, vol: 0.14 }); tone({ type: 'square', f0: 1319, dur: 0.18, vol: 0.14, delay: 0.07 }); },
    pickup: () => tone({ type: 'triangle', f0: 600, f1: 1200, dur: 0.1, vol: 0.2 }),
    pop: () => tone({ type: 'sine', f0: 400, f1: 900, dur: 0.07, vol: 0.25 }),
    hit: () => { noise({ dur: 0.08, vol: 0.25, freq: 1800 }); tone({ type: 'square', f0: 220, f1: 90, dur: 0.1, vol: 0.15 }); },
    hurt: () => { tone({ type: 'sawtooth', f0: 300, f1: 80, dur: 0.25, vol: 0.22 }); noise({ dur: 0.15, vol: 0.18, freq: 900 }); },
    jump: () => tone({ type: 'square', f0: 300, f1: 620, dur: 0.14, vol: 0.14 }),
    whoosh: () => noise({ dur: 0.25, vol: 0.2, filter: 'bandpass', freq: 1200, q: 0.6 }),
    rustle: () => noise({ dur: 0.07, vol: 0.12, filter: 'highpass', freq: 2500 }),
    scratch: () => noise({ dur: 0.05, vol: 0.1, filter: 'bandpass', freq: 3500, q: 1.5 }),
    splash: () => noise({ dur: 0.35, vol: 0.25, filter: 'lowpass', freq: 1400 }),
    explosion: () => { noise({ dur: 0.5, vol: 0.4, freq: 700 }); tone({ type: 'sine', f0: 120, f1: 40, dur: 0.4, vol: 0.3 }); },
    laser: () => tone({ type: 'square', f0: 1400, f1: 300, dur: 0.08, vol: 0.08 }),
    error: () => { tone({ type: 'square', f0: 180, dur: 0.12, vol: 0.18 }); tone({ type: 'square', f0: 140, dur: 0.18, vol: 0.18, delay: 0.1 }); },
    powerup: () => [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'square', f0: f, dur: 0.1, vol: 0.13, delay: i * 0.07 })),
    levelup: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.14, vol: 0.2, delay: i * 0.06 })),
    win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone({ type: 'square', f0: f, dur: i === 5 ? 0.5 : 0.14, vol: 0.14, delay: i * 0.12 })),
    lose: () => [392, 330, 262, 196].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.28, vol: 0.22, delay: i * 0.2 })),
    dice: () => { for (let i = 0; i < 6; i++) noise({ dur: 0.03, vol: 0.18, filter: 'bandpass', freq: 2500 + Math.random() * 2000, q: 3, delay: i * 0.045 + Math.random() * 0.02 }); },
    card: () => noise({ dur: 0.09, vol: 0.18, filter: 'highpass', freq: 1800 }),
    step: () => noise({ dur: 0.04, vol: 0.08, freq: 600 }),
    alarm: () => [0, 1, 2, 3].forEach(i => tone({ type: 'square', f0: i % 2 ? 660 : 880, dur: 0.14, vol: 0.12, delay: i * 0.15 })),
    siren: () => { tone({ type: 'sawtooth', f0: 600, f1: 1100, dur: 0.4, vol: 0.1 }); tone({ type: 'sawtooth', f0: 1100, f1: 600, dur: 0.4, vol: 0.1, delay: 0.4 }); },
    ring: () => { for (let i = 0; i < 2; i++) { tone({ type: 'sine', f0: 440, dur: 0.4, vol: 0.12, delay: i * 0.5 }); tone({ type: 'sine', f0: 480, dur: 0.4, vol: 0.12, delay: i * 0.5 }); } },
    hangup: () => { for (let i = 0; i < 3; i++) { tone({ type: 'sine', f0: 480, dur: 0.22, vol: 0.12, delay: i * 0.45 }); tone({ type: 'sine', f0: 620, dur: 0.22, vol: 0.12, delay: i * 0.45 }); } },
    static: () => noise({ dur: 0.6, vol: 0.12, filter: 'bandpass', freq: 2200, q: 0.3 }),
    thud: () => { tone({ type: 'sine', f0: 140, f1: 50, dur: 0.18, vol: 0.35 }); noise({ dur: 0.08, vol: 0.15, freq: 500 }); },
    bounce: () => tone({ type: 'sine', f0: 320, f1: 520, dur: 0.08, vol: 0.25 }),
    spike: () => { noise({ dur: 0.12, vol: 0.3, freq: 2500 }); tone({ type: 'square', f0: 900, f1: 200, dur: 0.15, vol: 0.15 }); },
    whistle: () => { tone({ type: 'sine', f0: 2200, dur: 0.18, vol: 0.12 }); tone({ type: 'sine', f0: 2300, dur: 0.3, vol: 0.12, delay: 0.2 }); },
    heal: () => tone({ type: 'sine', f0: 500, f1: 1000, dur: 0.25, vol: 0.15 }),
    crumble: () => { noise({ dur: 0.3, vol: 0.25, freq: 800 }); },
    wind: () => noise({ dur: 1.2, vol: 0.18, filter: 'bandpass', freq: 500, q: 0.4 }),
    tick: () => tone({ type: 'square', f0: 1800, dur: 0.02, vol: 0.06 }),
    bell: () => [0, 0.35, 0.7].forEach(d => { tone({ type: 'sine', f0: 1046, dur: 0.6, vol: 0.15, delay: d }); tone({ type: 'sine', f0: 1568, dur: 0.4, vol: 0.06, delay: d }); }),
  };
  A.sfx = (name, arg) => {
    if (!A.ctx || A.muted) return;
    if (name === 'dtmf') { const p = DTMF[arg] || DTMF[5]; tone({ type: 'sine', f0: p[0], dur: 0.14, vol: 0.12 }); tone({ type: 'sine', f0: p[1], dur: 0.14, vol: 0.12 }); return; }
    const f = SFX[name]; if (f) f();
  };
  // 节流：频繁调用的音效（如扫地、刮卡）
  const lastPlay = {};
  A.sfxThrottled = (name, ms) => { const now = performance.now(); if (now - (lastPlay[name] || 0) < ms) return; lastPlay[name] = now; A.sfx(name); };

  /* 程序化背景音乐：按主题生成 8 小节旋律 + 低音 + 鼓点，循环播放 */
  const THEMES = {
    calm: { bpm: 88, root: 57, scale: [0, 2, 4, 7, 9], prog: [0, 9, 5, 7], lead: 'triangle', density: 0.38, drums: 'soft', seed: 3 },
    cozy: { bpm: 96, root: 60, scale: [0, 2, 4, 7, 9], prog: [0, 5, 9, 7], lead: 'triangle', density: 0.45, drums: 'soft', seed: 11 },
    night: { bpm: 100, root: 57, scale: [0, 3, 5, 7, 10], prog: [0, 8, 3, 10], lead: 'square', density: 0.4, drums: 'swing', seed: 7 },
    upbeat: { bpm: 128, root: 60, scale: [0, 2, 4, 7, 9], prog: [0, 7, 9, 5], lead: 'square', density: 0.55, drums: 'four', seed: 21 },
    tense: { bpm: 112, root: 55, scale: [0, 1, 3, 7, 8], prog: [0, 1, 0, 8], lead: 'sawtooth', density: 0.3, drums: 'tense', seed: 5 },
    sport: { bpm: 138, root: 62, scale: [0, 2, 4, 7, 9], prog: [0, 5, 7, 5], lead: 'square', density: 0.5, drums: 'four', seed: 31 },
    action: { bpm: 140, root: 52, scale: [0, 3, 5, 7, 10], prog: [0, 10, 8, 7], lead: 'sawtooth', density: 0.55, drums: 'drive', seed: 13 },
    retro: { bpm: 118, root: 57, scale: [0, 2, 3, 7, 9], prog: [0, 5, 3, 7], lead: 'square', density: 0.5, drums: 'swing', seed: 17 },
    mystery: { bpm: 92, root: 50, scale: [0, 2, 3, 7, 8], prog: [0, 8, 5, 7], lead: 'triangle', density: 0.32, drums: 'soft', seed: 23 },
    epic: { bpm: 108, root: 48, scale: [0, 2, 3, 5, 7, 10], prog: [0, 8, 10, 7], lead: 'sawtooth', density: 0.45, drums: 'drive', seed: 41 },
  };
  function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function buildSong(th) {
    const r = mulberry(th.seed); const bars = 8, steps = 16; const lead = [];
    let deg = 2;
    for (let b = 0; b < bars; b++) {
      const motif = b % 4 === 3 ? b : b % 2; // 简单的重复结构
      const rr = mulberry(th.seed * 100 + motif);
      for (let s = 0; s < steps; s++) {
        const strong = s % 4 === 0;
        if (rr() < (strong ? th.density + 0.25 : th.density * 0.6)) {
          deg = XG.clamp(deg + Math.round((rr() - 0.5) * 3), 0, th.scale.length * 2 - 1);
          const oct = Math.floor(deg / th.scale.length), note = th.root + 12 + th.scale[deg % th.scale.length] + 12 * oct;
          lead.push({ b, s, n: note, len: rr() < 0.3 ? 2 : 1 });
        }
      }
    }
    r();
    return { lead, bars, steps };
  }
  const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
  A.music = name => {
    if (!A.ctx) { A.pendingTheme = name; return; }
    if (A.theme === name && A.seqTimer) return;
    A.stopMusic();
    const th = THEMES[name] || THEMES.calm; A.theme = name;
    const song = buildSong(th); const stepDur = 60 / th.bpm / 4;
    let step = 0, next = A.ctx.currentTime + 0.1;
    const sched = () => {
      if (A.musicPaused) { next = A.ctx.currentTime + 0.1; return; }
      while (next < A.ctx.currentTime + 0.15) {
        const bar = Math.floor(step / song.steps) % song.bars, s = step % song.steps;
        const chord = th.root - 12 + th.prog[Math.floor(bar / 2) % th.prog.length];
        const at = { bus: A.musicBus };
        const play = (o) => tone(Object.assign({}, at, o, { delay: next - A.ctx.currentTime }));
        // 低音
        if (s === 0 || s === 8 || (th.drums === 'drive' && s % 4 === 0) || (th.drums === 'four' && (s === 6 || s === 14))) play({ type: 'triangle', f0: mtof(chord), dur: stepDur * 3, vol: 0.5 });
        // 和弦垫
        if (s === 0) [0, 4, 7].forEach(iv => play({ type: 'sine', f0: mtof(chord + 24 + (th.scale.includes(3) && iv === 4 ? -1 : 0) + iv), dur: stepDur * 14, vol: 0.06, attack: 0.08 }));
        // 旋律
        for (const n of song.lead) if (n.b === bar && n.s === s) play({ type: th.lead, f0: mtof(n.n), dur: stepDur * n.len * 0.95, vol: th.lead === 'sawtooth' ? 0.08 : 0.12 });
        // 鼓
        if (!A.muted) {
          const d = th.drums, tt = next - A.ctx.currentTime;
          if ((d === 'four' || d === 'drive') && s % 4 === 0) tone({ type: 'sine', f0: 140, f1: 45, dur: 0.12, vol: 0.5, delay: tt, bus: A.musicBus });
          if ((d === 'soft' || d === 'swing' || d === 'tense') && (s === 0 || s === 10)) tone({ type: 'sine', f0: 110, f1: 45, dur: 0.12, vol: 0.35, delay: tt, bus: A.musicBus });
          if (s % 2 === 0 && d !== 'soft') noise({ dur: 0.03, vol: 0.12, filter: 'highpass', freq: 7000, delay: tt, bus: A.musicBus });
          if (d === 'soft' && s % 4 === 2) noise({ dur: 0.03, vol: 0.08, filter: 'highpass', freq: 7000, delay: tt, bus: A.musicBus });
          if ((s === 4 || s === 12) && d !== 'soft') noise({ dur: 0.1, vol: 0.18, filter: 'bandpass', freq: 1800, delay: tt, bus: A.musicBus });
        }
        next += stepDur; step++;
      }
    };
    A.seqTimer = setInterval(sched, 30); sched();
  };
  A.stopMusic = () => { if (A.seqTimer) clearInterval(A.seqTimer); A.seqTimer = null; A.theme = null; };
  A.pauseMusic = p => { A.musicPaused = p; };

  /* ---------------- 键盘状态 + 触屏虚拟按键 ---------------- */
  XG.keys = new Set();
  window.addEventListener('keydown', e => { XG.keys.add(e.code); });
  window.addEventListener('keyup', e => { XG.keys.delete(e.code); });
  window.addEventListener('blur', () => XG.keys.clear());
  const fireKey = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true }));
  XG.pressKey = code => { fireKey('keydown', code); setTimeout(() => fireKey('keyup', code), 60); };

  const T = (XG.touch = { enabled: XG.isTouch, layer: null, sticks: {}, buttons: {} });
  function layer() {
    if (!T.layer) { T.layer = $el('div', 'xg-touch-layer'); document.body.appendChild(T.layer); if (T.enabled) { T.layer.classList.add('show'); document.body.classList.add('xg-touch'); } }
    return T.layer;
  }
  /* 浮动摇杆：zone = {left, top, width, height}（百分比字符串），keys = {up,down,left,right}（会派发对应键盘事件） */
  T.stick = (id, opt) => {
    const L = layer();
    const zone = $el('div', 'xg-zone'); Object.assign(zone.style, opt.zone || { left: '0', top: '35%', width: '50%', height: '65%' });
    const base = $el('div', 'xg-stick-base'); const knob = $el('div', 'xg-stick-knob'); base.appendChild(knob);
    const hint = $el('div', 'xg-stick-hint', opt.hint || '拖动移动'); hint.style.left = '12px';
    zone.appendChild(base); zone.appendChild(hint); L.appendChild(zone);
    const st = { x: 0, y: 0, active: false, pid: null, ox: 0, oy: 0, held: new Set(), zone, rest: null };
    const rest = () => { const r = zone.getBoundingClientRect(); base.style.left = (opt.restX != null ? opt.restX : 90) + 'px'; base.style.top = (r.height - (opt.restBottom != null ? opt.restBottom : 90)) + 'px'; base.style.opacity = '0.6'; };
    st.rest = rest; rest(); window.addEventListener('resize', rest);
    const keys = opt.keys;
    const setDir = () => {
      if (!keys) return;
      const want = new Set();
      if (st.y < -0.35) want.add(keys.up); if (st.y > 0.35) want.add(keys.down);
      if (st.x < -0.35) want.add(keys.left); if (st.x > 0.35) want.add(keys.right);
      for (const k of st.held) if (!want.has(k)) { fireKey('keyup', k); st.held.delete(k); }
      for (const k of want) if (k && !st.held.has(k)) { fireKey('keydown', k); st.held.add(k); }
    };
    const R = 55;
    zone.addEventListener('pointerdown', e => {
      if (st.active) return; e.preventDefault(); A.init();
      st.active = true; st.pid = e.pointerId; zone.setPointerCapture && zone.setPointerCapture(e.pointerId);
      const r = zone.getBoundingClientRect(); st.ox = e.clientX - r.left; st.oy = e.clientY - r.top;
      base.style.left = st.ox + 'px'; base.style.top = st.oy + 'px'; base.style.opacity = '1';
    });
    zone.addEventListener('pointermove', e => {
      if (!st.active || e.pointerId !== st.pid) return;
      const r = zone.getBoundingClientRect(); let dx = e.clientX - r.left - st.ox, dy = e.clientY - r.top - st.oy;
      const d = Math.hypot(dx, dy); if (d > R) { dx = dx / d * R; dy = dy / d * R; }
      st.x = dx / R; st.y = dy / R; knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; setDir();
    });
    const end = e => { if (e.pointerId !== st.pid) return; st.active = false; st.x = st.y = 0; knob.style.transform = 'translate(-50%,-50%)'; setDir(); rest(); };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
    T.sticks[id] = st; return st;
  };
  /* 虚拟按钮：pos = {left/right/top/bottom}，size，按下时派发 keydown，松开派发 keyup */
  T.button = (id, opt) => {
    const L = layer();
    const b = $el('div', 'xg-vbtn' + (opt.wide ? ' wide' : ''), opt.label);
    const size = opt.size || 76; b.style.width = (opt.w || size) + 'px'; b.style.height = (opt.h || size) + 'px';
    Object.assign(b.style, opt.pos || {});
    L.appendChild(b);
    const st = { down: false, el: b, pids: new Set() };
    const down = e => { e.preventDefault(); A.init(); st.pids.add(e.pointerId); b.setPointerCapture && b.setPointerCapture(e.pointerId); if (!st.down) { st.down = true; b.classList.add('down'); if (opt.key) fireKey('keydown', opt.key); opt.onDown && opt.onDown(); } };
    const up = e => { st.pids.delete(e.pointerId); if (st.down && st.pids.size === 0) { st.down = false; b.classList.remove('down'); if (opt.key) fireKey('keyup', opt.key); opt.onUp && opt.onUp(); } };
    b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
    b.addEventListener('contextmenu', e => e.preventDefault());
    T.buttons[id] = st; return st;
  };
  // 把摇杆区域/按钮放到指定的屏幕矩形（px），常用于只覆盖画布区域，避免挡住页面上的按钮
  T.place = (id, r) => { const s = T.sticks[id] || T.buttons[id]; if (!s) return; const e = s.zone || s.el; Object.assign(e.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); if (s.rest) s.rest(); };
  T.setVisible = (id, vis) => { const s = T.sticks[id] || T.buttons[id]; if (!s) return; (s.zone || s.el).style.display = vis ? '' : 'none'; };
  T.show = on => { layer().classList.toggle('show', on && T.enabled); };

  /* ---------------- 画布自适应 ---------------- */
  XG.fit = (canvas, opt = {}) => {
    // opt.reserve() 返回 { w, h }：需要给侧栏 / HUD 预留的宽高（可随横竖屏变化）
    const resize = () => {
      const W = canvas.width, H = canvas.height;
      const res = opt.reserve ? opt.reserve() : { w: opt.reserveW || 0, h: opt.reserveH != null ? opt.reserveH : 60 };
      const maxW = window.innerWidth - (opt.padX || 12) - res.w;
      const maxH = window.innerHeight - res.h - (opt.padBottom || 8);
      const s = Math.max(0.2, Math.min(maxW / W, Math.max(120, maxH) / H, opt.maxScale || 1.25));
      canvas.style.width = Math.floor(W * s) + 'px'; canvas.style.height = Math.floor(H * s) + 'px';
      opt.onResize && opt.onResize(s);
    };
    window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));
    resize(); setTimeout(resize, 50);
    return resize;
  };
  XG.landscape = () => window.innerWidth >= window.innerHeight;
  XG.canvasPos = (canvas, e) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height }; };

  /* ---------------- toast ---------------- */
  let toastEl, toastTimer;
  XG.toast = (msg, ms = 1800) => {
    if (!toastEl) { toastEl = $el('div', 'xg-toast'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  };

  /* ---------------- 游戏外壳：开始 / 暂停 / 教程 / 结算 ---------------- */
  XG.game = cfg => {
    const G = { cfg, paused: false, state: 'menu', save: cfg.save };
    const ov = $el('div', 'xg-overlay'); const card = $el('div', 'xg-card'); ov.appendChild(card); document.body.appendChild(ov);
    // 顶栏
    const bar = $el('div', 'xg-topbar');
    const bPause = $el('button', null, '⏸'); bPause.title = '暂停 (Esc)';
    const bMusic = $el('button', null, '🎵'); bMusic.title = '背景音乐开关';
    const bMute = $el('button', null, '🔊'); bMute.title = '静音 (M)';
    const bHelp = $el('button', null, '❓'); bHelp.title = '教程';
    const bHome = $el('button', null, '🏠'); bHome.title = '返回游戏目录';
    [bPause, bMusic, bMute, bHelp, bHome].forEach(b => bar.appendChild(b));
    document.body.appendChild(bar);
    XG._syncTopbar = () => { bMute.textContent = A.muted ? '🔇' : '🔊'; bMusic.style.opacity = A.musicOn ? '1' : '0.4'; bPause.style.visibility = G.state === 'play' ? 'visible' : 'hidden'; };
    XG._syncTopbar();
    bMute.onclick = () => { A.init(); A.setMuted(!A.muted); };
    bMusic.onclick = () => { A.init(); A.setMusic(!A.musicOn); };
    bPause.onclick = () => G.pause();
    bHelp.onclick = () => { const was = G.state === 'play'; if (was) G.pause(true); G.tutorial(() => { if (was) G.showPause(); else if (G._menuBack) G._menuBack(); }); };
    bHome.onclick = () => { location.href = cfg.home || '../../index.html'; };
    window.addEventListener('keydown', e => {
      if (e.code === 'Escape') { if (G.state === 'play') G.pause(); else if (G.state === 'paused') G.resume(); }
      if (e.code === 'KeyM' && !cfg.noMKey) { A.init(); A.setMuted(!A.muted); }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play') G.pause(); });

    G.open = (html, btns) => {
      card.innerHTML = html;
      if (btns && btns.length) {
        const row = $el('div', 'xg-btns');
        btns.forEach(b => {
          const e = $el('button', 'xg-btn' + (b.primary ? ' primary' : ''), b.label);
          if (b.id) e.id = b.id;
          if (b.disabled) e.disabled = true;
          e.onclick = () => { A.init(); A.sfx('click'); b.onClick && b.onClick(); };
          row.appendChild(e);
        });
        card.appendChild(row);
      }
      ov.classList.add('show'); T.show(false);
      return card;
    };
    G.close = () => { ov.classList.remove('show'); };
    G.setState = s => { G.state = s; XG._syncTopbar(); if (s === 'play') T.show(true); else T.show(false); };

    G.menu = (extraHtml, btns) => {
      if (extraHtml === undefined && cfg.onMenu) { G.setState('menu'); return cfg.onMenu(); }
      extraHtml = extraHtml || '';
      G.setState('menu'); A.pauseMusic(false);
      G._menuBack = () => G.menu(extraHtml, btns);
      const note = XG.storage.notice();
      const cover = cfg.cover ? `<img class="xg-cover" src="${cfg.cover}" alt="">` : '';
      G.open(`${cover}<h2>${cfg.title}</h2><div class="xg-sub">${cfg.subtitle || ''}</div>${extraHtml}${note ? `<div class="xg-warn">${note}</div>` : ''}`,
        btns || [{ label: '▶ 开始游戏', primary: true, id: 'xgStart', onClick: () => G.start() }, { label: '📖 教程', onClick: () => G.tutorial(() => G.menu(extraHtml, btns)) }]);
    };
    G.start = (...args) => {
      const first = cfg.save && !cfg.save.data.tutorialSeen && cfg.tutorial && cfg.tutorial.length;
      const go = () => { G.close(); G.paused = false; G.setState('play'); if (cfg.music) A.music(cfg.music); A.pauseMusic(false); cfg.onStart && cfg.onStart(...args); };
      if (first) G.tutorial(go); else go();
    };
    G.tutorial = done => {
      const steps = cfg.tutorial || []; let i = 0;
      const show = () => {
        const s = steps[i];
        const btns = [];
        if (i > 0) btns.push({ label: '← 上一步', onClick: () => { i--; show(); } });
        btns.push(i < steps.length - 1 ? { label: '下一步 →', primary: true, onClick: () => { i++; show(); } } : { label: '明白了！', primary: true, id: 'xgTutDone', onClick: () => { if (cfg.save) { cfg.save.data.tutorialSeen = true; cfg.save.write(); } done && done(); } });
        const touchTip = XG.isTouch && s.touch ? `<div class="xg-note">📱 触屏：${s.touch}</div>` : (!XG.isTouch && s.touch ? `<div class="xg-note">📱 手机上：${s.touch}</div>` : '');
        G.open(`<h2>📖 ${s.title}</h2><div class="xg-tut-step">${s.text}</div>${touchTip}<div class="xg-tut-dots">${steps.map((_, k) => k === i ? '●' : '○').join('')}</div>`, btns);
      };
      if (!steps.length) { done && done(); return; }
      show();
    };
    G.pause = silent => {
      if (G.state !== 'play') return;
      G.paused = true; G.setState('paused'); A.pauseMusic(true); XG.keys.clear();
      cfg.onPause && cfg.onPause();
      if (!silent) G.showPause();
    };
    G.showPause = () => {
      G.setState('paused');
      G.open(`<h2>⏸ 已暂停</h2><div class="xg-sub">${cfg.pauseInfo ? cfg.pauseInfo() : ''}</div>`, [
        { label: '▶ 继续', primary: true, id: 'xgResume', onClick: () => G.resume() },
        { label: '🔁 重新开始本局', onClick: () => { G.close(); G.paused = false; G.setState('play'); A.pauseMusic(false); cfg.onRestart ? cfg.onRestart() : cfg.onStart && cfg.onStart(); } },
        { label: '🏠 回到菜单', onClick: () => { G.paused = false; cfg.onQuit && cfg.onQuit(); G.menu(); } },
      ]);
    };
    G.resume = () => {
      if (G.state !== 'paused') return;
      G.close(); G.paused = false; G.setState('play'); A.pauseMusic(false); cfg.onResume && cfg.onResume();
    };
    /* 结算：opt = { win, title, sub, stats: [[k, v]], buttons } */
    G.end = opt => {
      G.setState('end'); A.pauseMusic(true);
      A.sfx(opt.win ? 'win' : 'lose');
      const stats = opt.stats && opt.stats.length ? `<div class="xg-stats">${opt.stats.map(([k, v]) => `<span>${k}</span><b>${v}</b>`).join('')}</div>` : '';
      setTimeout(() => G.open(`<h2>${opt.title || (opt.win ? '🏆 胜利！' : '💥 失败')}</h2><div class="xg-sub">${opt.sub || ''}</div>${stats}${opt.extra || ''}`,
        opt.buttons || [{ label: '🔁 再来一局', primary: true, id: 'xgAgain', onClick: () => G.start() }, { label: '🏠 菜单', onClick: () => G.menu() }]), opt.delay || 350);
    };
    /* 关卡选择：levels = [{ name, sub, locked, stars }] */
    G.levelSelect = (levels, onPick, title = '选择关卡', extra = '') => {
      G.setState('menu');
      const card = G.open(`<h2>${title}</h2>${extra}<div class="xg-levels"></div>`, [{ label: '← 返回', onClick: () => G.menu() }]);
      const box = card.querySelector('.xg-levels');
      levels.forEach((l, i) => {
        const b = $el('button', 'xg-level' + (l.locked ? ' locked' : ''), `${l.locked ? '🔒 ' : ''}${l.name}<small>${l.sub || ''}</small>${l.stars != null ? `<span class="stars">${'★'.repeat(l.stars)}${'☆'.repeat(Math.max(0, (l.maxStars || 3) - l.stars))}</span>` : ''}`);
        b.dataset.level = i;
        b.onclick = () => { if (l.locked) { A.sfx('error'); return; } A.sfx('select'); onPick(i); };
        box.appendChild(b);
      });
    };
    return G;
  };
})();
