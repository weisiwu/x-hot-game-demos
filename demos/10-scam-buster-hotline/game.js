// 反诈拖延热线 — 3 个班次、12 个分支剧本、按键语音菜单、按住制造杂音、让骗子干等、反问让骗子露馅
// 趋势参考：2026 年 10 月走红的“呼叫中心 + AI 来电”合作喜剧游戏（这里反转为反诈视角，剧本原创虚构）
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SCRIPTS = window.SCAM_SCRIPTS, TAGS = window.SCAM_TAGS, TIPS = window.SCAM_TIPS;
  const SHIFTS = [
    { name: '早班', calls: 5, goal: 110, diff: 1 },
    { name: '午班', calls: 6, goal: 150, diff: 1.15 },
    { name: '夜班', calls: 7, goal: 185, diff: 1.3 },
  ];
  const SAVE = XG.save('10-scam-buster-hotline', { tutorialSeen: false, unlocked: 1, stars: {}, best: {}, lifetimeMins: 0, calls: 0, cracked: 0, learned: {} });
  const SV = SAVE.data;
  let R = null, C = null;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = XG.pick;
  const variants = s => s.split('|');
  const total = () => Math.round(R.mins + R.flags);
  const STALL = ['稍等稍等，我找一下老花镜……', '信号不好，你说什么？大点声！', '等一下，锅里的汤要溢出来了！', '你说慢一点，我拿笔记一下……', '哎呀我家猫把手机线咬了，你再说一遍？'];
  const DUMB = ['“备用金”是哪个金？金子吗？', '你说的那个按钮是蓝色的还是绿色的？', '我该先点左边还是右边？', '验证码是什么码？二维码吗？', '我手机是老人机，有这个功能吗？'];
  const HOOK = ['哇，真的吗？那你再详细讲讲！', '听起来不错，我很感兴趣！', '我还有几个朋友也想参加，能一起吗？', '好好好，我听你的，下一步怎么做？'];
  const FAKE = ['好的，我念一下：123……啊不对，是 987……', '我的卡号是 6222 0000……等一下我数数有几个零', '照片发了，你看到了吗？（发了一张猫的照片）', '转好了！（其实转了 0.01 元给自己）'];

  function add(cls, text, tag) {
    const d = document.createElement('div'); d.className = 'msg ' + cls; d.textContent = text;
    if (tag) { const t = document.createElement('span'); t.className = 'tag'; t.textContent = tag; d.appendChild(t); }
    $('chat').appendChild(d); $('chat').scrollTop = 1e9;
  }
  function opts(list) {
    const box = $('opts'); box.innerHTML = '';
    list.forEach((o, i) => {
      const b = document.createElement('button'); b.className = o.cls || ''; b.textContent = (list.length > 1 ? `${i + 1}. ` : '') + o.text;
      if (o.tag) { const t = document.createElement('span'); t.className = 'tag'; t.textContent = o.tag; b.appendChild(t); }
      if (o.hold) { b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) { /* 合成事件 */ } o.hold(true); }); ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => o.hold(false))); window.addEventListener('pointerup', () => o.hold(false), { once: true }); }
      else b.onclick = () => { XG.audio.sfx('click'); o.fn(); };
      box.appendChild(b);
    });
  }

  function startShift(si) {
    const S = SHIFTS[si];
    R = { si, S, idx: 0, mins: 0, flags: 0, leaks: 0, order: XG.shuffle(SCRIPTS.slice()).slice(0, S.calls), over: false };
    render(); ring();
  }
  function ring() {
    C = null; $('chat').innerHTML = '';
    const sc = R.order[R.idx];
    $('avatar').src = `../../assets/10-scam-buster-hotline/caller-${sc.av}.webp`;
    $('cName').textContent = '📞 来电中…'; $('cNum').textContent = sc.num; $('timer').textContent = '';
    $('opts').innerHTML = `<div id="ring"><div class="big">📞</div><div>第 ${R.idx + 1} / ${R.S.calls} 通来电</div></div>`;
    const btn = document.createElement('button'); btn.className = 'primary'; btn.id = 'bAnswer'; btn.textContent = '接听 ☎️';
    btn.onclick = () => { clearInterval(R.ringT); XG.audio.sfx('click'); answer(sc); };
    $('opts').appendChild(btn);
    XG.audio.sfx('ring'); clearInterval(R.ringT); R.ringT = setInterval(() => { if (!G.paused) XG.audio.sfx('ring'); }, 2200);
    render();
  }
  function answer(sc) {
    C = { sc, stage: 0, patience: 100, mins: 0, asked: 0, turns: 0, holdUses: 0, awayUses: 0, leaked: false, ended: false };
    $('cName').textContent = sc.name;
    add('sys', '📞 已接通');
    if (sc.ivr) return ivr(6);
    speak();
  }
  // 按键语音菜单：按错键会让对方的机器人一直“请重新输入”
  function ivr(tries) {
    add('them', '【语音】您好，' + (C.sc.id === 'bank' ? '这里是银行风控中心' : C.sc.id === 'customs' ? '这里是海关包裹通知' : '这里是医保中心') + '。人工服务请按 1，查询请按 2，重听请按 *。');
    const box = $('opts'); box.innerHTML = '<div class="sys" style="font-size:13px">机器人在等你按键……按 1 会转接骗子，乱按可以白白浪费他们的线路时间（但别按太多次）。</div><div id="keypad"></div>';
    const kp = box.querySelector('#keypad');
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].forEach(k => {
      const b = document.createElement('button'); b.textContent = k; b.dataset.k = k;
      b.onclick = () => press(k); kp.appendChild(b);
    });
    const press = k => {
      if (C.ended) return;
      XG.audio.sfx('dtmf', k);
      if (k === '1' || tries <= 0) { add('sys', tries <= 0 ? '机器人：“正在为您转接人工……”' : '正在转接人工……'); return setTimeout(speak, 300); }
      tries--; gain(0.5); C.patience = Math.max(30, C.patience - 4 * R.S.diff);
      add('them', pick(['【语音】输入有误，请重新输入。', '【语音】您的选择无效。人工服务请按 1。', '【语音】正在查询……查询失败，请重新输入。']));
      render();
    };
    C.ivrPress = press;
  }
  function gain(m) { C.mins += m; R.mins += m; render(); }
  function speak(kind) {
    if (C.ended) return;
    const sc = C.sc, st = sc.stages[Math.min(C.stage, sc.stages.length - 1)];
    let line;
    if (kind === 'repeat') line = pick(sc.repeat);
    else if (kind === 'verify') line = pick(sc.verify);
    else if (kind === 'back') line = pick(['你终于回来了！我们继续。', '喂？！你还在吗？刚才说到哪了……', '你别再走开了！']);
    else if (kind === 'static') line = pick(['喂？喂？现在能听到吗？', '你那边信号太差了！', '……喂？你说话啊！']);
    else line = pick(variants(st.t));
    add('them', line, kind ? '' : '');
    turnOptions();
  }
  function turnOptions() {
    const sc = C.sc, st = sc.stages[Math.min(C.stage, sc.stages.length - 1)], list = [];
    list.push({ text: pick(STALL), tag: '拖延', fn: () => act('stall') });
    list.push({ text: pick(DUMB), tag: '装傻', fn: () => act('dumb') });
    list.push({ text: pick(HOOK), tag: '假装上钩', fn: () => act('hook') });
    if (st.ask) list.push({ text: pick(FAKE), tag: '给假信息·有风险', fn: () => act('fake') });
    if (C.asked < sc.qa.length) list.push({ text: '❓ ' + sc.qa[C.asked][0], tag: '反问', fn: () => act('ask') });
    if (C.holdUses < 2) list.push({ text: '📶 假装信号不好（按住不放）', tag: '按住', cls: 'hold', hold: on => holdStatic(on) });
    if (C.awayUses < 1 && C.turns >= 1) list.push({ text: '🍲 “你等我一下啊！”（放下电话）', tag: '冒险', fn: () => away() });
    if (st.ask) list.push({ text: `（照做）${st.bait}`, cls: 'bait', fn: () => leak(st.bait) });
    list.push({ text: '📵 挂断并举报这个号码', fn: () => endCall('report') });
    opts(list); render();
  }
  function act(kind) {
    if (C.ended) return;
    const d = R.S.diff, sc = C.sc;
    C.turns++;
    let mins = 0, pat = 0, next = 'repeat';
    if (kind === 'stall') { add('me', pick(STALL)); mins = rnd(2, 4); pat = -rnd(16, 24) * d; }
    if (kind === 'dumb') { add('me', pick(DUMB)); mins = rnd(1, 3); pat = -rnd(8, 14) * d; }
    if (kind === 'hook') { add('me', pick(HOOK)); mins = rnd(1, 2); pat = rnd(6, 12) - (C.stage >= sc.stages.length - 1 ? 14 : 0); C.stage++; next = 'stage'; }
    if (kind === 'fake') {
      add('me', pick(FAKE));
      if (Math.random() < 0.35) { mins = 1; pat = -55 * d; next = 'verify'; }
      else { mins = rnd(4, 7); pat = -rnd(18, 28) * d; C.stage++; next = 'stage'; add('sys', '骗子相信了你的假信息，正在“处理”……'); }
    }
    if (kind === 'ask') {
      const [q, a] = sc.qa[C.asked++]; add('me', q); add('them', a); mins = 1.5; pat = -10 * d; R.flags += 3;
      if (C.asked >= sc.qa.length) { gain(mins); add('them', sc.crack); add('sys', '🎯 骗子被你问住了！识破加分 +6'); R.flags += 6; SV.cracked++; return endCall('cracked'); }
      next = 'none';
    }
    gain(mins); C.patience = XG.clamp(C.patience + pat, 0, 100);
    add('sys', `⏱ 拖住 ${mins.toFixed(1)} 分钟`);
    if (C.patience <= 0) return angry();
    if (C.turns > 14) { add('them', '我没空跟你耗了！'); return endCall('giveup'); }
    $('opts').innerHTML = '';
    setTimeout(() => { if (C && !C.ended) { if (next === 'none') turnOptions(); else speak(next === 'stage' ? undefined : next); } }, 380);
  }
  // 按住制造杂音：越按越久越赚时间，但骗子耐心下降，同一通电话里第二次效果减半
  function holdStatic(on) {
    if (!C || C.ended) return;
    if (on && !C.holding) {
      C.holding = true; C.holdUses++; const eff = 1 / C.holdUses;
      add('me', '（滋滋滋……嘶——）喂？你说啥？');
      C.holdT = setInterval(() => {
        if (G.paused) return;
        XG.audio.sfx('static'); gain(0.05 * eff * 2); C.patience = Math.max(0, C.patience - 1.4 * R.S.diff);
        if (C.patience <= 0) { holdStatic(false); }
      }, 100);
    } else if (!on && C.holding) {
      C.holding = false; clearInterval(C.holdT);
      if (C.patience <= 0) return angry();
      speak('static');
    }
  }
  // 放下电话：离开越久拖得越多，但骗子耐心加速流失，没回来他就挂了
  function away() {
    C.awayUses++; C.turns++;
    add('me', '你等我一下啊，我去拿个东西！（放下电话）');
    let t = 0; const box = $('opts');
    box.innerHTML = `<div class="sys" style="font-size:14px">🍲 你离开了电话……骗子在干等。越晚回来拖得越久，但他随时可能挂断！</div><div class="meter"><div id="awayFill"></div></div><div class="sys" id="awayInfo"></div>`;
    const back = document.createElement('button'); back.className = 'primary'; back.id = 'bBack'; back.textContent = '☎️ 我回来了！'; box.appendChild(back);
    const tick = setInterval(() => {
      if (G.paused || !C || C.ended) return;
      t += 0.1; gain(0.06); C.patience -= (1 + t * 1.6) * 0.1 * R.S.diff * 1.2;
      const f = $('awayFill'); if (f) f.style.width = Math.max(0, C.patience) + '%';
      const info = $('awayInfo'); if (info) info.textContent = `已离开 ${t.toFixed(1)} 秒（拖住 ${(t * 0.6).toFixed(1)} 分钟）`;
      if (t > 1 && Math.random() < 0.02) XG.audio.sfx('tick');
      if (C.patience <= 0) { clearInterval(tick); add('them', '人呢？！喂？！……（对方挂断）'); endCall('angry'); }
    }, 100);
    back.onclick = () => { clearInterval(tick); XG.audio.sfx('pickup'); add('sys', `⏱ 让骗子干等了 ${(t * 0.6).toFixed(1)} 分钟`); speak('back'); };
  }
  function angry() { add('them', pick(['你耍我是吧！（挂断）', '浪费我时间！（啪地挂了）', '神经病！（挂断）'])); endCall('angry'); }
  function leak(what) {
    R.leaks++; C.leaked = true; add('me', `（你照做了：${what}）`);
    add('sys', '⚠️ 你泄露了真实信息！现实中这会造成真实损失。本局总分 -10'); XG.audio.sfx('error');
    R.mins = Math.max(0, R.mins - 10);
    if (R.leaks >= 2) { C.ended = true; return finish(false, '💸 泄露信息太多次'); }
    add('them', '好的，收到了！（对方迅速挂断）'); endCall('leak');
  }
  function endCall(reason) {
    if (C.ended) return; C.ended = true; clearInterval(C.holdT);
    XG.audio.sfx('hangup');
    if (reason === 'report' && !C.leaked) { R.flags += 2; add('sys', '你挂断了电话并举报了号码（举报 +2）'); }
    SV.calls++; SV.lifetimeMins += C.mins; SAVE.write();
    const box = $('opts'); box.innerHTML = '<div id="quiz"><b>这通电话里出现了哪些诈骗话术？（勾选后提交）</b><br></div>';
    const q = box.firstChild;
    TAGS.forEach(t => { const l = document.createElement('label'); l.innerHTML = `<input type="checkbox" value="${t}"> ${t}`; q.appendChild(l); });
    const b = document.createElement('button'); b.className = 'primary'; b.id = 'bGrade'; b.textContent = '提交识别结果'; b.onclick = () => grade(q); box.appendChild(b);
    render();
  }
  function grade(q) {
    const chosen = [...q.querySelectorAll('input:checked')].map(i => i.value), truth = C.sc.tags;
    let pts = 0; const right = [], wrong = [];
    for (const t of chosen) { if (truth.includes(t)) { pts += 4; right.push(t); SV.learned[t] = (SV.learned[t] || 0) + 1; } else { pts -= 3; wrong.push(t); } }
    const missed = truth.filter(t => !chosen.includes(t));
    R.flags += pts; XG.audio.sfx(pts > 0 ? 'coin' : 'error');
    add('sys', `识别 ${pts >= 0 ? '+' : ''}${pts}。正确：${right.join('、') || '无'}${wrong.length ? '；误判：' + wrong.join('、') : ''}${missed.length ? '；漏掉：' + missed.join('、') : ''}`);
    if (missed.length) add('sys', '💡 ' + TIPS[missed[0]]);
    SAVE.write(); R.idx++; render();
    if (R.idx >= R.S.calls) return finish(total() >= R.S.goal);
    opts([{ text: '接听下一通 ☎️', cls: 'primary', fn: () => ring() }]);
  }
  function finish(win, title) {
    R.over = true; clearInterval(R.ringT);
    const key = 'S' + R.si, sc = total();
    const stars = !win ? 0 : sc >= R.S.goal * 1.6 ? 3 : sc >= R.S.goal * 1.3 ? 2 : 1;
    if (win) { SV.stars[key] = Math.max(SV.stars[key] || 0, stars); SV.unlocked = Math.max(SV.unlocked, Math.min(SHIFTS.length, R.si + 2)); }
    const nb = !SV.best[key] || sc > SV.best[key]; if (nb) SV.best[key] = sc;
    SAVE.write();
    const last = R.si === SHIFTS.length - 1;
    G.end({ win, title: title || (win ? `🏆 ${R.S.name}完成！${'★'.repeat(stars)}` : `😓 ${R.S.name}未达标`), sub: win ? `你一共浪费了骗子 ${R.mins.toFixed(0)} 分钟。` : `总分 ${sc}，目标 ${R.S.goal}。`,
      stats: [['拖住时间', R.mins.toFixed(1) + ' 分钟'], ['识别/反问加分', R.flags], ['总分', sc + (nb ? '（新纪录）' : '')], ['累计拖住骗子', SV.lifetimeMins.toFixed(0) + ' 分钟'], ['问住骗子', SV.cracked + ' 次']],
      buttons: [...(win && !last ? [{ label: '▶ 下一个班次', primary: true, id: 'xgNext', onClick: () => G.start(R.si + 1) }] : []), { label: '🔁 再值一次班', primary: !win || last, id: 'xgAgain', onClick: () => G.start(R.si) }, { label: '🏠 菜单', onClick: () => G.menu() }] });
  }
  function render() {
    if (!R) return;
    $('shiftName').textContent = R.S.name; $('callNo').textContent = `${Math.min(R.idx + 1, R.S.calls)} / ${R.S.calls}`;
    $('mins').textContent = R.mins.toFixed(1) + ' 分'; $('flags').textContent = R.flags; $('total').textContent = total(); $('goal').textContent = R.S.goal; $('leaks').textContent = R.leaks;
    $('patFill').style.width = (C ? C.patience : 100) + '%';
    if (C) { const m = C.mins; $('timer').textContent = `通话 ${Math.floor(m)}:${String(Math.round((m % 1) * 60)).padStart(2, '0')}`; }
  }
  window.addEventListener('keydown', e => {
    if (G.state !== 'play' || !R) return;
    if (C && C.ivrPress && !C.ended && $('keypad') && /^(Digit\d|Numpad\d)$/.test(e.code)) return C.ivrPress(e.code.slice(-1));
    const m = e.code.match(/^Digit([1-9])$/);
    if (m) { const b = $('opts').querySelectorAll('button')[+m[1] - 1]; if (b && !b.classList.contains('hold')) b.click(); }
  });

  const G = XG.game({
    id: '10-scam-buster-hotline', title: '☎️ 反诈拖延热线', subtitle: '你是反诈志愿者：接听模拟诈骗电话，用各种办法拖住骗子、绝不泄露真实信息，并识别他们的话术。3 个班次，12 种骗局。',
    cover: '../../assets/10-scam-buster-hotline/cover.webp', music: 'mystery', save: SAVE,
    tutorial: [
      { title: '拖住骗子', text: '每一句回应都会<b>浪费骗子的时间</b>（拖住的分钟数就是得分），但也会消耗他的<b>耐心</b>。“假装上钩”能回耐心，但骗局会往下推进。', touch: '点选项回应，数字键 1–9 也可以。' },
      { title: '特别招数', text: '<b>📶 信号不好</b>：按住不放制造杂音，按得越久拖得越多。<b>🍲 让他等一下</b>：放下电话，越晚回来越赚，但骗子随时会挂。<b>❓ 反问</b>：问他工号、要求当面办理……问住他还有额外加分。语音来电要先过<b>按键菜单</b>，乱按也能拖时间。', touch: '「信号不好」要用手指按住。' },
      { title: '绝不泄露', text: '红色的“（照做）……”选项代表真的泄露信息或转账，每次扣分，<b>泄露 2 次班次直接失败</b>。“给假信息”可以拖很久，但可能被识破。', touch: '' },
      { title: '识别话术', text: '每通电话结束后勾选出现过的诈骗话术，答对加分、答错扣分，漏掉的会给出反诈提示。总分达到班次目标就通关，解锁更难的下一个班次。', touch: '' },
    ],
    onStart: si => startShift(si == null ? Math.min(SV.unlocked, SHIFTS.length) - 1 : si),
    onRestart: () => startShift(R.si),
    onQuit: () => { if (R) { R.over = true; clearInterval(R.ringT); } if (C) clearInterval(C.holdT); },
    onMenu: () => menu(),
    pauseInfo: () => R ? `${R.S.name} · 第 ${R.idx + 1} 通 · 总分 ${total()}` : '',
  });
  function menu() {
    const learned = Object.keys(SV.learned).length;
    G.menu(`<div class="xg-stats"><span>已解锁班次</span><b>${SV.unlocked} / ${SHIFTS.length}</b><span>累计拖住骗子</span><b>${SV.lifetimeMins.toFixed(0)} 分钟</b><span>接听来电</span><b>${SV.calls}</b><span>话术图鉴</span><b>${learned} / ${TAGS.length}</b></div>`, [
      { label: `▶ 上班：${SHIFTS[Math.min(SV.unlocked, SHIFTS.length) - 1].name}`, primary: true, id: 'xgStart', onClick: () => G.start(Math.min(SV.unlocked, SHIFTS.length) - 1) },
      { label: '🗓 选择班次', id: 'xgLevels', onClick: () => G.levelSelect(SHIFTS.map((s, i) => ({ name: s.name, sub: `${s.calls} 通 · 目标 ${s.goal}`, locked: i >= SV.unlocked, stars: SV.stars['S' + i] || 0 })), i => G.start(i), '选择班次') },
      { label: '📖 教程', onClick: () => G.tutorial(menu) },
    ]);
  }
  menu();
  window.__demo = { G, SV, get R() { return R; }, get C() { return C; }, act, endCall, grade, SCRIPTS };
})();
