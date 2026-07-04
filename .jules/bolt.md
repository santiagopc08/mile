## 2024-06-25 - Refactoring Complex Game Board Generation
**Learning:** Overly complex nested loops containing both business logic and array mutation (`splice`) significantly reduce readability and increase cyclomatic complexity.
**Action:** Extract inner iteration/attempt logic into clearly named helper functions, and replace in-place reverse-loop array mutations with functional `.filter()` re-assignments.

## 2025-02-23 - Optimize O(N*M) array iterations within React renders
**Learning:** In highly interactive React components (like the Mahjong game and Task modules), mapping over small arrays (e.g., `[0, 1, 2]`) and performing an O(N) lookup internally (e.g., `Array.from(map.values()).find()`) executes the O(N) conversion repeatedly inside the loop block. This creates an O(N*M) allocation and iteration bottleneck that significantly slows down render cycles.
**Action:** When performing searches against collections inside a render loop, always pre-calculate or convert derived `Map` or `Set` iterators to arrays *before* the `.map()` loop to ensure single-pass O(N) execution instead of O(N*M). Additionally, replace double-pass O(N) state mutations (`.find` then `.map`) with single-pass `.findIndex` modifications.

## 2026-06-23 - Pre-calculate map keys/values outside render loops
**Learning:** Evaluating Object.keys() or Object.values() inside an array .map() inside a React component's return function creates significant O(N) evaluation overhead for every iteration of the outer map.
**Action:** Hoist the Object.keys/values generation to a pre-calculated constant outside the map function to evaluate it once per render cycle instead of O(N) times.
 
## 2024-07-28 - Avoid Array spreads on mapped property values
**Learning:** Calculating bounds or maximums using `Math.max(...array.map(item => item.value))` forces V8 to allocate two intermediate O(N) structures: a temporary array for `.map()` output, and a spread argument array (which can hit the JavaScript engine stack limit `Maximum call stack size exceeded` for large arrays).
**Action:** Replace `Math.max(...array.map(...))` inside React components with a standard O(N) `for...of` loop tracking the min/max incrementally to eliminate the garbage collection overhead and stack overflow risk.

## 2026-07-03 - Optimize intermediate chained map/filter arrays
**Learning:** In React useEffects tracking state changes like game completions, calculating derived results using chained `.filter().map().filter()` on potentially large arrays creates substantial temporary memory allocations and repeats O(N) operations.
**Action:** Replace intermediate array chaining with a single O(N) `for...of` pass containing early exits (`continue`) and incremental aggregations.

## 2025-03-02 - [O(N) Set Optimization for Dates]
**Learning:** Instantiating `new Date()` inside an O(N) loop is slow and creates unnecessary garbage collection overhead when the dates can be compared lexically as YYYY-MM-DD strings.
**Action:** When filtering dates inside loops, format the comparison boundary (e.g. `startOfWeekStr`) outside the loop and use lexical string comparison (`dateStr >= startOfWeekStr`) for ~28x speedup.
## 2024-05-30 - Map Lookup inside React Render Loop
**Learning:** Performing multiple Map `.get()` lookups inside an array `.map()` call that executes on every React render loop can cause a minor but frequent CPU overhead, which scales poorly as the array size increases.
**Action:** Extract these derivations into a `useMemo` hook that runs only when the dependencies change, returning an array of pre-calculated state objects that the render loop can cheaply iterate over.

## 2024-07-03 - Batch Push Notification Sends
**Learning:** Sending all push notifications in parallel with `Promise.all` across a large userbase can exhaust resources, cause rate limiting from push services, and consume excessive memory.
**Action:** When making bulk external API calls, process them in batches (e.g. 50 at a time) to cap concurrent connections and memory usage.
