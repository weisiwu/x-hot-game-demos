#!/usr/bin/env python3
"""把 imgen 原图（PNG，保存在仓库外的 /tmp/xg-art/raw）压缩成游戏用的 webp，放进 assets/<游戏>/，
并生成 art/manifest.json 生成记录（prompt、尺寸、job 状态、输出路径、原图与输出的 sha256 / 字节数）。
用法：python3 tools/art-process.py [原图根目录]   （只处理已经下载成功、且通过人工筛选的图片）
不读取、不记录任何登录凭据。
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/xg-art/raw')
SPECS = ROOT / 'art' / 'specs'
REJECT = set((ROOT / 'art' / 'rejected.txt').read_text().split()) if (ROOT / 'art' / 'rejected.txt').exists() else set()

DIRS = {'01': '01-haystack-needle', '02': '02-leaf-sweepers', '03': '03-night-market-pawn', '04': '04-scratch-tycoon', '05': '05-class-clown', '06': '06-soda-raft',
        '07': '07-pocket-volley', '08': '08-bullet-heaven', '09': '09-dice-roguelike', '10': '10-scam-buster-hotline', '11': '11-stamina-summit', '12': '12-mech-autobattler'}
# 名称 → (输出文件名, 输出尺寸, webp 质量)
def target(name):
    g, rest = name.split('-', 1); rest = rest.replace('-v2', '')
    if rest == 'cover': return DIRS[g], 'cover.webp', (960, 640), 80
    if rest.startswith(('cust-', 'caller-')): return DIRS[g], rest + '.webp', (256, 256), 80
    if rest.startswith('mech-'): return DIRS[g], rest + '.webp', (192, 192), 82
    sizes = {'ground': (900, 600), 'lawn': (900, 600), 'grass': (512, 512), 'beach': (880, 587), 'arena': (512, 512), 'felt': (1200, 800),
             'cliff': (600, 900), 'deck': (900, 600), 'floor': (900, 600), 'backdrop': (1280, 853)}
    return DIRS[g], rest + '.webp', sizes[rest], 72 if rest == 'backdrop' else 78

def fit_crop(im, size):
    w, h = im.size; tw, th = size
    s = max(tw / w, th / h); im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    l, t = (im.width - tw) // 2, (im.height - th) // 2
    return im.crop((l, t, l + tw, t + th))

def main():
    jobs, order = {}, []
    for spec_file in sorted(SPECS.glob('*.json')):
        if spec_file.name.endswith('.results.json'): continue
        spec = json.loads(spec_file.read_text())
        res_file = Path(str(spec_file) + '.results.json')
        results = json.loads(res_file.read_text()) if res_file.exists() else {}
        for job in spec['jobs']:
            name = job['name']
            if name not in jobs:
                jobs[name] = {'name': name, 'batch': spec_file.stem.split('-r')[0] if '-r' in spec_file.stem[-3:] else spec_file.stem, 'prompt': job['prompt'], 'request_size': [job['w'], job['h']], 'attempts': [], 'out_dir': spec['out_dir']}
                order.append(name)
            for t in results.get(name, []):
                jobs[name]['attempts'].append({'spec': spec_file.name, 'job_id': t.get('job_id'), 'status': t.get('status'), 'attempt': t.get('attempt')})
    manifest = []
    for name in order:
        entry = jobs[name]; raw = Path(entry.pop('out_dir')) / (name + '.png')
        if not raw.exists():
            entry['result'] = 'missing (job not downloaded)'; manifest.append(entry); continue
        data = raw.read_bytes()
        entry['raw'] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
        if name in REJECT:
            entry['result'] = 'rejected in review (not used)'; manifest.append(entry); continue
        d, fname, size, q = target(name)
        out = ROOT / 'assets' / d / fname; out.parent.mkdir(parents=True, exist_ok=True)
        im = fit_crop(Image.open(raw).convert('RGB'), size)
        im.save(out, 'WEBP', quality=q, method=6)
        ob = out.read_bytes()
        entry['output'] = {'path': str(out.relative_to(ROOT)), 'size': list(size), 'bytes': len(ob), 'sha256': hashlib.sha256(ob).hexdigest()}
        entry['result'] = 'used'; manifest.append(entry)
        print(f"{name:24s} -> {entry['output']['path']}  {len(data) // 1024}KB -> {len(ob) // 1024}KB")
    (ROOT / 'art' / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1))
    print('used', sum(1 for m in manifest if m.get('result') == 'used'), 'of', len(manifest))

if __name__ == '__main__':
    main()
