#!/usr/bin/env node
/**
 * Reporte de alcanzabilidad de módulos.
 *
 * Recorre el grafo de imports desde cada entry point declarado y reporta qué
 * archivos de src/ no llega a tocar nadie. Sirve para mantener honesta la
 * frontera entre el árbol que realmente se ejecuta y el laboratorio.
 *
 * Uso:  node scripts/reachability.mjs [--list] [--max-orphan-ratio=0.8]
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');

const ENTRY_POINTS = [
  // El entry real: lo que carga index.html.
  { file: join(SRC, 'index.jsx'), label: 'app (index.html)' },
  // El barrel del SDK: no lo carga la app, pero es la fachada pública del laboratorio.
  { file: join(SRC, 'index.js'), label: 'sdk barrel' },
];

const EXTENSIONS = ['.js', '.jsx', '.mjs'];

function collectSourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectSourceFiles(full, out);
    else if (EXTENSIONS.includes(extname(entry))) out.push(full);
  }
  return out;
}

function resolveImport(specifier, fromFile) {
  if (!specifier.startsWith('.')) return null; // paquete de node_modules
  const base = resolve(dirname(fromFile), specifier);

  const candidates = [
    base,
    ...EXTENSIONS.map((ext) => base + ext),
    ...EXTENSIONS.map((ext) => join(base, `index${ext}`)),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const IMPORT_PATTERN = /(?:import|export)\s+(?:[\s\S]*?\sfrom\s+)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function extractImports(source) {
  const found = [];
  for (const match of source.matchAll(IMPORT_PATTERN)) {
    found.push(match[1] ?? match[2]);
  }
  return found.filter(Boolean);
}

function walk(entryFile) {
  const reached = new Set();
  if (!existsSync(entryFile)) return reached;

  const stack = [entryFile];
  while (stack.length > 0) {
    const current = stack.pop();
    if (reached.has(current)) continue;
    reached.add(current);

    let source;
    try {
      source = readFileSync(current, 'utf8');
    } catch {
      continue;
    }

    for (const specifier of extractImports(source)) {
      const target = resolveImport(specifier, current);
      if (target && !reached.has(target)) stack.push(target);
    }
  }
  return reached;
}

// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const showList = args.includes('--list');
const ratioArg = args.find((a) => a.startsWith('--max-orphan-ratio='));
const maxOrphanRatio = ratioArg ? Number(ratioArg.split('=')[1]) : null;

const allFiles = collectSourceFiles(SRC);
const reachedByEntry = new Map();
const reachedAll = new Set();

for (const entry of ENTRY_POINTS) {
  const reached = walk(entry.file);
  reachedByEntry.set(entry.label, reached);
  for (const file of reached) reachedAll.add(file);
}

const orphans = allFiles.filter((file) => !reachedAll.has(file)).sort();
const orphanRatio = allFiles.length === 0 ? 0 : orphans.length / allFiles.length;

const pct = (n) => `${(n * 100).toFixed(1)}%`;

console.log('\nAlcanzabilidad de módulos en src/\n');
console.log(`  Archivos totales        ${allFiles.length}`);
for (const entry of ENTRY_POINTS) {
  const reached = reachedByEntry.get(entry.label);
  const label = entry.label.padEnd(22);
  console.log(`  ${label}${reached.size}\t(${pct(reached.size / allFiles.length)})`);
}
console.log(`  Alcanzable en total     ${reachedAll.size}\t(${pct(reachedAll.size / allFiles.length)})`);
console.log(`  Huérfanos               ${orphans.length}\t(${pct(orphanRatio)})`);

if (showList && orphans.length > 0) {
  console.log('\nArchivos que no alcanza ningún entry point:\n');
  const byDir = new Map();
  for (const file of orphans) {
    const dir = dirname(relative(SRC, file));
    byDir.set(dir, (byDir.get(dir) ?? 0) + 1);
  }
  for (const [dir, count] of [...byDir].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(4)}  ${dir}`);
  }
}

console.log('');

if (maxOrphanRatio !== null && orphanRatio > maxOrphanRatio) {
  console.error(
    `Umbral superado: ${pct(orphanRatio)} de huérfanos supera el máximo de ${pct(maxOrphanRatio)}.\n`
  );
  process.exit(1);
}
