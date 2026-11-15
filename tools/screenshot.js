// Снимки игры через headless Chrome/Edge для визуальной инспекции.
// Запуск: node tools/screenshot.js [выходная_папка]
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(root, 'shots'));
fs.mkdirSync(out, { recursive: true });

const candidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
];
const browser = candidates.find((p) => fs.existsSync(p));
if (!browser) { console.error('Chrome/Edge не найден'); process.exit(1); }

const base = 'file:///' + path.join(root, 'index.html').replace(/\\/g, '/');
const shots = [
  ['demo.png', '?demo=1&mute'],
  ['title.png', '?mute'],
  ['bot-l3.png', '?level=3&bot=pro&speed=1&mute', 20000],
  ['bot-l7.png', '?level=7&bot=casual&speed=1&mute', 40000],
];
const only = process.env.SHOT;
for (const [name, q, budget] of shots) {
  if (only && !name.startsWith(only)) continue;
  const file = path.join(out, name);
  try { fs.unlinkSync(file); } catch (e) { /* нет файла */ }
  execFileSync(browser, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1230,1280', `--virtual-time-budget=${budget || 4000}`,
    `--user-data-dir=${path.join(require('os').tmpdir(), 'elina-shot-profile')}`,
    `--screenshot=${file}`, base + q,
  ], { stdio: 'ignore', timeout: 120000 });
  console.log(fs.existsSync(file) ? 'ok   ' + file : 'FAIL ' + file);
}
