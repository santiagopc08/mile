# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: objectives_verification.spec.ts >> verify objectives management on productivity dashboard
- Location: tests/objectives_verification.spec.ts:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Gestión de Objetivos')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Gestión de Objetivos')

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
  - main [ref=e41]:
    - generic [ref=e43]:
      - generic [ref=e44]:
        - generic [ref=e46]:
          - generic [ref=e48]:
            - generic [ref=e49]:
              - generic [ref=e50]: ENFOQUE
              - generic [ref=e51]: CONECTADOS
            - button "Bandeja de alertas" [ref=e54]:
              - img [ref=e55]
          - heading "Eficiencia" [level=1] [ref=e58]
          - generic [ref=e59]:
            - paragraph [ref=e60]: Plataforma de gestión de operaciones, finanzas y tareas diarias.
            - generic [ref=e61]:
              - generic [ref=e62]:
                - generic [ref=e63]: "0"
                - generic [ref=e64]: Tareas
              - generic [ref=e65]:
                - generic [ref=e66]: "0"
                - generic [ref=e67]: Activas
              - generic [ref=e68]:
                - generic [ref=e69]: 0%
                - generic [ref=e70]: Enfoque
        - generic [ref=e71]:
          - button "Operaciones 01" [ref=e72]:
            - generic [ref=e73]:
              - img [ref=e74]
              - generic [ref=e77]: Operaciones
            - generic [ref=e78]: "01"
          - button "Finanzas 02" [ref=e80]:
            - generic [ref=e81]:
              - img [ref=e82]
              - generic [ref=e86]: Finanzas
            - generic [ref=e87]: "02"
      - generic [ref=e88]:
        - generic [ref=e89]:
          - generic [ref=e90]:
            - generic:
              - img
          - generic [ref=e92]:
            - paragraph [ref=e93]: Plataforma de gestión
            - heading "Ejecución y planeación" [level=2] [ref=e94]
          - img [ref=e95]
        - generic [ref=e97]:
          - generic:
            - img
          - generic [ref=e99]:
            - generic [ref=e100]:
              - generic [ref=e101]:
                - generic [ref=e102]: "> ANCLAJE_DE_OPERACIÓN"
                - button "SELECCIONAR_OBJETIVO..." [ref=e103]:
                  - generic [ref=e104]: SELECCIONAR_OBJETIVO...
                  - img [ref=e105]
              - generic [ref=e107]:
                - generic [ref=e108]:
                  - generic [ref=e109]: CUOTA_TEMPORAL
                  - generic [ref=e110]:
                    - spinbutton [ref=e111]: "25"
                    - generic [ref=e112]: MIN
                - slider [ref=e113] [cursor=pointer]: "26"
                - generic [ref=e115]:
                  - 'generic "Enfoque: 25 min" [ref=e117]':
                    - img [ref=e119]
                  - generic [ref=e125]: 01 / 01 MODULOS
            - button "INICIAR" [ref=e127]:
              - img [ref=e128]
              - generic [ref=e130]: INICIAR
        - generic [ref=e133]:
          - generic:
            - img
          - heading "NUESTRAS TAREAS Y OBJETIVOS CONECTADOS // EN LÍNEA" [level=2] [ref=e134]:
            - generic [ref=e135]: NUESTRAS TAREAS Y OBJETIVOS
            - generic [ref=e136]: CONECTADOS // EN LÍNEA
          - generic [ref=e137]:
            - generic [ref=e141]:
              - textbox "NUEVO OBJETIVO" [ref=e142]
              - button [ref=e143]:
                - img [ref=e144]
            - generic [ref=e145]:
              - generic [ref=e146]:
                - heading "PEND 0" [level=4] [ref=e147]:
                  - generic [ref=e148]: PEND
                  - generic [ref=e150]: "0"
                - button "ADD" [ref=e152]:
                  - img [ref=e153]
                  - text: ADD
              - heading "ACTIVO 0" [level=4] [ref=e155]:
                - generic [ref=e156]: ACTIVO
                - generic [ref=e158]: "0"
              - heading "HECHO 0" [level=4] [ref=e161]:
                - generic [ref=e162]: HECHO
                - generic [ref=e164]: "0"
              - heading "SKIP 0" [level=4] [ref=e167]:
                - generic [ref=e168]: SKIP
                - generic [ref=e170]: "0"
        - generic [ref=e172]:
          - generic:
            - img
          - heading "RESUMEN DE NUESTRO PROGRESO" [level=2] [ref=e173]: RESUMEN DE NUESTRO PROGRESO
        - generic [ref=e175]:
          - generic:
            - img
          - heading "BITÁCORA DE ACTIVIDAD COMPARTIDA" [level=2] [ref=e176]: BITÁCORA DE ACTIVIDAD COMPARTIDA
          - generic [ref=e180]:
            - img [ref=e181]
            - paragraph [ref=e183]: Ningún evento registrado en la bitácora aún
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('verify objectives management on productivity dashboard', async ({ page }) => {
  4  |   // Login
  5  |   await page.goto('/');
  6  |   await page.click('text=Él');
  7  |   await page.fill('input[type="password"]', 'refugio');
  8  |   await page.locator('button[type="submit"]').click();
  9  |
  10 |   // Verify "Gestión de Objetivos" header
> 11 |   await expect(page.locator('text=Gestión de Objetivos')).toBeVisible();
     |                                                           ^ Error: expect(locator).toBeVisible() failed
  12 |
  13 |   // Add an objective
  14 |   await page.fill('placeholder="Nuevo objetivo..."', 'Test Objective');
  15 |   await page.click('button:has(svg)'); // The Plus button
  16 |
  17 |   // Verify objective is listed
  18 |   await expect(page.locator('text=Test Objective')).toBeVisible();
  19 |
  20 |   // Add a task assigned to the objective
  21 |   await page.fill('placeholder="Nueva operación..."', 'Test Task');
  22 |   await page.selectOption('select', { label: 'Test Objective' });
  23 |   await page.click('button:has(svg)'); // The Plus button for tasks
  24 |
  25 |   // Verify task card shows the objective
  26 |   await expect(page.locator('text=#Test Objective')).toBeVisible();
  27 |
  28 |   // Take screenshot
  29 |   await page.screenshot({ path: 'objectives-verification.png', fullPage: true });
  30 | });
  31 |
```