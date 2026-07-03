## 2024-05-18 - Avoid O(N*M) lookups inside `.filter()` calls
**Learning:** Checking for element existence inside a `.filter()` using `Array.includes()` on another array results in O(N*M) time complexity. This is especially bad in frequently called UI functions like game event handlers or hint engines.
**Action:** Always pre-convert lookup arrays to a `Set` (O(1) lookup) *before* the `.filter()` operation to reduce complexity to O(N).
