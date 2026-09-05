# Handoff 文档：WTC Singapore 网站 — 部署/域名/状态（可编辑副本）

**最后更新：2026-09-05（sitemap 改为自动扫目录生成器 + 无需到 Google/Bing 重传）**

> 本文件是活跃开发目录 `C:\Users\bruce\Desktop\bruce\WTC-SG-site\` 下的可编辑版本（同源 `WTC-SG-site-backup/push/` 的只读备份）。

---

## 一、当前部署状态

| 平台 | 状态 | 地址 |
|------|------|------|
| 本地网站目录 | ✅ 维护中 | `C:\Users\bruce\Desktop\bruce\WTC-SG-site`（**2026-08 起已从 `D:\WTCSingapore\WTC-SG-site` 迁移至此**，旧目录已删除）|
| GitHub 仓库 | ✅ 推送目标 | `gtn-global/WTC-SG-site`（push 前用 `git remote -v` 核对，勿推到 `gtn-global/gtn-site`）|
| GitHub Pages | ✅ 自动发布 | push 到 `main` 分支即触发；仓库含 `CNAME=wtcasg.org` 绑定自定义域名 |
| 线上网址 | ✅ | `https://wtcasg.org`（见 `sitemap.xml`）|
| 站点地图 | ✅ 脚本生成 | `sitemap.xml`（`generate-sitemap.js` 产物，需手动跑）|
| AI 索引 | ✅ 脚本生成 | `llms.txt`（`generate-sitemap.js` 产物，需手动跑）|

---

## 二、关键约束（别踩坑）

1. **仓库名易混淆**：存在 `gtn-global/gtn-site`（无 `/site` 区分）这个**另一个仓库**，历史上曾绑错（兄弟项目 GTN 踩过此坑）。推送前必须 `git remote -v` 确认指向 `gtn-global/WTC-SG-site`。
2. **`common.css` 禁止修改**（用户铁律）：所有页面级样式改动只用页面内 `<style>` 覆盖。
3. **图片目录必须随站发布**：`logo/ grid/ waterfall/ wtc-buildings/ quotes-logos/ ogimage/` 全部在仓库内，GitHub Pages 会把 `main` 分支整目录作为站点根发布。务必随 `git push` 进仓库，否则图片/og:image 404。
4. **`og:image` 走公网抓取**：社交平台爬虫直接抓 `https://wtcasg.org/ogimage/og%20image.jpeg`，不会被内联，必须公网可访问。
5. **sitemap/llms 是脚本产物**：由本地 `generate-sitemap.js` 生成，**GitHub Pages 不会自动跑该脚本**。每次新增/移动/删除页面后，push 前需本地手动跑（见第五节），并把生成的 `sitemap.xml`/`llms.txt` 一起 `git add` 提交。
   - ✅ **WTC-SG 的生成器现已自动扫目录（与 GTN 一致，2026-09-05 改）**：无需手写清单；新增页面按目录规矩放好、重跑脚本即自动收录。

---

## 三、账号信息（备查，待 bruce 补全）

- **GitHub**：用户名 `gtn-global`，仓库 `gtn-global/WTC-SG-site`（`gh` CLI 已登录走 SSH/keyring）。
- **GitHub Pages**：由仓库 `CNAME=wtcasg.org` 绑定自定义域名，push 到 `main` 即自动发布，无 Netlify / 无 Miaoda。
- **域名**：`wtcasg.org`（DNS 托管待确认）。
- **Google Search Console / Bing Webmaster**：已认领 `wtcasg.org` 并提交 `https://wtcasg.org/sitemap.xml`。**重生成 sitemap 后无需重新提交**（搜素引擎会按节奏回抓该网址）。

---

## 四、一句话总结

> WTC Singapore 纯静态双语文案站，本地 `C:\Users\bruce\Desktop\bruce\WTC-SG-site`，push 到 `gtn-global/WTC-SG-site` 的 `main` 分支由 GitHub Pages 自动部署到 `https://wtcasg.org`。sitemap/llms 由 `generate-sitemap.js` 本地**自动扫目录**生成后随仓库提交（已内置排除规则跳过演示/模板/验证文件，新增页面放好即自动收录）。红线：不改 `common.css`、图片目录随站发布、push 前 AI 确认。

---

## 五、部署前必做：重生成 sitemap 与 llms.txt

`sitemap.xml` 与 `llms.txt` 不是手写的，而是由仓库根的 **`generate-sitemap.js`**（Node 脚本）一次性生成。**每次新增/移动/删除页面后，push 前必须先手动重跑脚本**（GitHub Pages 不会自动跑），否则站点地图与 GEO 索引会过期。

```bash
cd "C:\Users\bruce\Desktop\bruce\WTC-SG-site"
node generate-sitemap.js
# 脚本会写出 sitemap.xml 与 llms.txt
```

> **目录迁移说明（2026-08 起）**：原 `D:\WTCSingapore\WTC-SG-site` 已删除，整站现位于 `C:\Users\bruce\Desktop\bruce\WTC-SG-site`。该目录为独立 git 仓库，`remote` 指向 `git@github.com:gtn-global/WTC-SG-site.git`（SSH），push 到 `main` 即触发 GitHub Pages 部署。

- ✅ **WTC-SG 生成器现已自动扫目录（与 GTN 一致，2026-09-05 改）**：脚本递归扫描全站 `.html` 页面并内置排除规则（跳过 `_demo`/`*_demo*`/`google*/baidu*` 验证文件/`signature-dong*` 演示页）。**新增页面只要按目录规矩放好、重跑脚本即自动收录，无需再维护任何清单。**
- `sitemap.xml` / `llms.txt` **勿手改**（改了下次跑脚本会被覆盖）。
- 跑完脚本后，连同网页改动一起 `git add` 再 push（见《运维 Handoff.md》第四节与《Push 前检查清单.md》）。
- 仓库根其它红线文件：`CNAME`、`.git`/`.gitignore`、以及**禁止修改的 `common.css`**，说明见《运维 Handoff.md》第五节。
- **重生成并 push 后，无需到 Google Search Console / Bing Webmaster 后台重新提交 sitemap**——你提交的是网址 `https://wtcasg.org/sitemap.xml`，搜索引擎会按自己的节奏回抓，下次访问即见新内容。

---

## 六、发布触发机制（GitHub Pages）

> 本站点**由 GitHub Pages 发布**，push 到 `main` 分支即触发部署；仓库根 `CNAME` 文件绑定自定义域名 `wtcasg.org`。**GitHub Pages 不会自动跑 `generate-sitemap.js`**，所以 sitemap/llms 必须本地手动生成后随 commit 提交。

1. **push 到 main 即发布**：GitHub Pages 监听 `main` 分支，push 成功后通常几秒到一分钟内线上更新。
2. **sitemap/llms 本地手动跑**：在仓库根 `node generate-sitemap.js`（自动扫目录，无需确认清单），生成后一并 `git add` 提交。

**结果**：你日常只做 `git push`（确认 remote 正确 + AI 已确认改动），GitHub Pages 自动发布网页；索引文件需本地跑脚本补充。若部署异常，在仓库 **Settings → Pages** 查看发布状态，再发改动给 AI 处理即可。详见《运维 Handoff.md》第八节验证清单。
