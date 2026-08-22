## 2025-02-28 - Avoid Over-Optimizing API Request Concurrency
**Learning:** Removing a deliberate concurrency boundary (like chunking large `Promise.all` sets into chunks of 50) specifically to reduce a small intermediate array allocation map can crash the Node instance with `EMFILE` under load. Also, optimizing a `find()` inside a loop over a 7-element array by creating a full `Map` of a 144-element array introduces more memory overhead than the optimization saves.
**Action:** Do not micro-optimize Array allocations or iterations if it introduces unsafe behavior like unbound API concurrency, or if the size of the arrays are incredibly small (less than 10).
## 2023-10-27 - [Optimize React List Rendering Filtering]
**Learning:** Double filtering the same array to split items on every render in functional components is a common performance bottleneck that scales poorly as array size grows.
**Action:** Replace multiple sequential `.filter()` passes inside components with a single O(N) pass wrapped in `useMemo` to group/split items efficiently and reduce intermediate array allocations.
## 2025-02-28 - [Memoize List Item Rendering]
**Learning:** In functional components rendering long lists (like `Timeline`), components mapped over arrays re-render completely every time a parent state changes (e.g. `isAdding` or `activeEventId`). In this specific codebase, missing `React.memo` on list item components that perform expensive tag iterations and rendering causes measurable UI blocking.
**Action:** Always wrap complex list item components (`export const ComponentName = memo(function ComponentName(...)`) when extracting them to ensure they only re-render when their specific props change.
