#!/usr/bin/env node
/**
 * WTC Singapore - 图片批处理脚本
 *
 * 目的：为 quotes-logos / wtc-buildings / waterfall / grid 等目录下的
 *       新增位图素材，自动生成：
 *         - 同名的 .webp（质量 82）
 *         - 按用途缩放的多尺寸版本（见 SIZES）
 *       原图保留，WebP 写入同目录。
 *
 * 用法：node tools/process-images.js [目录...]
 *   不传参数则处理默认目录列表。
 * 依赖：npm install（sharp）
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_DIRS = [
  'quotes-logos',
  'wtc-buildings',
  'waterfall',
  'grid',
  'logo'
];

// 常见用途尺寸（宽 px），height 按原始比例
const SIZES = [
  { suffix: '', width: null },       // 原尺寸（仅转 webp）
  { suffix: '@2x', width: 1600 },
  { suffix: '@1x', width: 800 }
];

const SUPPORTED = ['.png', '.jpg', '.jpeg'];

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => SUPPORTED.includes(path.extname(f).toLowerCase()))
    .map(f => path.join(dir, f));
}

async function processImage(file) {
  const ext = path.extname(file).toLowerCase();
  const base = file.slice(0, -ext.length);
  const tasks = [];
  for (const s of SIZES) {
    const outBase = s.suffix ? `${base}${s.suffix}` : base;
    const outWebp = `${outBase}.webp`;
    let pipe = sharp(file).webp({ quality: 82 });
    if (s.width) pipe = pipe.resize({ width: s.width, withoutEnlargement: true });
    tasks.push(pipe.toFile(outWebp));
  }
  await Promise.all(tasks);
  console.log(`✓ ${path.relative(ROOT, file)} → webp (${SIZES.length} 版本)`);
}

async function main() {
  const args = process.argv.slice(2);
  const dirs = args.length ? args : DEFAULT_DIRS;
  let count = 0;
  for (const d of dirs) {
    const abs = path.isAbsolute(d) ? d : path.join(ROOT, d);
    const imgs = listImages(abs);
    for (const img of imgs) {
      try { await processImage(img); count++; }
      catch (e) { console.error(`✗ 失败 ${img}: ${e.message}`); }
    }
  }
  console.log(`\n完成：共处理 ${count} 张图片`);
}

main();
