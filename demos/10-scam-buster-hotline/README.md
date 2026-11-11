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


## 灵感来源（X 原帖）

数据由 Kai 使用 X 公开读取工具抓取，抓取时间：北京时间 2026-11-11 10:13:42（太平洋时间 2026-11-10 18:13:42 PST）。指标为抓取那一刻的公开数据，之后会变化。第三方资讯账号帖子里的销量 / 同时在线等数字只代表该帖原文说法，不是官方或审计数据。

- 对应灵感：Scam With Your Friends（和朋友开诈骗呼叫中心、用 AI 来电对象演戏的合作喜剧；本仓库 demo 反转为反诈视角）
- X 佐证强度：**中**
- 结论：找到真实讨论、销量和同接转述，以及较高互动的主播剪辑帖；未找到高互动官方宣布帖。X 热度中等偏低，Steam 数据更突出。

- [x.com/DailyDoseNut/status/2114371713601257844](https://x.com/DailyDoseNut/status/2114371713601257844)
  - 作者 @DailyDoseNut（DailyDoseOfTheBurntPeanut），发布于北京时间 2026-10-25 23:01:14
  - 抓取时公开指标：赞 76 · 转发 2 · 回复 2 · 引用 0 · 书签 12 · 浏览 4,756
  - 摘要：主播剪辑：TheBurntPeanut 在游戏里用「松鼠」诈骗战术。是检索中互动最高的相关帖。
- [x.com/Teallyz/status/2110882652400374040](https://x.com/Teallyz/status/2110882652400374040)
  - 作者 @Teallyz（Teally 🦇⭐️），发布于北京时间 2026-10-16 07:56:57
  - 抓取时公开指标：赞 19 · 转发 1 · 回复 1 · 引用 1 · 书签 1 · 浏览 1,453
  - 摘要：主播预告直播玩 Scam w. your friends。
- [x.com/AppMagicRocks/status/2112244234505830803](https://x.com/AppMagicRocks/status/2112244234505830803)
  - 作者 @AppMagicRocks（AppMagic.rocks），发布于北京时间 2026-10-20 02:07:23
  - 抓取时公开指标：赞 1 · 转发 0 · 回复 0 · 引用 0 · 书签 0 · 浏览 191
  - 摘要：称 10 月 15 日抢先体验首日 Steam 收入 95 万美元、售出 10.1 万份；截至 10 月 17 日收入 200 万美元、售出 23 万份；上线时活跃愿望单 42 万。互动极低，数字仅作该账号原文记录。
- [x.com/2game_info/status/2111678707727478890](https://x.com/2game_info/status/2111678707727478890)
  - 作者 @2game_info（ゲームをもっと楽しく。2game.info 🎮️），发布于北京时间 2026-10-18 12:40:11
  - 抓取时公开指标：赞 0 · 转发 0 · 回复 0 · 引用 0 · 书签 0 · 浏览 41
  - 摘要：日语资讯：日本时间 10 月 16 日发售后，单日最大同接 19,251。
- [x.com/tehchno_gaming/status/2111478453052780592](https://x.com/tehchno_gaming/status/2111478453052780592)
  - 作者 @tehchno_gaming（Tehchno），发布于北京时间 2026-10-17 23:24:27
  - 抓取时公开指标：赞 1 · 转发 0 · 回复 0 · 引用 0 · 书签 0 · 浏览 24
  - 摘要：称 60 万愿望单、首日 28,983 名玩家；售价 $8.99，队友运营诈骗呼叫中心、对象是要被说服的 AI 来电者。

## 其他公开报道（第一轮调研）
GameDiscoverCo 2026-11-06 月报提到一款让玩家在呼叫中心用语音对付 AI 来电的合作喜剧游戏，称其销量超过 60 万且“big influencer interest”；也有媒体对其题材有争议讨论。

具体链接见仓库根目录 [README.md](../../README.md) 的来源表。


## 原创说明
原作让玩家扮演诈骗方；本 demo 刻意反转为反诈科普视角，剧本与话术均为原创，并附现实反诈提示。

## 文件
- `index.html`：页面与样式
- `game.js`：游戏逻辑（原生 JavaScript，依赖仓库内 `shared/xg.js` 公共框架）
- `scripts.js`：12 个诈骗剧本数据
