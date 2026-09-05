# WTC Singapore 网站（WTC-SG）Push 前检查清单（可编辑副本）

> 目的：每次把本地 `WTC-SG-site` 推送到 GitHub `gtn-global/WTC-SG-site`（GitHub Pages 自动部署到 https://wtcasg.org/ ）之前，按本清单核验，避免对网站 SEO/GEO 权重造成负面影响。
>
> **铁律：push 之前，先把改动发给我（AI）确认一遍。** 有时是在新窗口，也要走这一步，不要直接 push。
>
> ⚠️ **目录已迁移（2026-08 起）**：原仓库目录 `D:\WTCSingapore\WTC-SG-site` 已不再使用，整站已移动到 **`C:\Users\bruce\Desktop\bruce\WTC-SG-site`**。本文档内所有 `cd "D:\WTCSingapore\WTC-SG-site"` 一律以 `C:\Users\bruce\Desktop\bruce\WTC-SG-site` 为准。旧文件夹已删除，无需再找。
>
> ⚠️ **仓库形态变更**：当前 `WTC-SG-site` 为独立 git 仓库，`remote` 指向 `gtn-global/WTC-SG-site`（SSH：`git@github.com:gtn-global/WTC-SG-site.git`）。push 前用 `git remote -v` 核对，确认指向 `gtn-global/WTC-SG-site` 后再 push。
>
> 本副本就 sitemap 维护做了订正：① WTC-SG 生成器是写死 PAGES 数组（非自动扫目录）；② 重生成后无需到 Google/Bing 后台重传 sitemap。

---

## 0. 推送目标确认（避免推错仓库）

- 当前仓库：`gtn-global/WTC-SG-site`
- ⚠️ 注意：存在另一个仓库 `gtn-global/gtn-site`（**无 `/site` 区分**），推送前务必 `git remote -v` 核对，确认指向 `gtn-global/WTC-SG-site` 后再 push。

---

## 1. 链接完整性检查（防 404，最重要）

404（尤其是整页 404、图片 404）是权重的主要杀手。

- [ ] **新增/移动/删除了文件或目录后**，全局搜索项目内所有 `.html/.css/.js`，确认没有任何指向**已删除路径**的引用。
  - 搜索命令（在仓库根目录执行）：
    ```powershell
    Get-ChildItem -Recurse -Include *.html,*.css,*.js | Select-String -Pattern "quotes-logos/|logo/|grid/|waterfall/|wtc-buildings/|ogimage/" | Select-Object Path,Line
    ```
- [ ] **每个 HTML 引用的图片**都真实存在于对应目录内（`quotes-logos/`、`logo/`、`grid/`、`waterfall/`、`wtc-buildings/`、`ogimage/`）。
- [ ] **`og:image` 目录随站发布**：`ogimage/og image.jpeg` 必须随 `git push` 进仓库，否则社交分享图 404。线上验证：`https://wtcasg.org/ogimage/og%20image.jpeg` 返回图片。
- [ ] 用浏览器或本地预览打开 `index.html` 与 `index-en.html`，确认图片、CSS、JS 都正常加载，无控制台 404。

---

## 2. Canonical 与域名一致性（防权重分散）

- [ ] 所有页面的 `<link rel="canonical">` 指向**当前线上域名** `https://wtcasg.org/...`，不要混用其它过渡域名（用 `wtcasg.org` 保持一致）。
- [ ] 中英文页通过 `hreflang` 互相标注（`index.html` ↔ `index-en.html`），且 canonical 各自正确。
- [ ] 站内互相链接统一用线上域名或相对路径，不要混用多套域名。

---

## 3. 不要删除已被收录的 URL（确需改动时做重定向）

- [ ] 如果要**重命名或移动已有页面/资源**（URL 改变），必须确认旧 URL 没有任何外链/已收录价值可放弃；如需保留权重，在仓库根加 `_redirects` 301 规则（`/旧路径    /新路径    301`）。
  - 注：当前站点**无 `_redirects` 文件**（GitHub Pages 默认用 `index.html` 作为 `/` 入口，无需重定向）。仅当确有 URL 变动时才新建。
- [ ] 首页 `index.html`、英文入口 `index-en.html` 路径**不要随意改名**。

---

## 4. 结构变动自洽性（整批改完再 push）

- [ ] 一次 push 的内容应是**自洽完整**的：HTML 引用、对应资源、索引链接三者一致，不要"先推 HTML、后传图片"分两次。
- [ ] 大批量改动建议**小步快跑、改完即 push**，而不是长期堆积——堆积后一次性出错难定位、难回滚。GitHub Pages 部署是整体生效，不会"改到一半线上崩"。

---

## 5. SEO 基础字段检查（每项新增/修改页都要有）

- [ ] `<title>` 唯一且描述准确（中文页含"新加坡世贸中心 WTC Singapore"、英文页含 "WTC Singapore | WTCA"）
- [ ] `<meta name="description">` 存在且相关
- [ ] `<link rel="canonical">` 正确（见第 2 条）
- [ ] 中英文 `hreflang` 标注（双语页）
- [ ] `og:` / Twitter Card 结构化数据完整（`og:title` / `og:description` / `og:image` / `twitter:card` / `twitter:image`）
- [ ] 图片有 `alt` 文本

---

## 6.  sitemap / llms 重生成（当前必须手动，非自动）

> 旧版仅写"先跑 `node generate-sitemap.js` 重新生成"。**补充关键订正**：

- [ ] **新增/移动/删除了页面后，push 前务必在仓库根运行**：
  ```bash
  node generate-sitemap.js
  ```
  脚本同时写出 `sitemap.xml` 与 `llms.txt`（GEO 索引，ChatGPT/Perplexity 靠它发现站点，务必同步更新）。
- [ ] ✅ **WTC-SG 的生成器现已自动扫目录（与 GTN 一致，2026-09-05 改）**：脚本递归扫描全站 `.html` 并内置排除规则（跳过 `_demo`/`*_demo*`/`google*/baidu*` 验证文件/`signature-dong*` 演示页）。**新增页面只要按目录规矩放好、重跑脚本即自动收录，无需再维护 PAGES 清单。**（GTN 站同样是自动扫目录。）
- [ ] 把生成的 `sitemap.xml`、`llms.txt` 与网页改动**一起 `git add`** 再 push。
- [ ] `sitemap.xml` / `llms.txt` **勿手改**（改了下次跑脚本会被覆盖）。
- [ ] **重生成并 push 后，无需再到 Google Search Console / Bing Webmaster 后台重新提交 sitemap**——你之前提交的是网址 `https://wtcasg.org/sitemap.xml`，搜索引擎会按自己的节奏回抓该网址，下次访问即见新内容（想加速可点"重新提交/resubmit"，但非必须）。
- [ ] `CNAME` 未被误改（当前内容 `wtcasg.org`，GitHub Pages 自定义域名绑定）。
- [ ] `.gitignore` 未被误改（否则文件不进 GitHub）；`.git` 目录勿动。
- [ ] **`common.css` 未被修改**（用户铁律：禁止修改；页面级样式只用页面内 `<style>` 覆盖）。
- [ ] `common.js` 未被误改（deck 初始化逻辑）。
- [ ] 没有把整站 `noindex` 或误改 `robots` 元标签。

---

## 一键自检脚本（PowerShell，仓库根目录运行）

```powershell
# 1) 找出对图片目录的引用，确认目录仍存在
Get-ChildItem -Recurse -Include *.html,*.css,*.js | Select-String -Pattern "quotes-logos/|logo/|grid/|waterfall/|wtc-buildings/|ogimage/" | Select-Object Path,Line

# 2) 列出 canonical 指向异常域名的页面（应为 wtcasg.org 或实际部署域名）
Get-ChildItem -Recurse -Include *.html | Select-String -Pattern "canonical" | Select-Object Path,Line

# 3) 查看当前改动概况（确认改动自洽）
git status -s
git diff --stat
```

---

## 推送流程（确认无误后）

```bash
cd "C:\Users\bruce\Desktop\bruce\WTC-SG-site"
git remote -v               # 确认指向 gtn-global/WTC-SG-site
node generate-sitemap.js    # 重生成 sitemap.xml / llms.txt（GitHub Pages 不会自动跑，需本地手动跑；新增页先确认 PAGES 数组已含该 URL）
git add -A
git commit -m "说明本次改动（如：新增 og:image 与 SEO 元标签）"
git push                    # 以 git remote -v 显示的 remote 名为准（推到 main 分支）
```

推送后到仓库 **Settings → Pages** 看是否发布，并抽查（见《运维 Handoff.md》第八节）：首页、`/index-en.html`、`/sitemap.xml`、`/ogimage/og%20image.jpeg` 均正常。
