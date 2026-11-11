# 🧗 体力登顶

点击岩点攀爬，管理体力与伤势，登上 5 座越来越高的山。

## 怎么运行
推荐在仓库根目录运行 `python3 -m http.server 8000`，然后打开 http://localhost:8000/demos/11-stamina-summit/ （存档最可靠）。也可以直接双击 `index.html`（`file://`），能玩，但存档能否保留取决于浏览器，无法保存时开始界面会给出提示。

## 玩法与关卡
5 座山（667 → 1600 米），裂纹岩点会碎（6 秒后长回）、冰岩挂着时体力流失加倍、高处有阵风；🍎 恢复体力上限，🪢 安全绳抵消一次摔伤。体力耗尽会摔到下方平台并降低体力上限，低于 25 失败。登顶 1 星，用时达标、零摔落各 1 星。

## 操作
**键盘 / 鼠标**
- 鼠标点击绿圈高亮的岩点，点击平台可在平台上走动；Esc 暂停

**手机触屏**：手指直接点岩点（触屏判定半径更大）。

右上角按钮：⏸ 暂停、🎵 背景音乐开关、🔊 静音、❓ 教程、🏠 返回目录（静音与音乐设置会记住）。首次开始会自动显示教程。

## 存档
使用浏览器 localStorage（键名 `xhgd:11-stamina-summit`），保存：解锁山峰、星级、最佳用时、累计攀爬米数、登顶次数。

## 数值调平
用带路径规划和 0.55 秒人类反应延迟的机器人模拟：5 座山都能登顶，摔落次数随海拔增加（冰瀑岩最难）；目标用时按机器人中位数的约 1.8 倍设为 50 / 75 / 100 / 115 / 145 秒。另用 300 张随机地图验证每张都存在可达路径。

## 美术素材
以下图片由 imgen（gpt-image-2，quality high）生成，经人工筛选后裁切压缩为 webp；生成记录（prompt、job id、原图与输出的哈希/体积）见仓库根目录 `art/manifest.json`。画布中的角色、特效等其余图形为代码绘制或系统 emoji。
- `assets/11-stamina-summit/cover.webp`（960×640 webp，105 KB）
- `assets/11-stamina-summit/cliff.webp`（600×900 webp，117 KB）


## 灵感来源（X 原帖）

数据由 Kai 使用 X 公开读取工具抓取，抓取时间：北京时间 2026-11-11 10:13:42（太平洋时间 2026-11-10 18:13:42 PST）。指标为抓取那一刻的公开数据，之后会变化。第三方资讯账号帖子里的销量 / 同时在线等数字只代表该帖原文说法，不是官方或审计数据。

- 对应灵感：PEAK（Aggro Crab 与 Landfall 的合作攀爬 friendslop；2025 年作品，2026 年 10 月主机版走热）
- X 佐证强度：**强**
- 结论：Landfall 官方主机预告与发售帖互动很高，足以作为 X 佐证。

- [x.com/LandfallGames/status/2110777736642105563](https://x.com/LandfallGames/status/2110777736642105563)
  - 作者 @LandfallGames（Landfall），发布于北京时间 2026-10-16 01:00:03
  - 抓取时公开指标：赞 9,492 · 转发 1,051 · 回复 170 · 引用 124 · 书签 1,044 · 浏览 323,835
  - 摘要：官方宣布 PEAK 于 10 月 22 日登陆 Xbox Series X|S、Switch 2 与 PlayStation 5，并支持跨平台联机。
- [x.com/LandfallGames/status/2113284496976118264](https://x.com/LandfallGames/status/2113284496976118264)
  - 作者 @LandfallGames（Landfall），发布于北京时间 2026-10-22 23:01:01
  - 抓取时公开指标：赞 2,782 · 转发 293 · 回复 106 · 引用 30 · 书签 298 · 浏览 151,109
  - 摘要：官方宣布主机版现已上线，并强调跨平台可一起玩。同线程稍后更正为 Switch 2 而非普通 Switch。
- [x.com/LandfallGames/status/2110204955546243268](https://x.com/LandfallGames/status/2110204955546243268)
  - 作者 @LandfallGames（Landfall），发布于北京时间 2026-10-14 11:04:01
  - 抓取时公开指标：赞 1,925 · 转发 46 · 回复 12 · 引用 1 · 书签 45 · 浏览 27,274
  - 摘要：官方短帖「SNITCH」（配图/视频，具体画面未观看）。
- [x.com/rockpapershot/status/2087486793121780084](https://x.com/rockpapershot/status/2087486793121780084)
  - 作者 @rockpapershot（Rock Paper Shotgun），发布于北京时间 2026-08-12 18:30:09
  - 抓取时公开指标：赞 97 · 转发 5 · 回复 2 · 引用 1 · 书签 10 · 浏览 28,648
  - 摘要：RPS：在最终大型更新之际，Landfall 与 Aggro Crab 解释为何 PEAK 不会做成「永远运营的游戏」。

## 其他公开报道（第一轮调研）
GameDiscoverCo 2026-11-06 月报称一款合作攀爬游戏为 “friendslop masterpiece” 并提到它在 PlayStation 上的新增玩家；据 Wikipedia “Friendslop” 词条，这款 2025 年的合作生存游戏的走红让 friendslop（面向好友群体的低门槛合作独立游戏）一词使用量大增。注意：该作为 2025 年作品，10–11 月是其主机版的持续热度，并非新作。

具体链接见仓库根目录 [README.md](../../README.md) 的来源表。


## 原创说明
原作是多人 3D 合作攀爬；本 demo 是原创的单人 2D 点击攀爬，只保留“体力/伤势管理 + 登顶”这一通用机制。

## 文件
- `index.html`：页面与样式
- `game.js`：游戏逻辑（原生 JavaScript，依赖仓库内 `shared/xg.js` 公共框架）
