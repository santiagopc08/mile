const fs = require('fs');
let content = fs.readFileSync('src/components/symmetry/TaskCard.tsx', 'utf8');

// I accidentally replaced `export const TaskCard = ...` with a comment and `export const TaskCard`,
// which caused the earlier `modify_task_card.js` logic to be duplicated? No wait.
// Ah, the problem is `export const TaskCard = memo(function TaskCard({`
// And on line 49 it says `}: TaskCardProps) {`
// Wait, TS1005: '{' expected.
// Is it because `function TaskCard(...)` cannot have a return type like that? No, it doesn't have a return type.
// Is it because `memo(...)` doesn't support generic type inference if it's not a generic function? No.
// Let's use `memo(( { ... }: TaskCardProps ) => {` instead!

content = content.replace(/memo\(function TaskCard\(\{/g, 'memo(({');
content = content.replace(/\}:\s*TaskCardProps\)\s*\{/g, '}: TaskCardProps) => {');

fs.writeFileSync('src/components/symmetry/TaskCard.tsx', content);

let content2 = fs.readFileSync('src/components/health/movement/ActivitySessionItem.tsx', 'utf8');
content2 = content2.replace(/memo\(function ActivitySessionItem\(\{/g, 'memo(({');
content2 = content2.replace(/\}:\s*ActivitySessionItemProps\)\s*\{/g, '}: ActivitySessionItemProps) => {');
fs.writeFileSync('src/components/health/movement/ActivitySessionItem.tsx', content2);
