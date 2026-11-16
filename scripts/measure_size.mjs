import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';

const execFileAsync = promisify(execFile);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Let's get the SVG inner content by running a script or headless dump
const htmlWithExtractor = fs.readFileSync('c:/Project/Neut-Studio/scripts/test_vertical.html', 'utf8')
  .replace('</body>', `<script>
    setTimeout(() => {
      const svg = document.querySelector('svg');
      if (svg) {
        const b = svg.getBoundingClientRect();
        console.log('SVG_SIZE:' + Math.ceil(b.width) + 'x' + Math.ceil(b.height));
      }
    }, 1500);
  </script></body>`);

fs.writeFileSync('c:/Project/Neut-Studio/scripts/test_measure.html', htmlWithExtractor);

const args = [
  '--headless',
  '--disable-gpu',
  '--virtual-time-budget=2000',
  '--enable-logging',
  '--v=1',
  'file:///C:/Project/Neut-Studio/scripts/test_measure.html'
];

execFileAsync(chromePath, args).then(() => {
  console.log('Done measuring');
}).catch(e => console.log('Measure err:', e.message));
