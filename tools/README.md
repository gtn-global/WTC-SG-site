# 构建与校验工具

Phase 4.2 引入的最小化工程化脚本，均为**本地辅助工具**，不影响线上页面。

## 1. HTML 校验（防 link 断裂 / 标签不匹配）

```bash
npm install
npm run validate:html
```

会在提交前校验 `index.html` / `index-en.html`：
- 标签必须成对（拦截未闭合 `<div>`/`<style>`/`<script>`）
- `id` 唯一
- `<img>` 必须有 `alt`
- `<link>`/`<src>` 不得为空

> 背景：Phase 1 曾出现字体 `<link>` 被误改导致首屏无样式，
> 引入该校验可在合入前拦下同类问题。

## 2. 图片批处理（自动 WebP + 多尺寸）

```bash
npm install
npm run process:images            # 处理默认目录
npm run process:images wtc-buildings   # 仅处理指定目录
```

为位图素材生成同名 `.webp`（质量 82）及 `@1x`/`@2x` 多尺寸版本，
原图保留。新增素材时跑一遍即可，无需再手工压缩。

## 依赖

`htmlhint`、`sharp`（已写入 `package.json` 的 devDependencies）。
