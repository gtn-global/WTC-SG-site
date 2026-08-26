/**
 * 生成 sitemap.xml —— 纯静态站点，手动列出页面。
 * 用法: node generate-sitemap.js [BASE_URL]
 *   不传 BASE_URL 时用下方 DEFAULT_BASE。
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEFAULT_BASE = 'https://wtcasg.org';
const BASE = (process.argv[2] || DEFAULT_BASE).replace(/\/$/, '');

// 站点内所有公开页面；中文首页 canonical 为根路径，故映射为 ''（生成 BASE + '/'）
const PAGES = [
  '',
  'index-en.html',
  'wtc-one-club/one-club-journal.html',
  'wtc-one-club/one-club-journal-en.html',
  'wtc-one-club/journal-launch-ceremony/journal-launch-ceremony.html',
  'wtc-one-club/journal-launch-ceremony/journal-launch-ceremony-en.html',
  'wtc-one-club/journal-beyondsoft-singapore/journal-beyondsoft-singapore.html',
  'wtc-one-club/journal-beyondsoft-singapore/journal-beyondsoft-singapore-en.html',
  'wtc-one-club/journal-HKcapital/journal-HKcapital.html',
  'wtc-one-club/journal-HKcapital/journal-HKcapital-en.html',
  'wtc-one-club/journal-ciftis-2025/journal-ciftis-2025.html',
  'wtc-one-club/journal-ciftis-2025/journal-ciftis-2025-en.html',
  'wtc-one-club/journal-maldives-ambassador/journal-maldives-ambassador.html',
  'wtc-one-club/journal-maldives-ambassador/journal-maldives-ambassador-en.html',
  'club-apply/club-apply.html',
  'club-apply/club-apply-en.html',
  'cases/case-list.html',
  'cases/case-list-en.html',
  'cases/hardtech-semiconductor/index.html',
  'cases/hardtech-semiconductor/en.html',
  'cases/home-building-materials/index.html',
  'cases/home-building-materials/en.html',
  'cases/smart-manufacturing/index.html',
  'cases/smart-manufacturing/en.html',
];

// 每个页面关联的代表性图片（用于 sitemap image 扩展，提升图片搜索可见性）
const PAGE_IMAGES = {
  '': [
    'quotes-logos/logo_sg.webp',
    'quotes-logos/governance-leaders.webp',
    'wtc-buildings/wtc-building-01.jpg',
  ],
  'index-en.html': [
    'quotes-logos/logo_sg.webp',
    'quotes-logos/governance-leaders.webp',
    'wtc-buildings/wtc-building-01.jpg',
  ],
};

// lastmod 取最近一次 git 提交的日期（内容真实修改时间），避免每次构建漂移
let lastmod;
try {
  lastmod = execSync('git log -1 --format=%cI', { cwd: __dirname }).toString().trim().slice(0, 10);
} catch (e) {
  lastmod = new Date().toISOString().slice(0, 10);
}
const now = lastmod;

const urls = PAGES.map(p => {
  const imgs = (PAGE_IMAGES[p] || []).map(img =>
    `    <image:image>\n      <image:loc>${BASE}/${img}</image:loc>\n    </image:image>`).join('\n');
  return `  <url>
    <loc>${BASE}${p ? '/' + p : '/'}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
${imgs}
  </url>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;

fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), xml + '\n');
console.log('sitemap.xml generated for', BASE);

// ---- llms.txt 生成：固定文案常量 + PAGES 自动扫描 ----
function readMeta(rel) {
  try {
    const html = fs.readFileSync(path.join(__dirname, rel), 'utf8');
    const t = html.match(/<title>([\s\S]*?)<\/title>/i);
    const d = html.match(/<meta\s+name="description"\s+content="([\s\S]*?)"/i);
    let title = t ? t[1].trim() : '';
    title = title.replace(/^WTC Singapore\s*[|｜]\s*/i, '').trim(); // 去品牌前缀（中文 ciftis）
    title = title.replace(/\s*[|｜]\s*(WTC Singapore|世界贸易中心协会 WTCA 新加坡|World Trade Centers Association.*)$/i, '').trim(); // 去品牌后缀
    return { title, desc: d ? d[1].trim() : '' };
  } catch (e) {
    return { title: '', desc: '' };
  }
}

const SITE_INTRO = `# WTC Singapore Deck

世界贸易中心新加坡（WTC Singapore）介绍演示文稿的中英文双版本静态站点。`;

const ABOUT = `## 关于 WTC Singapore

新加坡世界贸易中心（WTC Singapore）是世界贸易中心协会（World Trade Centers Association, WTCA）在新加坡的成员机构。WTCA 是一个覆盖全球 90 多个国家与地区、300 多个城市的全球经贸网络，关联企业超过 100 万家。

WTC Singapore 依托 WTCA 的全球网络，为企业与机构提供核心服务、全球生态连接与跨境商机对接，助力企业拓展海外市场、对接国际资源与合作伙伴。

### 三大核心业务

1. **WTC ONE Club** — 面向企业高层与决策者的国际商业俱乐部与会员网络。
2. **GlobalX 出海加速器** — 助力企业拓展海外市场、对接国际资源与合作伙伴的出海加速器。
3. **WTC Fund** — 连接国际资本与创新的产业生态基金。`;

const SECRETARY = `## 关于秘书长

- 姓名：董立鑫（英文名 Bruce Dong）
- 职位：WTC Singapore Secretary-General & COO（秘书长兼首席运营官）
- LinkedIn：https://www.linkedin.com/in/donglixin

### 联系信息

- 办公地址（OFFICE ADDRESS）：6 Raffles Quay, Singapore
- 官方网站（OFFICIAL WEBSITE）：https://wtcasg.org
- 合作咨询邮箱（INQUIRY EMAIL）：partners@wtcasg.org`;

const PROJECT_STRUCTURE = `## 项目结构

- common.css / common.js — 全站共用样式与脚本
- generate-sitemap.js — 站点地图生成脚本
- grid/ waterfall/ wtc-buildings/ — 演示用图片资源
- logo/ — 标志与二维码资源`;

const DEPLOY = `## 部署

纯静态站点，由 GitHub Pages 从 GitHub 仓库 \`gtn-global/WTC-SG-site\`（分支 main，根路径 \`/\`）发布，自定义域名 \`wtcasg.org\`。根路径 \`/\` 直接展示 index.html（中文版），\`/index-en.html\` 为英文版。`;

const sitePages = [], journalPages = [], clubPages = [], casePages = [];
for (const p of PAGES) {
  const meta = readMeta(p || 'index.html');
  const entry = { url: BASE + (p ? '/' + p : '/'), title: meta.title };
  if (p.startsWith('club-apply/')) clubPages.push(entry);
  else if (p.startsWith('wtc-one-club/')) journalPages.push(entry);
  else if (p.startsWith('cases/')) casePages.push(entry);
  else sitePages.push(entry);
}

function section(title, entries) {
  if (!entries.length) return '';
  const lines = entries.map(e => `- ${e.title || e.url} — ${e.url}`).join('\n');
  return `## ${title}\n\n${lines}`;
}

const llms = [
  SITE_INTRO,
  ABOUT,
  section('秘书长手记（Secretary-General\'s Journal，董立鑫 Bruce Dong 第一人称记录）', journalPages),
  section('俱乐部申请', clubPages),
  section('案例研究', casePages),
  section('站点页面', sitePages),
  SECRETARY,
  PROJECT_STRUCTURE,
  DEPLOY,
].filter(Boolean).join('\n\n') + '\n';

fs.writeFileSync(path.join(__dirname, 'llms.txt'), llms);
console.log('llms.txt generated for', BASE);

