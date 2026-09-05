/**
 * 生成 sitemap.xml 与 llms.txt —— 纯静态站点，自动扫目录，无需手写页面清单。
 * 用法: node generate-sitemap.js [BASE_URL]
 *   不传 BASE_URL 时用下方 DEFAULT_BASE。
 *
 * 扫描规则（与 GTN 站一致）：
 *  - 根目录 index.html          -> BASE + '/'
 *  - 根目录 xxx.html（非 index） -> BASE + '/xxx.html'
 *  - 含 index.html 的子目录      -> BASE + '/' + 目录名 + '/'
 *  - 资源目录（SKIP_DIRS）与图片/css/js 等文件一律跳过，不进 sitemap。
 *
 * ⚠️ 此脚本只读扫描，绝不修改任何页面内容。新增页面只要按现有目录规矩放好，
 *    重跑本脚本即自动进 sitemap / llms.txt，无需再维护任何清单。
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEFAULT_BASE = 'https://wtcasg.org';
const BASE = (process.argv[2] || DEFAULT_BASE).replace(/\/$/, '');

// 这些目录是静态资源/非页面，跳过（不进 sitemap）
const SKIP_DIRS = new Set([
  'logo', 'grid', 'waterfall', 'wtc-buildings', 'quotes-logos', 'ogimage',
  'fonts', 'scripts', 'tools', 'node_modules', '.git', '.codebuddy',
]);

// 这些扩展名不是页面，跳过
const SKIP_EXT = new Set([
  '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.webp', '.gif',
  '.svg', '.ico', '.woff', '.woff2', '.ttf', '.md', '.db', '.php',
  '.map', '.min.css', '.min.js',
]);

// 递归扫描，返回相对仓库根的真实页面路径（不含开头的 ./）
function scanPages(dir, rel) {
  let results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return results;
  }
  for (const ent of entries) {
    const name = ent.name;
    if (name.startsWith('.')) continue; // 隐藏文件/目录
    if (name.startsWith('_')) continue;                       // _demo 等开发/演示目录
    if (name.includes('_demo')) continue;                    // journal-entry-template_demo 等模板
    if (/^(google|baidu)[a-z0-9_-]*\.html$/i.test(name)) continue; // 搜索引擎验证文件，非页面
    const full = path.join(dir, name);
    const relPath = rel ? path.join(rel, name) : name;
    if (/signature-dong/i.test(relPath)) continue;           // 签名演示页（待确认，默认排除）
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      results = results.concat(scanPages(full, relPath));
    } else if (ent.isFile()) {
      if (!name.endsWith('.html')) continue;
      if (SKIP_EXT.has(path.extname(name))) continue;
      // 只收入口页：根 index.html、根非 index 的 xxx.html、含 index.html 的子目录
      if (name === 'index.html') {
        results.push(relPath); // 形如 'cases/materials/index.html'
      } else if (rel === '') {
        results.push(name);    // 根目录的 xxx.html（非 index）
      }
      // 子目录下的非 index.html（如 one-club-journal.html）也收，确保不漏真实页面
      else if (name !== 'index.html' && name.endsWith('.html')) {
        results.push(relPath);
      }
    }
  }
  return results;
}

// 把扫描到的文件路径转成用于 PAGES 的"相对 URL 路径"（去 .html 后缀，保留结尾 /）
function toPageKey(relPath) {
  const p = relPath.split(path.sep).join('/');
  if (p === 'index.html') return '';
  if (p.endsWith('/index.html')) return '/' + p.slice(0, -'index.html'.length);
  if (p.endsWith('.html')) return '/' + p.slice(0, -'.html'.length);
  return '/' + p;
}

const found = scanPages(__dirname, '');
// 去重并规范成 pages（key=URL 路径，根首页为 ''；file=实际 html 相对路径）
const seen = new Set();
const pages = [];
for (const relPath0 of found) {
  const sep = relPath0.split(path.sep).join('/');
  let key = toPageKey(sep);
  if (key === '/index') key = '';
  if (seen.has(key)) continue;
  seen.add(key);
  pages.push({ key, file: sep });
}
pages.sort((a, b) => a.key.localeCompare(b.key));

// 每个页面关联的代表性图片（用于 sitemap image 扩展，提升图片搜索可见性）
const PAGE_IMAGES = {
  '': [
    'quotes-logos/logo_sg.webp',
    'quotes-logos/governance-leaders.webp',
    'wtc-buildings/01_washington_wtc.jpg',
  ],
  '/index-en': [
    'quotes-logos/logo_sg.webp',
    'quotes-logos/governance-leaders.webp',
    'wtc-buildings/01_washington_wtc.jpg',
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

// 页面优先级分级：首页最高，列表/申请类次之，详情/文章页最低
function priorityOf(key) {
  if (key === '' || key === '/index-en') return '1.0';
  if (key.startsWith('/club-apply/') || key.startsWith('/cases/case-list')) return '0.8';
  if (key.startsWith('/cases/')) return '0.7';
  return '0.6';
}

const urls = pages.map(({ key }) => {
  const imgs = (PAGE_IMAGES[key] || []).map(img =>
    `    <image:image>\n      <image:loc>${BASE}/${img}</image:loc>\n    </image:image>`).join('\n');
  return `  <url>
    <loc>${BASE}${key === '' ? '/' : key}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priorityOf(key)}</priority>
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
console.log('sitemap.xml generated for', BASE, '(' + pages.length + ' pages)');

// ---- llms.txt 生成：固定文案常量 + 自动扫描 ----
function readMeta(file) {
  try {
    const html = fs.readFileSync(path.join(__dirname, file), 'utf8');
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
for (const { key, file } of pages) {
  const meta = readMeta(file);
  const entry = { url: BASE + (key ? '/' + key : '/'), title: meta.title };
  if (key.startsWith('/club-apply/')) clubPages.push(entry);
  else if (key.startsWith('/wtc-one-club/')) journalPages.push(entry);
  else if (key.startsWith('/cases/')) casePages.push(entry);
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

