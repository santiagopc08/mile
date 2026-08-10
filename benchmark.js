const byCategory = { a: 1, b: 2 };
console.time('Object.keys');
for (let i = 0; i < 1000000; i++) {
  const result = Object.keys(byCategory).length > 0;
}
console.timeEnd('Object.keys');

let hasCategories = true;
console.time('cached');
for (let i = 0; i < 1000000; i++) {
  const result = hasCategories;
}
console.timeEnd('cached');
