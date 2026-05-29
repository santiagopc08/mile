# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend.spec.ts >> verify geospatial tracker on /planes
- Location: tests/frontend.spec.ts:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Mapa de Planes')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Mapa de Planes')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
        - generic [ref=e43]: SELECCIÓN DE IDENTIDAD
        - heading "Espacio Seguro" [level=1] [ref=e44]
        - paragraph [ref=e45]: Selecciona Identidad
      - generic [ref=e47]:
        - button "ÉL" [ref=e48]:
          - img [ref=e50]
          - generic [ref=e53]: ÉL
        - button "ELLA" [ref=e55]:
          - img [ref=e57]
          - generic [ref=e61]: ELLA
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('verify geospatial tracker on /planes', async ({ page }) => {
  4  |   // Login first
  5  |   await page.goto('/');
  6  |   await page.click('text=Él');
  7  |   await page.fill('input[type="password"]', 'refugio');
  8  |   await page.locator('button[type="submit"]').click();
  9  |
  10 |   await page.goto('/planes');
  11 |
  12 |   // Wait for the tracker to appear
> 13 |   await expect(page.locator('text=Mapa de Planes')).toBeVisible();
     |                                                     ^ Error: expect(locator).toBeVisible() failed
  14 |
  15 |   // Check for the "Add Point" button
  16 |   await expect(page.locator('button:has-text("Agregar Punto")')).toBeVisible();
  17 |
  18 |   // Take screenshot
  19 |   await page.screenshot({ path: 'planes-map.png', fullPage: true });
  20 | });
  21 |
```