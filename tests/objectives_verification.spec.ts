import { test, expect } from '@playwright/test';

test('verify objectives management on productivity dashboard', async ({ page }) => {
  // Login
  await page.goto('/');
  await page.click('text=Él');
  await page.fill('input[type="password"]', 'refugio');
  await page.click('button:has-text("Acceder")');

  // Verify "Gestión de Objetivos" header
  await expect(page.locator('text=Gestión de Objetivos')).toBeVisible();

  // Add an objective
  await page.fill('placeholder="Nuevo objetivo..."', 'Test Objective');
  await page.click('button:has(svg)'); // The Plus button

  // Verify objective is listed
  await expect(page.locator('text=Test Objective')).toBeVisible();

  // Add a task assigned to the objective
  await page.fill('placeholder="Nueva operación..."', 'Test Task');
  await page.selectOption('select', { label: 'Test Objective' });
  await page.click('button:has(svg)'); // The Plus button for tasks

  // Verify task card shows the objective
  await expect(page.locator('text=#Test Objective')).toBeVisible();

  // Take screenshot
  await page.screenshot({ path: 'objectives-verification.png', fullPage: true });
});
