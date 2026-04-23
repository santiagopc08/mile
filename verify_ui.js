const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Login first
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(5000);

  const passwordInput = await page.$('input[type="password"]');
  if (passwordInput) {
    console.log('Login found, logging in...');
    await passwordInput.fill('refugio');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
  }

  // Check navigation
  console.log('Checking navigation items...');
  const navText = await page.innerText('nav');
  console.log('Nav content:', navText);

  // Take screenshots
  await page.screenshot({ path: 'screenshot_home.png' });

  console.log('Visiting /refugio...');
  await page.goto('http://localhost:3000/refugio');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshot_refugio.png' });

  console.log('Visiting /planes...');
  await page.goto('http://localhost:3000/planes');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshot_planes.png' });

  await browser.close();
})();
