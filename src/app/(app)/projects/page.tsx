"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useProjects } from "@/components/ProjectsProvider";
import { COLOR_OPTIONS } from "@/lib/constants";
import { Plus, Trash2, Pencil, X, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  status: string;
  category: string;
}

export default function ProjectsIndexPage() {
  const { projects, refresh } = useProjects();
  const { data: tasks } = useSWR<Task[]>("/api/tasks", fetcher);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", color: "#c8a0a0" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const addProject = async () => {
    if (!form.name.trim()) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", color: "#c8a0a0" });
    setShowAddForm(false);
    refresh();
  };

  const updateProject = async (id: string) => {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditingId(null);
    refresh();
  };

  const deleteProject = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    refresh();
  };

  const startEdit = (proj: typeof projects[0]) => {
    setEditingId(proj.id);
    setForm({ name: proj.name, color: proj.color });
  };

  const getStats = (key: string) => {
    const projTasks = (tasks || []).filter((t) => t.category === key);
    const done = projTasks.filter((t) => t.status === "done").length;
    return {
      total: projTasks.length,
      done,
      pct: projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0,
    };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-rose-dark tracking-tight">Projects</h1>
          <p className="text-sm text-rose-muted mt-1">{projects.length} projects</p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setForm({ name: "", color: "#c8a0a0" }); }}
          className="flex items-center gap-2 bg-rose-deep text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40" onClick={() => setShowAddForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-rose-dark">New Project</h2>
              <button onClick={() => setShowAddForm(false)} className="text-rose-muted hover:text-rose-deep">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") addProject(); }}
              placeholder="Project name..."
              className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-rose"
              autoFocus
            />
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-rose-muted">Color:</span>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-6 h-6 rounded-full border-2 transition ${form.color === c ? "border-rose-dark scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button onClick={addProject} className="w-full bg-rose-deep text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
              Create Project
            </button>
          </div>
        </div>
      )}

      {/* Project Grid */}
      <div className="grid grid-cols-2 gap-4">
        {projects.map((proj) => {
          const stats = getStats(proj.key);
          const isEditing = editingId === proj.id;

          if (isEditing) {
            return (
              <div key={proj.id} className="card p-5">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") updateProject(proj.id); if (e.key === "Escape") setEditingId(null); }}
                  className="w-full border border-rose-border rounded-lg px-3 py-1.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-rose"
                  autoFocus
                />
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs text-rose-muted">Color:</span>
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-5 h-5 rounded-full border-2 transition ${form.color === c ? "border-rose-dark scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateProject(proj.id)} className="flex items-center gap-1 text-sm bg-rose-deep text-white px-3 py-1.5 rounded-lg hover:opacity-90">
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-sm text-rose-muted hover:text-rose-deep px-3 py-1.5">
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={proj.id} className="card p-5 group hover:border-rose transition">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: proj.color }} />
                  <span className="text-base font-semibold text-rose-dark truncate">{proj.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => startEdit(proj)} className="p-1.5 rounded-lg text-rose-muted hover:text-rose-deep hover:bg-rose-light transition" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {deleteConfirm === proj.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteProject(proj.id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 bg-red-50 rounded">
                        Confirm
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs text-rose-muted px-2 py-1">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(proj.id)} className="p-1.5 rounded-lg text-rose-muted hover:text-red-500 hover:bg-red-50 transition" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="text-xs text-rose-muted mb-2">
                {stats.done}/{stats.total} tasks done · {stats.pct}%
              </div>
              <div className="w-full bg-rose-light rounded-full h-1.5 mb-4">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${stats.pct}%`, backgroundColor: proj.color }} />
              </div>

              <Link
                href={`/projects/${proj.key}`}
                className="text-sm text-rose-deep hover:underline flex items-center gap-1"
              >
                Open <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="col-span-2 card p-8 text-center text-sm text-rose-muted">
            No projects yet.{" "}
            <button onClick={() => { setShowAddForm(true); setForm({ name: "", color: "#c8a0a0" }); }} className="text-rose-deep hover:underline">
              Create one
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
