# PUSH 前必读（防呆锁 · 本文件专治"读错套/记混/找不到"）

用户说「push / 推 / 发我确认」时，**先别凭记忆**，严格按下面走：

## 第 1 步：先认仓库（最关键，防串）
在「当前改动目录」运行：
```
git remote -v
```
- remote 含 `gtn-global/WTC-SG-site` → 就是本仓库（WTC Singapore / wtcasg.org）
- remote 含 `gtn-global/site` → 那是 GTN 站，**立刻停手**，去 `gtn-global-site\push\` 读另一套

## 第 2 步：读本仓库的三件套（就在此目录）
- `WTCASG-网站运维 Handoff.md`
- `WTCASG-网站部署 Handoff.md`
- `WTCASG-网站 Push 前检查清单.md`

## 第 3 步：死规矩
- **绝不**去读 GTN 那套（`海鑫汇GTN-*.md`，在 `gtn-global-site\push\`）
- 三件套要求 push 前跑 `node generate-sitemap.js`，照做（已自动扫目录，不用改清单）
- 跑完连同网页改动一起 `git add` 再 push

## 第 4 步：push 后
- Google/Bing 会自己回抓 sitemap，**不用到后台重传**
- 百度是另一条线（每日「推百度」），与此无关
