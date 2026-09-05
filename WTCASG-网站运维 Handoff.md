# WTC Singapore 网站运维 Handoff（智能体接手指南）— 可编辑副本

> **本文件是活跃开发目录 `C:\Users\bruce\Desktop\bruce\WTC-SG-site\` 下的可编辑版本**（同源 `WTC-SG-site-backup/push/` 的只读备份，本副本改了不违反"勿动备份"红线）。
> 配套文件（均与本文件同目录）：
> - **《WTCASG-网站 Push 前检查清单.md》**——每次 push 前必须照它核验（权重红线）。
> - **《WTCASG-网站部署 Handoff.md》**——部署链路（GitHub Pages）与 sitemap 生成的具体操作记录。
>
> 本次就 sitemap / llms 维护做了两处订正：① 更正"脚本自动扫目录"为"写死 PAGES 数组，新增页须先加 URL"；② 新增"重生成后无需到 Google/Bing 后台重传 sitemap"。

---

## 一、背景

WTC Singapore（新加坡世贸中心）介绍演示文稿是一个**纯静态单页站点**（HTML/CSS/JS + 图片），中英文双版本（`index.html` 中文 / `index-en.html` 英文），由滚动式 deck（16 屏）组成，非传统多页网站。核心目标是 **GEO/SEO**（让 ChatGPT / Perplexity / Gemini 及搜索引擎发现并引用），并支持社交分享（og:image）。

网站由用户（bruce）在本地维护，通过 Git 推送到 GitHub，由 **GitHub Pages 自动发布到公网**（仓库含 `CNAME=wtcasg.org`，push 到 `main` 分支即触发部署，无 Netlify / 无 Miaoda）。

---

## 二、关键位置（务必记准）

| 项目 | 位置 |
|------|------|
| 本地网站文件夹 | `C:\Users\bruce\Desktop\bruce\WTC-SG-site`（**2026-08 起已从 `D:\WTCSingapore\WTC-SG-site` 迁移至此**，旧目录已删除；该目录为独立 git 仓库，`remote` 指向 `gtn-global/WTC-SG-site`）|
| **GitHub 仓库（GitHub Pages 发布源）** | `gtn-global/WTC-SG-site` |
| Git remote 名 | 待确认（push 前用 `git remote -v` 核对） |
| 分支 | `main` |
| GitHub Pages 站点 | 由仓库 `CNAME=wtcasg.org` 绑定自定义域名，push 到 `main` 即自动发布 |
| 线上网址 | **https://wtcasg.org**（见 `sitemap.xml`，部署后以此为准）|
| Push 前检查清单 | `WTCASG-网站 Push 前检查清单.md`（同目录）|
| 部署操作记录 | `WTCASG-网站部署 Handoff.md`（同目录）|
| 站点地图 | `sitemap.xml`（脚本产物，由 `generate-sitemap.js` 生成）|
| AI 索引文件（GEO 核心） | `llms.txt` |
| sitemap/llms 生成脚本 | `generate-sitemap.js`（本地 Node 脚本，见下方"重要"说明）|
| Git 仓库元数据 | `.git` / `.gitignore`（隐藏，勿动）|

⚠️ **致命陷阱（已踩过坑，来自兄弟项目 GTN）**：存在一个易混淆的仓库 `gtn-global/gtn-site`（注意无 `/site` 区分）。推送时务必确认 remote 指向 `gtn-global/WTC-SG-site`，**推错仓库 GitHub Pages 不会更新**，线上永远是旧版本。push 前用 `git remote -v` 核对。

---

## 三、我们最看重的事：更新对权重的"正面 / 负面影响"

用户更新网站时，**第一优先级不是"快点上线"，而是"不能伤害网站在 AI 搜索引擎（GEO）和 Google 的权重"**。任何改动都要先评估权重影响。

### 铁律（必须照办）

1. **Push 前必须先发 AI 确认**：每次准备 `git push` 之前，先把改动发给 AI 确认一遍，AI 确认无负面影响后再 push。**不要直接 push。**
2. **严格使用检查清单**：每次 push 前逐项核对《WTCASG-网站 Push 前检查清单.md》，重点包括：
   - **链接完整性（防 404，最重要）**：无指向已删除/移动路径的引用；图片真实存在；`og:image` 目录随站发布。
   - **Canonical / hreflang / og 自洽**：中英文页互相 `hreflang`；`og:url` / canonical 一致。
   - **不删已收录 URL**：重命名/移动页面必须确认无收录价值或做 301。
   - **结构自洽**：HTML、资源、引用三者一致，整批改完再 push。
   - **SEO 基础字段**：每页有唯一 `<title>`、`<meta description>`、canonical、hreflang、og/Twitter 卡片、图片 `alt`。
   - **不 `noindex` 全站、不改 `common.css`**。
3. **不推错仓库**：确认 remote 指向 `gtn-global/WTC-SG-site` 后再 push。

### 权重的"正面"与"负面"判断

- **正面**：补齐缺失的 canonical / hreflang / og；sitemap 完整；修复软 404；结构更清晰。
- **负面（要规避）**：产生整页 404；canonical / 域名混乱导致权重分散；已收录 URL 被删除且无重定向；全站 noindex；重复内容（多个 URL 返回同一首页）；图片/og:image 目录未随站发布导致社交分享图失效。

---

## 四、如何正确 push（完整流程）

```bash
# 1. 进入本地网站目录
cd "C:\Users\bruce\Desktop\bruce\WTC-SG-site"

# 2. 先把改动发给 AI 确认（铁律，不要跳过）

# 3. 确认 remote 指向正确仓库
git remote -v     # 必须看到 gtn-global/WTC-SG-site

# 4. 重生成 sitemap / llms（详见第五节，新增页面需先在脚本里加 URL）
node generate-sitemap.js

# 5. AI 确认无误后，提交并推送
git add -A
git commit -m "说明本次改动（如：新增 og:image 与 SEO 元标签）"
git push          # 以 git remote -v 显示为准，推到 main 分支

# 6. 推送后核对远端确实收到 + GitHub Pages 部署完成（Settings → Pages 显示最新 commit 已发布）
# 7. 抽查关键页面线上是否正常（见第六节）
```

> **重要认知**：GitHub Pages 已绑定正确仓库（`CNAME=wtcasg.org`）后，"push 到 main 成功"≈"网站更新"。但每次 push 后仍要在仓库 **Settings → Pages** 确认最新 commit 已发布，并实际打开线上页面验证（GitHub Pages 通常几秒到一分钟内生效，偶发需等缓存刷新）。

---

## 五、仓库内不可误删/误改的配置文件清单（红线）

> 以下文件位于仓库根（`WTC-SG-site/`），都跟 GitHub / 搜索引擎 / AI 引擎直接沟通。它们都必须独立存在、不可合并进 Markdown（文件名是外部系统按协议读取的固定名）。

| 文件 | 跟谁沟通 | 能否手改 | 能否合并 | 删了/误改会怎样 |
|------|----------|----------|----------|----------------|
| `CNAME` | GitHub Pages（自定义域名） | ❌ 勿手改 | ❌ 不可合并 | 域名绑定失效；当前内容为 `wtcasg.org` |
| `sitemap.xml` | 搜索引擎/AI | ❌ 脚本产物，勿手改 | ❌ 不可合并 | 站点地图过期、页面不被收录；由 `generate-sitemap.js` 生成 |
| `llms.txt` | AI 引擎（ChatGPT/Perplexity/Gemini） | ❌ 脚本产物，勿手改 | ❌ 不可合并 | GEO 索引过期、AI 读不到新页；由 `generate-sitemap.js` 生成 |
| `generate-sitemap.js` | 本地 Node | ⚠️ 仅 AI 改逻辑 | ❌ 不可合并 | 失去 sitemap/llms 生成能力 |
| `.git` / `.gitignore` | GitHub | ❌ 勿动 | ❌ 不可合并 | 删 `.git`=仓库没了；误改 `.gitignore`=文件不进 GitHub |
| `common.css` | 全站样式 | ❌ **用户铁律：禁止修改** | ❌ 不可合并 | 全站样式崩坏；所有页面级改动只用页面内 `<style>` 覆盖，不碰此文件 |
| `common.js` | 全站脚本 | ⚠️ 谨慎 | ❌ 不可合并 | 破坏 deck 初始化；页面级脚本用 `<script>` 在 body 末尾追加 |

**关键认知**：`sitemap.xml` 与 `llms.txt` 是**同一个脚本 `generate-sitemap.js` 的产物**（一次运行两个文件都更新）。所以更新页面后，必须重跑脚本、不要手改这两个 xml/txt。

**运行方式**（在仓库根执行）：
```
node generate-sitemap.js
```
脚本会写出 `sitemap.xml` 和 `llms.txt`。

> **WTC-SG 的 `generate-sitemap.js` 现已改为与 GTN 一致的「自动扫目录」**（2026-09-05 改）：脚本递归扫描全站 `.html` 页面，无需手写清单。新增页面只要按现有目录规矩放好文件，重跑 `node generate-sitemap.js` 即自动进 sitemap/llms。内置排除规则会跳过：`_demo` 演示目录、`*_demo*` 模板、`google*/baidu*` 验证文件、`signature-dong*` 签名演示页。

---

## 六、资源目录红线（图片放哪、必须随站发布）

> WTC-SG 站点是**整站静态资源 + 图片都在仓库根下子目录**，部署时 GitHub Pages 会把整个 `main` 分支作为站点根发布。**任何被 HTML 引用的图片目录都必须随 `git push` 进仓库**，否则线上 404。

| 目录 | 角色 | 被引用方式 |
|------|------|-----------|
| `logo/` | 31 个 logo（`LOGO_DIR='logo/'` 由 JS 动态加载）| JS 动态 `data-base="logo/..."` |
| `grid/` | 9 张九宫格图 | JS 动态 `data-img="grid/..."` |
| `waterfall/` | 12 张全球连接图 | JS 动态 `data-base="waterfall/..."` |
| `wtc-buildings/` | 12 张世贸建筑图 | JS 动态 `data-base="wtc-buildings/..."` |
| `quotes-logos/` | 引言头像 + 二维码 + P1 两个 logo | HTML 直接 `src="quotes-logos/..."` |
| `ogimage/` | 社交分享缩略图 `og image.jpeg` | `<meta property="og:image" content="ogimage/og%20image.jpeg">` |

⚠️ **社交分享图专项提醒**：`og:image` 是给社交爬虫从**公网**抓的，不会被内联成 base64。部署后必须保证 `https://wtcasg.org/ogimage/og%20image.jpeg` 能公开访问——即 `ogimage/` 目录随仓库一起 push 到 `main` 分支、由 GitHub Pages 整目录发布。

---

## 七、接手智能体的首要目标

1. **维持"线上 = 本地"**：GitHub Pages 绑定正确仓库（`CNAME=wtcasg.org`），确保每次本地改动稳定上线。
2. **守住权重红线**：每次更新前用检查清单 + AI 确认，杜绝伤害 GEO/SEO 的改动。
3. **可复用流程**：本 handoff + 检查清单 + 部署 Handoff 三者配合，形成标准动作。

---

## 八、上线后验证清单（每次 push 后必做）

1. `git fetch` + `git rev-parse <remote>/main` 确认远端 commit 已更新。
2. 仓库 **Settings → Pages** 确认最新部署已发布（显示最新 commit），且 commit 与远端一致。
3. 浏览器抽查：
   - `https://wtcasg.org/` → 中文首页正常，无控制台 404。
   - `https://wtcasg.org/index-en.html` → 英文首页正常。
   - `https://wtcasg.org/sitemap.xml` → Content-Type 应为 `application/xml`。
   - `https://wtcasg.org/ogimage/og%20image.jpeg` → 返回图片（社交分享图可用）。
4. 若发现图片 404：先查该图片目录是否进了仓库（`git ls-files | findstr 目录名`）。

---

## 九、sitemap 维护后，要重新上传给 Google / Bing 吗？

**不用，不用重传。** 你在 Google Search Console / Bing Webmaster 后台提交的是**一个网址**（`https://wtcasg.org/sitemap.xml`），不是文件本身。搜索引擎会按自己的节奏回头去抓这个网址；你重生成 sitemap、push 上线后，新文件覆盖到同一个网址，它们下次来访问就自动看到新内容了。

> 想加速收录时，可到后台点一下"重新提交 / resubmit"催一下，但**不是必须**。

---

## 十、相关记忆 / 约定（摘要）

- 中英文双版：`index.html`（中文，主入口 `/`）、`index-en.html`（英文，`/index-en.html`）。
- 导航栏为顶部固定栏（占用真实高度，非覆盖），cn 品牌"新加坡世贸丨WTC Singapore"，en 品牌"WTC Singapore"；金色统一 `#C5A059`。
- **用户铁律**：不要修改 `common.css`；不要改无关元素；push 前必须 AI 确认。
- 页面级样式/脚本改动一律用页面内 `<style>` / `<script>`，不碰 `common.css` / `common.js`。
- 仓库/部署链路：**本地 `WTC-SG-site` → `git push` 到 `main` → GitHub Pages 自动发布 → `https://wtcasg.org`**。
- **sitemap/llms 生成器为自动扫目录**（2026-09-05 由写死 PAGES 数组改为自动扫描，与 GTN 一致）；新增页面按目录规矩放好、重跑脚本即自动收录，无需改脚本。
