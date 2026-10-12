🎯 **What:** Replaced the `any` type assigned to the `row` parameter in `useMovementData.ts` with `Partial<MovementSession>`, and cast the mapped object to `MovementSession`.

💡 **Why:** This improves maintainability and type safety by enforcing the schema of the fetched database records, removing a vague `any` assertion and ensuring that returned objects correctly match the `MovementSession` structure.

✅ **Verification:** Verified by checking type soundness with `npm run typecheck` and running the test suite with `npm run test` to ensure no functional regressions occurred.

✨ **Result:** Enhanced code health by eliminating an unnecessary `any` type, thus making the file safer and easier to refactor in the future.
