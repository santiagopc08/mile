const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
  const logFile = path.join(__dirname, 'canvas_debug_results.txt');
  const screenshotPath = path.join(__dirname, 'canvas_debug_screenshot.png');
  let logContent = '=== CANVAS DEBUGGING LOG ===\n\n';

  const consoleErrors = [];
  const consoleLogs = [];
  const failedRequests = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // mobile viewport
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  // Bypass auth gate & midnight lock
  await page.addInitScript(() => {
    window.localStorage.setItem('mile_auth', 'true');
    window.localStorage.setItem('mile_profile', 'el');
  });

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    } else {
      consoleLogs.push(text);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  page.on('requestfailed', request => {
    failedRequests.push(`${request.url()}: ${request.failure() ? request.failure().errorText : 'failed'}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push(`${response.url()}: status ${response.status()}`);
    }
  });

  try {
    logContent += 'Navigating to http://localhost:3000/cumple...\n';
    await page.goto('http://localhost:3000/cumple', { waitUntil: 'networkidle' });

    // Wait for the ready phase and click the start button
    logContent += 'Waiting for "INICIAR PROTOCOLO" button...\n';
    const startButton = page.locator('button:has-text("INICIAR PROTOCOLO")');
    await startButton.waitFor({ timeout: 5000 });
    logContent += 'Clicking "INICIAR PROTOCOLO" button...\n';
    await startButton.click();

    // Wait for canvas to mount and render
    await page.waitForTimeout(1000);

    // Scroll down to Section 2
    logContent += 'Scrolling down to progress connection stats...\n';
    await page.evaluate(() => {
      window.scrollTo(0, window.innerHeight * 1.5);
    });
    
    await page.waitForTimeout(2000);

    // Take a screenshot
    logContent += 'Taking screenshot...\n';
    await page.screenshot({ path: screenshotPath });
    logContent += `Screenshot saved to ${screenshotPath}\n`;

    // Analyze the DOM
    logContent += '\n--- DOM Analysis ---\n';
    
    // Check for canvas elements in document.body
    const canvasesInfo = await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      return canvases.map((c, idx) => {
        const rect = c.getBoundingClientRect();
        return {
          index: idx,
          tagName: c.tagName,
          id: c.id,
          className: c.className,
          width: c.width,
          height: c.height,
          style: c.getAttribute('style'),
          parentTagName: c.parentElement ? c.parentElement.tagName : 'NONE',
          parentClassName: c.parentElement ? c.parentElement.className : 'NONE',
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          },
          visible: rect.width > 0 && rect.height > 0
        };
      });
    });

    logContent += `Found ${canvasesInfo.length} canvas element(s):\n`;
    logContent += JSON.stringify(canvasesInfo, null, 2) + '\n';

  } catch (err) {
    logContent += `\nERROR during execution: ${err.message}\n${err.stack}\n`;
  } finally {
    logContent += '\n--- Console Logs ---\n';
    logContent += consoleLogs.join('\n') + '\n';

    logContent += '\n--- Console Errors ---\n';
    logContent += consoleErrors.join('\n') + '\n';

    logContent += '\n--- Failed Requests ---\n';
    logContent += failedRequests.join('\n') + '\n';

    fs.writeFileSync(logFile, logContent);
    console.log('Done. Results written to scratch/canvas_debug_results.txt');
    await browser.close();
  }
}

run();
