import sys

file_path = 'src/components/symmetry/TaskModule.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Add the objective stats calculation and rendering logic
objective_stats_ui = """
          {/* Objectives Summary Stats */}
          {objectives.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {objectives.map((obj) => {
                const objTasks = tasks.filter(t => t.objectiveId === obj.id);
                const total = objTasks.length;
                const completed = objTasks.filter(t => t.status === 'done').length;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <div key={obj.id} className="p-3 border border-stone-200 dark:border-stone-800 bg-white/5 dark:bg-black/20 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-user-a truncate max-w-[80%]" title={obj.title}>
                        {obj.title}
                      </span>
                      <span className="text-[8px] font-mono text-stone-500">{percent}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[7px] uppercase font-bold tracking-wider text-stone-500">
                      <span>Tareas: {total}</span>
                      <span>Completadas: {completed}</span>
                    </div>
                    <div className="w-full h-1 bg-stone-100 dark:bg-stone-900 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        className="h-full bg-user-a"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
"""

# Insert the stats UI after the Objective Management block
if '          </div>\n\n          <div className="flex flex-col gap-2">' in content:
    content = content.replace('          </div>\n\n          <div className="flex flex-col gap-2">', '          </div>' + objective_stats_ui + '\n          <div className="flex flex-col gap-2">')
else:
    print("Could not find the insertion point for stats UI")
    sys.exit(1)

with open(file_path, 'w') as f:
    f.write(content)
print("Successfully updated TaskModule.tsx with objective stats")
