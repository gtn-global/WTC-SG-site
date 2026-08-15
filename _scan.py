import re, os

def imgs_in(path):
    html = open(path, encoding='utf-8').read()
    return re.findall(r'<img[^>]+src=["\']([^"\']+)', html)

for f in ['index.html', 'index-en.html']:
    print('===', f, '===')
    for s in sorted(set(imgs_in(f))):
        print(' ', s)

# 蜂窝数据 it.img 在 common.js
js = open('common.js', encoding='utf-8').read()
print('=== common.js it.img values ===')
for m in re.findall(r'img:\s*["\']([^"\']+)', js):
    print(' ', m)
for m in re.findall(r'it\.img', js):
    pass
# 也抓 src= 拼接里的字面
print('=== common.js literal image paths ===')
for m in re.findall(r'src=["\']([^"\']+)', js):
    print(' ', m)

# 全仓库 png/jpg 引用统计
allrefs = ''
for f in ['index.html','index-en.html','common.js']:
    allrefs += open(f, encoding='utf-8').read()

print('=== unused image candidates ===')
for root, dirs, fs in os.walk('.'):
    if '.git' in root: continue
    for fn in fs:
        if fn.lower().endswith(('.png','.jpg','.jpeg','.webp')):
            rel = os.path.join(root, fn).replace('\\','/')[2:]  # strip ./
            # normalize: search both with and without leading ./
            cnt = len(re.findall(re.escape(rel), allrefs))
            if cnt == 0:
                print(' UNUSED:', rel)
