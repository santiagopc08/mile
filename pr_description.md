🎯 **What:** The `DualWallet.tsx` component was over 800 lines long, containing multiple concerns: state management for adding items, complex derived state calculation for metrics, rendering of form elements, metrics summaries, and historical lists. The refactor extracts the `DualWalletMetrics`, `DualWalletForm`, and `DualWalletHistory` into their own separate components, and moves shared types/constants to `DualWalletShared.tsx`.

💡 **Why:** This improves maintainability and readability by modularizing the codebase. The `DualWallet.tsx` file is now under 400 lines and focuses mainly on composing its subcomponents and managing the shared `allocations` state. Subcomponents now have focused responsibilities, which will make future updates easier and reduce merge conflicts.

✅ **Verification:** Verified by checking out the new files, running `npx tsc --noEmit` and `npm run lint` on the affected files, checking `git diff`, and ensuring Playwright tests unrelated to the UI don't introduce new failures.

✨ **Result:** A cleaner, more modular component structure for DualWallet that is easier to maintain without changing any of the underlying functionality or state hooks.
