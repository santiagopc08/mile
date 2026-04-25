import sys

file_path = 'src/components/symmetry/TaskModule.tsx'
with open(file_path, 'r') as f:
    content = f.read()

search_text = """export const TaskModule = ({ onTasksUpdate }: { onTasksUpdate: (focusScore: number) => void }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [category, setCategory] = useState<'work' | 'home' | 'personal'>('work');

  useEffect(() => {
    const saved = localStorage.getItem('symmetry_tasks');
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('symmetry_tasks', JSON.stringify(tasks));
    const completedCount = tasks.filter(t => t.status === 'done').length;
    const focusScore = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
    onTasksUpdate(focusScore);
  }, [tasks, onTasksUpdate]);"""

replace_text = """export const TaskModule = ({ onTasksUpdate }: { onTasksUpdate: (focusScore: number) => void }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [category, setCategory] = useState<'work' | 'home' | 'personal'>('work');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>('');

  useEffect(() => {
    const savedTasks = localStorage.getItem('symmetry_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    const savedObjectives = localStorage.getItem('symmetry_objectives');
    if (savedObjectives) setObjectives(JSON.parse(savedObjectives));
  }, []);

  useEffect(() => {
    localStorage.setItem('symmetry_tasks', JSON.stringify(tasks));
    localStorage.setItem('symmetry_objectives', JSON.stringify(objectives));
    const completedCount = tasks.filter(t => t.status === 'done').length;
    const focusScore = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
    onTasksUpdate(focusScore);
  }, [tasks, objectives, onTasksUpdate]);"""

if search_text in content:
    new_content = content.replace(search_text, replace_text)
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Successfully updated TaskModule.tsx")
else:
    print("Could not find search text")
    sys.exit(1)
