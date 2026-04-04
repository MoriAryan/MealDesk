import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function replaceInFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content
    .replace(/bg-\[var\(--c-bg\)\]/g, 'bg-bg')
    .replace(/bg-\[var\(--c-panel\)\]/g, 'bg-panel')
    .replace(/bg-\[var\(--c-panel-2\)\]/g, 'bg-panel')
    .replace(/text-\[var\(--c-ink\)\]/g, 'text-ink')
    .replace(/text-\[var\(--c-muted\)\]/g, 'text-muted')
    .replace(/border-\[var\(--c-border\)\]/g, 'border-border')
    .replace(/var\(--c-accent\)/g, 'var(--color-accent)')
    .replace(/var\(--c-bg\)/g, 'var(--color-bg)')
    .replace(/var\(--c-panel\)/g, 'var(--color-panel)')
    .replace(/var\(--c-panel-2\)/g, 'var(--color-panel)')
    .replace(/var\(--c-ink\)/g, 'var(--color-ink)')
    .replace(/var\(--c-muted\)/g, 'var(--color-muted)')
    .replace(/var\(--c-border\)/g, 'var(--color-border)')
    .replace(/var\(--font-ui\)/g, 'var(--font-sans)')
    .replace(/var\(--font-head\)/g, 'var(--font-sans)');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

walkDir('./src', replaceInFile);
console.log('Done replacing old CSS classes.');
