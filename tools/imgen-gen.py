#!/usr/bin/env python3
"""imgen 出图封装（参考 jianxian/scripts/art/imgen-gen.py 的调用方式，未修改原脚本）。

用法：python3 tools/imgen-gen.py spec.json
spec: {"out_dir": "...", "ref": "可选参考图", "jobs": [{"name": "...", "prompt": "...", "w": 1024, "h": 1024}]}

- 登录密码只从环境变量 IMGEN_PASSWORD_FILE 指向的文件或 /tmp/imgen_app_password 读取，绝不打印、不写入任何文件。
- 结果写到 spec 旁的 spec.json.results.json（只含 job id、状态、输出路径、尺寸、字节数、sha256）。
- 找不到密码文件时直接退出（退出码 3），并只输出缺少的路径。
"""
import hashlib, http.cookiejar, json, os, struct, sys, time, urllib.error, urllib.request, uuid
from pathlib import Path

BASE = 'https://imgen.baoganai.com'
PW_FILE = Path(os.environ.get('IMGEN_PASSWORD_FILE') or '/tmp/imgen_app_password')


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    if not PW_FILE.is_file():
        print(f'imgen 不可用：找不到密码文件 {PW_FILE}（未尝试登录）')
        sys.exit(3)
    jar = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

    def call(m, p, data=None, h=None, raw=False):
        hh = {'Origin': BASE, 'User-Agent': 'x-hot-game-demos-art-client'}
        hh.update(h or {})
        try:
            with op.open(urllib.request.Request(BASE + p, data=data, headers=hh, method=m), timeout=120) as r:
                b = r.read()
                return r.status, (b if raw else (json.loads(b) if b else None))
        except urllib.error.HTTPError as e:
            b = e.read()
            try:
                b = json.loads(b)
            except Exception:
                b = b[:300].decode('utf8', 'replace')
            return e.code, b

    def jp(p, o):
        return call('POST', p, json.dumps(o).encode(), {'Content-Type': 'application/json'})

    spec_path = sys.argv[1]
    spec = json.load(open(spec_path))
    res = {}
    st, _ = jp('/api/login', {'password': PW_FILE.read_text().strip()})
    print('login', st)  # 只输出状态码
    if st not in (200, 204):
        res['login_status'] = st
        json.dump(res, open(spec_path + '.results.json', 'w'), ensure_ascii=False, indent=1)
        sys.exit('login failed')
    refid = None
    if spec.get('ref'):
        p = Path(spec['ref'])
        bd = 'XG' + uuid.uuid4().hex
        body = (f'--{bd}\r\nContent-Disposition: form-data; name="files"; filename="{p.name}"\r\nContent-Type: image/png\r\n\r\n'.encode() + p.read_bytes()
                + f'\r\n--{bd}\r\nContent-Disposition: form-data; name="tags"\r\n\r\n[]\r\n--{bd}\r\nContent-Disposition: form-data; name="metadata"\r\n\r\n[]\r\n--{bd}--\r\n'.encode())
        st, r = call('POST', '/api/references', body, {'Content-Type': 'multipart/form-data; boundary=' + bd})
        print('upload', st)
        refid = r['assets'][0]['id'] if isinstance(r, dict) and r.get('assets') else None
        res['ref_asset_id'] = refid
    out = Path(spec['out_dir'])
    out.mkdir(parents=True, exist_ok=True)

    def find(jid):
        for pg in (1, 2):
            st, g = call('GET', f'/api/jobs?page={pg}')
            for j in (g or {}).get('jobs', []) if isinstance(g, dict) else []:
                if j.get('id') == jid:
                    return j

    for job in spec['jobs']:
        for att in range(1, spec.get('retries', 2) + 1):
            body = {'kind': 'image', 'width': job['w'], 'height': job['h'], 'imageCount': 1, 'model': 'gpt-image-2', 'quality': 'high', 'presetIds': [], 'prompt': job['prompt']}
            if refid and not job.get('noref'):
                body['referenceAssetIds'] = [refid]
            st, j = jp('/api/jobs', body)
            while st == 429:
                time.sleep(15)
                st, j = jp('/api/jobs', body)
            if st >= 300:
                print('submit fail', st)
                res.setdefault(job['name'], []).append({'attempt': att, 'submit_status': st})
                continue
            jid = j['job']['id']
            t0 = time.time()
            g = {}
            while time.time() - t0 < 1500:
                g = find(jid) or {}
                if g.get('status') in ('completed', 'failed', 'error', 'cancelled'):
                    break
                time.sleep(10)
            print(job['name'], att, jid, g.get('status'))
            e = {'job_id': jid, 'status': g.get('status'), 'attempt': att, 'prompt': job['prompt'], 'w': job['w'], 'h': job['h']}
            res.setdefault(job['name'], []).append(e)
            if g.get('status') == 'completed':
                st, img = call('GET', f'/api/jobs/{jid}/images/0/download', raw=True)
                if st == 200 and img[:8] == b'\x89PNG\r\n\x1a\n':
                    f = out / (job['name'] + '.png')
                    f.write_bytes(img)
                    w, h = struct.unpack('>II', img[16:24])
                    e['download'] = {'path': str(f), 'size': [w, h], 'bytes': len(img), 'sha256': hashlib.sha256(img).hexdigest()}
                    break
            else:
                e['err'] = str(g.get('message'))[:200]
        json.dump(res, open(spec_path + '.results.json', 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
