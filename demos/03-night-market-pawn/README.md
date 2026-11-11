# 🏮 夜市旧货摊

在夜市摆摊 7 个晚上：低价收货、高价卖出，识破仿品和赃物，别被便衣抓到。

## 怎么运行
推荐在仓库根目录运行 `python3 -m http.server 8000`，然后打开 http://localhost:8000/demos/03-night-market-pawn/ （存档最可靠）。也可以直接双击 `index.html`（`file://`），能玩，但存档能否保留取决于浏览器，无法保存时开始界面会给出提示。

## 玩法与关卡
7 夜战役，摊位费 60 → 300 递增。顾客分卖家与买家，卖家有 6 种性格（普通、急用钱、砍价高手、眼神闪躲、回头客、便衣巡查）。仿品只值很少的钱，可看“细节”线索（不一定准）或用有限次数的扫描鉴定；序列号在失窃登记表上的是赃物，利润高但打烊巡查可能被罚款并增加关注度（满 3 封摊），也可以举报领奖励。打烊后可买鉴定灯、暗格保险柜、霓虹招牌、吆喝喇叭。按最终现金评 S/A/B/C。

## 操作
**键盘 / 鼠标**
- 鼠标点击按钮；↑↓ 调价，Enter 出价，S 扫描，R 请走，Esc 暂停

**手机触屏**：全部为按钮操作，手机可直接点；窄屏自动改为单列布局。

右上角按钮：⏸ 暂停、🎵 背景音乐开关、🔊 静音、❓ 教程、🏠 返回目录（静音与音乐设置会记住）。首次开始会自动显示教程。

## 存档
使用浏览器 localStorage（键名 `xhgd:03-night-market-pawn`），保存：每晚开张时自动保存当前这一局（可“继续第 N 夜”）、历史最佳现金与评级、开局/通关次数。

## 数值调平
用“合理玩家”机器人打 40 局：胜率约 97%，最终现金中位数 $1302（A 级），只有少数局能到 S 级（≥$2000）。

## 美术素材
以下图片由 imgen（gpt-image-2，quality high）生成，经人工筛选后裁切压缩为 webp；生成记录（prompt、job id、原图与输出的哈希/体积）见仓库根目录 `art/manifest.json`。画布中的角色、特效等其余图形为代码绘制或系统 emoji。
- `assets/03-night-market-pawn/cover.webp`（960×640 webp，126 KB）
- `assets/03-night-market-pawn/backdrop.webp`（1280×853 webp，74 KB）
- `assets/03-night-market-pawn/cust-normal.webp`（256×256 webp，16 KB）
- `assets/03-night-market-pawn/cust-desperate.webp`（256×256 webp，15 KB）
- `assets/03-night-market-pawn/cust-haggler.webp`（256×256 webp，19 KB）
- `assets/03-night-market-pawn/cust-thief.webp`（256×256 webp，13 KB）
- `assets/03-night-market-pawn/cust-regular.webp`（256×256 webp，18 KB）
- `assets/03-night-market-pawn/cust-buyer.webp`（256×256 webp，18 KB）


## 灵感来源（X 原帖）

数据由 Kai 使用 X 公开读取工具抓取，抓取时间：北京时间 2026-11-11 10:13:42（太平洋时间 2026-11-10 18:13:42 PST）。指标为抓取那一刻的公开数据，之后会变化。第三方资讯账号帖子里的销量 / 同时在线等数字只代表该帖原文说法，不是官方或审计数据。

- 对应灵感：Probably Stolen: Cyberpunk Pawnshop Simulator（赛博朋克当铺/店主经营，Steam Next Fest 热门 demo）
- X 佐证强度：**强**
- 结论：官方账号有多条中高互动庆功帖，能直接印证 Next Fest 与发售后的销量节点。

- [x.com/Probably_Stolen/status/2117351164958372297](https://x.com/Probably_Stolen/status/2117351164958372297)
  - 作者 @Probably_Stolen（Probably Stolen: Cyberpunk Pawnshop Simulator），发布于北京时间 2026-11-03 04:20:30
  - 抓取时公开指标：赞 303 · 转发 23 · 回复 18 · 引用 8 · 书签 21 · 浏览 16,821
  - 摘要：官方宣布售出 75 万份。
- [x.com/Probably_Stolen/status/2118784062827733255](https://x.com/Probably_Stolen/status/2118784062827733255)
  - 作者 @Probably_Stolen（Probably Stolen: Cyberpunk Pawnshop Simulator），发布于北京时间 2026-11-07 03:14:20
  - 抓取时公开指标：赞 160 · 转发 16 · 回复 6 · 引用 2 · 书签 9 · 浏览 8,103
  - 摘要：官方称已有 100 万名店主开张，并预告后续内容。
- [x.com/Probably_Stolen/status/2116244979102392650](https://x.com/Probably_Stolen/status/2116244979102392650)
  - 作者 @Probably_Stolen（Probably Stolen: Cyberpunk Pawnshop Simulator），发布于北京时间 2026-10-31 03:04:55
  - 抓取时公开指标：赞 186 · 转发 20 · 回复 10 · 引用 4 · 书签 5 · 浏览 8,685
  - 摘要：官方宣布 50 万份销量，好评率 96%（Overwhelmingly Positive）。
- [x.com/Probably_Stolen/status/2116280230599881106](https://x.com/Probably_Stolen/status/2116280230599881106)
  - 作者 @Probably_Stolen（Probably Stolen: Cyberpunk Pawnshop Simulator），发布于北京时间 2026-10-31 05:25:00
  - 抓取时公开指标：赞 100 · 转发 9 · 回复 3 · 引用 0 · 书签 7 · 浏览 3,297
  - 摘要：官方再报：50 万店主、96% 好评、Steam 全球同时在线榜第 12。
- [x.com/Probably_Stolen/status/2118801101562769753](https://x.com/Probably_Stolen/status/2118801101562769753)
  - 作者 @Probably_Stolen（Probably Stolen: Cyberpunk Pawnshop Simulator），发布于北京时间 2026-11-07 04:22:02
  - 抓取时公开指标：赞 176 · 转发 22 · 回复 55 · 引用 4 · 书签 16 · 浏览 8,343
  - 摘要：官方公布未来数月免费更新路线图。
- [x.com/gamelassogg/status/2115564147505021163](https://x.com/gamelassogg/status/2115564147505021163)
  - 作者 @gamelassogg（GameLasso），发布于北京时间 2026-10-29 05:59:32
  - 抓取时公开指标：赞 6 · 转发 0 · 回复 3 · 引用 0 · 书签 0 · 浏览 222
  - 摘要：称该作为 Steam Next Fest 第一 demo，发售日同接 82,906。互动不高，作第三方转述。

## 其他公开报道（第一轮调研）
Steam Next Fest 2026 年 10 月期间，一款店主经营模拟 demo 在 Output Lag 按峰值在线统计的榜单中排第 1（标签：Shop Keeper、Trading）；PC Gamer 也推荐了该 demo。

具体链接见仓库根目录 [README.md](../../README.md) 的来源表。


## 原创说明
原作是赛博朋克题材；本 demo 采用原创的夜市旧货摊主题、原创物品与角色，核验玩法属于通用的“证件核验”类机制。

## 文件
- `index.html`：页面与样式
- `game.js`：游戏逻辑（原生 JavaScript，依赖仓库内 `shared/xg.js` 公共框架）
