import fs from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';

const svgPath = 'c:/Project/Neut-Studio/docs/images/01_master_erd.svg';
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Parse width / height / viewBox
const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
let width = 2400;
let height = 1600;

if (viewBoxMatch) {
  const parts = viewBoxMatch[1].split(/[\s,]+/).map(Number);
  if (parts.length === 4) {
    width = Math.ceil(parts[2]) + 80;
    height = Math.ceil(parts[3]) + 80;
  }
}

console.log(`Detected SVG dimensions: ${width} x ${height}`);

// Create an HTML wrapper
const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #ffffff;
      padding: 40px;
      display: inline-block;
    }
    svg {
      display: block;
      background: #ffffff;
    }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;

const tempHtmlPath = 'c:/Project/Neut-Studio/docs/images/temp_erd_render.html';
fs.writeFileSync(tempHtmlPath, html, 'utf8');

const outPngPath = 'c:/Project/Neut-Studio/docs/images/01_master_erd.png';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const targetWidth = Math.max(width, 2400);
const targetHeight = Math.max(height, 1600);

console.log(`Rendering via Chrome headless at ${targetWidth}x${targetHeight}...`);

const args = [
  '--headless',
  '--disable-gpu',
  '--force-device-scale-factor=2',
  `--window-size=${targetWidth},${targetHeight}`,
  `--screenshot=${outPngPath}`,
  `file:///${tempHtmlPath.replace(/\\/g, '/')}`
];

execFile(chromePath, args, (error, stdout, stderr) => {
  if (error) {
    console.error('Error running Chrome:', error);
    return;
  }
  const stat = fs.statSync(outPngPath);
  console.log(`SUCCESS! Generated ultra-crisp PNG: ${outPngPath} (${stat.size} bytes)`);
  
  // Clean up temp HTML
  try { fs.unlinkSync(tempHtmlPath); } catch {}
});
