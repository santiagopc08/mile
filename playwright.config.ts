import { defineConfig } from '@playwright/test';

/**
 * Configuración de la suite de tests.
 *
 * Sin este archivo `npx playwright test` no descubría nada: los 31 specs de
 * `tests/` existían pero reportaban "0 tests in 0 files", así que nadie se
 * enteró de que uno tenía marcadores de conflicto de merge sin resolver.
 *
 * Los specs de `tests/` son pruebas de lógica en Node (formateo, utilidades,
 * servicios con dobles), no de navegador. Se ejecutan con el runner de
 * Playwright pero sin lanzar Chromium, que es mucho más rápido. Si más adelante
 * se añaden pruebas de navegador reales, conviene separarlas en `e2e/` con su
 * propio proyecto y un `webServer` apuntando al dev server.
 */

// Supabase valida la URL al crear el cliente, y varios módulos lo crean al
// evaluarse. Sin estos valores la *recolección* de tests reventaba antes de
// ejecutar nada. Son dummies deliberados: ningún test debe tocar la red.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'test-anon-key';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.{ts,tsx}',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'dot' : 'list',

  // Lógica pura: un test que tarde más de 10s está colgado, no lento.
  timeout: 10_000,
  expect: { timeout: 5_000 },
});
