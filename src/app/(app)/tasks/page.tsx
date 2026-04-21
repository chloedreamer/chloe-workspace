"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { COLUMNS, PRIORITIES, getProjectBadgeStyle } from "@/lib/constants";
import { useProjects } from "@/components/ProjectsProvider";
import { fetcher } from "@/lib/fetcher";
import { Plus, Trash2, GripVertical, ChevronDown, X, LayoutGrid, List, CheckSquare, MessageSquare } from "lucide-react";
import TaskDetailPanel from "@/components/TaskDetailPanel";
import { TasksSkeleton } from "@/components/Skeleton";

interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  order: number;
  dueDate: string | null;
  subtasks: Subtask[];
  _count: { comments: number };
}

export default function TasksPage() {
  const { projects } = useProjects();
  const { data: tasks, mutate: fetchTasks } = useSWR<Task[]>("/api/tasks", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [filterProject, setFilterProject] = useState("all");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    category: "general",
    dueDate: "",
  });
  const [newSubtasks, setNewSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");

  if (!tasks) return <TasksSkeleton />;

  const addSubtaskToForm = () => {
    if (!subtaskInput.trim()) return;
    setNewSubtasks([...newSubtasks, subtaskInput.trim()]);
    setSubtaskInput("");
  };

  const removeSubtaskFromForm = (idx: number) => {
    setNewSubtasks(newSubtasks.filter((_, i) => i !== idx));
  };

  const createTask = async () => {
    if (!form.title.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const task = await res.json();
    if (newSubtasks.length > 0) {
      await Promise.all(
        newSubtasks.map((title, i) =>
          fetch(`/api/tasks/${task.id}/subtasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, order: i }),
          })
        )
      );
    }
    setForm({ title: "", description: "", status: "todo", priority: "medium", category: "general", dueDate: "" });
    setNewSubtasks([]);
    setSubtaskInput("");
    setShowForm(false);
    fetchTasks();
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  };

  const filteredTasks = filterProject === "all" ? tasks : tasks.filter((t) => t.category === filterProject);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) updateTask(taskId, { status: newStatus });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-rose-dark tracking-tight">Tasks</h1>
          <p className="text-sm text-rose-muted mt-1">{tasks.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-white rounded-lg overflow-hidden shadow-sm">
            <button onClick={() => setViewMode("board")} className={`p-2 transition ${viewMode === "board" ? "bg-rose-light text-rose-deep" : "text-rose-muted hover:text-rose-deep"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-2 transition ${viewMode === "list" ? "bg-rose-light text-rose-deep" : "text-rose-muted hover:text-rose-deep"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="appearance-none bg-white shadow-sm rounded-lg px-4 py-2 pr-8 text-sm text-rose-dark focus:outline-none focus:ring-2 focus:ring-rose">
              <option value="all">All Projects</option>
              {projects.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-rose-muted pointer-events-none" />
          </div>
          <button onClick={() => { setShowForm(true); setForm({ title: "", description: "", status: "todo", priority: "medium", category: "general", dueDate: "" }); }} className="flex items-center gap-2 bg-rose-deep text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {/* New Task Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-rose-dark">New Task</h2>
              <button onClick={() => setShowForm(false)} className="text-rose-muted hover:text-rose-deep"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Task title..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose" autoFocus />
              <textarea placeholder="Description (optional)..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose h-20 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-rose-muted mb-1 block">Project</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose">
                    {projects.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-rose-muted mb-1 block">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose">
                    {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-rose-muted mb-1 block">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose">
                    {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-rose-muted mb-1 block">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
                </div>
              </div>
              {/* Subtasks */}
              <div>
                <label className="text-xs text-rose-muted mb-1 block">Subtasks</label>
                {newSubtasks.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {newSubtasks.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-rose-dark bg-rose-light rounded-lg px-3 py-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-rose-muted" />
                        <span className="flex-1">{s}</span>
                        <button onClick={() => removeSubtaskFromForm(i)} className="text-rose-muted hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input type="text" value={subtaskInput} onChange={(e) => setSubtaskInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtaskToForm(); } }} placeholder="Add subtask..." className="flex-1 border border-rose-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
                  <button type="button" onClick={addSubtaskToForm} className="px-2 py-1.5 bg-rose-light text-rose-deep rounded-lg text-sm hover:bg-rose transition">+</button>
                </div>
              </div>
              <button onClick={createTask} className="w-full bg-rose-deep text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">Create Task</button>
            </div>
          </div>
        </div>
      )}

      {/* Board View */}
      {viewMode === "board" && (
        <div className="grid grid-cols-3 gap-5">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="kanban-column" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, col.key)}>
                <div className={`${col.headerColor} rounded-t-xl px-4 py-3 flex items-center gap-2`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <h3 className="font-semibold text-sm text-rose-dark">{col.label}</h3>
                  <span className="text-xs text-rose-muted ml-auto">{colTasks.length}</span>
                </div>
                <div className="bg-white/40 rounded-b-xl p-3 space-y-3 min-h-[300px]">
                  {colTasks.map((task) => {
                    const proj = projects.find((p) => p.key === task.category);
                    const pri = PRIORITIES.find((p) => p.key === task.priority);
                    const doneSubtasks = task.subtasks?.filter((s) => s.done).length || 0;
                    const totalSubtasks = task.subtasks?.length || 0;
                    return (
                      <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)} className="task-card bg-white rounded-lg p-4 shadow-sm cursor-grab active:cursor-grabbing">
                        <div className="flex items-start justify-between gap-2">
                          <GripVertical className="w-4 h-4 text-rose-border mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-rose-dark cursor-pointer hover:text-rose-deep" onClick={() => setSelectedTaskId(task.id)}>{task.title}</p>
                            {task.description && <p className="text-xs text-rose-muted mt-1 line-clamp-2">{task.description}</p>}
                          </div>
                          <button onClick={() => deleteTask(task.id)} className="text-rose-border hover:text-red-400 transition flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {proj && <span className="text-xs px-2 py-0.5 rounded-full border" style={getProjectBadgeStyle(proj.color)}>{proj.name}</span>}
                          {pri && <span className={`text-xs ${pri.color}`}>{pri.label}</span>}
                          {totalSubtasks > 0 && (
                            <span className="text-xs text-rose-muted flex items-center gap-1">
                              <CheckSquare className="w-3 h-3" /> {doneSubtasks}/{totalSubtasks}
                            </span>
                          )}
                          {task._count?.comments > 0 && (
                            <span className="text-xs text-rose-muted flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {task._count.comments}
                            </span>
                          )}
                          {task.dueDate && <span className="text-xs text-rose-muted ml-auto">{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="card overflow-hidden">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-rose-light border-b border-rose-border">
                <th className="text-left text-xs font-semibold text-rose-muted px-4 py-3">Task</th>
                <th className="text-left text-xs font-semibold text-rose-muted px-4 py-3 w-28">Status</th>
                <th className="text-left text-xs font-semibold text-rose-muted px-4 py-3 w-28">Priority</th>
                <th className="text-left text-xs font-semibold text-rose-muted px-4 py-3 w-28">Project</th>
                <th className="text-left text-xs font-semibold text-rose-muted px-4 py-3 w-28">Due Date</th>
                <th className="text-left text-xs font-semibold text-rose-muted px-4 py-3 w-28">Progress</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const proj = projects.find((p) => p.key === task.category);
                const pri = PRIORITIES.find((p) => p.key === task.priority);
                const col = COLUMNS.find((c) => c.key === task.status);
                const doneSubtasks = task.subtasks?.filter((s) => s.done).length || 0;
                const totalSubtasks = task.subtasks?.length || 0;
                return (
                  <tr key={task.id} className="border-b border-rose-border/50 hover:bg-rose-light/50 transition">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-rose-dark cursor-pointer hover:text-rose-deep" onClick={() => setSelectedTaskId(task.id)}>{task.title}</p>
                      {task.description && <p className="text-xs text-rose-muted mt-0.5 truncate max-w-md">{task.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${col?.dotColor}`} />
                        <span className="text-xs text-rose-dark">{col?.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${pri?.color}`}>{pri?.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {proj && <span className="text-xs px-2 py-0.5 rounded-full" style={getProjectBadgeStyle(proj.color)}>{proj.name}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-rose-muted">{task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {totalSubtasks > 0 ? (
                        <span className="text-xs text-rose-muted">{doneSubtasks}/{totalSubtasks}</span>
                      ) : (
                        <span className="text-xs text-rose-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteTask(task.id)} className="text-rose-border hover:text-red-400 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTasks.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-rose-muted">No tasks found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Detail Panel */}
      <TaskDetailPanel taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} onUpdate={fetchTasks} />
    </div>
  );
}
