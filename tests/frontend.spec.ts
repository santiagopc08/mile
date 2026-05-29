import { test, expect } from '@playwright/test';

test('verify geospatial tracker on /planes', async ({ page }) => {
  // Login first
  await page.goto('/');
  await page.click('text=Él');
  await page.fill('input[type="password"]', 'refugio');
  await page.locator('button[type="submit"]').click();

  await page.goto('/planes');

  // Wait for the tracker to appear
  await expect(page.locator('text=Mapa de Planes')).toBeVisible();

  // Check for the "Add Point" button
  await expect(page.locator('button:has-text("Agregar Punto")')).toBeVisible();

  // Take screenshot
  await page.screenshot({ path: 'planes-map.png', fullPage: true });
});
