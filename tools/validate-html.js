#!/usr/bin/env node
/**
 * WTC Singapore - HTML 校验脚本
 *
 * 目的：在提交前本地校验 index.html / index-en.html，
 * 防止再次出现 Phase 1 那种 <link> 断裂、标签不匹配、属性缺失等问题。
 *
 * 用法：node tools/validate-html.js
 * 依赖：npm install（htmlhint）
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FILES = ['index.html', 'index-en.html'];

// htmlhint 规则（宽松但覆盖高风险项）
const RULES = {
  'tagname-lowercase': true,
  'attr-lowercase': true,
  'attr-value-double-quotes': true,
  'attr-value-not-empty': false,
  'doctype-first': true,
  'tag-pair': true,            // 标签必须成对（拦截未闭合 div/style/script）
  'spec-char-escape': false,
  'id-unique': true,
  'src-not-empty': true,
  'attr-no-duplication': true,
  'title-require': false,
  'head-script-disabled': false,
  'alt-require': true,         // 图片必须有 alt（无障碍）
  'inline-script-disabled': false,
  'inline-style-disabled': false
};

const RULES_FILE = path.join(ROOT, '.htmlhintrc');
fs.writeFileSync(RULES_FILE, JSON.stringify(RULES, null, 2));

let failed = false;
for (const f of FILES) {
  const fp = path.join(ROOT, f);
  if (!fs.existsSync(fp)) {
    console.error(`✗ 缺失文件: ${f}`);
    failed = true;
    continue;
  }
  console.log(`\n校验 ${f} ...`);
  try {
    const out = execFileSync(
      path.join(ROOT, 'node_modules', '.bin', 'htmlhint'),
      [fp, '--config', RULES_FILE],
      { encoding: 'utf8' }
    );
    console.log(out || `✓ ${f} 通过`);
  } catch (e) {
    failed = true;
    console.error(e.stdout || e.message);
    console.error(`✗ ${f} 存在 HTML 问题，请修复后再提交`);
  }
}

fs.unlinkSync(RULES_FILE);
process.exit(failed ? 1 : 0);
