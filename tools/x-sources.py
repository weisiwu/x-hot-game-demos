#!/usr/bin/env python3
"""把 X 调研资料（由 Kai 用 X 公开读取工具抓取的 JSON）渲染成 README / 目录页用的来源段落。
所有数字、链接、时间都原样取自 JSON，不做任何推算或补写。
用法：python3 tools/x-sources.py <research.json>   → 更新各游戏 README 的「灵感来源」与根 README 的 X 佐证表、目录页的卡片说明
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads(Path(sys.argv[1] if len(sys.argv) > 1 else '/workspace/reports/x-hot-games-research.json').read_text())
FETCHED = f"北京时间 {DATA['meta']['fetched_at_beijing']}（太平洋时间 {DATA['meta']['fetched_at_pacific']}）"
LEVEL = {'strong': '强', 'moderate': '中', 'weak': '弱'}
DIRS = {'01': '01-haystack-needle', '02': '02-leaf-sweepers', '03': '03-night-market-pawn', '04': '04-scratch-tycoon', '05': '05-class-clown', '06': '06-soda-raft',
        '07': '07-pocket-volley', '08': '08-bullet-heaven', '09': '09-dice-roguelike', '10': '10-scam-buster-hotline', '11': '11-stamina-summit', '12': '12-mech-autobattler'}
# 新增游戏对应的候选（按 JSON 中的 rank）
NEW = {'13': ('13-dream-drift', 1), '14': ('14-fluff-house', 2), '15': ('15-reactor-night-shift', 8)}

fmt = lambda n: f'{n:,}'

def metrics(p):
    m = p['public_metrics']
    return f"赞 {fmt(m['likes'])} · 转发 {fmt(m['reposts'])} · 回复 {fmt(m['replies'])} · 引用 {fmt(m['quotes'])} · 书签 {fmt(m['bookmarks'])} · 浏览 {fmt(m['impressions'])}"

def post_md(p):
    s = f"- [{p['url'].replace('https://', '')}]({p['url']})\n  - 作者 @{p['author_handle']}（{p['author_display_name']}），发布于北京时间 {p['created_at_beijing']}\n  - 抓取时公开指标：{metrics(p)}\n  - 摘要：{p['text_summary']}"
    if p.get('note'): s += f"\n  - 备注：{p['note']}"
    return s

def top(posts):
    return sorted(posts, key=lambda p: (p['public_metrics']['likes'], p['public_metrics']['impressions']), reverse=True)[0]

def game_section(g):
    return (f"## 灵感来源（X 原帖）\n\n数据由 Kai 使用 X 公开读取工具抓取，抓取时间：{FETCHED}。指标为抓取那一刻的公开数据，之后会变化。"
            f"第三方资讯账号帖子里的销量 / 同时在线等数字只代表该帖原文说法，不是官方或审计数据。\n\n"
            f"- 对应灵感：{g['inspiration']}\n- X 佐证强度：**{LEVEL[g['evidence_level']]}**\n- 结论：{g['verdict']}\n\n" + '\n'.join(post_md(p) for p in g['posts']) + '\n')

def cand_section(c):
    posts = [c['representative_post']] + c.get('extra_posts', [])
    return (f"## 灵感来源（X 原帖）\n\n数据由 Kai 使用 X 公开读取工具抓取，抓取时间：{FETCHED}。指标为抓取那一刻的公开数据。\n\n"
            f"- 对应候选：#{c['rank']} {c['name']}\n- 玩法一句话（资料原文）：{c['one_liner']}\n- 为什么入选（资料原文）：{c['why_hot']}\n\n" + '\n'.join(post_md(p) for p in posts) + '\n')

def update_game_readme(path, section):
    s = path.read_text()
    # 旧版的「对应的热门趋势」保留为「公开报道」小节；已存在的 X 小节整体替换
    s = re.sub(r'## 灵感来源（X 原帖）\n.*?(?=\n## )', '', s, flags=re.S)
    if '## 对应的热门趋势' in s:
        s = s.replace('## 对应的热门趋势', section + '\n## 其他公开报道（第一轮调研）')
    elif '## 其他公开报道（第一轮调研）' in s:
        s = s.replace('## 其他公开报道（第一轮调研）', section + '\n## 其他公开报道（第一轮调研）')
    else:
        s = s.replace('## 原创说明', section + '\n## 原创说明')
    path.write_text(s)

def main():
    games = {g['id']: g for g in DATA['existing_games']}
    cands = {c['rank']: c for c in DATA['new_candidates']}
    for gid, d in DIRS.items():
        p = ROOT / 'demos' / d / 'README.md'
        if p.exists(): update_game_readme(p, game_section(games[gid]))
    for gid, (d, rank) in NEW.items():
        p = ROOT / 'demos' / d / 'README.md'
        if p.exists(): update_game_readme(p, cand_section(cands[rank]))
    # 根 README 用的佐证总表
    rows = ['| # | 游戏 | X 佐证强度 | 互动最高的相关帖（抓取时） | 结论（资料原文） |', '|---|---|---|---|---|']
    for gid, d in DIRS.items():
        g = games[gid]; t = top(g['posts']); m = t['public_metrics']
        rows.append(f"| {gid} | [{g['demo_name']}](demos/{d}/) | {LEVEL[g['evidence_level']]} | [@{t['author_handle']}]({t['url']})：赞 {fmt(m['likes'])} / 转发 {fmt(m['reposts'])} / 浏览 {fmt(m['impressions'])} | {g['verdict']} |")
    for gid, (d, rank) in NEW.items():
        c = cands[rank]; t = top([c['representative_post']] + c.get('extra_posts', [])); m = t['public_metrics']
        rows.append(f"| {gid} | [{d.split('-', 1)[1]}](demos/{d}/)（新增，对应候选 #{rank} {c['name']}） | 见说明 | [@{t['author_handle']}]({t['url']})：赞 {fmt(m['likes'])} / 转发 {fmt(m['reposts'])} / 浏览 {fmt(m['impressions'])} | {c['why_hot']} |")
    Path('/tmp/x-table.md').write_text('\n'.join(rows) + '\n')
    # 目录页卡片的一行说明
    cards = {}
    for gid, d in DIRS.items():
        g = games[gid]; t = top(g['posts']); m = t['public_metrics']
        cards[d] = f"X 佐证：{LEVEL[g['evidence_level']]} · @{t['author_handle']} 赞 {fmt(m['likes'])}（抓取于 {DATA['meta']['fetched_at_beijing'][:10]}）"
    for gid, (d, rank) in NEW.items():
        c = cands[rank]; t = c['representative_post']; m = t['public_metrics']
        cards[d] = f"X 候选 #{rank} · @{t['author_handle']} 赞 {fmt(m['likes'])}（抓取于 {DATA['meta']['fetched_at_beijing'][:10]}）"
    Path('/tmp/x-cards.json').write_text(json.dumps(cards, ensure_ascii=False, indent=1))
    print('ok')

if __name__ == '__main__':
    main()
