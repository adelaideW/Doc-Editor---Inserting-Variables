import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outPath = path.resolve(root, 'screenshots/v35-variable-search-4k.png');

function chip(label, id = label.toLowerCase().replace(/\s+/g, '-')) {
  const del = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="opacity-60 pointer-events-none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
  return `<span class="variable-chip inline-flex items-center px-2 py-0.5 mx-0.5 rounded bg-[#7A005D]/5 border border-[#7A005D]/20 text-[14px] text-[#7A005D] font-medium select-none align-baseline leading-tight transition-all duration-200 cursor-default group" contenteditable="false" data-variable="${label}" data-variable-id="${id}" data-variable-path="${label}" data-variable-description="${label}" data-needs-recipient="false"><span class="pointer-events-none">${label}</span><div class="mx-1.5 w-[1px] h-3 bg-[#7A005D]/20 pointer-events-none"></div><button class="chip-delete-btn p-0.5 rounded hover:bg-[#7A005D]/10 transition-colors flex items-center justify-center cursor-pointer" type="button">${del}</button></span>`;
}

const demoHtml = `
<p><strong>HR System One-Off Document Request</strong></p>
<p><br></p>
<p><strong>Document Title</strong></p>
<p>Country ${chip('Country', 'emp.country')}</p>
<p><br></p>
<p><strong>Background</strong></p>
<p>Title ${chip('Title', 'emp.title')} Manager Name ${chip('Manager Name', 'emp.manager-name')} Date of birth ${chip('Date of birth', 'emp.dob')}</p>
<p><br></p>
<p>Country ${chip('Country', 'emp.country-2')} Employee home full address ${chip('Employee home full address', 'emp.home-address')}<span id="caret-anchor"></span></p>
`.trim();

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {
        /* retry */
      }
      if (Date.now() - start > timeoutMs) reject(new Error('Dev server did not start'));
      else setTimeout(tick, 400);
    };
    tick();
  });
}

const dev = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5198'], {
  cwd: root,
  stdio: 'pipe',
  shell: true,
});

try {
  await waitForServer('http://127.0.0.1:5198');
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 3840, height: 2160 },
    deviceScaleFactor: 1,
  });

  await page.goto('http://127.0.0.1:5198', { waitUntil: 'networkidle' });

  const editor = page.locator('[contenteditable="true"]').first();
  await editor.waitFor({ state: 'visible' });

  await page.evaluate((html) => {
    const ed = document.querySelector('[contenteditable="true"]');
    if (!ed) return;
    ed.innerHTML = html;
    ed.dispatchEvent(new Event('input', { bubbles: true }));
  }, demoHtml);

  await page.evaluate(() => {
    const anchor = document.getElementById('caret-anchor');
    const ed = document.querySelector('[contenteditable="true"]');
    if (!anchor || !ed) return;
    const range = document.createRange();
    range.setStartAfter(anchor);
    range.collapse(true);
    anchor.remove();
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    ed.focus();
  });

  await page.keyboard.type('/');
  await page.waitForSelector('text=Write with AI', { timeout: 5000 });
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(150);
  await page.keyboard.press('Enter');
  await page.waitForSelector('text=Insert variables', { timeout: 5000 });
  await page.waitForTimeout(200);
  await page.keyboard.type('employe');
  await page.waitForSelector('text=Searching:', { timeout: 5000 });
  await page.waitForTimeout(600);

  await page.locator('[contenteditable="true"]').first().scrollIntoViewIfNeeded();

  await page.screenshot({ path: outPath, type: 'png', fullPage: false });
  await browser.close();
  console.log(`Saved 4K screenshot: ${outPath}`);
} finally {
  dev.kill('SIGTERM');
}
