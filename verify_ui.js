const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000');
    // Login if necessary
    const isLogin = await page.isVisible('input[type="password"]');
    if (isLogin) {
      await page.fill('input[type="password"]', 'refugio');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'initial_load.png' });
    console.log('Initial load screenshot taken.');

    // Check if Fiscal Health Guardian is present
    const auditorText = await page.textContent('body');
    if (auditorText.includes('Fiscal Health Guardian')) {
      console.log('Fiscal Health Guardian component found.');
    } else {
      console.log('Fiscal Health Guardian component NOT found.');
    }

  } catch (e) {
    console.error('Verification failed:', e);
  } finally {
    await browser.close();
  }
})();
