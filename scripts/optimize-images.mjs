import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const root = process.cwd();
const targetDirs = [
  'wtc-buildings',
  'waterfall',
  'grid',
  'club-apply',
  'wtc-one-club/journal-ciftis-2025',
  'quotes-logos'
];

const exts = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const maxWidth = 1920;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (exts.has(path.extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

async function optimizeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const input = await fs.readFile(filePath);
  const before = input.length;

  let img = sharp(input, { failOn: 'none' });
  const meta = await img.metadata();

  if (meta.width && meta.width > maxWidth) {
    img = img.resize({ width: maxWidth, withoutEnlargement: true });
  }

  let out;
  if (ext === '.jpg' || ext === '.jpeg') {
    out = await img.jpeg({ quality: 72, mozjpeg: true, progressive: true }).toBuffer();
  } else if (ext === '.png') {
    out = await img.png({ compressionLevel: 9, palette: true, effort: 8 }).toBuffer();
  } else {
    out = await img.webp({ quality: 72, effort: 6 }).toBuffer();
  }

  if (out.length < before) {
    await fs.writeFile(filePath, out);
    return { changed: true, before, after: out.length };
  }

  return { changed: false, before, after: before };
}

async function main() {
  const allFiles = [];
  for (const rel of targetDirs) {
    const abs = path.join(root, rel);
    try {
      allFiles.push(...(await walk(abs)));
    } catch {
      // ignore missing folders
    }
  }

  let totalBefore = 0;
  let totalAfter = 0;
  let changedCount = 0;

  for (const file of allFiles) {
    const res = await optimizeFile(file);
    totalBefore += res.before;
    totalAfter += res.after;
    if (res.changed) changedCount += 1;
  }

  const saved = totalBefore - totalAfter;
  console.log(`files_scanned=${allFiles.length}`);
  console.log(`files_changed=${changedCount}`);
  console.log(`before_mb=${(totalBefore / 1024 / 1024).toFixed(2)}`);
  console.log(`after_mb=${(totalAfter / 1024 / 1024).toFixed(2)}`);
  console.log(`saved_mb=${(saved / 1024 / 1024).toFixed(2)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
