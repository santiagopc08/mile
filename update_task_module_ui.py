import sys

file_path = 'src/components/symmetry/TaskModule.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Add addObjective and deleteObjective functions
add_objective_func = """  const addObjective = () => {
    if (!newObjective.trim()) return;
    const objective: Objective = {
      id: Date.now().toString(),
      title: newObjective,
    };
    setObjectives([...objectives, objective]);
    setNewObjective('');
  };

  const deleteObjective = (id: string) => {
    setObjectives(objectives.filter(o => o.id !== id));
    setTasks(tasks.map(t => t.objectiveId === id ? { ...t, objectiveId: undefined } : t));
  };
"""

# Insert addObjective and deleteObjective before deleteTask
if '  const deleteTask = (id: string) => {' in content:
    content = content.replace('  const deleteTask = (id: string) => {', add_objective_func + '\n  const deleteTask = (id: string) => {')
else:
    print("Could not find deleteTask function")
    sys.exit(1)

# Add UI for objective management at the top of the return block
ui_objective_management = """        <div className="space-y-6">
          {/* Objective Management */}
          <div className="p-4 border border-stone-200 dark:border-stone-800 bg-white/5 dark:bg-black/20">
            <h4 className="text-[9px] uppercase font-bold tracking-[0.2em] text-stone-500 mb-4 flex items-center justify-between">
              Gestión de Objetivos
              <span className="text-[7px] font-mono opacity-50">v1.0</span>
            </h4>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Nuevo objetivo..."
                className="flex-1 bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-[10px] uppercase tracking-widest outline-none focus:border-user-a transition-colors"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={addObjective}
                className="bg-stone-800 dark:bg-stone-200 text-white dark:text-black px-4 py-2"
              >
                <Plus size={16} />
              </motion.button>
            </div>

            <div className="flex flex-wrap gap-2">
              {objectives.map((obj) => (
                <div key={obj.id} className="flex items-center gap-2 px-2 py-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-stone-600">{obj.title}</span>
                  <button onClick={() => deleteObjective(obj.id)} className="text-stone-400 hover:text-red-500">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
"""

# Replace the initial return <div> with the new objective management UI
if '    return (\n        <div className="space-y-4">' in content:
    content = content.replace('    return (\n        <div className="space-y-4">', '    return (\n' + ui_objective_management)
elif '    return (\n        <div className="space-y-4">\n          <div className="flex flex-col gap-2">' in content:
    content = content.replace('    return (\n        <div className="space-y-4">\n          <div className="flex flex-col gap-2">', '    return (\n' + ui_objective_management + '          <div className="flex flex-col gap-2">')
else:
    # Try a more generic match
    content = content.replace('    return (', '    return (\n' + ui_objective_management)

with open(file_path, 'w') as f:
    f.write(content)
print("Successfully updated TaskModule.tsx UI")
