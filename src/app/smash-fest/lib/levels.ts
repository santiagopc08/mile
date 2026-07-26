/**
 * Level schema and the bundled campaign for SmashFest.
 *
 * Kept out of the rendering component so it can be imported (and validated) by
 * plain Node — the component pulls in three.js, r3f and supabase.
 */

// `levelGenerator` only imports types from this file, so the cycle is erased at
// compile time and there is no runtime import loop.
import { campaignLevels } from "./levelGenerator";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * A body in a level. `dimensions` is read per type: box = [w, h, d],
 * cylinder = [radiusTop, radiusBottom, height], sphere = [radius, _, _].
 */
export interface LevelNode {
  id: string;
  type: "box" | "cylinder" | "sphere";
  dimensions: [number, number, number];
  position: [number, number, number];
  mass: number;
  friction: number;
  material: string; // "stone" | "wood" | "metal" | "special" | "platform"
  isMemoryBlock?: boolean;
  isStatic?: boolean; // Anchored platforms that must not fall on their own
  /**
   * Memory blocks only: the platform the block has to leave. Toppling one on
   * the spot is not enough — it has to go over the edge — which is what stops a
   * single collapse from clearing a level. Dropping below `releaseY` is the
   * usual way out; `releaseBox` ([minX, maxX, minZ, maxZ]) also catches a block
   * that left sideways and landed on the rubble piling up beside the platform.
   */
  releaseY?: number;
  releaseBox?: [number, number, number, number];
  /**
   * Obstacles that drive themselves. Any node carrying this is kinematic: it
   * pushes what it touches and nothing pushes back.
   */
  motion?: {
    kind: "spin" | "slide";
    /** spin: rad/s about Y. slide: rad/s of the sweep. */
    speed: number;
    /** slide: half-travel along X, in world units. */
    amplitude?: number;
    phase?: number;
  };
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

/**
 * The six numbered levels, built from fixed seeds by the procedural generator.
 *
 * They used to be hand-authored, which capped them at a dozen blocks each and
 * meant every gap or overlap had to be spotted by eye. Generating them keeps
 * them in step with the pattern library while staying byte-identical between
 * sessions — the stars stored against `level_1`…`level_6` have to keep meaning
 * the same board.
 */
export const DEFAULT_LEVELS: Record<string, LevelSchema> = campaignLevels();

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
      // Self-driven obstacles are kinematic: massless, like anchored ones.
      mass: n.isStatic || n.motion ? 0 : clamp((n.mass || 1) * scale, 0.5, 120),
      friction: clamp(n.friction ?? 0.6, 0.05, 1),
    })),
  };
}
