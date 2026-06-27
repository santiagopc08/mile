🎯 **What:** Removed an unnecessary `console.log` statement from `src/app/api/push/send/route.ts` that was logging expired push subscriptions. Also cleaned up an unused `verifyServerSession` import in the same file.

💡 **Why:** Leftover debugging `console.log` statements clutter server logs, increasing noise and making it harder to spot actual issues. Removing them improves code cleanliness and maintainability. Cleaning up unused imports avoids linter warnings and keeps dependencies tidy.

✅ **Verification:**
- Successfully ran `npm run lint` and `npx tsc --noEmit` confirming no syntax or type errors.
- Ran the full Playwright test suite (`npx playwright test`) validating that the push API and overall application behavior remain intact.

✨ **Result:** Cleaner server route with reduced log spam when handling expired push subscriptions.
