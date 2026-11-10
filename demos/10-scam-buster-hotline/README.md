# ☎️ 反诈拖延热线

反诈志愿者接听模拟诈骗电话：拖住骗子、绝不泄露、识别话术。

## 怎么运行
推荐在仓库根目录运行 `python3 -m http.server 8000`，然后打开 http://localhost:8000/demos/10-scam-buster-hotline/ （存档最可靠）。也可以直接双击 `index.html`（`file://`），能玩，但存档能否保留取决于浏览器，无法保存时开始界面会给出提示。

## 玩法与关卡
3 个班次（5/6/7 通，难度递增）、12 个分支剧本（快递理赔、冒充公检法、刷单返利、中奖、冒充熟人、虚假投资、银行风控、海关包裹、游戏交易、网贷注销、冒充领导、医保卡），每个剧本有多套台词变体、骗局推进阶段、反问问答和被识破台词。玩法：拖延/装傻/假装上钩/给假信息；按住「信号不好」制造杂音；「让他等一下」放下电话的冒险计时；反问骗子问住他；语音来电先过按键菜单（DTMF 按键音）。每通结束勾选话术，答错扣分、漏掉给出反诈提示。泄露 2 次班次失败。

## 操作
**键盘 / 鼠标**
- 鼠标点选项，数字键 1–9 选择，按键菜单可用数字键输入，Esc 暂停

**手机触屏**：全部为按钮操作；「信号不好」需要手指按住不放。

右上角按钮：⏸ 暂停、🎵 背景音乐开关、🔊 静音、❓ 教程、🏠 返回目录（静音与音乐设置会记住）。首次开始会自动显示教程。

## 存档
使用浏览器 localStorage（键名 `xhgd:10-scam-buster-hotline`），保存：班次解锁、星级、最高分、累计拖住骗子的分钟数、接听数、问住骗子次数、话术图鉴。

## 数值调平
用不使用特殊招数的“稳健玩家”机器人模拟：原目标 60/85/115 太容易（中位 144/179/210），调为 110/150/185；二、三星需要用到杂音、让他等和反问。

## 美术素材
以下图片由 imgen（gpt-image-2，quality high）生成，经人工筛选后裁切压缩为 webp；生成记录（prompt、job id、原图与输出的哈希/体积）见仓库根目录 `art/manifest.json`。画布中的角色、特效等其余图形为代码绘制或系统 emoji。
- `assets/10-scam-buster-hotline/cover.webp`（960×640 webp，95 KB）
- `assets/10-scam-buster-hotline/caller-service.webp`（256×256 webp，11 KB）
- `assets/10-scam-buster-hotline/caller-police.webp`（256×256 webp，9 KB）
- `assets/10-scam-buster-hotline/caller-mentor.webp`（256×256 webp，13 KB）
- `assets/10-scam-buster-hotline/caller-prize.webp`（256×256 webp，15 KB）
- `assets/10-scam-buster-hotline/caller-friend.webp`（256×256 webp，11 KB）
- `assets/10-scam-buster-hotline/caller-invest.webp`（256×256 webp，14 KB）

## 对应的热门趋势
GameDiscoverCo 2026-11-06 月报提到一款让玩家在呼叫中心用语音对付 AI 来电的合作喜剧游戏，称其销量超过 60 万且“big influencer interest”；也有媒体对其题材有争议讨论。

具体链接见仓库根目录 [README.md](../../README.md) 的来源表。

## 原创说明
原作让玩家扮演诈骗方；本 demo 刻意反转为反诈科普视角，剧本与话术均为原创，并附现实反诈提示。

## 文件
- `index.html`：页面与样式
- `game.js`：游戏逻辑（原生 JavaScript，依赖仓库内 `shared/xg.js` 公共框架）
- `scripts.js`：12 个诈骗剧本数据
