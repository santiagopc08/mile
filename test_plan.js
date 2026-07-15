const fs = require('fs');
const content = fs.readFileSync('src/services/storeService.ts', 'utf-8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('// Update tracking'));
const endIndex = lines.findIndex(l => l.includes('// === PLANES MODULE'));

console.log(lines.slice(startIndex, endIndex).join('\n'));
