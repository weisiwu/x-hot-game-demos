// 反诈拖延热线 — 对话选择 + 识别话术（趋势参考：2026 年 10 月走红的"AI 来电呼叫中心"合作喜剧游戏，这里反转为反诈视角）
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const TAGS = ['冒充身份', '制造紧迫感', '索要验证码/密码', '要求转账', '高回报诱惑', '要求保密', '先交费用'];
  const SCRIPTS = [
    {
      name: '“快递理赔专员”', num: '+86 ***-****-0731', tags: ['冒充身份', '索要验证码/密码', '制造紧迫感'],
      lines: ['您好，我是某某快递理赔专员，您的包裹在运输中丢失了，我们要给您三倍赔偿。',
        '为了赔偿到账，需要您打开支付软件里的“备用金”页面，看到了吗？',
        '系统会给您发一条验证码短信，请您念给我核对一下身份。',
        '这个理赔通道 10 分钟后就关闭了，您快一点！'],
      bait: '把收到的 6 位验证码念给他',
    },
    {
      name: '“市局刑侦科”', num: '+86 ***-****-0110', tags: ['冒充身份', '制造紧迫感', '要求转账', '要求保密'],
      lines: ['这里是市公安局刑侦科，你的身份证涉嫌一起洗钱案件。',
        '为证明清白，你必须配合资金审查，这件事不准告诉任何人，包括家人。',
        '现在需要你把卡里的钱转入国家“安全账户”进行核查。',
        '如果今天下班前不配合，我们会直接发逮捕令！'],
      bait: '告诉他你的银行卡号和余额',
    },
    {
      name: '“兼职导师小美”', num: '+86 ***-****-5521', tags: ['高回报诱惑', '先交费用', '要求转账'],
      lines: ['亲~ 在家动动手指就能赚钱，点赞一单返 5 块，日入 500 不是梦！',
        '第一单已经给你返了 10 块哦，是不是很靠谱？',
        '现在有个高级任务，先垫付 2000，完成后返 2600！',
        '你的任务卡单了，需要再充 5000 才能解冻提现哦。'],
      bait: '答应垫付，把转账截图发给她',
    },
    {
      name: '“幸运抽奖中心”', num: '+86 ***-****-8888', tags: ['高回报诱惑', '先交费用', '制造紧迫感'],
      lines: ['恭喜您！您在我们平台周年庆被抽中一等奖：一辆新能源汽车！',
        '奖品已经准备好了，只需要先缴纳 3% 的个人所得税和手续费。',
        '您把身份证正反面照片和银行卡发我，我们好办理过户。',
        '今天是领奖最后一天，过时自动作废！'],
      bait: '把身份证照片和卡号发过去',
    },
    {
      name: '“你的老同学”', num: '陌生号码', tags: ['冒充身份', '要求保密', '要求转账', '制造紧迫感'],
      lines: ['喂，猜猜我是谁？换号了，存一下哈。',
        '哎我这边出了点急事，在外地住院了，押金不够……',
        '你先帮我转 8000 到医院对公账户，我下周就还你。',
        '千万别跟别人说啊，太丢人了，快点帮帮我！'],
      bait: '直接转 8000 过去',
    },
  ];
  // 通用回应：拖延时间（分钟）与耐心变化
  const MOVES = [
    { kind: 'stall', text: ['稍等稍等，我找一下老花镜……', '信号不好，你说什么？大点声！', '等一下，锅里的汤要溢出来了！'], mins: [2, 4], pat: [-18, -26] },
    { kind: 'dumb', text: ['“备用金”是哪个金？金子吗？', '你说的那个按钮是蓝色的还是绿色的？', '那个……我该先点左边还是右边？'], mins: [1, 3], pat: [-8, -14] },
    { kind: 'hook', text: ['哇，真的吗？那你再详细跟我讲讲！', '听起来不错，我很感兴趣，你们公司在哪？', '我还有几个朋友也想参加，能一起吗？'], mins: [1, 2], pat: [8, 16] },
    { kind: 'fake', text: ['好的，我念一下：123……啊不对，是 987……', '我的卡号是 6222 0000……等一下我数数有几个零', '照片发了，你看到了吗？（发了一张猫的照片）'], mins: [4, 7], pat: [-30, -45], risk: 0.35 },
  ];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];

  const S = { call: 0, turn: 0, patience: 100, mins: 0, flags: 0, leaks: 0, order: SCRIPTS.slice().sort(() => Math.random() - .5), done: false };
  const total = () => Math.round(S.mins + S.flags);
  const cur = () => S.order[S.call];

  function add(cls, text, tag) {
    const d = document.createElement('div'); d.className = 'msg ' + cls; d.textContent = text;
    if (tag) { const t = document.createElement('span'); t.className = 'tag'; t.textContent = tag; d.appendChild(t); }
    $('chat').appendChild(d); $('chat').scrollTop = 1e9;
  }

  function startCall() {
    const c = cur(); S.turn = 0; S.patience = 100;
    $('chat').innerHTML = '';
    $('cName').textContent = c.name; $('cNum').textContent = c.num;
    add('sys', `📞 第 ${S.call + 1} 通来电接通`);
    scammerSpeak();
  }

  function scammerSpeak() {
    const c = cur();
    if (S.turn >= c.lines.length) {
      // 话术说完，骗子再纠缠一下
      add('them', pick(['你到底办不办？！', '我没时间跟你耗了！', '快点！别磨蹭！']));
    } else add('them', c.lines[S.turn]);
    renderOptions();
    render();
  }

  function renderOptions() {
    const c = cur(), box = $('opts'); box.innerHTML = '';
    const moves = MOVES.slice().sort(() => Math.random() - .5);
    for (const m of moves) {
      const t = pick(m.text);
      const b = document.createElement('button');
      const hint = { stall: '拖延', dumb: '装傻', hook: '假装上钩', fake: '给假信息（有风险）' }[m.kind];
      b.textContent = `${t}`; const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = hint; b.appendChild(tag);
      b.onclick = () => respond(m, t); box.appendChild(b);
    }
    const bait = document.createElement('button'); bait.textContent = `（照做）${c.bait}`;
    bait.onclick = () => leak(); box.appendChild(bait);
    const hang = document.createElement('button'); hang.textContent = '📵 挂断并举报'; hang.onclick = () => endCall('你挂断了电话并举报了号码。'); box.appendChild(hang);
  }

  function respond(m, text) {
    $('opts').innerHTML = ''; // 防止连点
    add('me', text);
    let mins = rnd(...m.mins), pat = rnd(...m.pat);
    if (m.risk && Math.random() < m.risk) {
      pat = -70; mins = 1;
      add('them', pick(['这验证码不对吧？你耍我？', '这卡号位数都不对！', '你发的是什么玩意儿？！']));
    }
    if (m.kind === 'hook' && S.turn >= 3) pat -= 10; // 一直假装上钩也会让人起疑
    S.mins += mins; S.patience = Math.max(0, Math.min(100, S.patience + pat));
    add('sys', `⏱ 拖住 ${mins.toFixed(1)} 分钟`);
    S.turn++;
    if (S.patience <= 0) return endCall('骗子气急败坏地挂断了电话。');
    if (S.turn >= cur().lines.length + 3) return endCall('骗子放弃了，去骗下一个人（但被你浪费了大量时间）。');
    setTimeout(scammerSpeak, 350);
    render();
  }

  function leak() {
    S.leaks++;
    add('me', '（你照着他说的做了……）');
    add('sys', '⚠️ 你泄露了真实信息！现实中这会造成真实损失。');
    S.mins = Math.max(0, S.mins - 10);
    if (S.leaks >= 2) { S.done = true; render(); return finish(false); }
    endCall('骗子得手后立刻挂了电话。');
  }

  function endCall(reason) {
    add('sys', reason);
    const box = $('opts'); box.innerHTML = '<div id="quiz"><b>这通电话里出现了哪些诈骗话术？</b><br></div>';
    const q = box.firstChild;
    TAGS.forEach(t => { const l = document.createElement('label'); l.innerHTML = `<input type="checkbox" value="${t}"> ${t}`; q.appendChild(l); });
    const b = document.createElement('button'); b.className = 'primary'; b.textContent = '提交识别结果';
    b.onclick = () => grade(q); box.appendChild(b);
    render();
  }

  function grade(q) {
    const chosen = [...q.querySelectorAll('input:checked')].map(i => i.value);
    const truth = cur().tags;
    let pts = 0; const right = [], wrong = [];
    for (const t of chosen) { if (truth.includes(t)) { pts += 4; right.push(t); } else { pts -= 3; wrong.push(t); } }
    const missed = truth.filter(t => !chosen.includes(t));
    S.flags += pts;
    add('sys', `识别 ${pts >= 0 ? '+' : ''}${pts} 分。正确：${right.join('、') || '无'}${wrong.length ? '；误判：' + wrong.join('、') : ''}${missed.length ? '；漏掉：' + missed.join('、') : ''}`);
    S.call++;
    render();
    if (S.call >= S.order.length) return finish(total() >= 80);
    const box = $('opts'); box.innerHTML = '';
    const n = document.createElement('button'); n.className = 'primary'; n.textContent = '接听下一通 ☎️'; n.onclick = startCall; box.appendChild(n);
  }

  function finish(win) {
    S.done = true;
    const box = $('opts');
    box.innerHTML = `<div style="text-align:center;font-size:18px;margin:10px">${win ? '🏆 班次完成！你一共浪费了骗子 ' + S.mins.toFixed(0) + ' 分钟。' : (S.leaks >= 2 ? '💸 泄露信息太多次，这个班次失败了。' : `😓 总分 ${total()}，未达到 80 分。`)}</div>`;
    const b = document.createElement('button'); b.className = 'primary'; b.textContent = '再值一个班'; b.onclick = () => location.reload(); box.appendChild(b);
  }

  function render() {
    $('callNo').textContent = `${Math.min(S.call + 1, S.order.length)} / ${S.order.length}`;
    $('mins').textContent = S.mins.toFixed(1) + ' 分';
    $('flags').textContent = S.flags;
    $('total').textContent = total();
    $('leaks').textContent = S.leaks;
    $('patFill').style.width = S.patience + '%';
  }

  startCall();
  window.__demo = { S, respond, MOVES, endCall, grade };
})();
