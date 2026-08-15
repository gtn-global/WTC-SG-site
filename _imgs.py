import re, os
from PIL import Image

def size_of(src):
    p = src.split('?')[0]
    if os.path.exists(p):
        try:
            im = Image.open(p)
            return im.size
        except Exception:
            return None
    return None

# 首屏不 lazy 的：带 class "logo" 的（页脚 WTCA logo，出现两次但非首屏？文档说首屏2个logo）
# 这里按文档：首屏的 logo 不加 lazy。页脚 WTCA logo2 在末屏，可加 lazy。
# 我们保守：class 含 "logo"（即 WTCA logo 页脚）也加 lazy 安全；但对 data-slide 第一屏的 logo_sg 不加。
# 简化：凡 src 以 quotes-logos/logo_sg.png 开头 -> 首屏，不加 lazy；其余静态 img 加 lazy+尺寸

for fn in ['index.html', 'index-en.html']:
    t = open(fn, encoding='utf-8').read()
    def repl(m):
        tag = m.group(0)
        if 'loading=' in tag or 'data-base' in tag or 'data-img' in tag:
            return tag  # 动态或已处理跳过
        src_m = re.search(r'src=["\']([^"\']+)', tag)
        if not src_m:
            return tag
        src = src_m.group(1)
        is_first = 'logo_sg.png' in src
        # 解析已有属性
        attrs = dict(re.findall(r'([\w-]+)=["\']([^"\']*)["\']', tag))
        news = []
        # width/height
        if 'width' not in attrs or 'height' not in attrs:
            sz = size_of(src)
            if sz:
                attrs.setdefault('width', str(sz[0]))
                attrs.setdefault('height', str(sz[1]))
        if not is_first:
            attrs.setdefault('loading', 'lazy')
        # 重建 tag（保持原顺序 + 新属性）
        # 简单：在原 tag 末尾 > 前插入缺失属性
        add = ''
        if 'width' not in attrs or 'height' not in attrs:
            pass
        # 重新组装：用原 tag 文本，替换闭合
        # 直接构造：保留原属性串，追加新属性
        inner = tag[4:-1]  # 去 <img 和 >
        extra = ''
        if 'width' in attrs and 'width' not in tag:
            extra += f' width="{attrs["width"]}"'
        if 'height' in attrs and 'height' not in tag:
            extra += f' height="{attrs["height"]}"'
        if not is_first and 'loading' not in tag:
            extra += ' loading="lazy"'
        return f'<img{inner}{extra}>'
    new = re.sub(r'<img\b[^>]*>', repl, t)
    open(fn, 'w', encoding='utf-8').write(new)
    print(fn, 'done')
print('OK')
