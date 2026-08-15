#!/usr/bin/env node
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

// 站点内所有公开页面（相对路径，不含前导斜杠）
const PAGES = [
  'index.html',
  'index-en.html',
];

// lastmod 取最近一次 git 提交的日期（内容真实修改时间），避免每次构建漂移
let lastmod;
try {
  lastmod = execSync('git log -1 --format=%cI', { cwd: __dirname }).toString().trim().slice(0, 10);
} catch (e) {
  lastmod = new Date().toISOString().slice(0, 10);
}
const now = lastmod;

const urls = PAGES.map(p => `  <url>
    <loc>${BASE}/${p}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>`).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), xml + '\n');
console.log('sitemap.xml generated for', BASE);
