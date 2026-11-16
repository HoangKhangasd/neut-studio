import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';

const execFileAsync = promisify(execFile);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function test() {
  const args = [
    '--headless',
    '--disable-gpu',
    '--virtual-time-budget=2000',
    '--force-device-scale-factor=2',
    '--window-size=2400,3200',
    '--screenshot=c:/Project/Neut-Studio/docs/images/01_master_erd_vertical.png',
    'file:///C:/Project/Neut-Studio/scripts/test_vertical.html'
  ];

  await execFileAsync(chromePath, args);
  const stat = fs.statSync('c:/Project/Neut-Studio/docs/images/01_master_erd_vertical.png');
  console.log(`Rendered vertical PNG: ${stat.size} bytes`);
}

test();
