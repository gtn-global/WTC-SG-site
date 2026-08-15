import os, re
from PIL import Image

ROOT = '.'

# ===== 1) 计算冗余删除清单 =====
# 主用格式（由 HTML 内联脚本 exts 顺序决定）：
#   grid/      : ['jpg','png']  -> 主用 jpg
#   waterfall/ : ['jpg','png']  -> 主用 jpg
#   wtc-buildings/: ['jpg','png'] -> 主用 jpg
#   logo/      : ['svg','png','jpg',...] -> logo1~9 主用 svg；logo10~18 主用 png
# GRID 只引用 logo1~logo18

remove = set()
# grid 冗余 png（仅 grid6 有 png）
for n in range(1, 10):
    remove.add(f'grid/grid{n}.png')  # grid6.png 存在，其余不存在也无妨
# waterfall 冗余 png（wtca03/09 有 png）
for n in [3, 9]:
    remove.add(f'waterfall/wtca{n}.png')
# logo 冗余
for n in range(1, 10):           # logo1~9 有 svg -> 删 jpg+png
    remove.add(f'logo/logo{n}.jpg')
    remove.add(f'logo/logo{n}.png')
for n in range(10, 19):          # logo10~18 无 svg，主用 png -> 删 jpg
    remove.add(f'logo/logo{n}.jpg')
# logo19 完全未被引用 -> 全删
remove.add('logo/logo19.jpg')
remove.add('logo/logo19.png')

remove = {os.path.normpath(p) for p in remove}

# ===== 2) 压缩保留的图片 =====
def compress(p):
    try:
        if p.lower().endswith('.jpg') or p.lower().endswith('.jpeg'):
            im = Image.open(p).convert('RGB')
            im.save(p, 'JPEG', quality=82, optimize=True, progressive=True)
        elif p.lower().endswith('.png'):
            im = Image.open(p)
            im.save(p, 'PNG', optimize=True)
        return True
    except Exception as e:
        print('  COMPRESS FAIL', p, e)
        return False

kept = []
for dirpath, _, files in os.walk('.'):
    if '.git' in dirpath: continue
    for fn in files:
        if fn.lower().endswith(('.jpg','.jpeg','.png')):
            full = os.path.normpath(os.path.join(dirpath, fn))
            rel = full.replace('.\\', '').replace('./', '')
            if rel in remove:
                continue
            kept.append(rel)

print('=== 将压缩(保留)的图片数:', len(kept))
before_total = 0
for rel in kept:
    before_total += os.path.getsize(rel)
for rel in kept:
    compress(rel)
after_total = sum(os.path.getsize(rel) for rel in kept)
print(f'=== 压缩前总大小 {before_total/1024:.1f} KB -> 压缩后 {after_total/1024:.1f} KB')

# ===== 3) 删除冗余 =====
print('=== 删除冗余副本 ===')
for rel in sorted(remove):
    if os.path.exists(rel):
        sz = os.path.getsize(rel)
        os.remove(rel)
        print(f'  DEL {rel} ({sz/1024:.1f} KB)')
    else:
        print(f'  (不存在,跳过) {rel}')
print('DONE')
