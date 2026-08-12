#!/usr/bin/env node
/**
 * 生成 sitemap.xml —— 纯静态站点，手动列出页面。
 * 用法: node generate-sitemap.js [BASE_URL]
 *   不传 BASE_URL 时用下方 DEFAULT_BASE。
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_BASE = 'https://wtc-sg-site.netlify.app';
const BASE = (process.argv[2] || DEFAULT_BASE).replace(/\/$/, '');

// 站点内所有公开页面（相对路径，不含前导斜杠）
const PAGES = [
  'WTC-SG-Deck-CN.html',
  'WTC-SG-Deck-EN.html',
];

const now = new Date().toISOString().slice(0, 10);

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
