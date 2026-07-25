import type { LevelNode, LevelSchema } from "../components/SmashFestGame";

/**
 * Procedural level generator for SmashFest.
 *
 * The whole point is that structures are built with a vertical cursor: every
 * piece is placed exactly on top of the previous one's surface. Hand-authored
 * levels kept shipping two classes of bug that this makes impossible:
 *
 *  - a gap under a block, so the tower half-collapses on load (and, for memory
 *    blocks, auto-completes the level before the first shot)
 *  - two blocks spawning interpenetrated, which the solver resolves by
 *    launching them across the map
 *
 * `validateLevel` re-checks both properties and is also useful against levels
 * coming from Supabase.
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

const range = (rng: Rng, min: number, max: number) => min + rng() * (max - min);
const pick = <T,>(rng: Rng, items: readonly T[]) => items[Math.floor(rng() * items.length)];
const round2 = (n: number) => Math.round(n * 100) / 100;

/* -------------------------------------------------------------------------- */
/* Material palette                                                           */
/* -------------------------------------------------------------------------- */

// Masses match the hand-tuned scale in SmashFestGame: heaviest body ~15x the
// lightest keeps cannon's solver stable.
const MATERIALS = {
  stone: { mass: 26, friction: 0.7 },
  metal: { mass: 40, friction: 0.5 },
  wood: { mass: 6, friction: 0.6 },
  special: { mass: 3, friction: 0.75 },
} as const;

const PALETTES = [
  { background: "#0c0a14", projectile: "#ff4b89", ground: "#1a1222" },
  { background: "#0a0c16", projectile: "#c3f400", ground: "#121a28" },
  { background: "#120818", projectile: "#00dbe9", ground: "#22102b" },
  { background: "#081216", projectile: "#a178ff", ground: "#10242e" },
  { background: "#180a0a", projectile: "#ff003c", ground: "#2d1212" },
  { background: "#0d0614", projectile: "#ff4b89", ground: "#200e30" },
] as const;

// Heads carry their grammatical gender so the adjective agrees: "Bastión
// Suspendido", not "Bastión Suspendida".
const NAME_HEAD = [
  { word: "Torre", feminine: true },
  { word: "Bastión", feminine: false },
  { word: "Ciudadela", feminine: true },
  { word: "Fortaleza", feminine: true },
  { word: "Atalaya", feminine: true },
  { word: "Reducto", feminine: false },
  { word: "Santuario", feminine: false },
] as const;

const NAME_TAIL = [
  { m: "Olvidado", f: "Olvidada" },
  { m: "de Cristal", f: "de Cristal" },
  { m: "Gemelo", f: "Gemela" },
  { m: "Acorazado", f: "Acorazada" },
  { m: "Suspendido", f: "Suspendida" },
  { m: "Escarlata", f: "Escarlata" },
  { m: "de Ecos", f: "de Ecos" },
  { m: "Silente", f: "Silente" },
  { m: "de Ceniza", f: "de Ceniza" },
] as const;

/* -------------------------------------------------------------------------- */
/* Structure builder                                                          */
/* -------------------------------------------------------------------------- */

class StructureBuilder {
  readonly nodes: LevelNode[] = [];
  private counter = 0;

  private id(prefix: string) {
    return `${prefix}_${this.counter++}`;
  }

  /** Adds a box whose *bottom* sits at `bottomY`. Returns its top surface. */
  box(
    prefix: string,
    bottomY: number,
    position: [number, number],
    size: [number, number, number],
    material: keyof typeof MATERIALS,
    extra?: Partial<LevelNode>
  ) {
    const [w, h, d] = size;
    const spec = MATERIALS[material];
    this.nodes.push({
      id: this.id(prefix),
      type: "box",
      dimensions: [round2(w), round2(h), round2(d)],
      position: [round2(position[0]), round2(bottomY + h / 2), round2(position[1])],
      mass: spec.mass,
      friction: spec.friction,
      material,
      ...extra,
    });
    return bottomY + h;
  }

  /** Adds a cylinder whose *bottom* sits at `bottomY`. Returns its top surface. */
  cylinder(prefix: string, bottomY: number, position: [number, number], radius: number, height: number) {
    const spec = MATERIALS.wood;
    this.nodes.push({
      id: this.id(prefix),
      type: "cylinder",
      dimensions: [round2(radius), round2(radius), round2(height)],
      position: [round2(position[0]), round2(bottomY + height / 2), round2(position[1])],
      mass: spec.mass,
      friction: spec.friction,
      material: "wood",
    });
    return bottomY + height;
  }
}

type StackOptions = {
  x: number;
  z: number;
  width: number;
  depth: number;
  tiers: number;
  memoryCount: number;
  /** Anchored base — the structure floats instead of resting on the ground. */
  floatingAt?: number;
};

/**
 * One tower: base -> (pillars -> slab) x tiers -> memory blocks.
 * Each step starts exactly where the previous one ended.
 */
function buildStack(b: StructureBuilder, rng: Rng, opts: StackOptions) {
  const { x, z, width, depth, tiers, memoryCount } = opts;
  let top = 0;

  if (opts.floatingAt !== undefined) {
    // Static platforms carry no load and need nothing underneath them.
    top = b.box("plat", opts.floatingAt, [x, z], [width + 0.3, 0.6, depth + 0.3], "stone", {
      mass: 0,
      isStatic: true,
    });
  } else {
    top = b.box("base", 0, [x, z], [width, 0.8, depth], "stone");
  }

  let tierWidth = width;
  let tierDepth = depth;

  for (let tier = 0; tier < tiers; tier++) {
    const radius = round2(range(rng, 0.32, 0.42));
    const height = round2(range(rng, 1.8, 2.5));
    const insetX = Math.max(0.5, tierWidth / 2 - radius - 0.15);
    const insetZ = Math.max(0.5, tierDepth / 2 - radius - 0.15);

    // Four legs on wide tiers, two on narrow ones.
    const legs: [number, number][] =
      tierDepth > 1.6
        ? [
            [x - insetX, z - insetZ],
            [x + insetX, z - insetZ],
            [x - insetX, z + insetZ],
            [x + insetX, z + insetZ],
          ]
        : [
            [x - insetX, z],
            [x + insetX, z],
          ];

    for (const leg of legs) b.cylinder("pil", top, leg, radius, height);
    top += height;

    tierWidth = Math.max(1.6, tierWidth - range(rng, 0, 0.4));
    tierDepth = Math.max(1.4, tierDepth - range(rng, 0, 0.4));
    top = b.box("slab", top, [x, z], [tierWidth, 0.5, tierDepth], "wood");
  }

  // Memory blocks are laid out at a fixed pitch so they can never spawn
  // overlapping, and the count is capped by what actually fits on the slab.
  const memSize = 0.9;
  const pitch = memSize + 0.16;
  const fits = Math.max(1, Math.floor((tierWidth + 0.16) / pitch));
  const placed = Math.min(memoryCount, fits);
  const startX = x - (pitch * (placed - 1)) / 2;

  for (let i = 0; i < placed; i++) {
    b.box("mem", top, [startX + pitch * i, z], [memSize, memSize, memSize], "special", {
      isMemoryBlock: true,
    });
  }

  return placed;
}

/** Free-standing metal wall the player has to breach or shoot over. */
function buildArmorWall(b: StructureBuilder, width: number, z: number) {
  let top = b.box("armor", 0, [0, z], [width, 1.8, 0.6], "metal");
  b.box("armor", top, [0, z], [width, 1.8, 0.6], "metal");
  top += 1.8;
}

/* -------------------------------------------------------------------------- */
/* Generator                                                                  */
/* -------------------------------------------------------------------------- */

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export function generateLevel(seed: number, difficulty: Difficulty = 3): LevelSchema {
  const rng = mulberry32(seed);
  const b = new StructureBuilder();

  const towerCount = difficulty <= 1 ? 1 : difficulty <= 3 ? 2 : 3;
  const tiers = Math.min(3, 1 + Math.floor(difficulty / 2));
  const hasArmor = difficulty >= 4 && rng() > 0.4;
  const hasFloating = difficulty >= 3 && rng() > 0.6;

  // Towers are spread on X and given a little Z jitter so the camera doesn't
  // see a flat row.
  const spacing = towerCount === 1 ? 0 : 5.2;
  const firstX = -((towerCount - 1) * spacing) / 2;

  let memoryTotal = 0;

  for (let i = 0; i < towerCount; i++) {
    const memoryCount = 1 + (rng() > 0.55 ? 1 : 0);

    memoryTotal += buildStack(b, rng, {
      x: firstX + i * spacing,
      z: round2(range(rng, -1, 1)),
      width: round2(range(rng, 2.2, 3.0)),
      depth: round2(range(rng, 1.8, 2.6)),
      tiers,
      memoryCount,
      floatingAt: hasFloating && i === towerCount - 1 ? round2(range(rng, 1.0, 2.0)) : undefined,
    });
  }

  if (hasArmor) {
    // Placed clear of whatever the towers ended up occupying — a fixed z would
    // intersect a tower whose depth jitter pushed it forward.
    const frontZ = b.nodes.reduce((max, n) => {
      const depth = n.type === "cylinder" ? Math.max(n.dimensions[0], n.dimensions[1]) * 2 : n.dimensions[2];
      return Math.max(max, n.position[2] + depth / 2);
    }, 0);
    buildArmorWall(b, round2(range(rng, 4.5, 6.0)), round2(frontZ + 1.0));
  }

  // Roughly four shots per memory block, tightening as difficulty climbs.
  const budget = Math.round(memoryTotal * (5 - difficulty * 0.4) + 3);

  const level: LevelSchema = {
    level_id: `gen_${seed}_${difficulty}`,
    name: (() => {
      const head = pick(rng, NAME_HEAD);
      const tail = pick(rng, NAME_TAIL);
      return `${head.word} ${head.feminine ? tail.f : tail.m}`;
    })(),
    palette: pick(rng, PALETTES),
    projectile_limit: Math.max(6, Math.min(20, budget)),
    nodes: b.nodes,
  };

  if (process.env.NODE_ENV !== "production") {
    const issues = validateLevel(level);
    if (issues.length > 0) {
      console.warn(`[smash-fest] generated level ${level.level_id} has issues:`, issues);
    }
  }

  return level;
}

export function randomSeed() {
  return Math.floor(Math.random() * 0xffffff);
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

type Box = { id: string; minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number; isStatic: boolean };

function toBox(node: LevelNode): Box {
  // Cylinder dimensions are [radiusTop, radiusBottom, height]; its footprint is
  // the widest radius.
  const [dx, dy, dz] = node.dimensions;
  const [w, h, d] =
    node.type === "cylinder" ? [Math.max(dx, dy) * 2, dz, Math.max(dx, dy) * 2] : [dx, dy, dz];
  const [x, y, z] = node.position;
  return {
    id: node.id,
    minX: x - w / 2,
    maxX: x + w / 2,
    minY: y - h / 2,
    maxY: y + h / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2,
    isStatic: !!node.isStatic,
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
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `daily_${iso}`;
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

