git add src/components/symmetry/TaskCard.tsx
git commit -m "🧹 [code health] Remove unused ChecklistItem import in TaskCard

🎯 What: Removed the unused ChecklistItem import from src/components/symmetry/TaskCard.tsx and updated the useState hooks that previously relied on it to use NonNullable<Task['actions']>.
💡 Why: Removing unused imports cleans up the code and slightly reduces parse times. We used NonNullable<Task['actions']> instead of creating a new type to ensure the state precisely matches the property type of the Task object.
✅ Verification: Ran \`npm run lint\`, \`npx tsc --noEmit\`, and \`npx playwright test\` to ensure no regressions.
✨ Result: Code is cleaner and types are more strongly coupled to the Task interface."
