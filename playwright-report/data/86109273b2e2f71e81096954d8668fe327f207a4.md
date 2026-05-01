# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task_analytics.spec.ts >> verify task analytics dashboard
- Location: tests/task_analytics.spec.ts:3:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Acceder")')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - navigation [ref=e2]:
    - list [ref=e3]:
      - listitem [ref=e4]:
        - link "Productividad" [ref=e5] [cursor=pointer]:
          - /url: /
          - img [ref=e7]
          - generic [ref=e12]: Productividad
      - listitem [ref=e14]:
        - link "Refugio" [ref=e15] [cursor=pointer]:
          - /url: /refugio
          - img [ref=e17]
          - generic [ref=e20]: Refugio
      - listitem [ref=e21]:
        - link "Planes" [ref=e22] [cursor=pointer]:
          - /url: /planes
          - img [ref=e24]
          - generic [ref=e27]: Planes
      - listitem [ref=e28]:
        - link "Mahjong" [ref=e29] [cursor=pointer]:
          - /url: /juego
          - img [ref=e31]
          - generic [ref=e33]: Mahjong
      - listitem [ref=e34]:
        - link "Historia" [ref=e35] [cursor=pointer]:
          - /url: /historia
          - img [ref=e37]
          - generic [ref=e40]: Historia
  - button "Open Next.js Dev Tools" [ref=e46] [cursor=pointer]:
    - img [ref=e47]
  - alert [ref=e50]
  - generic [ref=e51]:
    - generic:
      - generic:
        - img
      - generic:
        - img
    - generic [ref=e56]:
      - generic [ref=e57]:
        - img [ref=e59]
        - heading "Bienvenido" [level=1] [ref=e62]
        - paragraph [ref=e64]: Ingresa credencial
      - generic [ref=e65]:
        - generic [ref=e66]:
          - textbox "PALABRA CLAVE" [active] [ref=e67]: refugio
          - button [ref=e68]:
            - img [ref=e69]
        - button "Cambiar Perfil" [ref=e71]:
          - img [ref=e72]
          - text: Cambiar Perfil
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('verify task analytics dashboard', async ({ page }) => {
  4  |   // Login
  5  |   await page.goto('/');
  6  |   await page.click('text=Él');
  7  |   await page.fill('input[type="password"]', 'refugio');
> 8  |   await page.click('button:has-text("Acceder")');
     |              ^ Error: page.click: Test timeout of 30000ms exceeded.
  9  |
  10 |   // Navigate to analytics section (it's on the main dashboard)
  11 |   await expect(page.locator('text=Analítica de Operaciones')).toBeVisible();
  12 |
  13 |   // Add a task with estimated time and actual time to trigger analytics
  14 |   await page.fill('input[placeholder="Nueva operación..."]', 'Analytics Task');
  15 |   await page.fill('input[placeholder="Minutos Est."]', '100');
  16 |   await page.locator('button:has(svg.lucide-plus)').nth(1).click();
  17 |
  18 |   // Edit task to add actual time
  19 |   await page.locator('button:has(svg.lucide-pencil)').first().click();
  20 |   await page.locator('label:has-text("Act. (m)") + input').fill('120');
  21 |   await page.locator('button:has(svg.lucide-check)').click();
  22 |
  23 |   // Verify Analytics values
  24 |   // Inversión Total should be at least 120
  25 |   await expect(page.locator('text=120')).toBeVisible();
  26 |
  27 |   // Eficiencia Promedio (120/100 = 120%)
  28 |   await expect(page.locator('text=120%')).toBeVisible();
  29 |
  30 |   // Operación Mayor should show our task
  31 |   await expect(page.locator('text=Analytics Task')).toBeVisible();
  32 |
  33 |   // Take screenshot
  34 |   await page.screenshot({ path: 'task-analytics-verification.png', fullPage: true });
  35 | });
  36 |
```