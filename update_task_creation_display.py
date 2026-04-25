import sys

file_path = 'src/components/symmetry/TaskModule.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Update addTask to include objectiveId
old_add_task = """  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      text: newTask,
      status: 'todo',
      category,
      updatedAt: new Date().toISOString(),
    };
    setTasks([...tasks, task]);
    setNewTask('');
  };"""

new_add_task = """  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      objectiveId: selectedObjectiveId || undefined,
      text: newTask,
      status: 'todo',
      category,
      updatedAt: new Date().toISOString(),
    };
    setTasks([...tasks, task]);
    setNewTask('');
    setSelectedObjectiveId('');
  };"""

content = content.replace(old_add_task, new_add_task)

# Add objective selector to UI
old_input_ui = """              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Nueva operación..."
                className="flex-1 bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-[10px] uppercase tracking-widest outline-none focus:border-user-a transition-colors"
              />"""

new_input_ui = """              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Nueva operación..."
                  className="flex-1 bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-[10px] uppercase tracking-widest outline-none focus:border-user-a transition-colors"
                />
                <select
                  value={selectedObjectiveId}
                  onChange={(e) => setSelectedObjectiveId(e.target.value)}
                  className="bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-[8px] uppercase tracking-widest outline-none focus:border-user-a transition-colors"
                >
                  <option value="">Sin Objetivo</option>
                  {objectives.map(obj => (
                    <option key={obj.id} value={obj.id}>{obj.title}</option>
                  ))}
                </select>
              </div>"""

content = content.replace(old_input_ui, new_input_ui)

# Update task card to show objective
task_card_p = '<p className="text-[10px] uppercase tracking-wider text-stone-800 dark:text-stone-200 max-w-[150px] truncate" title={task.text}>{task.text}</p>'
new_task_card_p = """<p className="text-[10px] uppercase tracking-wider text-stone-800 dark:text-stone-200 max-w-[150px] truncate" title={task.text}>{task.text}</p>
                         {task.objectiveId && (
                           <div className="mt-1 text-[7px] uppercase font-bold text-stone-400">
                             #{objectives.find(o => o.id === task.objectiveId)?.title}
                           </div>
                         )}"""

content = content.replace(task_card_p, new_task_card_p)

# Update IN PROGRESS column task card
in_progress_p = '<p className="text-[10px] uppercase tracking-wider text-stone-800 dark:text-stone-200">{task.text}</p>'
new_in_progress_p = """<p className="text-[10px] uppercase tracking-wider text-stone-800 dark:text-stone-200">{task.text}</p>
                         {task.objectiveId && (
                           <div className="mt-1 text-[7px] uppercase font-bold text-stone-400">
                             #{objectives.find(o => o.id === task.objectiveId)?.title}
                           </div>
                         )}"""
content = content.replace(in_progress_p, new_in_progress_p)

# Update DONE column task card
done_p = '<p className="text-[10px] uppercase tracking-wider text-stone-500 line-through">{task.text}</p>'
new_done_p = """<p className="text-[10px] uppercase tracking-wider text-stone-500 line-through">{task.text}</p>
                         {task.objectiveId && (
                           <div className="mt-1 text-[7px] uppercase font-bold text-stone-400">
                             #{objectives.find(o => o.id === task.objectiveId)?.title}
                           </div>
                         )}"""
content = content.replace(done_p, new_done_p)

with open(file_path, 'w') as f:
    f.write(content)
print("Successfully updated TaskModule.tsx creation and display UI")
