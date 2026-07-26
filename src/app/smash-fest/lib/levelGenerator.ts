import type { LevelNode, LevelSchema } from "./levels";

/**
 * Procedural level generator for SmashFest.
 *
 * Structures are painted into a character grid ("píxel art" of one block per
 * cell) and only then turned into rigid bodies. Everything the physics needs is
 * a property of the grid, which is why this shape was chosen:
 *
 *  - a cell is placed on the lattice, so two blocks can never spawn
 *    interpenetrated (the solver answers that by launching them across the map)
 *  - a cell is only emitted if something is under it, so nothing free-falls at
 *    load time (for memory blocks that would auto-complete the level)
 *  - a run of cells with a hole under it (an arch, a belly between two legs)
 *    is merged into a single beam, which is both what a builder would do and
 *    the only way to keep it standing
 *
 * The pattern library below is the actual content: sprites (perro, gato,
 * robot…) plus parametric structures (ajedrez, pirámide, muralla, barriles…).
 * A level is one to three of them side by side, so what repeats is the
 * vocabulary, not the level.
 *
 * `validateLevel` re-checks the two invariants above and is also useful against
 * levels coming from Supabase.
 */

/* -------------------------------------------------------------------------- */
/* Deterministic RNG                                                          */
/* -------------------------------------------------------------------------- */

// mulberry32: same seed, same level, forever. Lets a level be shared as a number.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

const pick = <T,>(rng: Rng, items: readonly T[]) => items[Math.floor(rng() * items.length)];
const randInt = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const range = (rng: Rng, min: number, max: number) => min + rng() * (max - min);
const chance = (rng: Rng, p: number) => rng() < p;
const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const odd = (n: number) => (n % 2 === 0 ? n + 1 : n);

/* -------------------------------------------------------------------------- */
/* World scale                                                                */
/* -------------------------------------------------------------------------- */

/** Edge of one grid cell, in world units. A projectile is roughly half of it. */
const CELL = 0.8;
/** How deep a structure can be, in cells. Chosen per structure. */
const MIN_DEPTH = 1;
const MAX_DEPTH = 3;
/** Below this height a structure is too slender to stand one cell deep. */
const SLENDER_ROWS = 6;
/** Overhang of a pedestal past the structure it carries, per side. */
const PEDESTAL_MARGIN_X = 0.4;
const PEDESTAL_MARGIN_Z = 0.35;
/** How far below its pedestal a memory block counts as knocked off. */
const RELEASE_DROP = 0.35;
/** Ten cells is as tall as a structure gets before the camera has to pull out. */
const MAX_ROWS = 10;
/** Ceiling on rigid bodies: past this the solver starts costing frames on a phone. */
const MAX_BODIES = 88;
/** Widest a row of structures may get before the next one goes behind it. */
const MAX_ROW_WIDTH = 13.6;
const PROP_GAP = 1.2;

/**
 * Mass per cell. These are calibrated against the projectiles, not chosen for
 * realism: cannon will only displace a block wedged in a wall when the impactor
 * is of comparable mass, and the response falls off a cliff either side of
 * that. Measured against a standard 12 kg ball on a 5x5 test wall, this is what
 * each material is worth:
 *
 *   wood  9 — gives way, a hit opens a hole
 *   stone 16 — dents; takes several hits or the anvil
 *   metal 24 — the anvil, and nothing else
 *
 * Which is also why blocks are heavier than the old hand-authored levels: at
 * their old mass, relative to the ammo, whole towers went flying from a graze.
 */
const MATERIALS = {
  stone: { mass: 16, friction: 0.68 },
  metal: { mass: 24, friction: 0.52 },
  wood: { mass: 9, friction: 0.62 },
  special: { mass: 6, friction: 0.8 },
  platform: { mass: 0, friction: 0.7 },
} as const;

type MaterialName = keyof typeof MATERIALS;

/** A merged beam weighs more than one block but never enough to be immovable. */
const beamMass = (material: MaterialName, cells: number) =>
  Math.round(Math.min(60, MATERIALS[material].mass * (1 + (cells - 1) * 0.4)));

const PALETTES = [
  { background: "#0c0a14", projectile: "#ff4b89", ground: "#1a1222" },
  { background: "#0a0c16", projectile: "#c3f400", ground: "#121a28" },
  { background: "#120818", projectile: "#00dbe9", ground: "#22102b" },
  { background: "#081216", projectile: "#a178ff", ground: "#10242e" },
  { background: "#180a0a", projectile: "#ff003c", ground: "#2d1212" },
  { background: "#0d0614", projectile: "#ff4b89", ground: "#200e30" },
  { background: "#06120e", projectile: "#3cffb0", ground: "#0d2420" },
  { background: "#141006", projectile: "#ffb020", ground: "#2a2010" },
] as const;

// Adjectives agree with the gender of the structure they qualify.
const NAME_TAIL = [
  { m: "Olvidado", f: "Olvidada" },
  { m: "de Cristal", f: "de Cristal" },
  { m: "Acorazado", f: "Acorazada" },
  { m: "Escarlata", f: "Escarlata" },
  { m: "de Ecos", f: "de Ecos" },
  { m: "Silente", f: "Silente" },
  { m: "de Ceniza", f: "de Ceniza" },
  { m: "Insomne", f: "Insomne" },
  { m: "de Hierro", f: "de Hierro" },
  { m: "Perdido", f: "Perdida" },
] as const;

/* -------------------------------------------------------------------------- */
/* Grid                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Row 0 sits on the pedestal.
 *
 *   `.` empty          `#` heavy block     `=` light block    `M` metal
 *   `o` barrel         `O` boulder         `h` low cap        `T` tall block
 *   `*` memory block
 *
 * Everything past the first four is what a projectile bounces off differently:
 * a barrel deflects sideways, a boulder rolls away under the hit, a low cap
 * lets a shot skim over the top and a tall block stops it dead.
 *
 * A tall block is two cells high but still owns a single cell — the one above
 * it is simply left empty, which is also what keeps any neighbouring row from
 * running a beam through its upper half.
 */
type Glyph = "." | "#" | "=" | "M" | "o" | "O" | "h" | "T" | "*";

/** Shapes that are one cell wide and never merged into a beam. */
const SOLO: readonly Glyph[] = ["o", "O", "h", "T", "*"];
const isSolo = (g: Glyph) => SOLO.includes(g);

class Grid {
  readonly cols: number;
  readonly rows: number;
  private readonly data: Glyph[];

  constructor(cols: number, rows: number) {
    this.cols = Math.max(1, Math.round(cols));
    this.rows = Math.max(1, Math.round(rows));
    this.data = new Array(this.cols * this.rows).fill(".");
  }

  get(c: number, r: number): Glyph {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return ".";
    return this.data[r * this.cols + c];
  }

  set(c: number, r: number, g: Glyph) {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return;
    this.data[r * this.cols + c] = g;
  }

  fill(c0: number, r0: number, w: number, h: number, g: Glyph) {
    for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) this.set(c, r, g);
  }

  clear(c0: number, r0: number, w: number, h: number) {
    this.fill(c0, r0, w, h, ".");
  }

  /** Rows occupied by column `c` — i.e. the row a block dropped on it lands on. */
  height(c: number) {
    for (let r = this.rows - 1; r >= 0; r--) if (this.get(c, r) !== ".") return r + 1;
    return 0;
  }

  count() {
    let n = 0;
    for (const g of this.data) if (g !== ".") n++;
    return n;
  }

  /**
   * Bodies this grid will cost. A round cell becomes one body per layer of
   * depth, which is not known until layout, so this assumes the middle one.
   */
  weight() {
    let n = 0;
    for (const g of this.data) {
      if (g === ".") continue;
      n += g === "o" || g === "O" ? 2 : 1;
    }
    return n;
  }

  mirrored() {
    const out = new Grid(this.cols, this.rows);
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++) out.set(this.cols - 1 - c, r, this.get(c, r));
    return out;
  }

  /** Drops empty border rows/columns and adds headroom for memory blocks. */
  compact(extraRows = 1) {
    let minC = this.cols;
    let maxC = -1;
    let maxR = -1;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.get(c, r) === ".") continue;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
        if (r > maxR) maxR = r;
      }
    }
    if (maxC < 0) return new Grid(1, 1 + extraRows);

    const out = new Grid(maxC - minC + 1, maxR + 1 + extraRows);
    for (let r = 0; r <= maxR; r++)
      for (let c = minC; c <= maxC; c++) out.set(c - minC, r, this.get(c, r));
    return out;
  }
}

/** Sprite art is written top row first, the way it reads. */
function fromArt(art: readonly string[]): Grid {
  const cols = art.reduce((max, line) => Math.max(max, line.length), 0);
  const grid = new Grid(cols, art.length);
  art.forEach((line, i) => {
    const r = art.length - 1 - i;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch !== "." && ch !== " ") grid.set(c, r, ch as Glyph);
    }
  });
  return grid;
}

/* -------------------------------------------------------------------------- */
/* Pattern library                                                            */
/* -------------------------------------------------------------------------- */

type Pattern = {
  id: string;
  label: string;
  feminine: boolean;
  /** Fixed-size patterns declare their cost so the composer can skip them. */
  cells?: number;
  build: (rng: Rng, budget: number) => Grid;
};

/**
 * Sprites are authored so that every cell has something under it, except where
 * a merged beam is the intent (a belly across two legs, a lintel over a gate).
 */
function sprite(id: string, label: string, feminine: boolean, art: readonly string[]): Pattern {
  const base = fromArt(art);
  return {
    id,
    label,
    feminine,
    cells: base.count(),
    build: (rng) => (chance(rng, 0.5) ? base.mirrored() : base).compact(),
  };
}

const SPRITES: Pattern[] = [
  sprite("perro", "El Perro", false, [
    "......o.o",
    "......===",
    "=.....===",
    "=..======",
    "=========",
    "#########",
    "##....##.",
    "##....##.",
  ]),
  sprite("gato", "El Gato", false, [
    "....o.o..",
    "...=====.",
    "=..=====.",
    "=..=====.",
    "=========",
    "..#######",
    "..#######",
    "..#######",
  ]),
  sprite("conejo", "El Conejo", false, [
    "..=.=..",
    "..=.=..",
    "..===..",
    ".=====.",
    ".=====.",
    ".#####.",
    ".#####.",
    ".#####.",
    ".#####.",
  ]),
  sprite("buho", "El Búho", false, [
    ".o....o.",
    ".======.",
    ".=o..o=.",
    ".======.",
    ".######.",
    ".######.",
    ".######.",
    ".######.",
  ]),
  sprite("pez", "El Pez", false, [
    "....===....",
    "..========.",
    "=.=========",
    "===========",
    "..========.",
    "..#.....#..",
    "..#.....#..",
  ]),
  sprite("robot", "El Robot", false, [
    "...o.o...",
    "..#####..",
    "..#o.o#..",
    "..#####..",
    "M=======M",
    "M..===..M",
    "M..===..M",
    "M..===..M",
    "MM=====MM",
  ]),
  sprite("cohete", "El Cohete", false, [
    "...=...",
    "..===..",
    "..===..",
    ".=====.",
    ".=====.",
    ".=###=.",
    ".=###=.",
    "M=###=M",
    "M=###=M",
    "MM###MM",
  ]),
  sprite("corazon", "El Corazón", false, [
    ".==...==.",
    "=========",
    "=========",
    ".=======.",
    "..#####..",
    "...###...",
    "..#####..",
    ".#######.",
  ]),
  sprite("arbol", "El Árbol", false, [
    "...===...",
    "..=====..",
    ".=======.",
    ".=======.",
    "..=====..",
    "...###...",
    "...###...",
    "...###...",
    "..#####..",
  ]),
  sprite("casa", "La Casa", true, [
    "....=....",
    "...===...",
    "..=====..",
    ".=======.",
    "#########",
    "#..###..#",
    "#..###..#",
    "#########",
  ]),
  sprite("calavera", "La Calavera", true, [
    "..#####..",
    ".#######.",
    ".#o###o#.",
    ".#######.",
    ".#######.",
    "..#.#.#..",
    "..#.#.#..",
    ".#######.",
  ]),
  sprite("fantasma", "El Fantasma", false, [
    "..#####..",
    ".#######.",
    ".#o###o#.",
    ".#######.",
    ".#######.",
    ".#######.",
    "##.#.#.##",
  ]),
  sprite("seta", "La Seta", true, [
    ".#######.",
    "#########",
    "#########",
    "...===...",
    "...===...",
    "...===...",
    "..=====..",
  ]),
  sprite("pinguino", "El Pingüino", false, [
    "..===..",
    ".=====.",
    ".=o=o=.",
    ".=====.",
    "M=====M",
    "M=====M",
    "M=====M",
    "MM===MM",
  ]),
];

/* --- Parametric structures ------------------------------------------------ */

function buildPyramid(rng: Rng, budget: number): Grid {
  const base = clamp(odd(Math.round(Math.sqrt(budget) * 2 - 1)), 5, 13);
  const rows = (base + 1) / 2;
  const grid = new Grid(base, rows);
  const stoneRows = Math.ceil(rows * (chance(rng, 0.5) ? 0.5 : 0.34));
  for (let r = 0; r < rows; r++) grid.fill(r, r, base - 2 * r, 1, r < stoneRows ? "#" : "=");
  return grid.compact();
}

function buildZiggurat(rng: Rng, budget: number): Grid {
  const steps = clamp(Math.round(Math.sqrt(budget / 2.4)), 2, 5);
  const base = steps * 2 + 3;
  const grid = new Grid(base, steps * 2);
  for (let s = 0; s < steps; s++) grid.fill(s, s * 2, base - 2 * s, 2, s < steps / 2 ? "#" : "=");
  if (chance(rng, 0.5)) grid.set(Math.floor(base / 2), steps * 2 - 1, "o");
  return grid.compact();
}

/** Ajedrez: a fully filled wall whose two materials alternate like a board. */
function buildCheckerboard(rng: Rng, budget: number): Grid {
  const rows = randInt(rng, 4, 7);
  const cols = clamp(Math.round(budget / rows), 5, 13);
  const grid = new Grid(cols, rows);
  const dark: Glyph = chance(rng, 0.25) ? "M" : "#";
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) grid.set(c, r, (c + r) % 2 === 0 ? dark : "=");
  return grid;
}

/** Muralla: solid wall pierced by a gate, topped with crenellations. */
function buildRampart(rng: Rng, budget: number): Grid {
  const rows = randInt(rng, 4, 6);
  const cols = clamp(odd(Math.round(budget / rows)), 7, 13);
  const grid = new Grid(cols, rows);
  grid.fill(0, 0, cols, rows - 1, "#");

  const gate = (cols - 3) >> 1;
  grid.clear(gate, 0, 3, rows - 2);

  // Arrow slits, punched only where a whole run still has support underneath.
  if (rows >= 5 && cols >= 9) {
    grid.clear(1, rows - 3, 1, 1);
    grid.clear(cols - 2, rows - 3, 1, 1);
  }

  for (let c = 0; c < cols; c += 2) grid.set(c, rows - 1, "=");
  return grid.compact();
}

/** Torres: parallel keeps joined by a roof beam. */
function buildTowers(rng: Rng, budget: number): Grid {
  const count = randInt(rng, 2, 3);
  const gap = randInt(rng, 1, 2);
  const cols = count * 2 + (count - 1) * gap;
  const rows = clamp(Math.round((budget - cols) / (count * 2)), 3, 8);
  const grid = new Grid(cols, rows + 1);

  for (let i = 0; i < count; i++) {
    const x = i * (2 + gap);
    grid.fill(x, 0, 2, rows, "=");
    grid.fill(x, 0, 2, Math.min(2, rows), "#");
  }
  grid.fill(0, rows, cols, 1, "=");
  return grid.compact();
}

/** Barriles: tiers of barrels separated by the planks they rest on. */
function buildBarrelStack(rng: Rng, budget: number): Grid {
  const cols = clamp(odd(Math.round(budget / 8)), 5, 11);
  const grid = new Grid(cols, MAX_ROWS);
  grid.fill(0, 0, cols, 1, "#");

  let r = 1;
  let inset = 1;
  while (cols - 2 * inset >= 3 && r < MAX_ROWS - 3) {
    grid.fill(inset, r, cols - 2 * inset, 2, "o");
    r += 2;
    grid.fill(inset, r, cols - 2 * inset, 1, "=");
    r += 1;
    inset += 1;
  }
  return grid.compact();
}

/** Arcos: an aqueduct — 2-wide pillars carrying lintels, one or two tiers. */
function buildArches(rng: Rng, budget: number): Grid {
  const span = randInt(rng, 2, 3);
  const bays = randInt(rng, 2, 3);
  const pillar = 3;
  const cols = bays * (span + 2) + 2;
  const tiers = budget > 42 ? 2 : 1;
  const grid = new Grid(cols, tiers * (pillar + 1));

  let base = 0;
  for (let t = 0; t < tiers; t++) {
    for (let c = 0; c <= cols - 2; c += span + 2) grid.fill(c, base, 2, pillar, "=");
    grid.fill(0, base + pillar, cols, 1, "#");
    base += pillar + 1;
  }
  return grid.compact();
}

/** Columnata: paired barrel columns under stone slabs. */
function buildColonnade(rng: Rng, budget: number): Grid {
  const pairs = randInt(rng, 2, 4);
  const cols = pairs * 3;
  const tiers = clamp(Math.round(budget / (pairs * 2 + cols)), 1, 3);
  const grid = new Grid(cols, tiers * 3);

  let base = 0;
  for (let t = 0; t < tiers; t++) {
    for (let i = 0; i < pairs; i++) {
      grid.fill(i * 3, base, 2, 2, "o");
    }
    grid.fill(0, base + 2, cols, 1, t === 0 ? "#" : "=");
    base += 3;
  }
  return grid.compact();
}

/** Escalera: a staircase, sometimes mirrored into a stepped pyramid. */
function buildStairs(rng: Rng, budget: number): Grid {
  const width = clamp(Math.round(Math.sqrt(budget * 2)), 4, 9);
  const twin = chance(rng, 0.45);
  const cols = twin ? width * 2 - 1 : width;
  const grid = new Grid(cols, width);

  for (let c = 0; c < width; c++) {
    grid.fill(c, 0, 1, c + 1, c < width / 2 ? "#" : "=");
    if (twin) grid.fill(cols - 1 - c, 0, 1, c + 1, c < width / 2 ? "#" : "=");
  }
  return grid.compact();
}

/** Panal: floors carried by pairs of pillars, stacked into a hive. */
function buildLattice(rng: Rng, budget: number): Grid {
  const bays = randInt(rng, 2, 4);
  const cols = bays * 3 + 2;
  const bands = clamp(Math.round(budget / (cols + bays * 4)), 2, 3);
  const grid = new Grid(cols, bands * 3 + 1);

  let r = 0;
  for (let b = 0; b < bands; b++) {
    grid.fill(0, r, cols, 1, b === 0 ? "#" : "=");
    r += 1;
    for (let c = 0; c <= cols - 2; c += 3) grid.fill(c, r, 2, 2, "=");
    r += 2;
  }
  grid.fill(0, r, cols, 1, "#");
  return grid.compact();
}

/** Castillo: two corner keeps, a curtain wall and a gate under a lintel. */
function buildCastle(rng: Rng, budget: number): Grid {
  const towerRows = clamp(Math.round(budget / 10), 5, MAX_ROWS - 2);
  const curtainRows = towerRows - 2;
  const curtain = clamp(Math.round(budget / 8), 3, 7);
  const cols = curtain + 4;
  // One row above the towers, for their crenellations.
  const grid = new Grid(cols, towerRows + 1);

  grid.fill(0, 0, 2, towerRows, "#");
  grid.fill(cols - 2, 0, 2, towerRows, "#");
  grid.fill(2, 0, curtain, curtainRows, "=");

  const gate = 2 + Math.max(0, (curtain - 2) >> 1);
  if (curtain >= 4) grid.clear(gate, 0, 2, curtainRows - 1);

  for (let c = 0; c < cols; c += 2) grid.set(c, c < 2 || c >= cols - 2 ? towerRows : curtainRows, "=");
  return grid.compact();
}

/** Cruz: a tower carrying a plank across it, balanced on purpose. */
function buildCross(rng: Rng, budget: number): Grid {
  const rows = clamp(Math.round(budget / 6), 5, 9);
  const cols = clamp(odd(Math.round(budget / 5)), 5, 9);
  const centre = (cols - 1) / 2;
  const grid = new Grid(cols, rows);

  grid.fill(centre - 1, 0, 3, rows, "#");
  const arm = Math.max(2, rows - 3);
  grid.fill(0, arm, cols, 2, "=");
  if (chance(rng, 0.5)) {
    grid.set(0, arm + 2, "o");
    grid.set(cols - 1, arm + 2, "o");
  }
  return grid.compact();
}

const STRUCTURES: Pattern[] = [
  { id: "piramide", label: "La Pirámide", feminine: true, build: buildPyramid },
  { id: "zigurat", label: "El Zigurat", feminine: false, build: buildZiggurat },
  { id: "ajedrez", label: "El Tablero", feminine: false, build: buildCheckerboard },
  { id: "muralla", label: "La Muralla", feminine: true, build: buildRampart },
  { id: "torres", label: "Las Torres", feminine: true, build: buildTowers },
  { id: "barriles", label: "Los Barriles", feminine: false, build: buildBarrelStack },
  { id: "arcos", label: "El Acueducto", feminine: false, build: buildArches },
  { id: "columnata", label: "La Columnata", feminine: true, build: buildColonnade },
  { id: "escalera", label: "La Escalera", feminine: true, build: buildStairs },
  { id: "panal", label: "El Panal", feminine: false, build: buildLattice },
  { id: "castillo", label: "El Castillo", feminine: false, build: buildCastle },
  { id: "cruz", label: "El Tótem", feminine: false, build: buildCross },
];

const PATTERNS: Pattern[] = [...STRUCTURES, ...SPRITES];

/* -------------------------------------------------------------------------- */
/* Grid -> rigid bodies                                                       */
/* -------------------------------------------------------------------------- */

type Theme = { heavy: MaterialName; light: MaterialName };

function themeFor(rng: Rng, difficulty: number): Theme {
  if (difficulty >= 4 && chance(rng, 0.35)) return { heavy: "metal", light: "stone" };
  if (difficulty >= 2 && chance(rng, 0.35)) return { heavy: "metal", light: "wood" };
  return { heavy: "stone", light: "wood" };
}

function materialFor(glyph: Glyph, theme: Theme): MaterialName {
  if (glyph === "M") return "metal";
  if (glyph === "#" || glyph === "O") return theme.heavy;
  if (glyph === "*") return "special";
  return glyph === "o" ? "wood" : theme.light;
}

/**
 * Turns the top of each column into something other than another cube.
 *
 * Only the crown is touched: everything below is load-bearing and has to keep
 * the lattice intact, whereas the top cell can be any shape without anything
 * depending on its surface.
 */
function crownPass(rng: Rng, grid: Grid) {
  for (let c = 0; c < grid.cols; c++) {
    const height = grid.height(c);
    if (height === 0) continue;

    const r = height - 1;
    const glyph = grid.get(c, r);
    if (isSolo(glyph)) continue;

    const roll = rng();
    if (roll < 0.16) grid.set(c, r, "o");
    else if (roll < 0.32) grid.set(c, r, "h");
    else if (roll < 0.44) grid.set(c, r, "T");
  }
}

/**
 * Drops boulders into the notches of a structure.
 *
 * A ball on a flat roof is in equilibrium only until the solver's first jitter,
 * and then it rolls off the platform on its own and takes half the level with
 * it. In a notch it is wedged between its neighbours, and a hit still sends it
 * rolling — which is the whole point of having one.
 */
function cradlePass(rng: Rng, grid: Grid) {
  for (let c = 1; c < grid.cols - 1; c++) {
    for (let r = 1; r < grid.rows; r++) {
      if (grid.get(c, r) !== ".") continue;
      const floor = grid.get(c, r - 1);
      if (floor !== "#" && floor !== "=" && floor !== "M") continue;
      if (grid.get(c - 1, r) === "." || grid.get(c + 1, r) === ".") continue;
      if (chance(rng, 0.6)) grid.set(c, r, "O");
    }
  }
}

/** One structure placed in the world, standing on its own pedestal. */
type Stage = {
  grid: Grid;
  pattern: Pattern;
  /** World x of the left edge of column 0. */
  x0: number;
  z: number;
  /** Depth in cells. */
  depth: number;
  /** Height of the pedestal — where row 0 starts. */
  base: number;
  theme: Theme;
};

type Run = { cols: number[]; supported: boolean[] };

function rowRuns(grid: Grid, r: number): Run[] {
  const runs: Run[] = [];
  let current: Run | null = null;

  for (let c = 0; c < grid.cols; c++) {
    if (grid.get(c, r) === ".") {
      current = null;
      continue;
    }
    if (!current) {
      current = { cols: [], supported: [] };
      runs.push(current);
    }
    current.cols.push(c);
    current.supported.push(r === 0 || grid.get(c, r - 1) !== ".");
  }

  return runs;
}

type Group = { start: number; cells: number; glyph: Glyph; supported: boolean };
type Piece = { start: number; cells: number };

/**
 * Where a piece's weight sits relative to what holds it up: 0 balanced, +1 its
 * support is off to the right, -1 off to the left.
 *
 * Touching a support is not the same as resting on one. A three-cell plank held
 * up only by its right-hand end is a cantilever: cannon rotates it off its
 * perch within a few frames, which on a memory block reads as the level
 * completing itself before the first shot.
 */
function overhang(piece: Piece, supported: (i: number) => boolean): -1 | 0 | 1 {
  let min = Infinity;
  let max = -Infinity;
  for (let i = piece.start; i < piece.start + piece.cells; i++) {
    if (!supported(i)) continue;
    if (i < min) min = i;
    if (i > max) max = i;
  }
  if (min === Infinity) return 1;

  // Half a cell is where a block balances on the very edge of its support; the
  // margin is what keeps it standing once the row above loads it too.
  const centre = piece.start + (piece.cells - 1) / 2;
  if (centre < min - 0.25) return 1;
  if (centre > max + 0.25) return -1;
  return 0;
}

/**
 * Cuts a group into blocks that all stand up on their own.
 *
 * The preferred split is the finest one — a block per cell wherever both sides
 * of the seam are supported, which is what makes a demolition feel like rubble
 * rather than furniture. A row that spills past its support (a tree's crown, a
 * mushroom cap) instead becomes one rigid plank: a plank centred on its support
 * carries whatever is stacked on it, where a chain of little overhanging blocks
 * tips as soon as the row above loads its ends. Whatever still hangs off the
 * end after that is trimmed away.
 */
function splitBalanced(group: Group, supported: (i: number) => boolean): Piece[] {
  const fine: Piece[] = [];
  let start = group.start;

  for (let i = group.start; i < group.start + group.cells; i++) {
    const atEnd = i === group.start + group.cells - 1;
    if (!atEnd && !(supported(i) && supported(i + 1))) continue;
    fine.push({ start, cells: i - start + 1 });
    start = i + 1;
  }

  if (fine.every((piece) => overhang(piece, supported) === 0)) return fine;

  const plank: Piece = { start: group.start, cells: group.cells };
  for (let guard = 0; guard < group.cells; guard++) {
    const towards = overhang(plank, supported);
    if (towards === 0) return [plank];
    // Shed the end that hangs: the support is on the other side.
    if (towards > 0) plank.start++;
    plank.cells--;
    if (plank.cells <= 0) break;
  }

  return [];
}

/**
 * Splits one run into the bodies it becomes. Cells that have nothing under them
 * are absorbed by a neighbour, so what would have been a floating block becomes
 * part of a beam that reaches its support.
 */
function groupRun(grid: Grid, r: number, run: Run): Group[] {
  const groups: Group[] = [];

  for (let i = 0; i < run.cols.length; i++) {
    const glyph = grid.get(run.cols[i], r);
    const last = groups[groups.length - 1];
    const solo = isSolo(glyph);

    if (last && !solo && !isSolo(last.glyph) && last.glyph === glyph) {
      last.cells++;
      last.supported ||= run.supported[i];
    } else if (last && !isSolo(last.glyph) && !run.supported[i]) {
      // Nothing underneath: hand the cell to the beam on its left, which does
      // reach a support.
      last.cells++;
    } else {
      groups.push({ start: i, cells: 1, glyph, supported: run.supported[i] });
    }
  }

  // Whatever is still floating leans on a neighbouring beam — never on a
  // barrel or a memory block, which would quietly stop being one. Backwards,
  // so a group merging rightwards finds a neighbour already resolved.
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    if (group.supported || group.glyph === ".") continue;

    const next = groups[i + 1];
    const previous = groups[i - 1];

    if (next && !isSolo(next.glyph) && next.glyph !== ".") {
      next.start = group.start;
      next.cells += group.cells;
      groups.splice(i, 1);
    } else if (previous && !isSolo(previous.glyph)) {
      previous.cells += group.cells;
      groups.splice(i, 1);
    } else {
      // Nothing to lean on at all: the caller erases these cells.
      group.glyph = ".";
    }
  }

  return groups;
}

/**
 * Emits one structure. Runs are processed bottom-up and a run that has no
 * support at all is erased before the row above is considered, so support
 * always reflects what was actually placed.
 */
function emitStage(nodes: LevelNode[], stage: Stage, prefix: string) {
  const { grid, x0, z, theme, base } = stage;
  const depth = round2(stage.depth * CELL);
  let serial = 0;

  // The pedestal. Everything above has to be pushed off it to count, so it is
  // deliberately only a little wider than what it carries.
  const spanX = grid.cols * CELL;
  const halfX = round2(spanX / 2 + PEDESTAL_MARGIN_X);
  const halfZ = round2(depth / 2 + PEDESTAL_MARGIN_Z);
  const centreX = round2(x0 + spanX / 2);

  nodes.push({
    id: `${prefix}base`,
    type: "box",
    dimensions: [round2(halfX * 2), round2(base), round2(halfZ * 2)],
    position: [centreX, round2(base / 2), round2(z)],
    mass: 0,
    friction: MATERIALS.platform.friction,
    material: "platform",
    isStatic: true,
  });

  const releaseY = round2(base - RELEASE_DROP);
  const releaseBox: [number, number, number, number] = [
    round2(centreX - halfX),
    round2(centreX + halfX),
    round2(z - halfZ),
    round2(z + halfZ),
  ];

  for (let r = 0; r < grid.rows; r++) {
    for (const run of rowRuns(grid, r)) {
      if (!run.supported.some(Boolean)) {
        for (const c of run.cols) grid.set(c, r, ".");
        continue;
      }

      for (const group of groupRun(grid, r, run)) {
        const col = run.cols[group.start];
        const material = materialFor(group.glyph, theme);
        const x = round2(x0 + (col + 0.5) * CELL);
        const y = round2(base + (r + 0.5) * CELL);
        const id = `${prefix}${serial++}`;

        // Marked unbuildable by the grouping pass: erase it so the row above
        // does not count on support that was never placed.
        if (group.glyph === ".") {
          for (let i = group.start; i < group.start + group.cells; i++) grid.set(run.cols[i], r, ".");
          continue;
        }

        // Round shapes cannot be stretched in Z the way a box is, so one is
        // placed per layer of depth instead.
        if ((group.glyph === "o" || group.glyph === "O") && group.cells === 1) {
          const round = group.glyph === "o";
          const radius = round2(CELL * (round ? 0.45 : 0.38));
          for (let i = 0; i < stage.depth; i++) {
            nodes.push({
              id: `${id}_${i}`,
              type: round ? "cylinder" : "sphere",
              dimensions: round ? [radius, radius, round2(CELL)] : [radius, radius, radius],
              position: [
                x,
                round ? y : round2(base + r * CELL + radius),
                round2(z + (i - (stage.depth - 1) / 2) * CELL),
              ],
              mass: MATERIALS[material].mass,
              friction: MATERIALS[material].friction,
              material,
            });
          }
          continue;
        }

        if (group.glyph === "h" && group.cells === 1) {
          const height = round2(CELL * 0.5);
          nodes.push({
            id,
            type: "box",
            dimensions: [round2(CELL), height, depth],
            position: [x, round2(base + r * CELL + height / 2), z],
            mass: MATERIALS[material].mass,
            friction: MATERIALS[material].friction,
            material,
          });
          continue;
        }

        if (group.glyph === "T" && group.cells === 1) {
          nodes.push({
            id,
            type: "box",
            dimensions: [round2(CELL), round2(CELL * 2), depth],
            position: [x, round2(base + (r + 1) * CELL), z],
            mass: beamMass(material, 2),
            friction: MATERIALS[material].friction,
            material,
          });
          continue;
        }

        if (group.glyph === "*") {
          // Memory blocks come in two shapes so a shot glances off them
          // differently — but only where nothing rests on them. A drum is far
          // narrower than the structure is deep, and whatever sits on top of it
          // would be left holding air on the outer layers.
          const bears = grid.get(col, r + 1) !== ".";
          const drum = !bears && col % 2 === 1;
          // Exactly one cell tall, always. A token even slightly shorter than
          // its cell drops everything stacked on it by the difference, and a
          // beam bridging a sunk column and a full one rocks itself apart.
          nodes.push({
            id,
            type: drum ? "cylinder" : "box",
            dimensions: drum
              ? [round2(CELL * 0.45), round2(CELL * 0.45), round2(CELL)]
              : [round2(CELL), round2(CELL), bears ? depth : round2(Math.min(depth, CELL * 1.6))],
            position: [x, y, round2(z)],
            mass: MATERIALS.special.mass,
            friction: MATERIALS.special.friction,
            material: "special",
            isMemoryBlock: true,
            releaseY,
            releaseBox,
          });
          continue;
        }

        const pieces = splitBalanced(group, (i) => run.supported[i]);

        // Anything the balance pass refused to place has to leave the grid too,
        // or the row above will count on support that was never built.
        const kept = new Set<number>();
        for (const piece of pieces) for (let i = 0; i < piece.cells; i++) kept.add(piece.start + i);
        for (let i = group.start; i < group.start + group.cells; i++) {
          if (!kept.has(i)) grid.set(run.cols[i], r, ".");
        }

        for (const piece of pieces) {
          nodes.push({
            id: `${id}_${piece.start}`,
            type: "box",
            dimensions: [round2(piece.cells * CELL), round2(CELL), depth],
            position: [round2(x0 + (run.cols[piece.start] + piece.cells / 2) * CELL), y, round2(z)],
            mass: beamMass(material, piece.cells),
            friction: MATERIALS[material].friction,
            material,
          });
        }
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Composition                                                                */
/* -------------------------------------------------------------------------- */

export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** How many bodies a level is made of, before memory blocks. */
const PIECE_TARGET: Record<Difficulty, [number, number]> = {
  1: [26, 34],
  2: [30, 40],
  3: [38, 50],
  4: [48, 62],
  5: [58, 76],
};

type ChosenProp = { pattern: Pattern; grid: Grid };
/** Structures stand in at most two rows; the second one is a backdrop. */
type Row = { props: ChosenProp[]; width: number };

/** First-fit into the two rows, or -1 when the structure is simply too wide. */
function fitRow(rows: Row[], width: number): number {
  for (let i = 0; i < rows.length; i++) {
    const next = rows[i].props.length === 0 ? width : rows[i].width + PROP_GAP + width;
    if (next <= MAX_ROW_WIDTH) return i;
  }
  return -1;
}

function addToRow(rows: Row[], index: number, prop: ChosenProp) {
  const width = prop.grid.cols * CELL;
  const row = rows[index];
  row.width = row.props.length === 0 ? width : row.width + PROP_GAP + width;
  row.props.push(prop);
}

function chooseProps(rng: Rng, target: number): Row[] {
  const rows: Row[] = [
    { props: [], width: 0 },
    { props: [], width: 0 },
  ];
  const used = new Set<string>();
  // Never a token structure: even the gentlest level is a couple of dozen bodies.
  const floor = Math.max(target - 9, 24);
  let placed = 0;
  let attempts = 0;

  while (placed < floor && used.size < 3 && attempts < 8) {
    attempts++;
    // The first structure of a big level only gets part of the budget, so the
    // level is a scene of several things rather than one enormous wall.
    const remaining = target - placed;
    const share = used.size === 0 && target > 44 ? Math.round(target * (0.45 + rng() * 0.3)) : remaining;
    const options = PATTERNS.filter((p) => !used.has(p.id) && (p.cells === undefined || p.cells <= remaining * 1.25));
    if (options.length === 0) break;

    const pattern = pick(rng, options);
    const grid = pattern.build(rng, share).compact();

    const slot = fitRow(rows, grid.cols * CELL);
    // Too wide for what is left of the yard: try a different pattern rather
    // than pushing the level past what the camera can frame.
    if (slot < 0) continue;

    // Every structure has a minimum size of its own — a colonnade is never
    // three barrels — so a pattern that blows the remaining budget is put back
    // instead of doubling the level's body count.
    const allowance = Math.min(Math.max(remaining * 1.35, 16), MAX_BODIES - placed);
    if (grid.weight() > allowance) continue;

    used.add(pattern.id);
    addToRow(rows, slot, { pattern, grid });
    placed += grid.weight();
  }

  if (placed === 0) addToRow(rows, 0, { pattern: STRUCTURES[0], grid: buildPyramid(rng, target).compact() });
  return rows.filter((row) => row.props.length > 0);
}

const allProps = (rows: Row[]) => rows.flatMap((row) => row.props);

/**
 * Scatters the memory blocks through the structures instead of parking them on
 * the roof.
 *
 * A candidate cell has to be reachable (an open side, so a projectile can get
 * at it), directly supported (it becomes its own body, not part of a beam) and
 * clear of the row's merged planks. Spreading them over different heights is
 * what stops one lucky collapse from clearing the board.
 */
function placeMemories(rng: Rng, stages: Stage[], total: number) {
  type Slot = { stage: Stage; col: number; row: number };

  const shuffled = (slots: Slot[]) => {
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    return slots;
  };

  const exposed: Slot[] = [];
  const buried: Slot[] = [];
  const loose: Slot[] = [];

  for (const stage of stages) {
    const { grid } = stage;
    for (let r = 1; r < grid.rows; r++) {
      for (const run of rowRuns(grid, r)) {
        // A row that needs merging is the last resort: carving a memory block
        // out of a plank splits it into pieces the balance pass has to trim.
        const whole = run.supported.every(Boolean);
        for (let i = 0; i < run.cols.length; i++) {
          const c = run.cols[i];
          const glyph = grid.get(c, r);
          if (glyph !== "#" && glyph !== "=" && glyph !== "M") continue;
          const slot = { stage, col: c, row: r };
          if (!whole) {
            if (run.supported[i]) loose.push(slot);
            continue;
          }
          const open = grid.get(c - 1, r) === "." || grid.get(c + 1, r) === "." || grid.get(c, r + 1) === ".";
          (open ? exposed : buried).push(slot);
        }
      }
    }
  }

  // Whatever the shape of the structure, the level has to have its objectives:
  // the last tier drops a block on top of a column. Only on a flat one that
  // fills its cell, though — a low cap, a boulder or a tall block all end
  // somewhere other than the lattice line, and a block laid on those is left
  // standing on air or balanced on a curve.
  const crowns: Slot[] = [];
  for (const stage of stages) {
    for (let c = 0; c < stage.grid.cols; c++) {
      const height = stage.grid.height(c);
      if (height < 1 || height >= stage.grid.rows) continue;
      const below = stage.grid.get(c, height - 1);
      if (below !== "#" && below !== "=" && below !== "M" && below !== "o") continue;
      crowns.push({ stage, col: c, row: height });
    }
  }

  // Last resort for structures made almost entirely of barrels and planks:
  // a block standing on the bare pedestal beside the structure. Always
  // supported, always reachable, and still has to be pushed over the edge.
  const ground: Slot[] = [];
  for (const stage of stages) {
    for (let c = 0; c < stage.grid.cols; c++) {
      if (stage.grid.get(c, 0) === ".") ground.push({ stage, col: c, row: 0 });
    }
  }

  const taken: Slot[] = [];
  const fits = (slot: Slot, spacing: number) =>
    !taken.some(
      (t) => t.stage === slot.stage && Math.abs(t.col - slot.col) < spacing && Math.abs(t.row - slot.row) < spacing
    );

  // Start apart in both axes and only crowd them if the count demands it: two
  // memories side by side come down together and halve the level.
  for (const tier of [shuffled(exposed), shuffled(buried), shuffled(crowns), shuffled(loose), shuffled(ground)]) {
    for (const spacing of [3, 2, 1]) {
      for (const slot of tier) {
        if (taken.length >= total) break;
        if (fits(slot, spacing)) taken.push(slot);
      }
    }
    if (taken.length >= total) break;
  }

  for (const slot of taken) slot.stage.grid.set(slot.col, slot.row, "*");
}

/**
 * Guarantees the level has its objectives.
 *
 * A cell marked as a memory block can still be lost on the way out — carved out
 * of a plank, trimmed by the balance pass, erased with an unsupported run — and
 * a level with one objective is over in a shot. This promotes blocks that were
 * already built, so the geometry that has just been validated does not move.
 */
function ensureMemories(rng: Rng, nodes: LevelNode[], stages: Stage[], target: number) {
  const chosen = nodes.filter((n) => n.isMemoryBlock);
  if (chosen.length >= target) return;

  const candidates = nodes.filter(
    (node, index) =>
      !node.isMemoryBlock &&
      !node.isStatic &&
      !node.motion &&
      node.type === "box" &&
      // A single cell, not a beam and not a low cap: it has to read as a token.
      node.dimensions[0] <= CELL + 0.01 &&
      node.dimensions[1] >= CELL - 0.01 &&
      stages.some((_, s) => node.id.startsWith(`p${s}_`)) &&
      index >= 0
  );

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  for (const node of candidates) {
    if (chosen.length >= target) break;
    const stage = stages[Number(node.id.slice(1, node.id.indexOf("_")))];
    if (!stage) continue;
    // Keep them apart: two objectives in the same corner come down together.
    const clash = chosen.some(
      (other) => Math.hypot(other.position[0] - node.position[0], other.position[1] - node.position[1]) < 1.4
    );
    if (clash) continue;

    const spanX = stage.grid.cols * CELL;
    const centreX = stage.x0 + spanX / 2;
    const halfX = spanX / 2 + PEDESTAL_MARGIN_X;
    const halfZ = (stage.depth * CELL) / 2 + PEDESTAL_MARGIN_Z;

    node.isMemoryBlock = true;
    node.material = "special";
    node.mass = MATERIALS.special.mass;
    node.friction = MATERIALS.special.friction;
    node.releaseY = round2(stage.base - RELEASE_DROP);
    node.releaseBox = [round2(centreX - halfX), round2(centreX + halfX), round2(stage.z - halfZ), round2(stage.z + halfZ)];
    chosen.push(node);
  }
}

/**
 * Places the structures in world space: each on its own pedestal, at its own
 * depth, never more than two abreast.
 */
function layout(rng: Rng, rows: Row[], theme: Theme): Stage[] {
  const stages: Stage[] = [];

  rows.forEach((row, index) => {
    // The front pair straddles the camera axis; anything else stands well
    // behind it, to be shot over or through the gap between the front two.
    const rowZ = rows.length === 1 ? 0 : index === 0 ? 1.4 : -4.6;
    let cursor = -row.width / 2;

    for (const prop of row.props) {
      const rowCount = prop.grid.rows;
      // Slender structures need the depth; squat ones can be a single slab,
      // which is what makes a level read as several separate formations.
      const depth = clamp(
        rowCount >= SLENDER_ROWS ? randInt(rng, 2, MAX_DEPTH) : chance(rng, 0.35) ? MIN_DEPTH : 2,
        MIN_DEPTH,
        MAX_DEPTH
      );

      stages.push({
        grid: prop.grid,
        pattern: prop.pattern,
        x0: round2(cursor),
        // Within a row the structures still sit at slightly different depths.
        z: round2(rowZ + (rng() - 0.5) * 1.2),
        depth,
        base: round2(range(rng, 0.9, 2.2)),
        theme,
      });
      cursor += prop.grid.cols * CELL + PROP_GAP;
    }
  });

  // A little jitter so two levels built from the same pair never line up.
  if (stages.length > 1) {
    const drift = round2((rng() - 0.5) * 0.8);
    for (const stage of stages) stage.x0 = round2(stage.x0 + drift);
  }

  return stages;
}

/* -------------------------------------------------------------------------- */
/* Obstacles                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Hazards between the player and the structures. None of them touch a
 * structure: an obstacle that carried part of the level could sweep it off its
 * own pedestal and finish the level before the first shot.
 */
function addObstacles(rng: Rng, nodes: LevelNode[], stages: Stage[], difficulty: Difficulty) {
  if (difficulty < 2) return;

  const front = stages.reduce((max, s) => Math.max(max, s.z + (s.depth * CELL) / 2 + PEDESTAL_MARGIN_Z), 0);
  const spanLeft = Math.min(...stages.map((s) => s.x0));
  const spanRight = Math.max(...stages.map((s) => s.x0 + s.grid.cols * CELL));
  const centre = (spanLeft + spanRight) / 2;
  const width = spanRight - spanLeft;

  const count = difficulty >= 4 ? (chance(rng, 0.45) ? 2 : 1) : chance(rng, 0.65) ? 1 : 0;

  for (let i = 0; i < count; i++) {
    const z = round2(front + 1.5 + i * 2.0);
    // Never wider than about a third of the yard: standing between the player
    // and the structure, an obstacle looks far bigger than it measures, and
    // there always has to be a way past it.
    const span = round2(clamp(width * range(rng, 0.26, 0.42), 2.0, 4.6));
    const offset = round2((rng() - 0.5) * Math.max(0, width - span));
    const kind = pick(rng, ["wall", "shutter", "spinner"] as const);

    if (kind === "wall") {
      const height = round2(range(rng, 2.4, 4.2));
      nodes.push({
        id: `obs${i}_wall`,
        type: "box",
        dimensions: [span, height, 0.4],
        position: [round2(centre + offset), round2(height / 2), z],
        mass: 0,
        friction: 0.5,
        material: "metal",
        isStatic: true,
      });
      continue;
    }

    if (kind === "shutter") {
      const height = round2(range(rng, 1.6, 2.6));
      const travel = round2(clamp(width * 0.3, 1.4, 3.2));
      nodes.push({
        id: `obs${i}_shutter`,
        type: "box",
        dimensions: [span, height, 0.4],
        position: [round2(centre + offset), round2(range(rng, 1.4, 3.0) + height / 2), z],
        mass: 0,
        friction: 0.5,
        material: "metal",
        motion: { kind: "slide", speed: round2(range(rng, 0.7, 1.2)), amplitude: travel, phase: round2(rng() * 6.28) },
      });
      continue;
    }

    // Spinner: a post carrying a bar that sweeps across the line of fire.
    const postTop = round2(range(rng, 2.6, 4.0));
    nodes.push({
      id: `obs${i}_post`,
      type: "cylinder",
      dimensions: [0.22, 0.22, postTop],
      position: [round2(centre + offset), round2(postTop / 2), z],
      mass: 0,
      friction: 0.5,
      material: "metal",
      isStatic: true,
    });
    nodes.push({
      id: `obs${i}_bar`,
      type: "box",
      dimensions: [span, 0.36, 0.36],
      position: [round2(centre + offset), round2(postTop), z],
      mass: 0,
      friction: 0.4,
      material: "metal",
      motion: { kind: "spin", speed: round2(range(rng, 0.9, 1.8)) * (chance(rng, 0.5) ? 1 : -1) },
    });
  }
}

export function generateLevel(seed: number, difficulty: Difficulty = 3): LevelSchema {
  const rng = mulberry32(seed);
  const [min, max] = PIECE_TARGET[difficulty] ?? PIECE_TARGET[3];
  const target = randInt(rng, min, max);

  const rows = chooseProps(rng, target);
  const props = allProps(rows);
  const theme = themeFor(rng, difficulty);
  const stages = layout(rng, rows, theme);

  // Cradles first: the crown pass then sees a boulder as the top of its column
  // and leaves it alone.
  for (const stage of stages) {
    cradlePass(rng, stage.grid);
    crownPass(rng, stage.grid);
  }

  const memoryTarget = clamp(Math.round(2 + difficulty * 0.8), 3, 6);
  placeMemories(rng, stages, memoryTarget);

  const nodes: LevelNode[] = [];
  stages.forEach((stage, index) => emitStage(nodes, stage, `p${index}_`));
  ensureMemories(rng, nodes, stages, memoryTarget);
  addObstacles(rng, nodes, stages, difficulty);

  const memories = nodes.filter((n) => n.isMemoryBlock).length;
  // Every memory block has to go over the edge of its pedestal, which takes
  // aimed shots rather than one lucky collapse, so the budget is per block and
  // barely touched by how many blocks the scenery is made of.
  const budget = Math.round(memories * 4.2 + nodes.length * 0.06);

  const tail = pick(rng, NAME_TAIL);
  const name =
    props.length > 1
      ? `${props[0].pattern.label} y ${props[1].pattern.label}`
      : `${props[0].pattern.label} ${props[0].pattern.feminine ? tail.f : tail.m}`;

  return {
    level_id: `gen_${seed}_${difficulty}`,
    name: name.toUpperCase(),
    palette: pick(rng, PALETTES),
    projectile_limit: clamp(budget, 12, 30),
    nodes,
  };
}

export function randomSeed() {
  return Math.floor(Math.random() * 0xffffff);
}

/* -------------------------------------------------------------------------- */
/* Campaign                                                                   */
/* -------------------------------------------------------------------------- */

// Fixed seeds: the six numbered levels have to be the same board for everyone,
// forever, or the stars stored against their ids stop meaning anything.
const CAMPAIGN: { id: string; seed: number; difficulty: Difficulty }[] = [
  { id: "level_1", seed: 0x5f1a21, difficulty: 1 },
  { id: "level_2", seed: 0x2c7b90, difficulty: 2 },
  { id: "level_3", seed: 0x91d044, difficulty: 3 },
  { id: "level_4", seed: 0x3ba8e7, difficulty: 4 },
  { id: "level_5", seed: 0x6e2f13, difficulty: 5 },
  { id: "level_6", seed: 0xa4c5d8, difficulty: 5 },
];

export function campaignLevels(): Record<string, LevelSchema> {
  const levels: Record<string, LevelSchema> = {};
  for (const entry of CAMPAIGN) {
    const level = generateLevel(entry.seed, entry.difficulty);
    level.level_id = entry.id;
    levels[entry.id] = level;
  }
  return levels;
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

type Box = { id: string; minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number; isStatic: boolean };

function toBox(node: LevelNode): Box {
  // Cylinder dimensions are [radiusTop, radiusBottom, height] and a sphere's
  // are [radius, _, _]; a cylinder's footprint is its widest radius.
  const [dx, dy, dz] = node.dimensions;
  const [w, h, d] =
    node.type === "cylinder"
      ? [Math.max(dx, dy) * 2, dz, Math.max(dx, dy) * 2]
      : node.type === "sphere"
        ? [dx * 2, dx * 2, dx * 2]
        : [dx, dy, dz];
  const [x, y, z] = node.position;
  return {
    id: node.id,
    minX: x - w / 2,
    maxX: x + w / 2,
    minY: y - h / 2,
    maxY: y + h / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2,
    // Anchored and self-driven bodies hold themselves up by definition.
    isStatic: !!node.isStatic || !!node.motion,
  };
}

const overlaps1d = (aMin: number, aMax: number, bMin: number, bMax: number, eps: number) =>
  aMin < bMax - eps && bMin < aMax - eps;

/**
 * Reports structures that will misbehave the moment physics starts:
 * interpenetrating bodies, and dynamic bodies with nothing under them.
 * Returns an empty array for a sound level.
 */
export function validateLevel(level: LevelSchema): string[] {
  const issues: string[] = [];
  const boxes = level.nodes.map(toBox);

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      // Two anchored bodies may share space on purpose — a spinning bar is
      // mounted through its post — and neither can be ejected by the solver.
      if (a.isStatic && b.isStatic) continue;
      if (
        overlaps1d(a.minX, a.maxX, b.minX, b.maxX, 0.02) &&
        overlaps1d(a.minY, a.maxY, b.minY, b.maxY, 0.02) &&
        overlaps1d(a.minZ, a.maxZ, b.minZ, b.maxZ, 0.02)
      ) {
        issues.push(`"${a.id}" y "${b.id}" nacen interpenetrados`);
      }
    }
  }

  // A block may rest on the ground or on something whose top surface is within
  // a small tolerance of its bottom, with overlapping footprints.
  const SUPPORT_TOLERANCE = 0.25;
  for (const box of boxes) {
    if (box.isStatic) continue;
    if (box.minY <= 0.05) continue;

    const supported = boxes.some(
      (other: (typeof boxes)[number]) =>
        other.id !== box.id &&
        other.maxY <= box.minY + 0.05 &&
        box.minY - other.maxY <= SUPPORT_TOLERANCE &&
        overlaps1d(box.minX, box.maxX, other.minX, other.maxX, 0) &&
        overlaps1d(box.minZ, box.maxZ, other.minZ, other.maxZ, 0)
    );

    if (!supported) {
      issues.push(`"${box.id}" no se apoya en nada (base en y=${box.minY.toFixed(2)})`);
    }
  }

  return issues;
}

export function getDailySeed(): number {
  const dateStr = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Stable id for today's challenge — also the key its score is stored under. */
export function dailyLevelId(date = new Date()): string {
  return `daily_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isDailyLevelId(levelId: string | undefined): boolean {
  return !!levelId?.startsWith("daily_");
}

export function generateDailyLevel(): LevelSchema {
  const seed = getDailySeed();
  const dateLabel = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short" }).toUpperCase();
  const level = generateLevel(seed, 4);
  // A dedicated id rather than a marker in the display name: the name is
  // user-facing text, and code was branching on it.
  level.level_id = dailyLevelId();
  level.name = `DESAFÍO DE HOY (${dateLabel})`;
  return level;
}
