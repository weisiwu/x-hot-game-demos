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
        '07': '07-pocket-volley', '08': '08-bullet-heaven', '09': '09-dice-roguelike', '10': '10-scam-buster-hotline', '11': '11-stamina-summit', '12': '12-mech-autobattler',
        '13': '13-dream-drift', '14': '14-fluff-house', '15': '15-reactor-night-shift'}
# 名称 → (输出文件名, 输出尺寸, webp 质量)
def target(name):
    g, rest = name.split('-', 1); rest = rest.replace('-v2', '')
    if rest == 'cover': return DIRS[g], 'cover.webp', (960, 640), 80
    if rest.startswith(('cust-', 'caller-')): return DIRS[g], rest + '.webp', (256, 256), 80
    if rest.startswith('mech-'): return DIRS[g], rest + '.webp', (192, 192), 82
    if g == '13' and rest.startswith('w'): return DIRS[g], rest + '.webp', (900, 600), 76
    if g == '14' and rest.startswith('c') and rest[1:].isdigit(): return DIRS[g], rest + '.webp', (256, 256), 85
    if rest == 'room': return DIRS[g], 'room.webp', (900, 600), 76
    sizes = {'ground': (900, 600), 'lawn': (900, 600), 'grass': (512, 512), 'beach': (880, 587), 'arena': (512, 512), 'felt': (1200, 800),
             'cliff': (600, 900), 'deck': (900, 600), 'floor': (900, 600), 'backdrop': (1280, 853)}
    return DIRS[g], rest + '.webp', sizes[rest], 72 if rest == 'backdrop' else 78

def fit_crop(im, size):
    w, h = im.size; tw, th = size
    s = max(tw / w, th / h); im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    l, t = (im.width - tw) // 2, (im.height - th) // 2
    return im.crop((l, t, l + tw, t + th))

def chroma_key(im):
    """把纯绿背景抠成透明（毛球角色用）：只从图片边缘开始，泛洪填充与边缘连通的“纯绿”像素，
    这样角色身上偏绿的毛（如薄荷色）不会被误抠；再对背景边缘一圈做羽化和去绿边，最后裁到角色外框补成正方形。"""
    import numpy as np
    from collections import deque
    a = np.asarray(im.convert('RGB')).astype(np.int16); h, w, _ = a.shape
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    corners = np.array([a[2, 2], a[2, w - 3], a[h - 3, 2], a[h - 3, w - 3]])
    key = np.median(corners, axis=0)                      # 背景色（纯绿或纯品红）取四角中位数
    dist = np.abs(a - key).sum(axis=2)
    cand = dist < 150
    green = np.clip(150 - dist, 0, 150)                   # 越接近背景色，“溢色”越强
    bgm = np.zeros((h, w), bool); q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if cand[y, x] and not bgm[y, x]: bgm[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if cand[y, x] and not bgm[y, x]: bgm[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not bgm[ny, nx] and cand[ny, nx]: bgm[ny, nx] = True; q.append((ny, nx))
    alpha = np.where(bgm, 0, 255).astype(np.int16)
    # 边缘：与背景相邻的前景像素按绿色程度做半透明并去绿边
    edge = np.zeros_like(bgm)
    edge[1:, :] |= bgm[:-1, :]; edge[:-1, :] |= bgm[1:, :]; edge[:, 1:] |= bgm[:, :-1]; edge[:, :-1] |= bgm[:, 1:]
    edge &= ~bgm
    soft = edge & (green > 20)
    alpha[soft] = np.clip(255 - (green[soft] - 20) * 3, 60, 255)
    # 去色溢：边缘像素里属于背景色的主通道压下来
    out = a.copy()
    if key[1] > key[0] and key[1] > key[2]:  # 绿幕
        out[..., 1][edge] = np.minimum(g[edge], np.maximum(r[edge], b[edge]) + 8)
    else:                                    # 品红幕
        lo = g[edge] + 8; out[..., 0][edge] = np.minimum(r[edge], np.maximum(lo, 0)); out[..., 2][edge] = np.minimum(b[edge], np.maximum(lo, 0))
    out = np.dstack([out, alpha]).astype(np.uint8)
    im = Image.fromarray(out, 'RGBA')
    box = im.getbbox() or (0, 0, w, h)
    im = im.crop(box); side = max(im.size) + 16
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0)); canvas.paste(im, ((side - im.width) // 2, side - im.height - 8), im)
    return canvas

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
        if name.startswith('14-c') and name[4:].split('-')[0].isdigit():
            im = chroma_key(Image.open(raw).convert('RGB')).resize(size, Image.LANCZOS)
        else:
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
