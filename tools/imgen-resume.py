#!/usr/bin/env python3
"""续跑 imgen 批次：jianxian/scripts/art/imgen-gen.py 遇到网络读超时会整体退出，
这里只把还没下载到 PNG 的任务写成新的 spec（<原名>-rN.json）再交给原脚本执行，最多 N 轮。
用法：python3 tools/imgen-resume.py art/specs/batch-x.json [最多轮数]
不读取、不打印任何登录凭据（登录由原脚本完成，只输出状态码）。
"""
import json, subprocess, sys
from pathlib import Path

GEN = '/workspace/jianxian/scripts/art/imgen-gen.py'
spec_path = Path(sys.argv[1]).resolve(); rounds = int(sys.argv[2]) if len(sys.argv) > 2 else 4
spec = json.loads(spec_path.read_text())
out = Path(spec['out_dir'])
start_r = 2
while spec_path.with_name(f'{spec_path.stem}-r{start_r}.json').exists(): start_r += 1  # 不覆盖之前轮次的记录
for r in range(start_r, start_r + rounds):
    todo = [j for j in spec['jobs'] if not (out / (j['name'] + '.png')).exists()]
    if not todo:
        print('全部完成'); break
    rs = spec_path.with_name(f'{spec_path.stem}-r{r}.json')
    rs.write_text(json.dumps({**spec, 'jobs': todo}, ensure_ascii=False, indent=1))
    print(f'第 {r} 轮：剩余 {len(todo)} 张 -> {rs.name}', flush=True)
    subprocess.run(['python3', '-u', GEN, str(rs)], cwd=str(spec_path.parent))
else:
    left = [j['name'] for j in spec['jobs'] if not (out / (j['name'] + '.png')).exists()]
    print('仍未完成：', left)
