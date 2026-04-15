"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { PROJECTS, COLUMNS, PRIORITIES, getProjectStyle } from "@/lib/constants";
import { Plus, Trash2, GripVertical, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  order: number;
  dueDate: string | null;
}

export default function ProjectPage() {
  const params = useParams();
  const projectKey = params.project as string;
  const project = getProjectStyle(projectKey);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
  });

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data.filter((t: Task) => t.category === projectKey));
  }, [projectKey]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async () => {
    if (!form.title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, category: projectKey }),
    });
    setForm({ title: "", description: "", status: "todo", priority: "medium", dueDate: "" });
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

  const saveEdit = async () => {
    if (!editingTask) return;
    await updateTask(editingTask.id, form);
    setEditingTask(null);
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.split("T")[0] || "",
    });
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) updateTask(taskId, { status: newStatus });
  };

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="p-2 rounded-lg hover:bg-rose-light text-rose-muted transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${project.color}`}>{project.label}</span>
            <span className="text-sm text-rose-muted">{doneTasks}/{totalTasks} tasks done ({pct}%)</span>
          </div>
          <div className="w-full bg-rose-light rounded-full h-1.5 mt-2">
            <div className="bg-rose h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingTask(null); setForm({ title: "", description: "", status: "todo", priority: "medium", dueDate: "" }); }}
          className="flex items-center gap-2 bg-rose-deep text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Task Form Modal */}
      {(showForm || editingTask) && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => { setShowForm(false); setEditingTask(null); }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-rose-dark">{editingTask ? "Edit Task" : "New Task"}</h2>
              <button onClick={() => { setShowForm(false); setEditingTask(null); }} className="text-rose-muted hover:text-rose-deep">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Task title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                autoFocus
              />
              <textarea
                placeholder="Description (optional)..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose h-20 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-rose-muted mb-1 block">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose">
                    {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-rose-muted mb-1 block">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose">
                    {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-rose-muted mb-1 block">Due Date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
              </div>
              <button onClick={editingTask ? saveEdit : createTask} className="w-full bg-rose-deep text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
                {editingTask ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-3 gap-5">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="kanban-column" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, col.key)}>
              <div className={`${col.headerColor} border rounded-t-xl px-4 py-3 flex items-center gap-2`}>
                <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <h3 className="font-semibold text-sm text-rose-dark">{col.label}</h3>
                <span className="text-xs text-rose-muted ml-auto">{colTasks.length}</span>
              </div>
              <div className="bg-white/50 border border-t-0 rounded-b-xl p-3 space-y-3 min-h-[300px]">
                {colTasks.map((task) => {
                  const pri = PRIORITIES.find((p) => p.key === task.priority);
                  return (
                    <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)} className="task-card bg-white rounded-lg p-4 border border-rose-border cursor-grab active:cursor-grabbing">
                      <div className="flex items-start justify-between gap-2">
                        <GripVertical className="w-4 h-4 text-rose-border mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-rose-dark cursor-pointer hover:text-rose-deep" onClick={() => startEdit(task)}>{task.title}</p>
                          {task.description && <p className="text-xs text-rose-muted mt-1 line-clamp-2">{task.description}</p>}
                        </div>
                        <button onClick={() => deleteTask(task.id)} className="text-rose-border hover:text-red-400 transition flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {pri && <span className={`text-xs ${pri.color}`}>{pri.label}</span>}
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
    </div>
  );
}
