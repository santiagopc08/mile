/**
 * Level definitions for Breakout.
 * Each level is a 2D array of tier values (0 = empty, 1-3 = brick tiers with increasing hp).
 * Tier also determines point value: tier × 10.
 */

export const LEVELS = [
  // Level 1 — simple single-hit bricks (6 rows × 10 cols)
  {
    name: 'Level 1',
    layout: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    ballSpeed: 22,
  },
  // Level 2 — mixed tiers
  {
    name: 'Level 2',
    layout: [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
      [1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
    ],
    ballSpeed: 25,
  },
  // Level 3 — fortress with 3-hit bricks
  {
    name: 'Level 3',
    layout: [
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    ],
    ballSpeed: 28,
  },
];
