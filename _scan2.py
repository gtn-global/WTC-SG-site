import re, os

# 1) CSS 中对各图片目录的引用
css = open('common.css', encoding='utf-8').read()
print('=== common.css image refs ===')
for m in re.findall(r'url\(["\']?([^)"\']+)', css):
    print(' ', m)

# 2) 所有 css 文件中引用
for f in os.listdir('.'):
    if f.endswith('.css'):
        t = open(f, encoding='utf-8').read()
        found = re.findall(r'url\(["\']?([^)"\']+\.(?:png|jpg|jpeg|webp|svg))', t)
        if found:
            print('---', f, '---')
            for x in sorted(set(found)): print('  ', x)

# 3) 蜂窝数据 / it.img: 搜索所有 js 和 html 里 hexagon / hex / grid / logo 数据
print('=== grep hexagon data in all files ===')
for root, dirs, fs in os.walk('.'):
    if '.git' in root: continue
    for fn in fs:
        if fn.endswith(('.js','.html')):
            p = os.path.join(root, fn)
            t = open(p, encoding='utf-8', errors='ignore').read()
            if 'img:' in t or 'grid' in t.lower() or 'hex' in t.lower():
                # print lines containing img: or grid path
                for i, line in enumerate(t.splitlines(), 1):
                    if re.search(r'img:\s*[\'"]|grid\d|logo\d|wtca\d|wtc-buildings', line):
                        print(f'  {p}:{i}: {line.strip()[:120]}')
