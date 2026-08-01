import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PacmanConfig } from '../../src/pacman/PacmanConfig.js';
import { PacmanBalance } from '../../src/pacman/PacmanBalance.js';
import { PacmanEvents } from '../../src/pacman/PacmanEvents.js';
import {
  TileType,
  PluginState,
  GhostType,
  GhostState,
  PelletType,
} from '../../src/pacman/PacmanConstants.js';

const SRC_ROOT = fileURLToPath(new URL('../../src', import.meta.url));
const PACMAN_DIR = join(SRC_ROOT, 'pacman');

/**
 * Tablas congeladas indexadas por clave, junto al módulo del que provienen.
 *
 * Una clave inexistente no lanza: devuelve undefined y se propaga como NaN en
 * aritmética, o como el canal de eventos `undefined` en EventBus, donde todos
 * los emits sin clave caen en el mismo bucket y los handlers reciben payloads
 * ajenos. Ambos fallos son silenciosos.
 *
 * La comprobación sigue el import real de cada archivo, no el nombre de la
 * variable: existe un `src/apps/pacman/PacmanEvents.js` paralelo con claves
 * distintas, y compararlo contra esta tabla daría falsos positivos.
 */
const TABLES = [
  { name: 'PacmanConfig', module: join(PACMAN_DIR, 'PacmanConfig.js'), value: PacmanConfig },
  { name: 'PacmanBalance', module: join(PACMAN_DIR, 'PacmanBalance.js'), value: PacmanBalance },
  { name: 'PacmanEvents', module: join(PACMAN_DIR, 'PacmanEvents.js'), value: PacmanEvents },
  { name: 'TileType', module: join(PACMAN_DIR, 'PacmanConstants.js'), value: TileType },
  { name: 'PluginState', module: join(PACMAN_DIR, 'PacmanConstants.js'), value: PluginState },
  { name: 'GhostType', module: join(PACMAN_DIR, 'PacmanConstants.js'), value: GhostType },
  { name: 'GhostState', module: join(PACMAN_DIR, 'PacmanConstants.js'), value: GhostState },
  { name: 'PelletType', module: join(PACMAN_DIR, 'PacmanConstants.js'), value: PelletType },
];

const EXTENSIONS = ['.js', '.jsx'];

function collectSourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectSourceFiles(full, out);
    else if (EXTENSIONS.includes(extname(entry))) out.push(full);
  }
  return out;
}

function resolveSpecifier(specifier, fromFile) {
  if (!specifier.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [base, ...EXTENSIONS.map((e) => base + e), ...EXTENSIONS.map((e) => join(base, `index${e}`))];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const NAMED_IMPORT = /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;

/** Devuelve los nombres de TABLES que este archivo importa del módulo correcto. */
function tablesImportedBy(file, source) {
  const bound = [];
  for (const match of source.matchAll(NAMED_IMPORT)) {
    const [, clause, specifier] = match;
    const target = resolveSpecifier(specifier, file);
    if (!target) continue;

    const names = clause
      .split(',')
      .map((part) => part.trim().split(/\s+as\s+/)[0].trim())
      .filter(Boolean);

    for (const table of TABLES) {
      if (target === table.module && names.includes(table.name)) bound.push(table);
    }
  }
  return bound;
}

describe('integridad de las tablas indexadas por clave de Pac-Man', () => {
  const files = collectSourceFiles(SRC_ROOT);
  const misses = [];
  let checkedFiles = 0;

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const bound = tablesImportedBy(file, source);
    if (bound.length === 0) continue;
    checkedFiles += 1;

    for (const table of bound) {
      const pattern = new RegExp(`\\b${table.name}\\.([A-Z][A-Z0-9_]*)\\b`, 'g');
      for (const match of source.matchAll(pattern)) {
        const key = match[1];
        if (!(key in table.value)) {
          const line = source.slice(0, match.index).split('\n').length;
          misses.push(`${relative(SRC_ROOT, file)}:${line} → ${table.name}.${key}`);
        }
      }
    }
  }

  it('no lee ninguna clave inexistente', () => {
    expect(misses).toEqual([]);
  });

  it('inspecciona los archivos que consumen esas tablas', () => {
    // Guard contra una resolución de imports rota que haga pasar el test vacío.
    expect(checkedFiles).toBeGreaterThan(5);
  });
});

describe('PacmanBalance', () => {
  it('expone todos los valores como números finitos', () => {
    for (const [key, value] of Object.entries(PacmanBalance)) {
      expect(typeof value, `${key} debe ser número`).toBe('number');
      expect(Number.isFinite(value), `${key} debe ser finito`).toBe(true);
    }
  });

  it('mantiene el orden de velocidades del Pac-Man clásico', () => {
    expect(PacmanBalance.GHOST_FRIGHTENED_SPEED).toBeLessThan(PacmanBalance.GHOST_NORMAL_SPEED);
    expect(PacmanBalance.GHOST_NORMAL_SPEED).toBeLessThan(PacmanBalance.PACMAN_SPEED);
    expect(PacmanBalance.PACMAN_SPEED).toBeLessThan(PacmanBalance.GHOST_EYES_SPEED);
  });

  it('no solapa responsabilidades con PacmanConfig', () => {
    const overlap = Object.keys(PacmanBalance).filter((key) => key in PacmanConfig);
    expect(overlap).toEqual([]);
  });
});

describe('PacmanEvents', () => {
  it('no repite valores entre eventos', () => {
    // Dos claves con el mismo valor comparten canal en el EventBus.
    const values = Object.values(PacmanEvents);
    expect(new Set(values).size).toBe(values.length);
  });

  it('define un valor no vacío para cada clave', () => {
    for (const [key, value] of Object.entries(PacmanEvents)) {
      expect(typeof value, `${key} debe ser string`).toBe('string');
      expect(value.length, `${key} no puede ser vacío`).toBeGreaterThan(0);
    }
  });
});
