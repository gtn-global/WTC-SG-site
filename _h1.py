import re
for fn in ['index.html', 'index-en.html']:
    t = open(fn, encoding='utf-8').read()
    # 找到所有 <h1 ...> ... </h1> 块（含跨行）
    # 用非贪婪匹配到对应闭合
    # 先按行定位第一个 h1（封面），保留；其余改 h2
    # 策略：匹配 <h1 标签，统计出现次数，第一个不替换
    parts = re.split(r'(<h1\b[^>]*>)', t)
    # parts: [text, <h1 ...>, text, <h1 ...>, ...]
    # 第一个 <h1> (parts[1]) 是封面 -> 保留
    out = parts[0]
    count = 0
    i = 1
    while i < len(parts):
        tag = parts[i]
        body = parts[i+1] if i+1 < len(parts) else ''
        count += 1
        if count == 1:
            out += tag + body  # 封面保留 h1
        else:
            # 改闭合标签 </h1> -> </h2>
            body2 = body.replace('</h1>', '</h2>')
            out += tag.replace('<h1', '<h2', 1) + body2
        i += 2
    open(fn, 'w', encoding='utf-8').write(out)
    print(fn, 'h1->h2 (except first) done')
print('OK')
