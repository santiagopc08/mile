/**
 * Level data and schema for SmashFest.
 *
 * Kept out of the rendering component so it can be imported (and validated) by
 * plain Node — the component pulls in three.js, r3f and supabase.
 */

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export interface LevelNode {
  id: string;
  type: "box" | "cylinder";
  dimensions: [number, number, number];
  position: [number, number, number];
  mass: number;
  friction: number;
  material: string; // "stone" | "wood" | "metal" | "special"
  isMemoryBlock?: boolean;
  isStatic?: boolean; // Anchored platforms that must not fall on their own
}

export interface LevelSchema {
  level_id: string;
  name: string;
  palette: {
    background: string;
    projectile: string;
    ground: string;
  };
  projectile_limit: number;
  nodes: LevelNode[];
}

// 6 Escalating Levels. Every node rests on the one below it at spawn time:
// overlapping bodies get violently ejected by the solver, and gaps make a
// structure collapse (and auto-complete the level) before the first shot.
export const DEFAULT_LEVELS: Record<string, LevelSchema> = {
  level_1: {
    level_id: "level_1",
    name: "Torre Inicial",
    palette: {
      background: "#0c0a14",
      projectile: "#ff4b89",
      ground: "#1a1222",
    },
    projectile_limit: 8,
    nodes: [
      { id: "base1", type: "box", dimensions: [3, 0.8, 3], position: [0, 0.4, 0], mass: 30, friction: 0.7, material: "stone" },
      { id: "pillar1", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [-1, 1.8, -1], mass: 5, friction: 0.6, material: "wood" },
      { id: "pillar2", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [1, 1.8, -1], mass: 5, friction: 0.6, material: "wood" },
      { id: "pillar3", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [-1, 1.8, 1], mass: 5, friction: 0.6, material: "wood" },
      { id: "pillar4", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [1, 1.8, 1], mass: 5, friction: 0.6, material: "wood" },
      { id: "top1", type: "box", dimensions: [3, 0.5, 3], position: [0, 3.05, 0], mass: 8, friction: 0.6, material: "wood" },
      { id: "mem1", type: "box", dimensions: [1, 1, 1], position: [0, 3.8, 0], mass: 3, friction: 0.75, material: "special", isMemoryBlock: true },
    ],
  },
  level_2: {
    level_id: "level_2",
    name: "Castillo Gemelo",
    palette: {
      background: "#0a0c16",
      projectile: "#c3f400",
      ground: "#121a28",
    },
    projectile_limit: 10,
    nodes: [
      // Left Tower
      { id: "l_base", type: "box", dimensions: [2.2, 0.8, 2.2], position: [-2.5, 0.4, 0], mass: 26, friction: 0.7, material: "stone" },
      { id: "l_pil1", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [-3.2, 1.9, 0], mass: 5, friction: 0.6, material: "wood" },
      { id: "l_pil2", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [-1.8, 1.9, 0], mass: 5, friction: 0.6, material: "wood" },
      { id: "l_top", type: "box", dimensions: [2.2, 0.5, 2.2], position: [-2.5, 3.25, 0], mass: 7, friction: 0.6, material: "wood" },
      { id: "mem1", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-2.5, 3.96, 0], mass: 3, friction: 0.75, material: "special", isMemoryBlock: true },

      // Right Tower
      { id: "r_base", type: "box", dimensions: [2.2, 0.8, 2.2], position: [2.5, 0.4, 0], mass: 26, friction: 0.7, material: "stone" },
      { id: "r_pil1", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [1.8, 1.9, 0], mass: 5, friction: 0.6, material: "wood" },
      { id: "r_pil2", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [3.2, 1.9, 0], mass: 5, friction: 0.6, material: "wood" },
      { id: "r_top", type: "box", dimensions: [2.2, 0.5, 2.2], position: [2.5, 3.25, 0], mass: 7, friction: 0.6, material: "wood" },
      { id: "mem2", type: "box", dimensions: [0.9, 0.9, 0.9], position: [2.5, 3.96, 0], mass: 3, friction: 0.75, material: "special", isMemoryBlock: true },

      // Connecting bridge: rests on both roofs instead of intersecting them
      { id: "bridge", type: "box", dimensions: [3.4, 0.4, 1.5], position: [0, 3.71, 0], mass: 6, friction: 0.6, material: "wood" },
    ],
  },
  level_3: {
    level_id: "level_3",
    name: "Fortaleza de Cristal",
    palette: {
      background: "#120818",
      projectile: "#00dbe9",
      ground: "#22102b",
    },
    projectile_limit: 12,
    nodes: [
      // Base Grid
      { id: "b1", type: "box", dimensions: [1.8, 1.0, 1.8], position: [-1.8, 0.5, 0], mass: 24, friction: 0.7, material: "stone" },
      { id: "b2", type: "box", dimensions: [1.8, 1.0, 1.8], position: [0, 0.5, 0], mass: 24, friction: 0.7, material: "stone" },
      { id: "b3", type: "box", dimensions: [1.8, 1.0, 1.8], position: [1.8, 0.5, 0], mass: 24, friction: 0.7, material: "stone" },

      // Tier 2
      { id: "t2_p1", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [-1.2, 2.0, 0], mass: 5.5, friction: 0.6, material: "wood" },
      { id: "t2_p2", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [1.2, 2.0, 0], mass: 5.5, friction: 0.6, material: "wood" },
      { id: "t2_slab", type: "box", dimensions: [4.5, 0.5, 2.0], position: [0, 3.25, 0], mass: 9, friction: 0.6, material: "wood" },

      // Memory Blocks Tier
      { id: "mem1", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-1.5, 3.96, 0], mass: 3, friction: 0.75, material: "special", isMemoryBlock: true },
      { id: "mem2", type: "box", dimensions: [0.9, 0.9, 0.9], position: [0, 3.96, 0], mass: 3, friction: 0.75, material: "special", isMemoryBlock: true },
      { id: "mem3", type: "box", dimensions: [0.9, 0.9, 0.9], position: [1.5, 3.96, 0], mass: 3, friction: 0.75, material: "special", isMemoryBlock: true },
    ],
  },
  level_4: {
    level_id: "level_4",
    name: "Laberinto Flotante",
    palette: {
      background: "#081216",
      projectile: "#a178ff",
      ground: "#10242e",
    },
    projectile_limit: 12,
    nodes: [
      // Anchored platforms — the level is called "flotante" for a reason
      { id: "p1", type: "box", dimensions: [2.5, 0.6, 2.5], position: [-3, 1.2, -1], mass: 0, friction: 0.8, material: "stone", isStatic: true },
      { id: "p2", type: "box", dimensions: [2.5, 0.6, 2.5], position: [3, 1.2, -1], mass: 0, friction: 0.8, material: "stone", isStatic: true },
      { id: "p3", type: "box", dimensions: [3.0, 0.6, 3.0], position: [0, 2.8, 1], mass: 0, friction: 0.8, material: "stone", isStatic: true },

      { id: "c1", type: "cylinder", dimensions: [0.35, 0.35, 1.8], position: [-3, 2.4, -1], mass: 4.5, friction: 0.6, material: "wood" },
      { id: "c2", type: "cylinder", dimensions: [0.35, 0.35, 1.8], position: [3, 2.4, -1], mass: 4.5, friction: 0.6, material: "wood" },
      { id: "c3", type: "cylinder", dimensions: [0.35, 0.35, 1.8], position: [-0.8, 4.0, 1], mass: 4.5, friction: 0.6, material: "wood" },
      { id: "c4", type: "cylinder", dimensions: [0.35, 0.35, 1.8], position: [0.8, 4.0, 1], mass: 4.5, friction: 0.6, material: "wood" },

      { id: "mem1", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-3, 3.78, -1], mass: 2.5, friction: 0.75, material: "special", isMemoryBlock: true },
      { id: "mem2", type: "box", dimensions: [0.9, 0.9, 0.9], position: [3, 3.78, -1], mass: 2.5, friction: 0.75, material: "special", isMemoryBlock: true },
      { id: "mem3", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-0.8, 5.38, 1], mass: 2.5, friction: 0.75, material: "special", isMemoryBlock: true },
      { id: "mem4", type: "box", dimensions: [0.9, 0.9, 0.9], position: [0.8, 5.38, 1], mass: 2.5, friction: 0.75, material: "special", isMemoryBlock: true },
    ],
  },
  level_5: {
    level_id: "level_5",
    name: "Bastión Acorazado",
    palette: {
      background: "#180a0a",
      projectile: "#ff003c",
      ground: "#2d1212",
    },
    projectile_limit: 14,
    nodes: [
      // Armor Front Wall (Metal)
      { id: "metal1", type: "box", dimensions: [5.0, 1.8, 0.6], position: [0, 0.9, 2], mass: 40, friction: 0.5, material: "metal" },
      { id: "metal2", type: "box", dimensions: [5.0, 1.8, 0.6], position: [0, 2.7, 2], mass: 40, friction: 0.5, material: "metal" },

      // Inner Keep Towers
      { id: "ik1", type: "box", dimensions: [2.0, 0.8, 2.0], position: [-1.8, 0.4, -0.5], mass: 26, friction: 0.7, material: "stone" },
      { id: "ik2", type: "box", dimensions: [2.0, 0.8, 2.0], position: [1.8, 0.4, -0.5], mass: 26, friction: 0.7, material: "stone" },

      { id: "ik_c1", type: "cylinder", dimensions: [0.4, 0.4, 2.5], position: [-1.8, 2.06, -0.5], mass: 6.5, friction: 0.6, material: "wood" },
      { id: "ik_c2", type: "cylinder", dimensions: [0.4, 0.4, 2.5], position: [1.8, 2.06, -0.5], mass: 6.5, friction: 0.6, material: "wood" },

      // Memory Core
      { id: "mem1", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-1.8, 3.76, -0.5], mass: 3.5, friction: 0.75, material: "special", isMemoryBlock: true },
      { id: "mem2", type: "box", dimensions: [0.9, 0.9, 0.9], position: [1.8, 3.76, -0.5], mass: 3.5, friction: 0.75, material: "special", isMemoryBlock: true },
      { id: "mem3", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-0.9, 4.06, 2], mass: 3.5, friction: 0.75, material: "special", isMemoryBlock: true },
      { id: "mem4", type: "box", dimensions: [0.9, 0.9, 0.9], position: [0.9, 4.06, 2], mass: 3.5, friction: 0.75, material: "special", isMemoryBlock: true },
    ],
  },
  level_6: {
    level_id: "level_6",
    name: "Ciudadela Cósmica",
    palette: {
      background: "#0d0614",
      projectile: "#ff4b89",
      ground: "#200e30",
    },
    projectile_limit: 15,
    nodes: [
      // Central Citadel Spire
      { id: "spire_base", type: "cylinder", dimensions: [1.5, 1.8, 1.5], position: [0, 0.75, 0], mass: 45, friction: 0.75, material: "stone" },
      { id: "spire_mid", type: "cylinder", dimensions: [1.2, 1.2, 2.5], position: [0, 2.75, 0], mass: 26, friction: 0.7, material: "stone" },
      { id: "spire_top", type: "box", dimensions: [3.2, 0.6, 3.2], position: [0, 4.3, 0], mass: 12, friction: 0.6, material: "wood" },

      // Outer Ring Pillars
      { id: "op1", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [-2.5, 1.1, -2.5], mass: 5.5, friction: 0.6, material: "wood" },
      { id: "op2", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [2.5, 1.1, -2.5], mass: 5.5, friction: 0.6, material: "wood" },
      { id: "op3", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [-2.5, 1.1, 2.5], mass: 5.5, friction: 0.6, material: "wood" },
      { id: "op4", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [2.5, 1.1, 2.5], mass: 5.5, friction: 0.6, material: "wood" },

      // Memory Blocks Crown
      { id: "mem1", type: "box", dimensions: [0.9, 0.9, 0.9], position: [0, 5.06, 0], mass: 3.5, friction: 0.75, material: "special", isMemoryBlock: true },
      { id: "mem2", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-2.5, 2.66, -2.5], mass: 3.5, friction: 0.75, material: "special", isMemoryBlock: true },
      { id: "mem3", type: "box", dimensions: [0.9, 0.9, 0.9], position: [2.5, 2.66, -2.5], mass: 3.5, friction: 0.75, material: "special", isMemoryBlock: true },
      { id: "mem4", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-2.5, 2.66, 2.5], mass: 3.5, friction: 0.75, material: "special", isMemoryBlock: true },
      { id: "mem5", type: "box", dimensions: [0.9, 0.9, 0.9], position: [2.5, 2.66, 2.5], mass: 3.5, friction: 0.75, material: "special", isMemoryBlock: true },
    ],
  },
};

// Remote rows may still carry the legacy 10x mass scale, which makes the solver
// spongy. Bring anything oversized back into the range the tuning assumes.
export function normalizeLevel(raw: LevelSchema): LevelSchema {
  const nodes = Array.isArray(raw?.nodes) ? raw.nodes : [];
  const heaviest = nodes.reduce((max, n) => Math.max(max, n.mass || 0), 0);
  const scale = heaviest > 120 ? 0.1 : 1;

  return {
    ...raw,
    projectile_limit: clamp(raw.projectile_limit || 8, 1, 40),
    nodes: nodes.map((n) => ({
      ...n,
      mass: n.isStatic ? 0 : clamp((n.mass || 1) * scale, 0.5, 120),
      friction: clamp(n.friction ?? 0.6, 0.05, 1),
    })),
  };
}
