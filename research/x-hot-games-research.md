# X 热门小游戏调研

这份材料补的是仓库 README 里写明的缺口：当时直接访问 `x.com/search`、`x.com/explore` 返回 HTTP 402，因而没有、也不曾编造任何 X 点赞/浏览数据。本次用 X 公开读取工具（MCP 命名空间 `x`）拉取真实帖子，供后续把 GitHub Pages 上的游戏目录再补新候选，或给 README 增加可核验的 X 出处。

**未改仓库代码。** 机器可读对照文件：`/workspace/reports/x-hot-games-research.json`。

- 数据抓取时间：北京时间 2026-11-11 10:13:42（太平洋时间 2026-11-10 18:13:42 PST）
- 对应仓库：https://github.com/weisiwu/x-hot-game-demos
- 现有 12 个游戏：全部找到至少 1 条相关真实帖；其中 01、03、07、11 佐证较强，02、05、06、08、10 中等，04、09、12 偏弱（有讨论但无 X 爆款级原帖）
- 新候选：10 个，按代表帖互动（优先点赞，其次浏览）排序
- 约调用 40 次读取接口，每次最多 25 条

> 所有数字和链接均来自工具返回，没有编造。作者同时记录 handle 与工具给出的显示名。第三方资讯帖里的销量/同接数字只当作该帖原文，不视为已审计的官方数据。

## 1. 现有 12 个游戏在 X 上的佐证

### 01 草堆寻针

- 对应灵感：Needle In A Haystack Simulator / 500万根稻草找1根针
- 佐证强度：strong
- 结论：已核实原帖及多条高互动后续帖，原帖浏览量高于 Kotaku 撰稿时引用的 4800 万。

- **https://x.com/NasNakarus/status/2091156855774974333**
  - 作者：@NasNakarus（显示名 Nas）
  - 发布时间：北京时间 2026-08-22 21:33:40（太平洋时间 2026-08-22 06:33:40 PDT；UTC 2026-08-22T13:33:40.000Z）
  - 公开指标：赞 191818，转发 7525，回复 3235，引用 3132，书签 20450，浏览 54158314
  - 摘要：作者自称做了「在草堆里找针」的游戏，关键是有 5,000,000 根稻草、只有 1 根针。附约 26 秒演示视频。此即 README 引用的原帖，本次直接读取核实。
  - 备注：README 原帖；impression_count 在同一次会话的后续官方时间线读取中为 54158327，与首次读取相差 13，按首次核实写入。

- **https://x.com/NasNakarus/status/2098766830651191585**
  - 作者：@NasNakarus（显示名 Nas）
  - 发布时间：北京时间 2026-09-12 21:33:00（太平洋时间 2026-09-12 06:33:00 PDT；UTC 2026-09-12T13:33:00.000Z）
  - 公开指标：赞 83520，转发 3684，回复 708，引用 267，书签 3487，浏览 7835063
  - 摘要：为向《Marvel's Wolverine》致敬增加「3A 模式」：找不到巨大草堆时的夸张对照。

- **https://x.com/NasNakarus/status/2115146693889183955**
  - 作者：@NasNakarus（显示名 Nas）
  - 发布时间：北京时间 2026-10-28 02:20:44（太平洋时间 2026-10-27 11:20:44 PDT；UTC 2026-10-27T18:20:44.000Z）
  - 公开指标：赞 34683，转发 2150，回复 281，引用 163，书签 1462，浏览 1394684
  - 摘要：因被大量克隆，他们做了新模式：「找出原版游戏」。

- **https://x.com/NasNakarus/status/2093759786231742822**
  - 作者：@NasNakarus（显示名 Nas）
  - 发布时间：北京时间 2026-08-30 01:56:47（太平洋时间 2026-08-29 10:56:47 PDT；UTC 2026-08-29T17:56:47.000Z）
  - 公开指标：赞 3462，转发 131，回复 81，引用 60，书签 649，浏览 478087
  - 摘要：宣布 Steam 愿望单开放：8 人、500 万根稻草、1 根针。

- **https://x.com/sheapgamer/status/2093906786940338550**
  - 作者：@sheapgamer（显示名 เกมถูกบอกด้วย）
  - 发布时间：北京时间 2026-08-30 11:40:55（太平洋时间 2026-08-29 20:40:55 PDT；UTC 2026-08-30T03:40:55.000Z）
  - 公开指标：赞 158，转发 57，回复 0，引用 4，书签 25，浏览 17769
  - 摘要：泰语游戏媒体报道该玩法在网上走红，并提到最多 8 人合作。

- **https://x.com/indi_penguin/status/2095125541493875131**
  - 作者：@indi_penguin（显示名 Indifferent Penguin）
  - 发布时间：北京时间 2026-09-02 20:23:49（太平洋时间 2026-09-02 05:23:49 PDT；UTC 2026-09-02T12:23:49.000Z）
  - 公开指标：赞 722，转发 3，回复 2，引用 0，书签 1，浏览 11564
  - 摘要：回复指出讽刺之处：在 Steam 上找到「正确的那款找针游戏」本身就像在草堆里找针。此为回复帖，互动较高。

### 02 落叶清扫队

- 对应灵感：Moon Sweepers（最多 16 人合作、从牙刷开始清扫月球的增量清洁游戏）
- 佐证强度：moderate
- 结论：找到官方账号与多条讨论帖，能交叉印证 Steam 热度（报道称首周约 60 万玩家、同接峰值约 8.3 万），但 X 帖本身点赞普遍不高，热度主要在 Steam 而非 X。

- **https://x.com/Moon_Sweepers/status/2109571601804955889**
  - 作者：@Moon_Sweepers（显示名 MoonSweepers）
  - 发布时间：北京时间 2026-10-12 17:07:18（太平洋时间 2026-10-12 02:07:18 PDT；UTC 2026-10-12T09:07:18.000Z）
  - 公开指标：赞 13，转发 0，回复 7，引用 0，书签 0，浏览 1008
  - 摘要：官方账号称 5 天内 Steam 愿望单破 1 万并致谢。官方账号粉丝数读取时为 108。

- **https://x.com/Moon_Sweepers/status/2107808767731437826**
  - 作者：@Moon_Sweepers（显示名 MoonSweepers）
  - 发布时间：北京时间 2026-10-07 20:22:26（太平洋时间 2026-10-07 05:22:26 PDT；UTC 2026-10-07T12:22:26.000Z）
  - 公开指标：赞 3，转发 0，回复 2，引用 0，书签 0，浏览 450
  - 摘要：官方介绍：新独立游戏已上 Steam，16 名清洁工、预算只够一把牙刷，请加入愿望单。

- **https://x.com/YorchTorchGames/status/2117446845693559032**
  - 作者：@YorchTorchGames（显示名 Yorch Torch Games）
  - 发布时间：北京时间 2026-11-03 10:40:42（太平洋时间 2026-11-02 18:40:42 PST；UTC 2026-11-03T02:40:42.000Z）
  - 公开指标：赞 17，转发 1，回复 6，引用 0，书签 1，浏览 1898
  - 摘要：称该作发行周 Steam 同接峰值 83,138，高于《Gears of War: E-Day》的不到 32,000，并写「两个芬兰开发者」。

- **https://x.com/gamewith_review/status/2117201304682381440**
  - 作者：@gamewith_review（显示名 GameWith@最新ゲーム情報局）
  - 发布时间：北京时间 2026-11-02 18:25:01（太平洋时间 2026-11-02 02:25:01 PST；UTC 2026-11-02T10:25:01.000Z）
  - 公开指标：赞 5，转发 1，回复 0，引用 0，书签 0，浏览 5980
  - 摘要：日语媒体：发售不到两周销量破 60 万；11 月 2 日时 Steam 最高同接破 8.3 万；12 月计划 1.1 更新。

- **https://x.com/AppMagicRocks/status/2115139597667647616**
  - 作者：@AppMagicRocks（显示名 AppMagic.rocks）
  - 发布时间：北京时间 2026-10-28 01:52:32（太平洋时间 2026-10-27 10:52:32 PDT；UTC 2026-10-27T17:52:32.000Z）
  - 公开指标：赞 0，转发 0，回复 0，引用 0，书签 0，浏览 165
  - 摘要：称首日（10 月 23 日）售出 4.1 万份；第三日售出 10.2 万份、同接峰值 3.6 万，营收 130 万美元。互动极低，数字仅作该账号原文记录。

- **https://x.com/JoshOG/status/2115302569564336461**
  - 作者：@JoshOG（显示名 JoshOG）
  - 发布时间：北京时间 2026-10-28 12:40:07（太平洋时间 2026-10-27 21:40:07 PDT；UTC 2026-10-28T04:40:07.000Z）
  - 公开指标：赞 13，转发 1，回复 1，引用 0，书签 0，浏览 9861
  - 摘要：提醒玩家：主持或加入对局时 IP 会对局内其他人可见。

### 03 夜市旧货摊

- 对应灵感：Probably Stolen: Cyberpunk Pawnshop Simulator（赛博朋克当铺/店主经营，Steam Next Fest 热门 demo）
- 佐证强度：strong
- 结论：官方账号有多条中高互动庆功帖，能直接印证 Next Fest 与发售后的销量节点。

- **https://x.com/Probably_Stolen/status/2117351164958372297**
  - 作者：@Probably_Stolen（显示名 Probably Stolen: Cyberpunk Pawnshop Simulator）
  - 发布时间：北京时间 2026-11-03 04:20:30（太平洋时间 2026-11-02 12:20:30 PST；UTC 2026-11-02T20:20:30.000Z）
  - 公开指标：赞 303，转发 23，回复 18，引用 8，书签 21，浏览 16821
  - 摘要：官方宣布售出 75 万份。

- **https://x.com/Probably_Stolen/status/2118784062827733255**
  - 作者：@Probably_Stolen（显示名 Probably Stolen: Cyberpunk Pawnshop Simulator）
  - 发布时间：北京时间 2026-11-07 03:14:20（太平洋时间 2026-11-06 11:14:20 PST；UTC 2026-11-06T19:14:20.000Z）
  - 公开指标：赞 160，转发 16，回复 6，引用 2，书签 9，浏览 8103
  - 摘要：官方称已有 100 万名店主开张，并预告后续内容。

- **https://x.com/Probably_Stolen/status/2116244979102392650**
  - 作者：@Probably_Stolen（显示名 Probably Stolen: Cyberpunk Pawnshop Simulator）
  - 发布时间：北京时间 2026-10-31 03:04:55（太平洋时间 2026-10-30 12:04:55 PDT；UTC 2026-10-30T19:04:55.000Z）
  - 公开指标：赞 186，转发 20，回复 10，引用 4，书签 5，浏览 8685
  - 摘要：官方宣布 50 万份销量，好评率 96%（Overwhelmingly Positive）。

- **https://x.com/Probably_Stolen/status/2116280230599881106**
  - 作者：@Probably_Stolen（显示名 Probably Stolen: Cyberpunk Pawnshop Simulator）
  - 发布时间：北京时间 2026-10-31 05:25:00（太平洋时间 2026-10-30 14:25:00 PDT；UTC 2026-10-30T21:25:00.000Z）
  - 公开指标：赞 100，转发 9，回复 3，引用 0，书签 7，浏览 3297
  - 摘要：官方再报：50 万店主、96% 好评、Steam 全球同时在线榜第 12。

- **https://x.com/Probably_Stolen/status/2118801101562769753**
  - 作者：@Probably_Stolen（显示名 Probably Stolen: Cyberpunk Pawnshop Simulator）
  - 发布时间：北京时间 2026-11-07 04:22:02（太平洋时间 2026-11-06 12:22:02 PST；UTC 2026-11-06T20:22:02.000Z）
  - 公开指标：赞 176，转发 22，回复 55，引用 4，书签 16，浏览 8343
  - 摘要：官方公布未来数月免费更新路线图。

- **https://x.com/gamelassogg/status/2115564147505021163**
  - 作者：@gamelassogg（显示名 GameLasso）
  - 发布时间：北京时间 2026-10-29 05:59:32（太平洋时间 2026-10-28 14:59:32 PDT；UTC 2026-10-28T21:59:32.000Z）
  - 公开指标：赞 6，转发 0，回复 3，引用 0，书签 0，浏览 222
  - 摘要：称该作为 Steam Next Fest 第一 demo，发售日同接 82,906。互动不高，作第三方转述。

### 04 刮刮大亨

- 对应灵感：刮刮卡增量游戏；检索到对应作品 Scritchy Scratchy（incremental scratch-off）
- 佐证强度：weak
- 结论：找到对 Scritchy Scratchy 的真实讨论与媒体标题帖，可确认该品类存在，但未找到高互动爆款原帖；X 热度明显低于 Steam/Discord 叙事。

- **https://x.com/HappyGamerNews/status/2075084724603887908**
  - 作者：@HappyGamerNews（显示名 Happy Gamer）
  - 发布时间：北京时间 2026-07-09 13:08:46（太平洋时间 2026-07-08 22:08:46 PDT；UTC 2026-07-09T05:08:46.000Z）
  - 公开指标：赞 0，转发 0，回复 0，引用 0，书签 0，浏览 38
  - 摘要：标题式报道：Scritchy Scratchy 把刮刮卡做成容易上瘾的放置游戏。互动为 0，仅证明该作在 X 上被点名。

- **https://x.com/Psm6I/status/2091824742496133183**
  - 作者：@Psm6I（显示名 レジェビリ先輩𝕏）
  - 发布时间：北京时间 2026-08-24 17:47:37（太平洋时间 2026-08-24 02:47:37 PDT；UTC 2026-08-24T09:47:37.000Z）
  - 公开指标：赞 21，转发 0，回复 0，引用 0，书签 0，浏览 418
  - 摘要：玩家介绍：一直刮刮卡、冲多巴胺、想当亿万富翁；并提到游戏出现「保护手腕模式」。此为 8 月窗口内互动相对较高的讨论帖。

- **https://x.com/kotetsu_399/status/2076547175593472212**
  - 作者：@kotetsu_399（显示名 こてつ＠Vtuber）
  - 发布时间：北京时间 2026-07-13 14:00:01（太平洋时间 2026-07-12 23:00:01 PDT；UTC 2026-07-13T06:00:01.000Z）
  - 公开指标：赞 30，转发 3，回复 0，引用 0，书签 0，浏览 793
  - 摘要：VTuber 预告直播刮 Scritchy Scratchy，并边刮边闲聊。

- **https://x.com/LoverOfKitsune/status/2089970340021563505**
  - 作者：@LoverOfKitsune（显示名 Lover of Kitsune）
  - 发布时间：北京时间 2026-08-19 14:58:53（太平洋时间 2026-08-18 23:58:53 PDT；UTC 2026-08-19T06:58:53.000Z）
  - 公开指标：赞 2，转发 0，回复 0，引用 0，书签 0，浏览 365
  - 摘要：在推荐列表里将 Scritchy Scratchy 称为 Incremental scratch off。

### 05 课堂捣蛋王

- 对应灵感：Worst Class Ever（不对称教室派对：一人当老师，其余混在 NPC 学生里恶作剧）
- 佐证强度：moderate
- 结论：开发者官方帖确认 Next Fest 按独立玩家数登顶，以及 demo 玩家与同接数据；X 点赞不高，热度主要在 Steam。

- **https://x.com/Yomi_Funcore/status/2114962296313467030**
  - 作者：@Yomi_Funcore（显示名 夜之黄泉 | 顽核社）
  - 发布时间：北京时间 2026-10-27 14:08:00（太平洋时间 2026-10-26 23:08:00 PDT；UTC 2026-10-27T06:08:00.000Z）
  - 公开指标：赞 21，转发 0，回复 2，引用 0，书签 1，浏览 696
  - 摘要：官方宣布 Worst Class Ever 成为 Steam Next Fest 游玩人数第一的 demo 并致谢。

- **https://x.com/Yomi_Funcore/status/2113596547338236095**
  - 作者：@Yomi_Funcore（显示名 夜之黄泉 | 顽核社）
  - 发布时间：北京时间 2026-10-23 19:41:00（太平洋时间 2026-10-23 04:41:00 PDT；UTC 2026-10-23T11:41:00.000Z）
  - 公开指标：赞 7，转发 2，回复 1，引用 1，书签 0，浏览 532
  - 摘要：官方称 demo 玩家已超 30 万，邀人在课堂上和朋友一起捣乱、躲老师。

- **https://x.com/Yomi_Funcore/status/2113547725296079053**
  - 作者：@Yomi_Funcore（显示名 夜之黄泉 | 顽核社）
  - 发布时间：北京时间 2026-10-23 16:27:00（太平洋时间 2026-10-23 01:27:00 PDT；UTC 2026-10-23T08:27:00.000Z）
  - 公开指标：赞 6，转发 0，回复 2，引用 0，书签 0，浏览 471
  - 摘要：官方称 demo 同接峰值达到 2 万。

- **https://x.com/DanielOlimac/status/2113619541033156621**
  - 作者：@DanielOlimac（显示名 Daniel Camilo）
  - 发布时间：北京时间 2026-10-23 21:12:22（太平洋时间 2026-10-23 06:12:22 PDT；UTC 2026-10-23T13:12:22.000Z）
  - 公开指标：赞 9，转发 1，回复 1，引用 0，书签 2，浏览 795
  - 摘要：转述 demo 下载超 30 万、同接超 20,600，开发商为 Funcore Games，不对称多人：一班学生对抗老师。

- **https://x.com/InvenGlobal/status/2115119620579377236**
  - 作者：@InvenGlobal（显示名 Inven Global）
  - 发布时间：北京时间 2026-10-28 00:33:09（太平洋时间 2026-10-27 09:33:09 PDT；UTC 2026-10-27T16:33:09.000Z）
  - 公开指标：赞 0，转发 0，回复 0，引用 0，书签 0，浏览 355
  - 摘要：Inven Global：Valve 公布 Next Fest 游玩人数前 50，Worst Class Ever 按独立玩家数第一。

- **https://x.com/2game_info/status/2120154560543264845**
  - 作者：@2game_info（显示名 ゲームをもっと楽しく。2game.info 🎮️）
  - 发布时间：北京时间 2026-11-10 22:00:12（太平洋时间 2026-11-10 06:00:12 PST；UTC 2026-11-10T14:00:12.000Z）
  - 公开指标：赞 0，转发 0，回复 0，引用 0，书签 0，浏览 31
  - 摘要：日语资讯：11 月 9 日（美国时间）发售后，11 月 10 日 22:15 同接 26,496。

### 06 汽水木筏

- 对应灵感：Fart Together（河马用放屁推进木筏的 2–4 人物理合作，开发商 @gamesmrkt）
- 佐证强度：moderate
- 结论：官方帖写明 Next Fest 峰值同接与愿望单，玩法与 demo 对应清晰；X 互动偏低。

- **https://x.com/gamesmrkt/status/2118995535692505387**
  - 作者：@gamesmrkt（显示名 GamesMrkt）
  - 发布时间：北京时间 2026-11-07 17:14:39（太平洋时间 2026-11-07 01:14:39 PST；UTC 2026-11-07T09:14:39.000Z）
  - 公开指标：赞 6，转发 1，回复 5，引用 0，书签 1，浏览 901
  - 摘要：官方：Steam 愿望单破 10 万；十月 Next Fest 游玩数第 4；demo 同接峰值超 8,000。

- **https://x.com/gamesmrkt/status/2114621282268615030**
  - 作者：@gamesmrkt（显示名 GamesMrkt）
  - 发布时间：北京时间 2026-10-26 15:32:56（太平洋时间 2026-10-26 00:32:56 PDT；UTC 2026-10-26T07:32:56.000Z）
  - 公开指标：赞 5，转发 1，回复 4，引用 0，书签 1，浏览 887
  - 摘要：官方：3 周愿望单超 6 万、demo 同接超 4,500；10 月 29 日进抢先体验。

- **https://x.com/pressf_hub/status/2110827538909908999**
  - 作者：@pressf_hub（显示名 Press F）
  - 发布时间：北京时间 2026-10-16 04:17:57（太平洋时间 2026-10-15 13:17:57 PDT；UTC 2026-10-15T20:17:57.000Z）
  - 公开指标：赞 2，转发 0，回复 0，引用 0，书签 0，浏览 94
  - 摘要：介绍免费 Steam demo：用河马放屁驱动木筏，赢要靠精确配合。

- **https://x.com/Lalapy_Global/status/2114937633826648309**
  - 作者：@Lalapy_Global（显示名 Lalapy）
  - 发布时间：北京时间 2026-10-27 12:30:00（太平洋时间 2026-10-26 21:30:00 PDT；UTC 2026-10-27T04:30:00.000Z）
  - 公开指标：赞 1，转发 0，回复 0，引用 0，书签 0，浏览 109
  - 摘要：把 Fart Together 与 Worst Class Ever、Dumpster Gang 并列，称 Next Fest 热门 demo 再次被 friendslop 主导。

- **https://x.com/TableHopGG/status/2114112406289092644**
  - 作者：@TableHopGG（显示名 TableHop）
  - 发布时间：北京时间 2026-10-25 05:50:50（太平洋时间 2026-10-24 14:50:50 PDT；UTC 2026-10-24T21:50:50.000Z）
  - 公开指标：赞 0，转发 0，回复 1，引用 0，书签 0，浏览 54
  - 摘要：Next Fest 派对榜第 6 天：Fart Together 当晚 4,437 人，为当时最大夜晚；并提到 Worst Class Ever 白天同接 25,890。

- **https://x.com/_pratikpakhale/status/2113687050809655639**
  - 作者：@_pratikpakhale（显示名 Pratik）
  - 发布时间：北京时间 2026-10-24 01:40:37（太平洋时间 2026-10-23 10:40:37 PDT；UTC 2026-10-23T17:40:37.000Z）
  - 公开指标：赞 8，转发 1，回复 3，引用 2，书签 1，浏览 561
  - 摘要：作者因 Mac 上玩不了原作，用 AI 做了浏览器版克隆 Toot Together（可手机、可 PWA）。可作为「该玩法已有网页移植」的旁证，不是原作官帖。

### 07 口袋排球

- 对应灵感：just volleyball（@temkosoft 的街机排球，1v1 到 6v6，Steam Next Fest 热门 demo）
- 佐证强度：strong
- 结论：开发者多条高互动原帖，是 12 款里 X 佐证最强的之一。

- **https://x.com/temkosoft/status/2103173634244091945**
  - 作者：@temkosoft（显示名 temkosoft）
  - 发布时间：北京时间 2026-09-25 01:24:04（太平洋时间 2026-09-24 10:24:04 PDT；UTC 2026-09-24T17:24:04.000Z）
  - 公开指标：赞 4687，转发 199，回复 83，引用 27，书签 1454，浏览 343360
  - 摘要：开发者说本该修 bug，却太沉迷自己的游戏。

- **https://x.com/temkosoft/status/2112209327666659534**
  - 作者：@temkosoft（显示名 temkosoft）
  - 发布时间：北京时间 2026-10-19 23:48:41（太平洋时间 2026-10-19 08:48:41 PDT；UTC 2026-10-19T15:48:41.000Z）
  - 公开指标：赞 4351，转发 361，回复 105，引用 112，书签 1169，浏览 235993
  - 摘要：官方宣布 Steam Next Fest 限时免费 demo，开放至 10 月 26 日，进度可带到 11 月 4 日正式版。

- **https://x.com/temkosoft/status/2113307721420198022**
  - 作者：@temkosoft（显示名 temkosoft）
  - 发布时间：北京时间 2026-10-23 00:33:18（太平洋时间 2026-10-22 09:33:18 PDT；UTC 2026-10-22T16:33:18.000Z）
  - 公开指标：赞 3048，转发 158，回复 65，引用 30，书签 1041，浏览 193824
  - 摘要：开发者分享激烈对拉，称没什么比这更有趣。

- **https://x.com/temkosoft/status/2106442577717215563**
  - 作者：@temkosoft（显示名 temkosoft）
  - 发布时间：北京时间 2026-10-04 01:53:40（太平洋时间 2026-10-03 10:53:40 PDT；UTC 2026-10-03T17:53:40.000Z）
  - 公开指标：赞 2199，转发 77，回复 57，引用 12，书签 483，浏览 126528
  - 摘要：宣布游戏里「现在可以死了」。

- **https://x.com/temkosoft/status/2120195252984357199**
  - 作者：@temkosoft（显示名 temkosoft）
  - 发布时间：北京时间 2026-11-11 00:41:54（太平洋时间 2026-11-10 08:41:54 PST；UTC 2026-11-10T16:41:54.000Z）
  - 公开指标：赞 2046，转发 187，回复 81，引用 54，书签 290，浏览 59456
  - 摘要：因 Steam 审核推迟发售，再开一轮免费 demo 至 11 月 18 日。

- **https://x.com/indieradartr/status/2114419033768395070**
  - 作者：@indieradartr（显示名 Indie Radar）
  - 发布时间：北京时间 2026-10-26 02:09:16（太平洋时间 2026-10-25 11:09:16 PDT；UTC 2026-10-25T18:09:16.000Z）
  - 公开指标：赞 6，转发 0，回复 1，引用 0，书签 0，浏览 389
  - 摘要：土耳其资讯：单人开发的 just volleyball 在 Next Fest 达到 8,188 同接。

### 08 弹幕天堂 Mini

- 对应灵感：Bullet Heaven / Vampire Survivors 类（Steam 在 2026-05 将其列为官方标签；全年持续趋势）
- 佐证强度：moderate
- 结论：找到关于 Steam 正式加入 Bullet Heaven 标签的高互动报道帖，能印证品类趋势；这是 2026 年 5 月事件，不是 10–11 月新爆款单一作品。

- **https://x.com/Pirat_Nation/status/2056827481718419804**
  - 作者：@Pirat_Nation（显示名 Pirat_Nation 🔴）
  - 发布时间：北京时间 2026-05-20 04:01:00（太平洋时间 2026-05-19 13:01:00 PDT；UTC 2026-05-19T20:01:00.000Z）
  - 公开指标：赞 1286，转发 51，回复 35，引用 4，书签 108，浏览 63204
  - 摘要：报道 Steam 正式加入 Bullet Heaven 类型标签，用于 Vampire Survivors 风格游戏，并转述 Valve 定义：与弹幕地狱相对，强调升级与自动攻击。该标签更新同时引入 17 个新类型。

- **https://x.com/AwesomeGamesStd/status/2056735687932579848**
  - 作者：@AwesomeGamesStd（显示名 Awesome Games Studio）
  - 发布时间：北京时间 2026-05-19 21:56:14（太平洋时间 2026-05-19 06:56:14 PDT；UTC 2026-05-19T13:56:14.000Z）
  - 公开指标：赞 58，转发 9，回复 7，引用 1，书签 2，浏览 3870
  - 摘要：工作室宣布 Bullet Heaven 标签已上线，并向玩家和开发者征集作品。

- **https://x.com/AwesomeGamesStd/status/2058946057887698971**
  - 作者：@AwesomeGamesStd（显示名 Awesome Games Studio）
  - 发布时间：北京时间 2026-05-26 00:19:28（太平洋时间 2026-05-25 09:19:28 PDT；UTC 2026-05-25T16:19:28.000Z）
  - 公开指标：赞 65，转发 12，回复 7，引用 0，书签 2，浏览 4013
  - 摘要：感谢社区协助推动 Steam 将该类型正式化，并发布致谢视频。

### 09 骰运连连

- 对应灵感：Balatro-like / 骰子或计分构筑 roguelike（持续涌现的品类，而非单一新作）
- 佐证强度：weak
- 结论：找到 Balatro 2 相关泄露讨论（互动中等）以及骰子构筑 demo（如 Seferia Matrix、Lucky Hell）的推广帖，可印证品类仍热；未找到与本 demo 一一对应的爆款新作官帖。

- **https://x.com/ForwardLeaks/status/2097533807444283560**
  - 作者：@ForwardLeaks（显示名 Forward）
  - 发布时间：北京时间 2026-09-09 11:53:24（太平洋时间 2026-09-08 20:53:24 PDT；UTC 2026-09-09T03:53:24.000Z）
  - 公开指标：赞 216，转发 17，回复 16，引用 48，书签 79，浏览 100859
  - 摘要：「Steam 成就泄露第 4 版」名单中包含 Balatro 2（sequel）。此为泄露帖而非官方发布，但带动了大量后续讨论。

- **https://x.com/Jackmike00/status/2100552724513423429**
  - 作者：@Jackmike00（显示名 JACK）
  - 发布时间：北京时间 2026-09-17 19:49:30（太平洋时间 2026-09-17 04:49:30 PDT；UTC 2026-09-17T11:49:30.000Z）
  - 公开指标：赞 20，转发 3，回复 0，引用 0，书签 0，浏览 828
  - 摘要：介绍 Seferia Matrix：骰子 roguelike 构筑，锁定并重掷 5 枚骰子施法、叠升级打出高伤害，demo 已上线。

- **https://x.com/sinful_dice/status/2096223477833613430**
  - 作者：@sinful_dice（显示名 Sinful Dice）
  - 发布时间：北京时间 2026-09-05 21:06:37（太平洋时间 2026-09-05 06:06:37 PDT；UTC 2026-09-05T13:06:37.000Z）
  - 公开指标：赞 0，转发 0，回复 0，引用 0，书签 0，浏览 0
  - 摘要：Lucky Hell 自称骰子 roguelike 构筑，Steam 免费 demo。该条读取时各项互动均为 0，仅作存在性记录。

### 10 反诈拖延热线

- 对应灵感：Scam With Your Friends（和朋友开诈骗呼叫中心、用 AI 来电对象演戏的合作喜剧；本仓库 demo 反转为反诈视角）
- 佐证强度：moderate
- 结论：找到真实讨论、销量和同接转述，以及较高互动的主播剪辑帖；未找到高互动官方宣布帖。X 热度中等偏低，Steam 数据更突出。

- **https://x.com/DailyDoseNut/status/2114371713601257844**
  - 作者：@DailyDoseNut（显示名 DailyDoseOfTheBurntPeanut）
  - 发布时间：北京时间 2026-10-25 23:01:14（太平洋时间 2026-10-25 08:01:14 PDT；UTC 2026-10-25T15:01:14.000Z）
  - 公开指标：赞 76，转发 2，回复 2，引用 0，书签 12，浏览 4756
  - 摘要：主播剪辑：TheBurntPeanut 在游戏里用「松鼠」诈骗战术。是检索中互动最高的相关帖。

- **https://x.com/Teallyz/status/2110882652400374040**
  - 作者：@Teallyz（显示名 Teally 🦇⭐️）
  - 发布时间：北京时间 2026-10-16 07:56:57（太平洋时间 2026-10-15 16:56:57 PDT；UTC 2026-10-15T23:56:57.000Z）
  - 公开指标：赞 19，转发 1，回复 1，引用 1，书签 1，浏览 1453
  - 摘要：主播预告直播玩 Scam w. your friends。

- **https://x.com/AppMagicRocks/status/2112244234505830803**
  - 作者：@AppMagicRocks（显示名 AppMagic.rocks）
  - 发布时间：北京时间 2026-10-20 02:07:23（太平洋时间 2026-10-19 11:07:23 PDT；UTC 2026-10-19T18:07:23.000Z）
  - 公开指标：赞 1，转发 0，回复 0，引用 0，书签 0，浏览 191
  - 摘要：称 10 月 15 日抢先体验首日 Steam 收入 95 万美元、售出 10.1 万份；截至 10 月 17 日收入 200 万美元、售出 23 万份；上线时活跃愿望单 42 万。互动极低，数字仅作该账号原文记录。

- **https://x.com/2game_info/status/2111678707727478890**
  - 作者：@2game_info（显示名 ゲームをもっと楽しく。2game.info 🎮️）
  - 发布时间：北京时间 2026-10-18 12:40:11（太平洋时间 2026-10-17 21:40:11 PDT；UTC 2026-10-18T04:40:11.000Z）
  - 公开指标：赞 0，转发 0，回复 0，引用 0，书签 0，浏览 41
  - 摘要：日语资讯：日本时间 10 月 16 日发售后，单日最大同接 19,251。

- **https://x.com/tehchno_gaming/status/2111478453052780592**
  - 作者：@tehchno_gaming（显示名 Tehchno）
  - 发布时间：北京时间 2026-10-17 23:24:27（太平洋时间 2026-10-17 08:24:27 PDT；UTC 2026-10-17T15:24:27.000Z）
  - 公开指标：赞 1，转发 0，回复 0，引用 0，书签 0，浏览 24
  - 摘要：称 60 万愿望单、首日 28,983 名玩家；售价 $8.99，队友运营诈骗呼叫中心、对象是要被说服的 AI 来电者。

### 11 体力登顶

- 对应灵感：PEAK（Aggro Crab 与 Landfall 的合作攀爬 friendslop；2025 年作品，2026 年 10 月主机版走热）
- 佐证强度：strong
- 结论：Landfall 官方主机预告与发售帖互动很高，足以作为 X 佐证。

- **https://x.com/LandfallGames/status/2110777736642105563**
  - 作者：@LandfallGames（显示名 Landfall）
  - 发布时间：北京时间 2026-10-16 01:00:03（太平洋时间 2026-10-15 10:00:03 PDT；UTC 2026-10-15T17:00:03.000Z）
  - 公开指标：赞 9492，转发 1051，回复 170，引用 124，书签 1044，浏览 323835
  - 摘要：官方宣布 PEAK 于 10 月 22 日登陆 Xbox Series X|S、Switch 2 与 PlayStation 5，并支持跨平台联机。

- **https://x.com/LandfallGames/status/2113284496976118264**
  - 作者：@LandfallGames（显示名 Landfall）
  - 发布时间：北京时间 2026-10-22 23:01:01（太平洋时间 2026-10-22 08:01:01 PDT；UTC 2026-10-22T15:01:01.000Z）
  - 公开指标：赞 2782，转发 293，回复 106，引用 30，书签 298，浏览 151109
  - 摘要：官方宣布主机版现已上线，并强调跨平台可一起玩。同线程稍后更正为 Switch 2 而非普通 Switch。

- **https://x.com/LandfallGames/status/2110204955546243268**
  - 作者：@LandfallGames（显示名 Landfall）
  - 发布时间：北京时间 2026-10-14 11:04:01（太平洋时间 2026-10-13 20:04:01 PDT；UTC 2026-10-14T03:04:01.000Z）
  - 公开指标：赞 1925，转发 46，回复 12，引用 1，书签 45，浏览 27274
  - 摘要：官方短帖「SNITCH」（配图/视频，具体画面未观看）。

- **https://x.com/rockpapershot/status/2087486793121780084**
  - 作者：@rockpapershot（显示名 Rock Paper Shotgun）
  - 发布时间：北京时间 2026-08-12 18:30:09（太平洋时间 2026-08-12 03:30:09 PDT；UTC 2026-08-12T10:30:09.000Z）
  - 公开指标：赞 97，转发 5，回复 2，引用 1，书签 10，浏览 28648
  - 摘要：RPS：在最终大型更新之际，Landfall 与 Aggro Crab 解释为何 PEAK 不会做成「永远运营的游戏」。

### 12 机甲布阵

- 对应灵感：Mechabellum（机甲自走棋 / auto-battler；既有作品，期间有 2.0 更新与 Epic 免费赠送）
- 佐证强度：weak
- 结论：找到官方更新帖与免费领取讨论，可确认该作仍在被讨论；近 1–3 个月 X 上没有爆款级新热度，更像既有品类的持续存在。

- **https://x.com/mechabellum/status/2102807041869791285**
  - 作者：@mechabellum（显示名 Mechabellum）
  - 发布时间：北京时间 2026-09-24 01:07:21（太平洋时间 2026-09-23 10:07:21 PDT；UTC 2026-09-23T17:07:21.000Z）
  - 公开指标：赞 18，转发 2，回复 0，引用 0，书签 0，浏览 1591
  - 摘要：官方宣布 Update 2.0.0.1：修 bug、小幅平衡，并为完整版所有者增加额外奖励，同时说明免费版与完整版差异。

- **https://x.com/mechabellum/status/2104892247514734870**
  - 作者：@mechabellum（显示名 Mechabellum）
  - 发布时间：北京时间 2026-09-29 19:13:13（太平洋时间 2026-09-29 04:13:13 PDT；UTC 2026-09-29T11:13:13.000Z）
  - 公开指标：赞 17，转发 1，回复 2，引用 0，书签 0，浏览 1021
  - 摘要：官方宣布 Update 2.0.0.2：修 bug、调整星途远征匹配，并启用新的 Elite Battle Contract DLC。

- **https://x.com/mechabellum/status/2105331564892553541**
  - 作者：@mechabellum（显示名 Mechabellum）
  - 发布时间：北京时间 2026-10-01 00:18:54（太平洋时间 2026-09-30 09:18:54 PDT；UTC 2026-09-30T16:18:54.000Z）
  - 公开指标：赞 11，转发 0，回复 1，引用 0，书签 0，浏览 664
  - 摘要：官方宣布 Update 2.0.0.3 平衡与修复，特别提到削弱近期的 Centurion Spam。

- **https://x.com/freegamessales/status/2103577145226272971**
  - 作者：@freegamessales（显示名 Free Games & Sales）
  - 发布时间：北京时间 2026-09-26 04:07:28（太平洋时间 2026-09-25 13:07:28 PDT；UTC 2026-09-25T20:07:28.000Z）
  - 公开指标：赞 0，转发 0，回复 0，引用 0，书签 0，浏览 50
  - 摘要：称 Mechabellum 在 Epic Games 免费领取至 10 月 1 日，并转述 Steam 好评信息。

## 2. 近 1–3 个月新的网页小游戏 / 独立 demo 候选（10 个）

窗口大致为 2026-08-11 至抓取日（约 3 个月）。排序依据是代表帖的公开指标，而不是 Steam 同接。若干 Next Fest 热门在 X 上互动很低，仍列入是因为玩法适合做成网页 demo，文中会写明这一点。

| 排序 | 名称 | 代表帖 | 赞 / 转发 / 浏览 | 北京时间 |
|---|---|---|---|---|
| 1 | Dreamlike Boat Ride（暂用名，原帖未给正式标题） | https://x.com/kevin_t_ngo/status/2119868968307695818 | 4054 / 198 / 423302 | 2026-11-10 03:05:21 |
| 2 | Character House（桌面伴侣 / 收集养成） | https://x.com/CharacterHouse1/status/2111879040613355835 | 1570 / 880 / 44975 | 2026-10-19 01:56:14 |
| 3 | Landfill Bitcoin Drive（垃圾场找比特币硬盘） | https://x.com/7paiden/status/2091935998775034117 | 964 / 54 / 171820 | 2026-08-25 01:09:43 |
| 4 | Gilt & Gutter | https://x.com/kevin_t_ngo/status/2119900487688622171 | 310 / 11 / 96561 | 2026-11-10 05:10:36 |
| 5 | Mimes Control Reality（哑剧操纵现实） | https://x.com/ArfhisTheWizard/status/2095149403803996579 | 266 / 12 / 4136 | 2026-09-02 21:58:38 |
| 6 | Dumpster Gang | https://x.com/DumpsterGangHQ/status/2113314446902767622 | 30 / 3 / 1995 | 2026-10-23 01:00:02 |
| 7 | Dude, Trust Me | https://x.com/TimothyJooste/status/2118465999368339456 | 78 / 19 / 4998 | 2026-11-06 06:10:28 |
| 8 | Meltdown Crew | https://x.com/TableHopGG/status/2113768317660045799 | 0 / 0 / 49 | 2026-10-24 07:03:33 |
| 9 | Haunted Paws | https://x.com/CerbiBites/status/2118052156334895444 | 26 / 7 / 680 | 2026-11-05 02:46:00 |
| 10 | Find The Needle（Steam 工厂/自动化版） | https://x.com/ChiclanaFriends/status/2114710363921076409 | 61 / 5 / 7056 | 2026-10-26 21:26:54 |

### 候选 1. Dreamlike Boat Ride（暂用名，原帖未给正式标题）

- 玩法一句话：用 AI（帖中写作 Claude Fable 5.2）生成的浏览器演示：乘船穿过 8 个梦幻世界。
- 为什么火：近三日里检索到的互动最高的「可在浏览器玩」新 demo 帖，点赞与浏览量显著高于多数独立 demo 讨论。
- 做成网页 demo 的建议：很适合做成原创网页小游戏：短时探索/乘船观光 + 关卡世界切换，强调氛围与简单交互，不必复刻原作美术。注意只借鉴「短程浏览式关卡」机制，不要使用原帖素材或标题。

代表帖：

- **https://x.com/kevin_t_ngo/status/2119868968307695818**
  - 作者：@kevin_t_ngo（显示名 Kevin Ngo）
  - 发布时间：北京时间 2026-11-10 03:05:21（太平洋时间 2026-11-09 11:05:21 PST；UTC 2026-11-09T19:05:21.000Z）
  - 公开指标：赞 4054，转发 198，回复 161，引用 97，书签 1671，浏览 423302
  - 摘要：作者称 Claude Fable 5.2 做了这款可在浏览器游玩的 demo：乘船穿过 8 个梦幻世界，并附可玩链接与媒体。

### 候选 2. Character House（桌面伴侣 / 收集养成）

- 玩法一句话：挂在桌面上的收集/养成向「角色小屋」idle companion，Steam Next Fest 热门 demo。
- 为什么火：开发者求助帖转发近 900、点赞 1570；后续又发帖称进入 Most Played Game Demos 第 1，并有致谢帖。X 与 Steam 两侧都有信号。
- 做成网页 demo 的建议：适合做成轻量网页挂机收集：桌面宠物/小屋布置、掉落收集、简单养成。避免使用原作角色与名称，可改成夜市摊位宠物或公园小屋。

代表帖：

- **https://x.com/CharacterHouse1/status/2111879040613355835**
  - 作者：@CharacterHouse1（显示名 キャラ屋 / Character House / 캐릭터 하우스 /角色屋）
  - 发布时间：北京时间 2026-10-19 01:56:14（太平洋时间 2026-10-18 10:56:14 PDT；UTC 2026-10-18T17:56:14.000Z）
  - 公开指标：赞 1570，转发 880，回复 7，引用 20，书签 196，浏览 44975
  - 摘要：开发者在 Next Fest 当周求助：完全自发行、几乎没有其他宣发渠道，前两天愿望单对曝光很关键。

补充帖：

- **https://x.com/CharacterHouse1/status/2115335079224598995**
  - 作者：@CharacterHouse1（显示名 キャラ屋 / Character House / 캐릭터 하우스 /角色屋）
  - 发布时间：北京时间 2026-10-28 14:49:18（太平洋时间 2026-10-27 23:49:18 PDT；UTC 2026-10-28T06:49:18.000Z）
  - 公开指标：赞 533，转发 59，回复 5，引用 4，书签 12，浏览 7830
  - 摘要：官方致谢：demo 成为该届 Steam Next Fest 游玩数最高的 demo 之一。

- **https://x.com/CharacterHouse1/status/2112589238634184981**
  - 作者：@CharacterHouse1（显示名 キャラ屋 / Character House / 캐릭터 하우스 /角色屋）
  - 发布时间：北京时间 2026-10-21 00:58:19（太平洋时间 2026-10-20 09:58:19 PDT；UTC 2026-10-20T16:58:19.000Z）
  - 公开指标：赞 101，转发 10，回复 1，引用 1，书签 4，浏览 1637
  - 摘要：官方称首次参加 Next Fest，已是 Most Played Game Demos 第 1。

### 候选 3. Landfill Bitcoin Drive（垃圾场找比特币硬盘）

- 玩法一句话：在垃圾填埋场里翻找丢失的比特币硬盘，玩法明显呼应「草堆找针」。
- 为什么火：原帖近千赞、约 17 万浏览；被引用后出现 6457 赞的评论帖，说明「找东西模拟器」梗在找针爆款后仍有传播力。
- 做成网页 demo 的建议：非常适合网页 demo：拨开垃圾、升级工具、运气与增量。务必做成完全原创主题与资源（不要用比特币品牌或原作画面），可改成「在旧货仓库找一张过期门票」等。

代表帖：

- **https://x.com/7paiden/status/2091935998775034117**
  - 作者：@7paiden（显示名 Paiden）
  - 发布时间：北京时间 2026-08-25 01:09:43（太平洋时间 2026-08-24 10:09:43 PDT；UTC 2026-08-24T17:09:43.000Z）
  - 公开指标：赞 964，转发 54，回复 79，引用 46，书签 85，浏览 171820
  - 摘要：作者说正在做一款在垃圾填埋场寻找比特币硬盘的游戏，仍在开发中，并附约 16 秒视频。

补充帖：

- **https://x.com/KriasDev/status/2092353276788232506**
  - 作者：@KriasDev（显示名 Krias）
  - 发布时间：北京时间 2026-08-26 04:47:49（太平洋时间 2026-08-25 13:47:49 PDT；UTC 2026-08-25T20:47:49.000Z）
  - 公开指标：赞 6457，转发 208，回复 35，引用 1，书签 50，浏览 64083
  - 摘要：引用上述硬盘帖并吐槽：「找针」「找硬盘」让「懒惰的游戏开发者重新发明了 Where's Waldo」。此为评论帖，不是游戏官方宣布。

### 候选 4. Gilt & Gutter

- 玩法一句话：同样由 @kevin_t_ngo 发布的浏览器可玩 1v1 第一人称射击 demo，有两个可操作角色。
- 为什么火：与乘船 demo 同一作者、同一天发布，浏览约 9.7 万、点赞 310，说明「AI 生成、浏览器即开即玩」本身就能带来可观曝光。
- 做成网页 demo 的建议：完整 FPS 对网页小游戏偏重。若要做，建议做成极简 1v1 竞技场或两角色不对称对战的低面数演示，控制在纯 HTML/JS、短局。

代表帖：

- **https://x.com/kevin_t_ngo/status/2119900487688622171**
  - 作者：@kevin_t_ngo（显示名 Kevin Ngo）
  - 发布时间：北京时间 2026-11-10 05:10:36（太平洋时间 2026-11-09 13:10:36 PST；UTC 2026-11-09T21:10:36.000Z）
  - 公开指标：赞 310，转发 11，回复 34，引用 8，书签 165，浏览 96561
  - 摘要：作者称 Claude Fable 5.2 做了浏览器可玩的 Gilt & Gutter：1v1 FPS，两个可玩角色。

### 候选 5. Mimes Control Reality（哑剧操纵现实）

- 玩法一句话：作者一句话宣布：做了一款由哑剧演员操纵现实的游戏。
- 为什么火：「I made a game where …」句式在找针爆款后出现大量仿写，这条是同句式里互动相对突出的原创宣布（266 赞）。
- 做成网页 demo 的建议：题材适合做成短关卡解谜或物理沙盒：用「假装」动作改变场景规则（拉看不见的绳子、走进画里的门）。建议先看原视频再决定机制，避免只剩一句话梗。

代表帖：

- **https://x.com/ArfhisTheWizard/status/2095149403803996579**
  - 作者：@ArfhisTheWizard（显示名 Arfhis 💀 Necrowave）
  - 发布时间：北京时间 2026-09-02 21:58:38（太平洋时间 2026-09-02 06:58:38 PDT；UTC 2026-09-02T13:58:38.000Z）
  - 公开指标：赞 266，转发 12，回复 3，引用 0，书签 70，浏览 4136
  - 摘要：作者宣布：I made a game where mimes control reality，并附媒体。

### 候选 6. Dumpster Gang

- 玩法一句话：1–4 人浣熊合作沙盒：翻垃圾、搞小破坏、躲开灭虫员/驱赶员，12 月 3 日发售，Next Fest 有免费 demo。
- 为什么火：多次出现在 Next Fest 热门名单（与 Worst Class Ever、Fart Together 并列）；官方与发行商有宣布帖，但 X 单帖互动一般，热度更偏 Steam。
- 做成网页 demo 的建议：完整 3D 沙盒对网页偏重。可做成俯视或侧视的短时「翻垃圾桶闯关」：限时搜刮、躲避巡逻、本地双人捣乱。不要使用原作名称与角色。

代表帖：

- **https://x.com/DumpsterGangHQ/status/2113314446902767622**
  - 作者：@DumpsterGangHQ（显示名 Dumpster Gang）
  - 发布时间：北京时间 2026-10-23 01:00:02（太平洋时间 2026-10-22 10:00:02 PDT；UTC 2026-10-22T17:00:02.000Z）
  - 公开指标：赞 30，转发 3，回复 2，引用 1，书签 6，浏览 1995
  - 摘要：官方邀请试玩 Steam 与 Xbox on PC 免费 demo，并附链接。

补充帖：

- **https://x.com/DumpsterGangHQ/status/2112167372584898747**
  - 作者：@DumpsterGangHQ（显示名 Dumpster Gang）
  - 发布时间：北京时间 2026-10-19 21:01:58（太平洋时间 2026-10-19 06:01:58 PDT；UTC 2026-10-19T13:01:58.000Z）
  - 公开指标：赞 13，转发 3，回复 1，引用 4，书签 0，浏览 2615
  - 摘要：官方宣布 Next Fest 免费 demo 上线：最多 4 人当浣熊、犯点小罪、甩掉驱赶员。

- **https://x.com/curvegames/status/2112168618393833771**
  - 作者：@curvegames（显示名 Curve Games）
  - 发布时间：北京时间 2026-10-19 21:06:55（太平洋时间 2026-10-19 06:06:55 PDT；UTC 2026-10-19T13:06:55.000Z）
  - 公开指标：赞 17，转发 7，回复 4，引用 0，书签 1，浏览 1776
  - 摘要：发行商 Curve Games 引用官帖，宣布 demo 已上线。

- **https://x.com/InvenGlobal/status/2112218707195757031**
  - 作者：@InvenGlobal（显示名 Inven Global）
  - 发布时间：北京时间 2026-10-20 00:25:57（太平洋时间 2026-10-19 09:25:57 PDT；UTC 2026-10-19T16:25:57.000Z）
  - 公开指标：赞 0，转发 0，回复 0，引用 0，书签 0，浏览 311
  - 摘要：Inven Global：Curve Games 与 Coyote House Games 确认 12 月 3 日登录 PC/Xbox，首日进 PC Game Pass，Steam 免费 demo 已上线。

### 候选 7. Dude, Trust Me

- 玩法一句话：三人合作解谜：一人看不见、一人听不见、一人不能说话，谁都没有完整信息。
- 为什么火：机制非常适合「和朋友一起玩」的短视频与直播；出现在 Steam「TRENDING FREE」榜讨论中。单帖 X 互动不高，卖点是玩法独特。
- 做成网页 demo 的建议：非常适合网页：本地三人（或两人对 AI）沟通不对称解谜，一关 3–5 分钟。不要使用原作关卡与名称。开发者在更早的 Next Fest 帖中被提及为 @sefikstudios，本次未再单独拉取其时间线。

代表帖：

- **https://x.com/TimothyJooste/status/2118465999368339456**
  - 作者：@TimothyJooste（显示名 TimothyJ）
  - 发布时间：北京时间 2026-11-06 06:10:28（太平洋时间 2026-11-05 14:10:28 PST；UTC 2026-11-05T22:10:28.000Z）
  - 公开指标：赞 78，转发 19，回复 11，引用 7，书签 4，浏览 4998
  - 摘要：祝贺 Steam「TRENDING FREE」前 10，名单第 7 位为 Dude, Trust Me。这是榜单帖，不是游戏官方宣布。

补充帖：

- **https://x.com/gamingdebugged/status/2118719805742006783**
  - 作者：@gamingdebugged（显示名 Gaming Debugged）
  - 发布时间：北京时间 2026-11-06 22:59:00（太平洋时间 2026-11-06 06:59:00 PST；UTC 2026-11-06T14:59:00.000Z）
  - 公开指标：赞 1，转发 0，回复 0，引用 0，书签 0，浏览 42
  - 摘要：玩法说明：3 人合作解谜，分别盲、聋、哑，谁都没有完整答案，demo 已上线。

### 候选 8. Meltdown Crew

- 玩法一句话：最多 6 人在线合作操作核反应堆，别让它熔毁。
- 为什么火：在 TableHopGG 的 Next Fest 派对榜上多次排在 Fart Together / Worst Class Ever 附近（第 2–3），说明 demo 同场热度不低；但本次检索几乎没有高互动专帖，X 证据弱于 Steam 场次热度。
- 做成网页 demo 的建议：适合做成网页多人（或单人多职责切换）的慌乱操作模拟：仪表、冷却、灭火、沟通。可用本地热座或简单房间码。不要使用原作名称。

代表帖：

- **https://x.com/TableHopGG/status/2113768317660045799**
  - 作者：@TableHopGG（显示名 TableHop）
  - 发布时间：北京时间 2026-10-24 07:03:33（太平洋时间 2026-10-23 16:03:33 PDT；UTC 2026-10-23T23:03:33.000Z）
  - 公开指标：赞 0，转发 0，回复 1，引用 0，书签 0，浏览 49
  - 摘要：Next Fest 派对榜第 5 天：Fart Together 以 3,429 人居首，Meltdown Crew 排第 2。该帖自身互动为 0，价值在于同场排名记录。

补充帖：

- **https://x.com/ninasgameshelf/status/2118828077417734379**
  - 作者：@ninasgameshelf（显示名 Nina's Game Shelf）
  - 发布时间：北京时间 2026-11-07 06:09:14（太平洋时间 2026-11-06 14:09:14 PST；UTC 2026-11-06T22:09:14.000Z）
  - 公开指标：赞 0，转发 0，回复 0，引用 0，书签 0，浏览 18
  - 摘要：介绍：最多 6 人在线合作管核反应堆，Steam 有免费 demo。互动为 0。

- **https://x.com/TableHopGG/status/2114112406289092644**
  - 作者：@TableHopGG（显示名 TableHop）
  - 发布时间：北京时间 2026-10-25 05:50:50（太平洋时间 2026-10-24 14:50:50 PDT；UTC 2026-10-24T21:50:50.000Z）
  - 公开指标：赞 0，转发 0，回复 1，引用 0，书签 0，浏览 54
  - 摘要：第 6 天派对榜 Meltdown Crew 仍排第 3。

### 候选 9. Haunted Paws

- 玩法一句话：两只可自定义的小狗潜入鬼屋，救出被绑走的主人，合作解谜，demo 已上线。
- 为什么火：Next Fest 推荐名单中多次出现，之后仍有不少直播预告；X 单帖互动中等偏低，可爱合作题材对网页 demo 友好。
- 做成网页 demo 的建议：可做成短关卡双人解谜：一只负责闻线索、一只负责够高处，本地分键盘。不要使用原作角色。开发商在介绍帖中被写为 @lazyflockstudio。

代表帖：

- **https://x.com/CerbiBites/status/2118052156334895444**
  - 作者：@CerbiBites（显示名 Cerbi🐾⛓ 🦴🥩）
  - 发布时间：北京时间 2026-11-05 02:46:00（太平洋时间 2026-11-04 10:46:00 PST；UTC 2026-11-04T18:46:00.000Z）
  - 公开指标：赞 26，转发 7，回复 2，引用 1，书签 4，浏览 680
  - 摘要：主播日程预告周五与搭档玩 Haunted Paws Demo。这是直播预告，不是官方宣布。

补充帖：

- **https://x.com/parmuzin1992/status/2118321957980483641**
  - 作者：@parmuzin1992（显示名 Parmuzin | Second Tail (free demo)）
  - 发布时间：北京时间 2026-11-05 20:38:05（太平洋时间 2026-11-05 04:38:05 PST；UTC 2026-11-05T12:38:05.000Z）
  - 公开指标：赞 0，转发 0，回复 2，引用 0，书签 0，浏览 71
  - 摘要：玩法摘要：两只小狗救主人；挖、闻、叫来解谜；可把小狗做成自己家的狗；合作时好友可免费加入。写明由 @lazyflockstudio 开发，demo 已出。

### 候选 10. Find The Needle（Steam 工厂/自动化版）

- 玩法一句话：在仓库里从海量稻草中找针，并从手工翻找升级到传送带、机器人与扫描仪的自动化。
- 为什么火：直接承接 8 月找针爆款，进入十月 Next Fest 热门 demo 名单（Valve 20 款最常玩 demo 列表中被点名），说明该梗已产品化。与仓库已有的 01 号玩法近，补做需换主题。
- 做成网页 demo 的建议：若再做，不要再做「找针」。可借鉴「从手工劳动升级到自动化产线」的增量结构，换成完全不同的目标物。开发者账号为 @haydeveloper。

代表帖：

- **https://x.com/ChiclanaFriends/status/2114710363921076409**
  - 作者：@ChiclanaFriends（显示名 Chiclana & Friends）
  - 发布时间：北京时间 2026-10-26 21:26:54（太平洋时间 2026-10-26 06:26:54 PDT；UTC 2026-10-26T13:26:54.000Z）
  - 公开指标：赞 61，转发 5，回复 2，引用 0，书签 25，浏览 7056
  - 摘要：转述 Valve 分享的该届 Steam Next Fest 20 款最常玩 demo（无具体排序），名单包括 Find the Needle，以及 Worst Class Ever、Probably Stolen、Fart Together、Character House、Frostrail、Loftia、Just Volleyball 等。

补充帖：

- **https://x.com/haydeveloper/status/2112234975634366911**
  - 作者：@haydeveloper（显示名 Hay Developer）
  - 发布时间：北京时间 2026-10-20 01:30:36（太平洋时间 2026-10-19 10:30:36 PDT；UTC 2026-10-19T17:30:36.000Z）
  - 公开指标：赞 9，转发 2，回复 0，引用 0，书签 2，浏览 674
  - 摘要：开发者宣布 Find The Needle 正式参加 Steam Next Fest。

- **https://x.com/shortcredits/status/2102966776791216490**
  - 作者：@shortcredits（显示名 SHORT CREDITS）
  - 发布时间：北京时间 2026-09-24 11:42:05（太平洋时间 2026-09-23 20:42:05 PDT；UTC 2026-09-24T03:42:05.000Z）
  - 公开指标：赞 1，转发 0，回复 0，引用 0，书签 0，浏览 53
  - 摘要：介绍玩法：先在仓库里手工翻草堆，再卖草资助传送带、机器人和扫描仪实现自动化；并指向 @haydeveloper。

## 3. 调研方法、搜索词与局限

### 抓取时间

北京时间 2026-11-11 10:13:42（太平洋时间 2026-11-10 18:13:42 PST，UTC 2026-11-11T02:13:42Z）。帖子发布时间由 `created_at`（UTC）转换：北京时间固定 UTC+8；太平洋时间按 `America/Los_Angeles`（2026-11-01 夏令时结束后为 PST/UTC-8，此前为 PDT/UTC-7）。

### 工具与用量

- 命名空间：`x`（`search_posts_all`、`get_posts_by_id`、`get_users_by_username` / `get_users_by_usernames`、`get_users_posts`）
- 请求字段：`created_at`、`public_metrics`、`author_id`、`lang`、`conversation_id`、`text`；用户 `username`、`name`、`verified`；扩展 `author_id`
- 每次最多 25 条；检索多用 `sort_order=relevancy`，并加 `-is:retweet`，窗口多数从 2026-08-01 或 2026-08-11 起（Bullet Heaven 标签事件提前到 2026-05-01；Scritchy Scratchy 提前到 2026-06-01）
- 本次约 40 次调用，远低于约 150 次的自控上限

### 使用的搜索词与读取

- `原帖 get_posts_by_id: 2091156855774974333`
- `比特币硬盘帖 get_posts_by_id: 2091935998775034117`
- `("needle in a haystack" OR "needle in 5 million" OR "find a needle") (game OR hay) -is:retweet lang:en`
- `("Needle In A Haystack" OR NasNakarus OR "needle in a haystack") (game OR Steam OR playtest) -is:retweet  [曾加 min_likes:50，API 已剥离该运算符]`
- `("Moon Sweepers" OR Moonsweepers OR "leaf sweeper") (game OR demo OR Steam) -is:retweet`
- `("Moon Sweepers" OR #MoonSweepers) (... concurrent OR CCU OR players OR sold OR launch) -is:retweet`
- `("Probably Stolen" OR "probablystolen") (game OR demo OR Steam OR shopkeeper) -is:retweet`
- `"Worst Class Ever" (game OR demo OR Steam) -is:retweet`
- `("Scam With Your Friends" OR "Scam w/ Your Friends") -is:retweet`
- `("Scam With Your Friends" OR #ScamWithYourFriends) (Steam OR demo OR launch OR players OR CCU OR official) -is:retweet`
- `(Mechabellum OR "mech auto-battler" OR "mech autobattler") (game OR Steam OR demo) -is:retweet`
- `(friendslop OR "Peak game" OR "PEAK co-op") (climb OR climbing OR mountain OR co-op OR coop) -is:retweet  [首轮噪声大，多为口语 peak co-op]`
- `(PEAK) (Landfall OR AggroCrab OR "Aggro Crab" OR friendslop OR "climbing game" OR "co-op climb") -is:retweet`
- `("scratch-off" OR "scratch card" OR "scratch ticket" OR scratchoff) (idle OR incremental OR tycoon OR game) ...`
- `("scratch tycoon" OR "Scratch Incremental" OR "idle scratch" OR "Lucky Scratch") ...`
- `"Scritchy Scratchy" OR "ScritchyScratchy" OR scritchyscratchy -is:retweet`
- `("Fart Together" OR "fart raft" OR (hippo (fart OR pups OR raft) (game OR demo OR Steam))) -is:retweet`
- `(volleyball) (demo OR "Next Fest" OR arcade OR indie) (Steam OR game) -is:retweet`
- `"bullet heaven" (Steam OR game OR tag OR genre OR like) -is:retweet`
- `(Balatro OR "balatro-like" OR "dice roguelike" OR "roguelike deckbuilder") ...  [曾加 min_likes:20，已被剥离]`
- `Balatro (like OR clone OR roguelike OR deckbuilder OR sequel OR "Balatro 2") -is:retweet -is:reply`
- `("I made a game" OR "browser game" OR minigame ...) -is:retweet  [曾加 min_likes:500，已被剥离]`
- `"I made a game where" -is:retweet -is:reply lang:en`
- `"Dumpster Gang" (game OR demo OR Steam OR Roblox) -is:retweet`
- `("Character House" OR Frostrail OR "Meltdown Crew" OR Loftia OR "Find the Needle") (demo OR Steam OR "Next Fest" OR game) -is:retweet`
- `("Meltdown Crew" OR "Haunted Paws" OR "Dude, Trust Me") (game OR demo OR Steam OR Next) -is:retweet`
- `("play in your browser" OR "playable in the browser" OR "browser demo" OR "vibe coded game" OR vibecoded) -is:retweet lang:en`
- `账号解析与时间线: NasNakarus, temkosoft, Yomi_Funcore, gamesmrkt, Probably_Stolen, LandfallGames, mechabellum, Pirat_Nation, Moon_Sweepers；AggroCrab 用户名未找到`

### 局限

1. 本 API 不支持 min_likes / min_reposts 等互动过滤，查询里的这些运算符会被剥离，结果不能按赞数预筛。
2. search_posts_all 的 relevancy 仍会返回大量低互动或跑题帖；高互动帖往往要靠已知 ID 或官方账号时间线才能稳定拿到。
3. 每调用最多取 25 条，多数检索未翻完 pagination，不是全量普查。
4. 首轮用「peak co-op」搜索 PEAK，结果几乎全是口语「巅峰合作体验」，与游戏无关。
5. 用户名 AggroCrab 未找到；Moon Sweepers 官方账号粉丝很少，X 热度远低于其 Steam 同接。
6. 部分销量、同接数字来自第三方资讯账号，已单独标注，不能当成官方核定数。
7. 未观看帖内视频，文本摘要只依据帖子正文。
8. 浏览器游戏检索里有大量低质回复广告（例如 Feeding the Foxes 刷回复），已排除出候选。
9. X 讨论热度不等于 Steam/Discord 热度：若干对应原作在 Steam 很热，但 X 上只有低赞讨论。

## 给后续补游戏时的简要建议

1. 若只补 1–2 个网页 demo，优先考虑候选 1（浏览器梦幻乘船）和候选 2（桌面收集养成）：一个已经是网页可玩，一个在 Next Fest 与 X 上都有信号。
2. 候选 3（垃圾场找硬盘）和候选 10（工厂版找针）与现有 01 号过于接近，不建议再做「找东西」除非彻底换主题。
3. 候选 7（Dude, Trust Me 式信息不对称合作）和候选 8（反应堆慌乱操作）机制独特，适合本地多人网页，但本次 X 代表帖互动不强，不要在介绍里写成「X 爆款」。
4. 更新 README 时，01 号原帖现在可以写上已核实的公开指标；其他条目仍应区分「X 热度」和「Steam/Discord 热度」。
