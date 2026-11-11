# X 近期热门玩法 · 15 个浏览器小游戏

基于 **2026 年 10–11 月**公开报道中反复出现的热门游戏玩法/类型，做了 15 个**原创的完整网页小游戏**（01–12 为第一轮，13–15 为根据 X 调研新候选补做）：每个都有开始与结算界面、关卡或长期进度与难度曲线、本地存档、暂停、首次教程、WebAudio 合成的音效与背景音乐，并且可以在手机上用触屏完整游玩。纯 HTML + 原生 JavaScript，无构建、无后端、无需联网。

> 📌 **数据来源说明**：X（Twitter）上的帖子、作者与公开指标由 Kai 使用 X 公开读取工具抓取，**抓取时间：北京时间 2026-11-11 10:13:42（太平洋时间 2026-11-10 18:13:42 PST）**；指标是抓取那一刻的公开数据，之后会变化。完整原始资料见仓库 `research/x-hot-games-research.md`（机器可读版 `research/x-hot-games-research.json`），本仓库只引用其中的链接与数字，**没有编造任何点赞数、浏览量或排名**。资料把每个游戏的 X 佐证分为强 / 中 / 弱：强的是 01、03、07、11，中的是 02、05、06、08、10，弱的是 04、09、12（有讨论但没有 X 爆款级原帖）。第三方资讯账号帖子里的销量、同时在线等数字只代表该帖原文说法，不是官方或审计数据。X 讨论热度也不等于 Steam / Discord 热度，若干原作在 Steam 很热但在 X 上只有低赞讨论。详见下方「X 灵感来源与指标」和文末「调研方法、来源与局限」。

## 运行方式

**方式一（推荐）：本地静态服务器**，存档最可靠

```bash
cd x-hot-game-demos
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000 （手机与电脑在同一局域网时，可用电脑的局域网 IP 访问）
```

**方式二：直接双击** 根目录 `index.html`（`file://`）。可以玩，但 `file://` 下的 localStorage 是否可写取决于浏览器（Chrome 通常可以，Safari 等可能不行）；如果检测到无法写入，开始界面会明确提示“本次进度只保存在内存里”，并建议改用方式一。

## 统一的游戏外壳（`shared/xg.js`）

- **开始界面 / 结算界面**：胜利和失败都有结算面板（星级、成绩、新纪录），可再来一局、下一关、回菜单
- **关卡选择与进度**：已解锁关卡、星级、最佳成绩
- **暂停**：右上角 ⏸ 或 Esc；切到后台自动暂停
- **教程**：首次开始自动弹出，之后可随时点 ❓ 查看
- **音频**：WebAudio 实时合成的音效与程序化背景音乐（每个游戏一种曲风），🔊 静音、🎵 音乐开关，设置会记住
- **存档**：localStorage，键名 `xhgd:<游戏目录名>`；不可写时回退到内存并提示
- **触屏**：虚拟摇杆 / 按住式按钮（通过派发键盘事件驱动游戏，与键盘逻辑完全一致），支持多点触控与双人分屏

## 操作速查（含触屏）

| # | 游戏 | 键盘 / 鼠标 | 手机触屏 |
|---|---|---|---|
| 01 | 草堆寻针 | 按住拖动拨草，单击拿针，G 磁铁 | 手指拖动拨草，轻点拿针 |
| 02 | 落叶清扫队 | P1 WASD，P2 方向键，1–5 升级 | 单人全屏摇杆；双人左右半屏两个摇杆 |
| 03 | 夜市旧货摊 | 点击按钮，↑↓ 调价，Enter 出价 | 点按钮（窄屏单列布局） |
| 04 | 刮刮大亨 | 按住鼠标刮卡，空格再买一张 | 手指涂抹刮卡 |
| 05 | 课堂捣蛋王 | WASD 移动，按住空格恶作剧，按住 Shift 趴下 | 左侧摇杆 + 右下「恶作剧」「趴下」按住按钮 |
| 06 | 汽水木筏 | A 左喷口，L 右喷口（单人 ←→↑） | 按住左半屏 = 左喷口，右半屏 = 右喷口（单人双拇指 / 两人各一边） |
| 07 | 口袋排球 | A/D 移动 W 跳 S 扣；P2 用方向键 | 左下 ◀▶ 右下 跳/扣；双人左右各一组按钮 |
| 08 | 弹幕天堂 Mini | WASD 移动，1/2/3 选升级 | 任意位置拖动摇杆，点卡片选升级 |
| 09 | 骰运连连 | 点骰子/1–5 锁定，R 重掷，Enter 计分 | 点骰子和按钮 |
| 10 | 反诈拖延热线 | 点选项/数字键，按键菜单可键入数字 | 点选项，「信号不好」按住不放 |
| 11 | 体力登顶 | 点击岩点 | 手指点岩点（判定更宽） |
| 12 | 机甲布阵 | 点击部署/升级，右键回收 | 点击部署，「回收模式」代替右键 |
| 13 | 梦境漂流 | A/D 转向，按住空格冲刺 | 按住左 / 右半屏转向，按住「冲刺」 |
| 14 | 毛球小屋 | 点家具再点空位摆放，点毛球摸摸、点礼物收下 | 同左，全部为点击 |
| 15 | 反应堆夜班 | 拖控制棒（↑↓），按住 1 冷却、按住 2 补水、3 泄压，点事故图标 | 拖滑杆，按住冷却 / 补水按钮，点泄压与事故图标 |

各游戏目录下的 `README.md` 有完整的玩法、关卡、存档内容和数值调平说明。

## 游戏列表

| # | 名称 | 一句话介绍 | 对应的热门趋势 | 来源（公开报道） |
|---|---|---|---|---|
| 01 | [🪡 草堆寻针](demos/01-haystack-needle/) | 拖动鼠标在上万根稻草里拨找一根针，用拨开的稻草换工具升级 | 2026-08 在 X 上爆红的“500 万根稻草找 1 根针”游戏帖；同类找针增量游戏 10 月上 Discord 趋势榜 | [Kotaku 2026-08-24](https://kotaku.com/find-needle-haystack-game-steam-5-million-twitter-x-2000727664) · [Dexerto 2026-08-24](https://www.dexerto.com/gaming/viral-game-makes-you-find-a-needle-in-5-million-pieces-of-hay-3401460/) · [X 原帖（已核实，见下表）](https://x.com/NasNakarus/status/2091156855774974333) · [Discord 趋势榜 10-01 周](https://discord.com/trending-games/category/indie/2026-10-01) |
| 02 | [🍂 落叶清扫队](demos/02-leaf-sweepers/) | 扫落叶、卖堆肥、升级扫帚和扫地机器人，可本地双人合作 | 合作 + 增量清洁类（GameDiscoverCo 月报原文称其为“super-viral co-op incremental cleaning-game”，热度主要在 Steam；X 上相关帖互动不高） | [GameDiscoverCo 2026-11-06](https://newsletter.gamediscover.co/p/october-2026s-top-new-pc-and-console) · [ixbt.games 2026-10-28](https://ixbt.games/en/news/2026/10/28/dva-razrabotcika-sdelali-igru-pro-uborku-luny-moon-sweepers-ona-obosla-aaa-xity-v-steam.html) |
| 03 | [🏮 夜市旧货摊](demos/03-night-market-pawn/) | 鉴定成色、比对失窃登记序列号、讨价还价，撑过 5 天 | Steam Next Fest 2026-10 峰值在线榜第 1 的店主经营模拟 demo | [Output Lag 2026-10-26](https://outputlag.com/news/steam-next-fest-october-2026-the-most-played-demos-by-the-numbers/) · [PC Gamer](https://pcgamer.com/games/sim/cool-demo-alert-be-a-cyberpunk-shopkeeper-in-probably-stolen) |
| 04 | [🎟️ 刮刮大亨](demos/04-scratch-tycoon/) | 鼠标刮开涂层中奖，升级幸运与自动刮卡机，赚到一百万（虚构币） | 刮刮卡增量游戏（Discord 趋势榜） | [Discord 趋势榜 10-01 周](https://discord.com/trending-games/category/indie/2026-10-01) |
| 05 | [🏫 课堂捣蛋王](demos/05-class-clown/) | 趁老师写板书溜出座位恶作剧，躲开老师回头和班长告状 | Next Fest 2026-10 Valve 官方榜（按独立玩家数）第 1 的教室恶作剧派对游戏 | [Inven Global 2026-10-27](https://www.invenglobal.com/articles/27767/steam-next-fest-top-50-most-played-demos-revealed-worst-class-ever-takes-1st-place) · [Output Lag](https://outputlag.com/news/steam-next-fest-october-2026-the-most-played-demos-by-the-numbers/) |
| 06 | [🥤 汽水木筏](demos/06-soda-raft/) | 两只青蛙用左右两个汽水喷口共同操控木筏逆流而上 | 搞笑物理合作派对游戏（Next Fest 峰值榜第 8；月报称其走红后出现大量 vibe-coded 克隆） | [Output Lag](https://outputlag.com/news/steam-next-fest-october-2026-the-most-played-demos-by-the-numbers/) · [GameDiscoverCo 2026-11-06](https://newsletter.gamediscover.co/p/october-2026s-top-new-pc-and-console) · [PCGH](https://www.pcgameshardware.de/Steam-Software-69900/News/Nilpferde-pupsen-sich-zum-Erfolg-Koop-Spiel-mit-4000-Spielern-1557701/) |
| 07 | [🏐 口袋排球](demos/07-pocket-volley/) | 极简街机排球，跳跃扣球，先到 7 分，可本地双人 | 街机排球 demo（Next Fest 峰值榜第 4，标签 Sports/Arcade） | [Output Lag](https://outputlag.com/news/steam-next-fest-october-2026-the-most-played-demos-by-the-numbers/) |
| 08 | [✨ 弹幕天堂 Mini](demos/08-bullet-heaven/) | 自动攻击、升级三选一、撑 3 分钟打大怪，带局外成长 | Bullet Heaven / 幸存者类（2026 年成为 Steam 官方标签；**全年持续趋势，非 10–11 月新热点**） | [howtomarketagame 2026-05-19](https://howtomarketagame.com/2026/05/19/2026-state-of-bullet-heavens-how-vital-shell-succeeded/) |
| 09 | [🎲 骰运连连](demos/09-dice-roguelike/) | 掷骰凑牌型，“筹码×倍率”计分，买护符改规则连过 8 轮 | roguelike 计分构筑类持续大量涌现 | [GamesRadar（仅读到标题）](https://www.gamesradar.com/games/roguelike/subnautica-2-exec-is-tired-of-balatro-likes-says-devs-pitched-maybe-250-roguelike-deckbuilders-in-the-last-12-months/) · [Output Lag（单列 roguelike 分类）](https://outputlag.com/news/steam-next-fest-october-2026-the-most-played-demos-by-the-numbers/) |
| 10 | [☎️ 反诈拖延热线](demos/10-scam-buster-hotline/) | 接听模拟诈骗电话，拖住骗子、不泄露信息、识别话术 | 2026-10 走红的“呼叫中心 + AI 来电”合作喜剧游戏（本 demo 反转为反诈视角） | [GameDiscoverCo 2026-11-06](https://newsletter.gamediscover.co/p/october-2026s-top-new-pc-and-console) · [dlcompare](https://www.dlcompare.com/gaming-news/scam-with-your-friends-turns-phone-scams-into-co-op-comedy-85830) |
| 11 | [🧗 体力登顶](demos/11-stamina-summit/) | 点击岩点攀爬，管理体力与伤势、躲阵风，登上山顶 | 合作攀爬 “friendslop”（2025 年作品，10–11 月主机版持续走热） | [GameDiscoverCo 2026-11-06](https://newsletter.gamediscover.co/p/october-2026s-top-new-pc-and-console) · [Wikipedia: Friendslop](https://en.wikipedia.org/wiki/Friendslop) |
| 12 | [🤖 机甲布阵](demos/12-mech-autobattler/) | 部署并升级机甲，自动战斗，击退 7 波敌军 | 机甲自走棋 / auto-battler（Discord 趋势榜） | [Discord 趋势榜 10-01 周](https://discord.com/trending-games/category/indie/2026-10-01) · [Turn Based Lovers](https://turnbasedlovers.com/overview/mechabellum-2-0/) |
| 13 | [🌙 梦境漂流](demos/13-dream-drift/) | 伪 3D 水道里乘纸船穿过 8 个梦境，每个世界一条规则 | X 候选 #1：作者用 AI 做的浏览器乘船演示帖（抓取时互动最高的新 demo 帖） | [X 原帖](https://x.com/kevin_t_ngo/status/2119868968307695818)（赞 4,054 / 浏览 423,302） |
| 14 | [🏡 毛球小屋](demos/14-fluff-house/) | 摆家具吸引毛球来做客，赚莓果、收礼物、完成每日委托 | X 候选 #2：Next Fest 热门的桌面角色小屋 / 收集养成 demo（X 与 Steam 两侧都有信号） | [X 原帖](https://x.com/CharacterHouse1/status/2111879040613355835)（赞 1,570 / 转发 880 / 浏览 44,975） |
| 15 | [☢️ 反应堆夜班](demos/15-reactor-night-shift/) | 一个人调功率、冷却、补水、泄压，同时灭火堵漏接电话 | X 候选 #8：Next Fest 派对榜上的多人看管反应堆 demo（**X 佐证弱**，热度主要来自 Steam 同场排名） | [X 帖](https://x.com/TableHopGG/status/2113768317660045799)（派对榜记录帖，赞 0 / 浏览 49） |

每个游戏目录下都有单独的 `README.md`，写明玩法与关卡、操作（含触屏）、存档、数值调平、美术素材、对应趋势和原创说明。

### 背景趋势：vibe coding 做游戏

这一时期另一个被反复提到的现象是“用 AI 编程工具快速做游戏”（vibe coding）：GameDiscoverCo 月报提到 Steam 审核被大量 vibe-coded 游戏淹没、热门 demo 走红后很快出现大量克隆；“vibe coding 游戏”的风潮最早可追溯到 2025 年开发者在 X 上分享 AI 做的浏览器游戏（见 [Wikipedia: Vibe coding](https://en.wikipedia.org/wiki/Vibe_coding)、[awesome-ai-built-games](https://github.com/lappemic/awesome-ai-built-games)）。本仓库本身就是用 AI 编程代理完成的，可以看作这个趋势的一个样本。

## X 灵感来源与指标

抓取时间：北京时间 2026-11-11 10:13:42（太平洋时间 2026-11-10 18:13:42 PST）。下表每行只列互动最高的一条相关帖，每个游戏的全部相关帖（作者、发布时间、赞 / 转发 / 回复 / 引用 / 书签 / 浏览、摘要）见各游戏目录 README 的「灵感来源（X 原帖）」一节。注意：佐证为「中 / 弱」的游戏，其热度主要体现在 Steam / Discord，而不是 X。

| # | 游戏 | X 佐证强度 | 互动最高的相关帖（抓取时） | 结论（资料原文） |
|---|---|---|---|---|
| 01 | [草堆寻针](demos/01-haystack-needle/) | 强 | [@NasNakarus](https://x.com/NasNakarus/status/2091156855774974333)：赞 191,818 / 转发 7,525 / 浏览 54,158,314 | 已核实原帖及多条高互动后续帖，原帖浏览量高于 Kotaku 撰稿时引用的 4800 万。 |
| 02 | [落叶清扫队](demos/02-leaf-sweepers/) | 中 | [@YorchTorchGames](https://x.com/YorchTorchGames/status/2117446845693559032)：赞 17 / 转发 1 / 浏览 1,898 | 找到官方账号与多条讨论帖，能交叉印证 Steam 热度（报道称首周约 60 万玩家、同接峰值约 8.3 万），但 X 帖本身点赞普遍不高，热度主要在 Steam 而非 X。 |
| 03 | [夜市旧货摊](demos/03-night-market-pawn/) | 强 | [@Probably_Stolen](https://x.com/Probably_Stolen/status/2117351164958372297)：赞 303 / 转发 23 / 浏览 16,821 | 官方账号有多条中高互动庆功帖，能直接印证 Next Fest 与发售后的销量节点。 |
| 04 | [刮刮大亨](demos/04-scratch-tycoon/) | 弱 | [@kotetsu_399](https://x.com/kotetsu_399/status/2076547175593472212)：赞 30 / 转发 3 / 浏览 793 | 找到对 Scritchy Scratchy 的真实讨论与媒体标题帖，可确认该品类存在，但未找到高互动爆款原帖；X 热度明显低于 Steam/Discord 叙事。 |
| 05 | [课堂捣蛋王](demos/05-class-clown/) | 中 | [@Yomi_Funcore](https://x.com/Yomi_Funcore/status/2114962296313467030)：赞 21 / 转发 0 / 浏览 696 | 开发者官方帖确认 Next Fest 按独立玩家数登顶，以及 demo 玩家与同接数据；X 点赞不高，热度主要在 Steam。 |
| 06 | [汽水木筏](demos/06-soda-raft/) | 中 | [@_pratikpakhale](https://x.com/_pratikpakhale/status/2113687050809655639)：赞 8 / 转发 1 / 浏览 561 | 官方帖写明 Next Fest 峰值同接与愿望单，玩法与 demo 对应清晰；X 互动偏低。 |
| 07 | [口袋排球](demos/07-pocket-volley/) | 强 | [@temkosoft](https://x.com/temkosoft/status/2103173634244091945)：赞 4,687 / 转发 199 / 浏览 343,360 | 开发者多条高互动原帖，是 12 款里 X 佐证最强的之一。 |
| 08 | [弹幕天堂 Mini](demos/08-bullet-heaven/) | 中 | [@Pirat_Nation](https://x.com/Pirat_Nation/status/2056827481718419804)：赞 1,286 / 转发 51 / 浏览 63,204 | 找到关于 Steam 正式加入 Bullet Heaven 标签的高互动报道帖，能印证品类趋势；这是 2026 年 5 月事件，不是 10–11 月新爆款单一作品。 |
| 09 | [骰运连连](demos/09-dice-roguelike/) | 弱 | [@ForwardLeaks](https://x.com/ForwardLeaks/status/2097533807444283560)：赞 216 / 转发 17 / 浏览 100,859 | 找到 Balatro 2 相关泄露讨论（互动中等）以及骰子构筑 demo（如 Seferia Matrix、Lucky Hell）的推广帖，可印证品类仍热；未找到与本 demo 一一对应的爆款新作官帖。 |
| 10 | [反诈拖延热线](demos/10-scam-buster-hotline/) | 中 | [@DailyDoseNut](https://x.com/DailyDoseNut/status/2114371713601257844)：赞 76 / 转发 2 / 浏览 4,756 | 找到真实讨论、销量和同接转述，以及较高互动的主播剪辑帖；未找到高互动官方宣布帖。X 热度中等偏低，Steam 数据更突出。 |
| 11 | [体力登顶](demos/11-stamina-summit/) | 强 | [@LandfallGames](https://x.com/LandfallGames/status/2110777736642105563)：赞 9,492 / 转发 1,051 / 浏览 323,835 | Landfall 官方主机预告与发售帖互动很高，足以作为 X 佐证。 |
| 12 | [机甲布阵](demos/12-mech-autobattler/) | 弱 | [@mechabellum](https://x.com/mechabellum/status/2102807041869791285)：赞 18 / 转发 2 / 浏览 1,591 | 找到官方更新帖与免费领取讨论，可确认该作仍在被讨论；近 1–3 个月 X 上没有爆款级新热度，更像既有品类的持续存在。 |
| 13 | [dream-drift](demos/13-dream-drift/)（新增，对应候选 #1 Dreamlike Boat Ride（暂用名，原帖未给正式标题）） | 见说明 | [@kevin_t_ngo](https://x.com/kevin_t_ngo/status/2119868968307695818)：赞 4,054 / 转发 198 / 浏览 423,302 | 近三日里检索到的互动最高的「可在浏览器玩」新 demo 帖，点赞与浏览量显著高于多数独立 demo 讨论。 |
| 14 | [fluff-house](demos/14-fluff-house/)（新增，对应候选 #2 Character House（桌面伴侣 / 收集养成）） | 见说明 | [@CharacterHouse1](https://x.com/CharacterHouse1/status/2111879040613355835)：赞 1,570 / 转发 880 / 浏览 44,975 | 开发者求助帖转发近 900、点赞 1570；后续又发帖称进入 Most Played Game Demos 第 1，并有致谢帖。X 与 Steam 两侧都有信号。 |
| 15 | [reactor-night-shift](demos/15-reactor-night-shift/)（新增，对应候选 #8 Meltdown Crew） | 见说明 | [@TableHopGG](https://x.com/TableHopGG/status/2114112406289092644)：赞 0 / 转发 0 / 浏览 54 | 在 TableHopGG 的 Next Fest 派对榜上多次排在 Fart Together / Worst Class Ever 附近（第 2–3），说明 demo 同场热度不低；但本次检索几乎没有高互动专帖，X 证据弱于 Steam 场次热度。 |

## 原创性说明

- 所有 demo 都是**玩法类型层面的致敬与简化实现**，名称、角色、美术、剧本、关卡与数值均为原创，不使用任何原作的名称、角色、美术或音乐。
- 有几个原作的题材组合比较独特（如清扫月球、赛博朋克当铺、河马放屁划船、教室恶作剧派对），demo 中都换成了不同的原创主题（落叶公园、夜市旧货摊、青蛙汽水木筏、单人潜行捣蛋），只保留通用的玩法机制。
- 10 号 demo 对应的原作让玩家扮演诈骗方，本 demo 刻意反转为反诈科普视角。

## 调研方法、来源与局限

**方法**

1. 第一轮（2026-11-10）：用公开网页搜索并抓取原文，重点关注 2026 年 10–11 月的 Steam Next Fest 榜单、Discord 趋势榜和行业报道，交叉核对多个来源。当时 X 内容只能通过媒体报道间接引用。
2. 第二轮（抓取于北京时间 2026-11-11 10:13:42）：由 Kai 使用 X 公开读取工具（按帖子 ID 读取、按账号读取时间线、关键词检索）拉取真实帖子，核对每个游戏的 X 原帖与公开指标，并整理出 10 个新候选（本仓库据此新增 13–15 号游戏）。
3. 只保留原文能读到的事实；第三方转述的数字标注为“该帖原文”。

**主要来源**

- Output Lag：[Steam Next Fest October 2026: the most played demos, by the numbers](https://outputlag.com/news/steam-next-fest-october-2026-the-most-played-demos-by-the-numbers/)（2026-10-26，按**峰值同时在线**排名，统计 7,310 个 demo）
- Inven Global：[Steam Next Fest Top 50 Most-Played Demos Revealed](https://www.invenglobal.com/articles/27767/steam-next-fest-top-50-most-played-demos-revealed-worst-class-ever-takes-1st-place)（2026-10-27，转述 Valve 官方榜，按**独立玩家数**排名）
- GameDiscoverCo：[October 2026's top new PC & console games, revealed...](https://newsletter.gamediscover.co/p/october-2026s-top-new-pc-and-console)（2026-11-06，部分内容付费墙、图表为图片未能读取）
- Discord：[Indie Games Trending — Week of October 1, 2026](https://discord.com/trending-games/category/indie/2026-10-01)（按 Discord 上玩家增量排名，统计周期 9/25–10/1）
- Kotaku / Dexerto 2026-08-24 关于 X 爆款“草堆找针”帖的报道（Kotaku 写道该帖在其撰稿时浏览量超过 4800 万）；第二轮直接读取原帖，抓取时浏览为 54,158,314、赞 191,818
- X 原帖：见上方「X 灵感来源与指标」及各游戏 README
- 其余单篇报道见上表链接

**局限**

- **X 热度 ≠ Steam / Discord 热度**：01、03、07、11 在 X 上有高互动原帖；02、05、06、08、10 只有中低互动的讨论；04、09、12 在 X 上佐证弱，热度主要来自 Steam / Discord / 行业报道。
- **X 读取工具的局限**（资料原文整理）：接口不支持按点赞数等互动过滤；每次最多取 25 条，多数检索没有翻完分页，不是全量普查；相关性排序仍会返回大量低互动或跑题帖；帖内视频没有观看，摘要只依据正文；部分账号（如 AggroCrab）未找到。
- **指标是快照**：所有 X 指标都是抓取时刻的数值，之后会变化。
- **不同榜单口径不同**：Valve 官方按独立玩家数、Output Lag 按峰值在线、Discord 按平台内玩家增量，排名不可直接比较。
- **时间窗口不完全一致**：01 的 X 帖发布于 2026-08；08（Bullet Heaven）、09（roguelike 构筑）、11（friendslop）属于 2026 年的持续趋势，并非 10–11 月新出现。
- **抓取不完整**：gg.deals 的 Next Fest 50 强页面返回 403；GameDiscoverCo 有付费墙；GamesRadar 只读到标题。
- **未覆盖的热门**：Discord 榜上的 cozy 裁缝游戏、MMO / 3A 大作（如 ArcheAge Chronicles、Phantom Blade Zero）等因不适合做成小型网页 demo 或公开信息不足，未纳入。
- 部分来源为聚合站或博客，可信度低于一手数据，已尽量用多源交叉核对。

## 美术素材来源

- 全部封面、背景纹理、顾客 / 来电人物头像、机甲图标、梦境背景、毛球角色由 **imgen**（服务 imgen.baoganai.com，模型 gpt-image-2，quality high）按本仓库 `art/specs/*.json` 中的 prompt 生成，共生成 63 张、使用 61 张。淘汰 2 张：07 号初版封面（角色与现有知名游戏角色过于相似，已重新生成）；14 号薄荷色毛球初版（绿幕上抠图会把绿色的毛一起抠掉，已改用品红背景重新生成）。
- 原图（每张约 2–4 MB PNG）不入库；经 `tools/art-process.py` 裁切缩放后压缩为 webp 放在 `assets/<游戏>/`，13–15 号新增素材后总计约 3.5 MB。
- 生成记录：`art/manifest.json`（每张图的 prompt、请求尺寸、各次尝试的 job id 与状态、原图与输出文件的 sha256 和字节数、是否使用）；`art/specs/*.results.json` 为出图脚本的原始返回记录；`art/rejected.txt` 为淘汰列表。
- 出图调用 `/workspace/jianxian/scripts/art/imgen-gen.py`（未修改）；`tools/imgen-resume.py` 只负责在网络超时中断后把未完成的任务另存为新 spec 再续跑。登录凭据只从本机文件读取，不在仓库、日志或文档中出现。
- 画布里的角色、特效、UI 等其余图形为代码绘制或系统 emoji；音效与音乐全部为 WebAudio 实时合成，没有外部音频文件。

## 数值调平方法

每个游戏都写了“机器人玩家”在无头浏览器里加速模拟（如贪心清扫、带路径规划和人类反应延迟的攀爬、AI 对打、构筑与经营策略），按通关率、用时、失败位置调整参数，过程与结论写在各游戏 README 的「数值调平」一节。机器人策略并不等于真人水平，结论只作为难度曲线的参考。

## 本地自测

`node tools/selftest.cjs [截图目录] [只测的编号，如 01,06]`（需要 Node.js 22+ 与本机 Chrome/Chromium）。脚本会：

1. 启动 `python3 -m http.server`（自动选空闲端口）和独立的 headless Chrome；
2. 对 15 个游戏逐个走完整流程：开始界面 → 首次教程 → 用真实键鼠输入游玩核心操作 → Esc 暂停与继续 → 推进到结局并确认结算界面出现 → 刷新页面确认存档仍在；
3. 用手机横屏视口 + 多点触摸事件再测一遍触屏能否独立完成核心操作（包括双人分屏）；
4. 用 `file://` 打开每个游戏做冒烟检查；
5. 全程收集未捕获异常、`console.error` 和资源加载错误，并保存截图与 `report.json`。

## 已知问题

- 13–15 号是本轮根据 X 调研新候选补做的原创游戏：15 号对应的原作在 X 上佐证很弱（代表帖互动为 0），热度主要来自 Steam Next Fest 同场排名，不应视为 X 爆款；13、14 号对应的原帖互动较高，但本作只借用玩法结构，与原作无关联。
- 最近一次全量自测：目录页 + 15 个游戏 × (http / 触屏 / file://) 共 46 个页面、240 个检查点全部通过，0 个控制台错误。
- 平衡是用机器人模拟加推算调的，没有大规模真人试玩，个别关卡的难度对新手可能偏高或偏低。
- 10 号仍是文字剧本 + 合成电话音效，没有接入真实 AI 语音。
- 角色动画较简单（画布绘制 + emoji），不同系统的 emoji 外观略有差异。
- `file://` 下的存档取决于浏览器，推荐使用本地服务器。

## 目录结构

```
index.html                     目录页（含封面）
shared/xg.js, xg.css           公共框架：存档、音频、界面外壳、触屏、自适应
demos/NN-name/index.html       各游戏页面
demos/NN-name/game.js          各游戏逻辑（10 号另有 scripts.js 剧本数据）
demos/NN-name/README.md        各游戏说明
assets/NN-name/*.webp          imgen 生成并压缩后的素材
art/                           出图 spec、结果记录与 manifest
tools/selftest.cjs             无头浏览器自测（用例在 selftest-cases.cjs）
tools/imgen-gen.py             imgen 封装（备用）；tools/imgen-resume.py 续跑；tools/art-process.py 压缩入库
```
