# 🥤 汽水木筏

两只青蛙用左右两个汽水喷口共同驾驶木筏逆流而上，适合两人合作。

## 怎么运行
推荐在仓库根目录运行 `python3 -m http.server 8000`，然后打开 http://localhost:8000/demos/06-soda-raft/ （存档最可靠）。也可以直接双击 `index.html`（`file://`），能玩，但存档能否保留取决于浏览器，无法保存时开始界面会给出提示。

## 玩法与关卡
6 条河流，逐步加入漂流木、漩涡（吸向中心并打转）、横穿河道的鳄鱼、急流窄道。汽水会用光，捡 🥤 补充；只有高速撞上河岸或石头才掉血，慢慢蹭只会弹开。到达终点过关，用时达标和收集 60% 金币各再得 1 星。

## 操作
**键盘 / 鼠标**
- 左喷口 A、右喷口 L（两人各管一边）；单人可用 ← → 转向、↑ / W 双喷；Esc 暂停

**手机触屏**：按住屏幕左半边 = 左喷口，右半边 = 右喷口；单人用两个拇指，两人各按一边。

右上角按钮：⏸ 暂停、🎵 背景音乐开关、🔊 静音、❓ 教程、🏠 返回目录（静音与音乐设置会记住）。首次开始会自动显示教程。

## 存档
使用浏览器 localStorage（键名 `xhgd:06-soda-raft`），保存：解锁河流、星级、最佳用时、累计金币。

## 数值调平
用自动驾驶机器人模拟：最初最高速度约 500px/s 而前方视野只有约 370px，反应时间不足 0.7 秒，于是推力从 300 降到 210、镜头下移；又按机器人的死亡位置降低漂流木速度、放宽后两关河道、后期生命增至 4–5 点。

## 美术素材
以下图片由 imgen（gpt-image-2，quality high）生成，经人工筛选后裁切压缩为 webp；生成记录（prompt、job id、原图与输出的哈希/体积）见仓库根目录 `art/manifest.json`。画布中的角色、特效等其余图形为代码绘制或系统 emoji。
- `assets/06-soda-raft/cover.webp`（960×640 webp，176 KB）
- `assets/06-soda-raft/grass.webp`（512×512 webp，65 KB）


## 灵感来源（X 原帖）

数据由 Kai 使用 X 公开读取工具抓取，抓取时间：北京时间 2026-11-11 10:13:42（太平洋时间 2026-11-10 18:13:42 PST）。指标为抓取那一刻的公开数据，之后会变化。第三方资讯账号帖子里的销量 / 同时在线等数字只代表该帖原文说法，不是官方或审计数据。

- 对应灵感：Fart Together（河马用放屁推进木筏的 2–4 人物理合作，开发商 @gamesmrkt）
- X 佐证强度：**中**
- 结论：官方帖写明 Next Fest 峰值同接与愿望单，玩法与 demo 对应清晰；X 互动偏低。

- [x.com/gamesmrkt/status/2118995535692505387](https://x.com/gamesmrkt/status/2118995535692505387)
  - 作者 @gamesmrkt（GamesMrkt），发布于北京时间 2026-11-07 17:14:39
  - 抓取时公开指标：赞 6 · 转发 1 · 回复 5 · 引用 0 · 书签 1 · 浏览 901
  - 摘要：官方：Steam 愿望单破 10 万；十月 Next Fest 游玩数第 4；demo 同接峰值超 8,000。
- [x.com/gamesmrkt/status/2114621282268615030](https://x.com/gamesmrkt/status/2114621282268615030)
  - 作者 @gamesmrkt（GamesMrkt），发布于北京时间 2026-10-26 15:32:56
  - 抓取时公开指标：赞 5 · 转发 1 · 回复 4 · 引用 0 · 书签 1 · 浏览 887
  - 摘要：官方：3 周愿望单超 6 万、demo 同接超 4,500；10 月 29 日进抢先体验。
- [x.com/pressf_hub/status/2110827538909908999](https://x.com/pressf_hub/status/2110827538909908999)
  - 作者 @pressf_hub（Press F），发布于北京时间 2026-10-16 04:17:57
  - 抓取时公开指标：赞 2 · 转发 0 · 回复 0 · 引用 0 · 书签 0 · 浏览 94
  - 摘要：介绍免费 Steam demo：用河马放屁驱动木筏，赢要靠精确配合。
- [x.com/Lalapy_Global/status/2114937633826648309](https://x.com/Lalapy_Global/status/2114937633826648309)
  - 作者 @Lalapy_Global（Lalapy），发布于北京时间 2026-10-27 12:30:00
  - 抓取时公开指标：赞 1 · 转发 0 · 回复 0 · 引用 0 · 书签 0 · 浏览 109
  - 摘要：把 Fart Together 与 Worst Class Ever、Dumpster Gang 并列，称 Next Fest 热门 demo 再次被 friendslop 主导。
- [x.com/TableHopGG/status/2114112406289092644](https://x.com/TableHopGG/status/2114112406289092644)
  - 作者 @TableHopGG（TableHop），发布于北京时间 2026-10-25 05:50:50
  - 抓取时公开指标：赞 0 · 转发 0 · 回复 1 · 引用 0 · 书签 0 · 浏览 54
  - 摘要：Next Fest 派对榜第 6 天：Fart Together 当晚 4,437 人，为当时最大夜晚；并提到 Worst Class Ever 白天同接 25,890。
- [x.com/_pratikpakhale/status/2113687050809655639](https://x.com/_pratikpakhale/status/2113687050809655639)
  - 作者 @_pratikpakhale（Pratik），发布于北京时间 2026-10-24 01:40:37
  - 抓取时公开指标：赞 8 · 转发 1 · 回复 3 · 引用 2 · 书签 1 · 浏览 561
  - 摘要：作者因 Mac 上玩不了原作，用 AI 做了浏览器版克隆 Toot Together（可手机、可 PWA）。可作为「该玩法已有网页移植」的旁证，不是原作官帖。

## 其他公开报道（第一轮调研）
Output Lag 统计的 Steam Next Fest 2026 年 10 月峰值在线榜第 8 名是一款物理派对合作游戏（标签：Physics、Party Game）；GameDiscoverCo 月报提到它在 Next Fest 表现出色后，马上出现了大量 vibe-coded 克隆。

具体链接见仓库根目录 [README.md](../../README.md) 的来源表。


## 原创说明
原作的角色与推进方式不同；本 demo 的青蛙、汽水喷射、河流关卡均为原创，只保留“多人共同操控一个物理载具”的合作类型。

## 文件
- `index.html`：页面与样式
- `game.js`：游戏逻辑（原生 JavaScript，依赖仓库内 `shared/xg.js` 公共框架）
