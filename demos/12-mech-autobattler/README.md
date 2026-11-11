# 🤖 机甲布阵

部署机甲、搭配羁绊、升级三星，自动战斗击退 10 波敌军。

## 怎么运行
推荐在仓库根目录运行 `python3 -m http.server 8000`，然后打开 http://localhost:8000/demos/12-mech-autobattler/ （存档最可靠）。也可以直接双击 `index.html`（`file://`），能玩，但存档能否保留取决于浏览器，无法保存时开始界面会给出提示。

## 玩法与关卡
10 波战役（第 5、10 波 Boss）+ 无尽模式；6 种机甲（重盾卫士、速射枪手、重炮、突袭者、维修机、狙击机），同类再点一次升级（最高三星），同类 2 台激活羁绊；胜利收入含利息（每存 5 能源 +1，最多 5）与连胜奖励，失败扣基地耐久。战斗可切换 ×1/×2/×3 速度。

## 操作
**键盘 / 鼠标**
- 点击选择机甲、点击下半场格子部署/升级；右键回收；Esc 暂停

**手机触屏**：点击操作即可；用「回收模式」按钮代替右键。

右上角按钮：⏸ 暂停、🎵 背景音乐开关、🔊 静音、❓ 教程、🏠 返回目录（静音与音乐设置会记住）。首次开始会自动显示教程。

## 存档
使用浏览器 localStorage（键名 `xhgd:12-mech-autobattler`），保存：每个准备阶段自动保存当前战役（可继续）、通关次数、最远波次、无尽最远、战斗速度设置。

## 数值调平
用构筑机器人打 30 局战役：胜率约 73%，失败集中在第 5、10 波 Boss。

## 美术素材
以下图片由 imgen（gpt-image-2，quality high）生成，经人工筛选后裁切压缩为 webp；生成记录（prompt、job id、原图与输出的哈希/体积）见仓库根目录 `art/manifest.json`。画布中的角色、特效等其余图形为代码绘制或系统 emoji。
- `assets/12-mech-autobattler/cover.webp`（960×640 webp，114 KB）
- `assets/12-mech-autobattler/deck.webp`（900×600 webp，60 KB）
- `assets/12-mech-autobattler/mech-guard.webp`（192×192 webp，11 KB）
- `assets/12-mech-autobattler/mech-gunner.webp`（192×192 webp，9 KB）
- `assets/12-mech-autobattler/mech-artillery.webp`（192×192 webp，8 KB）
- `assets/12-mech-autobattler/mech-raider.webp`（192×192 webp，8 KB）
- `assets/12-mech-autobattler/mech-medic.webp`（192×192 webp，7 KB）
- `assets/12-mech-autobattler/mech-sniper.webp`（192×192 webp，8 KB）


## 灵感来源（X 原帖）

数据由 Kai 使用 X 公开读取工具抓取，抓取时间：北京时间 2026-11-11 10:13:42（太平洋时间 2026-11-10 18:13:42 PST）。指标为抓取那一刻的公开数据，之后会变化。第三方资讯账号帖子里的销量 / 同时在线等数字只代表该帖原文说法，不是官方或审计数据。

- 对应灵感：Mechabellum（机甲自走棋 / auto-battler；既有作品，期间有 2.0 更新与 Epic 免费赠送）
- X 佐证强度：**弱**
- 结论：找到官方更新帖与免费领取讨论，可确认该作仍在被讨论；近 1–3 个月 X 上没有爆款级新热度，更像既有品类的持续存在。

- [x.com/mechabellum/status/2102807041869791285](https://x.com/mechabellum/status/2102807041869791285)
  - 作者 @mechabellum（Mechabellum），发布于北京时间 2026-09-24 01:07:21
  - 抓取时公开指标：赞 18 · 转发 2 · 回复 0 · 引用 0 · 书签 0 · 浏览 1,591
  - 摘要：官方宣布 Update 2.0.0.1：修 bug、小幅平衡，并为完整版所有者增加额外奖励，同时说明免费版与完整版差异。
- [x.com/mechabellum/status/2104892247514734870](https://x.com/mechabellum/status/2104892247514734870)
  - 作者 @mechabellum（Mechabellum），发布于北京时间 2026-09-29 19:13:13
  - 抓取时公开指标：赞 17 · 转发 1 · 回复 2 · 引用 0 · 书签 0 · 浏览 1,021
  - 摘要：官方宣布 Update 2.0.0.2：修 bug、调整星途远征匹配，并启用新的 Elite Battle Contract DLC。
- [x.com/mechabellum/status/2105331564892553541](https://x.com/mechabellum/status/2105331564892553541)
  - 作者 @mechabellum（Mechabellum），发布于北京时间 2026-10-01 00:18:54
  - 抓取时公开指标：赞 11 · 转发 0 · 回复 1 · 引用 0 · 书签 0 · 浏览 664
  - 摘要：官方宣布 Update 2.0.0.3 平衡与修复，特别提到削弱近期的 Centurion Spam。
- [x.com/freegamessales/status/2103577145226272971](https://x.com/freegamessales/status/2103577145226272971)
  - 作者 @freegamessales（Free Games & Sales），发布于北京时间 2026-09-26 04:07:28
  - 抓取时公开指标：赞 0 · 转发 0 · 回复 0 · 引用 0 · 书签 0 · 浏览 50
  - 摘要：称 Mechabellum 在 Epic Games 免费领取至 10 月 1 日，并转述 Steam 好评信息。

## 其他公开报道（第一轮调研）
Discord 2026-10-01 当周独立游戏趋势榜上的机甲自走棋（Discord 页面描述为 “epic mech auto-battler”）；该作 2.0 版本于 2026-09-22 推出免费版。

具体链接见仓库根目录 [README.md](../../README.md) 的来源表。


## 原创说明
单位、数值、地图均为原创，只保留“布阵 → 自动战斗”的通用类型。

## 文件
- `index.html`：页面与样式
- `game.js`：游戏逻辑（原生 JavaScript，依赖仓库内 `shared/xg.js` 公共框架）
