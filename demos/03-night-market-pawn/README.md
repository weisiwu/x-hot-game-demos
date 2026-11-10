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

## 对应的热门趋势
Steam Next Fest 2026 年 10 月期间，一款店主经营模拟 demo 在 Output Lag 按峰值在线统计的榜单中排第 1（标签：Shop Keeper、Trading）；PC Gamer 也推荐了该 demo。

具体链接见仓库根目录 [README.md](../../README.md) 的来源表。

## 原创说明
原作是赛博朋克题材；本 demo 采用原创的夜市旧货摊主题、原创物品与角色，核验玩法属于通用的“证件核验”类机制。

## 文件
- `index.html`：页面与样式
- `game.js`：游戏逻辑（原生 JavaScript，依赖仓库内 `shared/xg.js` 公共框架）
