# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: time_accounting.spec.ts >> verify time accounting system
- Location: tests/time_accounting.spec.ts:3:5

# Error details

```
Error: page.fill: Unknown engine "placeholder" while parsing selector placeholder="Nuevo objetivo..."
Call log:
  - waiting for locator('placeholder="Nuevo objetivo..."')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - complementary [ref=e2]:
    - generic [ref=e3]: OC
    - 'link "Día a Día: Tareas" [ref=e4] [cursor=pointer]':
      - /url: /
      - img [ref=e5]
    - 'link "Refugio: Nosotros" [ref=e10] [cursor=pointer]':
      - /url: /refugio
      - img [ref=e11]
    - 'link "Antojos: Deseos" [ref=e14] [cursor=pointer]':
      - /url: /planes
      - img [ref=e15]
    - 'link "Salud: Bienestar" [ref=e18] [cursor=pointer]':
      - /url: /salud
      - img [ref=e19]
    - 'link "Juego: Memoria" [ref=e21] [cursor=pointer]':
      - /url: /juego
      - img [ref=e22]
  - button "Open Next.js Dev Tools" [ref=e29] [cursor=pointer]:
    - img [ref=e30]
  - alert [ref=e33]
  - generic [ref=e34]:
    - generic:
      - generic:
        - img
      - generic:
        - img
      - generic:
        - img
      - generic:
        - img
      - generic:
        - img
      - generic:
        - generic:
          - generic:
            - generic: SYS
            - generic: OK
    - generic:
      - generic: CONEXIÓN SEGURA // EN LÍNEA
      - generic: "COORD: 04°35'56\"N 74°04'51\"W"
      - generic: "MODO SEGURO ACTIVO: SÍ"
      - generic: Sincronía Enlace v1.0.4
    - generic [ref=e36]:
      - generic [ref=e37]: ACCESO 01
      - generic [ref=e38]:
        - img [ref=e40]
        - generic [ref=e42]: SELECCIÓN DE IDENTIDAD
        - heading "Santiago" [level=1] [ref=e43]
        - paragraph [ref=e44]: Confirmar Acceso
      - generic [ref=e46]:
        - generic [ref=e48]:
          - textbox "CONTRASEÑA" [ref=e49]: refugio
          - button [active] [ref=e50]:
            - img [ref=e51]
        - button "Elegir otro perfil" [ref=e53]:
          - img [ref=e54]
          - text: Elegir otro perfil
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('verify time accounting system', async ({ page }) => {
  4  |   // Login
  5  |   await page.goto('/');
  6  |   await page.click('text=Él');
  7  |   await page.fill('input[type="password"]', 'refugio');
  8  |   await page.locator('button[type="submit"]').click();
  9  |
  10 |   // Add an objective
> 11 |   await page.fill('placeholder="Nuevo objetivo..."', 'Time Test Obj');
     |              ^ Error: page.fill: Unknown engine "placeholder" while parsing selector placeholder="Nuevo objetivo..."
  12 |   await page.locator('button:has(svg)').first().click(); // First Plus button is for objectives
  13 |
  14 |   // Add a task with estimated time
  15 |   await page.fill('placeholder="Nueva operación..."', 'Timed Task');
  16 |   await page.selectOption('select', { label: 'Time Test Obj' });
  17 |   await page.fill('placeholder="Minutos Est."', '60');
  18 |   await page.locator('button:has(svg)').nth(1).click(); // Second Plus button is for tasks
  19 |
  20 |   // Verify task ratio badge (0/60m)
  21 |   await expect(page.locator('text=0/60m')).toBeVisible();
  22 |
  23 |   // Edit task to add actual time
  24 |   await page.click('button:has(svg.lucide-pencil)');
  25 |   await page.fill('label:has-text("Act. (m)") + input', '75');
  26 |   await page.click('button:has(svg.lucide-check)');
  27 |
  28 |   // Verify task ratio badge updated (75/60m) and should have red color logic (checked via class/style)
  29 |   const badge = page.locator('text=75/60m');
  30 |   await expect(badge).toBeVisible();
  31 |   await expect(badge).toHaveClass(/border-red-500/);
  32 |
  33 |   // Verify objective progress bar and ratio (75/60m)
  34 |   await expect(page.locator('text=75/60m').first()).toBeVisible(); // The one in objective card
  35 |
  36 |   // Take screenshot
  37 |   await page.screenshot({ path: 'time-accounting-verification.png', fullPage: true });
  38 | });
  39 |
```