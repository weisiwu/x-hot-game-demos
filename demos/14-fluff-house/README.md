# 🏡 毛球小屋

摆家具、等毛球来做客：赚莓果、收礼物、完成访客委托，把小屋变成毛球们最爱的家。

## 怎么运行
推荐在仓库根目录运行 `python3 -m http.server 8000`，然后打开 http://localhost:8000/demos/14-fluff-house/ （存档最可靠）。也可以直接双击 `index.html`（`file://`），无法保存时开始界面会给出提示。

## 玩法与关卡
10 天进度：每天 90 秒，随机 3 个委托（让某只毛球来做客、赚够莓果、摸摸若干次、收礼物、同时有若干只毛球在家），完成 2 个过关、3 个 3 星；失败可重来这一天。8 种家具各吸引一种毛球（皇冠团需要家里同时有 4 只毛球，月团第 6 天起出现），毛球在家会产出莓果、偶尔掉礼物，待一段时间后回家。图鉴：8 只毛球 + 12 件礼物。

## 操作
**键盘 / 鼠标**
- 鼠标：点右侧家具按钮选中，再点小屋里的虚线空位摆放；点毛球摸摸，点礼物收下；Esc 暂停

**手机触屏**：全部为点击操作，手机直接点。

右上角按钮：⏸ 暂停、🎵 背景音乐开关、🔊 静音、❓ 教程、🏠 返回目录（静音与音乐设置会记住）。首次开始会自动显示教程。

## 存档
使用浏览器 localStorage（键名 `xhgd:14-fluff-house`），保存：莓果、家具摆放、毛球与礼物图鉴、天数进度与星级、累计摸摸次数。

## 数值调平
用“休闲玩家”机器人（买得起就摆最便宜的新家具、每 2.5 秒摸一次、礼物出现约 4 秒后才捡）连续玩 10 天、5 次试验：最初全部 3/3 满分——原因是摸摸奖励过高、后期目标太低；下调摸摸奖励（1 莓果、每只 3 秒冷却）、提高家具价格与后期目标后，前 6 天基本 3 星，第 7 天起开始掉星，第 10 天会出现失败重来。

## 美术素材
以下图片由 imgen（gpt-image-2，quality high）生成，经人工筛选后裁切压缩为 webp；生成记录见仓库根目录 `art/manifest.json`。画布中的其余图形为代码绘制或系统 emoji。
毛球角色在纯色背景上出图，再用 `tools/art-process.py` 从图片边缘泛洪抠图成透明 webp；薄荷色的「芽团」在绿幕上与背景混在一起，被淘汰后改用品红背景重新生成。
- `assets/14-fluff-house/cover.webp`（960×640 webp，149 KB）
- `assets/14-fluff-house/room.webp`（900×600 webp，83 KB）
- `assets/14-fluff-house/c1.webp`（256×256 webp，19 KB）
- `assets/14-fluff-house/c3.webp`（256×256 webp，16 KB）
- `assets/14-fluff-house/c4.webp`（256×256 webp，17 KB）
- `assets/14-fluff-house/c5.webp`（256×256 webp，22 KB）
- `assets/14-fluff-house/c6.webp`（256×256 webp，18 KB）
- `assets/14-fluff-house/c7.webp`（256×256 webp，19 KB）
- `assets/14-fluff-house/c8.webp`（256×256 webp，20 KB）
- `assets/14-fluff-house/c2.webp`（256×256 webp，17 KB）


## 灵感来源（X 原帖）

数据由 Kai 使用 X 公开读取工具抓取，抓取时间：北京时间 2026-11-11 10:13:42（太平洋时间 2026-11-10 18:13:42 PST）。指标为抓取那一刻的公开数据。

- 对应候选：#2 Character House（桌面伴侣 / 收集养成）
- 玩法一句话（资料原文）：挂在桌面上的收集/养成向「角色小屋」idle companion，Steam Next Fest 热门 demo。
- 为什么入选（资料原文）：开发者求助帖转发近 900、点赞 1570；后续又发帖称进入 Most Played Game Demos 第 1，并有致谢帖。X 与 Steam 两侧都有信号。

- [x.com/CharacterHouse1/status/2111879040613355835](https://x.com/CharacterHouse1/status/2111879040613355835)
  - 作者 @CharacterHouse1（キャラ屋 / Character House / 캐릭터 하우스 /角色屋），发布于北京时间 2026-10-19 01:56:14
  - 抓取时公开指标：赞 1,570 · 转发 880 · 回复 7 · 引用 20 · 书签 196 · 浏览 44,975
  - 摘要：开发者在 Next Fest 当周求助：完全自发行、几乎没有其他宣发渠道，前两天愿望单对曝光很关键。
- [x.com/CharacterHouse1/status/2115335079224598995](https://x.com/CharacterHouse1/status/2115335079224598995)
  - 作者 @CharacterHouse1（キャラ屋 / Character House / 캐릭터 하우스 /角色屋），发布于北京时间 2026-10-28 14:49:18
  - 抓取时公开指标：赞 533 · 转发 59 · 回复 5 · 引用 4 · 书签 12 · 浏览 7,830
  - 摘要：官方致谢：demo 成为该届 Steam Next Fest 游玩数最高的 demo 之一。
- [x.com/CharacterHouse1/status/2112589238634184981](https://x.com/CharacterHouse1/status/2112589238634184981)
  - 作者 @CharacterHouse1（キャラ屋 / Character House / 캐릭터 하우스 /角色屋），发布于北京时间 2026-10-21 00:58:19
  - 抓取时公开指标：赞 101 · 转发 10 · 回复 1 · 引用 1 · 书签 4 · 浏览 1,637
  - 摘要：官方称首次参加 Next Fest，已是 Most Played Game Demos 第 1。

## 原创说明
原作是桌面角色小屋 / 收集养成 demo；本作的毛球角色、家具、委托系统与名称均为原创，未使用原作角色。

## 文件
- `index.html`：页面与样式
- `game.js`：游戏逻辑（原生 JavaScript，依赖仓库内 `shared/xg.js` 公共框架）
