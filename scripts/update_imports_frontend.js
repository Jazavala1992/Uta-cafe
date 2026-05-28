const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'frontend', 'src');

function walk(dir) {
  const res = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) res.push(...walk(p));
    else if (/\.(tsx?|jsx?)$/.test(name)) res.push(p);
  }
  return res;
}

function toAlias(importPath, fileDir) {
  if (!importPath.startsWith('.')) return null;
  const abs = path.resolve(fileDir, importPath);
  if (!abs.startsWith(src)) return null;
  const rel = path.relative(src, abs).replace(/\\\\/g, '/');
  return `@src/${rel}`;
}

const files = walk(src);
let changed = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  const newContent = content.replace(/(import\s+[\s\S]*?from\s+['\"])(\.\.\/[^'\"]+)(['\"])/g, (m, p1, p2, p3) => {
    const candidate = toAlias(p2, dir);
    if (candidate) {
      changed++;
      return p1 + candidate + p3;
    }
    return m;
  });
  if (newContent !== content) fs.writeFileSync(file, newContent, 'utf8');
}
console.log('Files processed:', files.length);
console.log('Replacements made:', changed);
process.exit(0);
