## 2024-06-25 - Refactoring Complex Game Board Generation
**Learning:** Overly complex nested loops containing both business logic and array mutation (`splice`) significantly reduce readability and increase cyclomatic complexity.
**Action:** Extract inner iteration/attempt logic into clearly named helper functions, and replace in-place reverse-loop array mutations with functional `.filter()` re-assignments.

## 2025-02-23 - Optimize O(N*M) array iterations within React renders
**Learning:** In highly interactive React components (like the Mahjong game and Task modules), mapping over small arrays (e.g., `[0, 1, 2]`) and performing an O(N) lookup internally (e.g., `Array.from(map.values()).find()`) executes the O(N) conversion repeatedly inside the loop block. This creates an O(N*M) allocation and iteration bottleneck that significantly slows down render cycles.
**Action:** When performing searches against collections inside a render loop, always pre-calculate or convert derived `Map` or `Set` iterators to arrays *before* the `.map()` loop to ensure single-pass O(N) execution instead of O(N*M). Additionally, replace double-pass O(N) state mutations (`.find` then `.map`) with single-pass `.findIndex` modifications.
