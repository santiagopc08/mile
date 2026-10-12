const { performance } = require('perf_hooks');

const generateTasks = (numTasks, numItems) => {
  const tasks = [];
  for (let i = 0; i < numTasks; i++) {
    const actions = [];
    for (let j = 0; j < numItems; j++) {
      actions.push({ id: `item-${i}-${j}`, checked: false });
    }
    tasks.push({
      id: `task-${i}`,
      actions,
      validations: []
    });
  }
  return tasks;
};

const runBenchmark = () => {
  const tasks = generateTasks(1000, 100);
  const taskId = 'task-500';
  const listType = 'actions';
  const itemId = 'item-500-50';

  // Original
  const startOriginal = performance.now();
  for (let iter = 0; iter < 1000; iter++) {
    const updatedTasks = tasks.map((t) => {
        if (t.id === taskId) {
            const list = (t[listType] || []);
            const newList = list.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i);
            return { ...t, [listType]: newList };
        }
        return t;
    });
  }
  const endOriginal = performance.now();

  // Optimized
  const startOptimized = performance.now();
  for (let iter = 0; iter < 1000; iter++) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        const updatedTasks = [...tasks];
        const task = updatedTasks[taskIndex];
        const list = (task[listType] || []);

        const itemIndex = list.findIndex(i => i.id === itemId);
        if (itemIndex !== -1) {
            const newList = [...list];
            newList[itemIndex] = { ...newList[itemIndex], checked: !newList[itemIndex].checked };
            updatedTasks[taskIndex] = { ...task, [listType]: newList };
        }
    }
  }
  const endOptimized = performance.now();

  console.log(`Original: ${endOriginal - startOriginal} ms`);
  console.log(`Optimized: ${endOptimized - startOptimized} ms`);
};

runBenchmark();
