"use client";

import { useState } from "react";
import { useProjects } from "@/components/ProjectsProvider";
import { COLOR_OPTIONS } from "@/lib/constants";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";

export default function SettingsPage() {
  const { projects, refresh } = useProjects();
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

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold text-rose-dark tracking-tight mb-8">Settings</h1>

      <div className="card p-6 space-y-6">
        {/* Projects Management */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-rose-dark">Projects</h3>
            <button
              onClick={() => { setShowAddForm(true); setForm({ name: "", color: "#c8a0a0" }); }}
              className="flex items-center gap-1.5 text-sm text-rose-deep hover:opacity-80 transition"
            >
              <Plus className="w-4 h-4" /> Add Project
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-4 p-4 bg-rose-light rounded-lg border border-rose-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-rose-dark">New Project</span>
                <button onClick={() => setShowAddForm(false)} className="text-rose-muted hover:text-rose-deep">
                  <X className="w-4 h-4" />
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
              <div className="flex items-center gap-2 mb-3">
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
          )}

          {/* Project List */}
          <div className="space-y-2">
            {projects.map((proj) => (
              <div key={proj.id} className="p-3 rounded-lg bg-rose-light border border-rose-border">
                {editingId === proj.id ? (
                  <div>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") updateProject(proj.id); }}
                      className="w-full border border-rose-border rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-rose"
                      autoFocus
                    />
                    <div className="flex items-center gap-2 mb-2">
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
                      <button onClick={() => updateProject(proj.id)} className="flex items-center gap-1 text-sm text-green-600 hover:opacity-80">
                        <Check className="w-4 h-4" /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-sm text-rose-muted hover:text-rose-deep">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: proj.color }} />
                      <span className="text-sm font-medium text-rose-dark">{proj.name}</span>
                      <span className="text-xs text-rose-muted">({proj.key})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(proj)} className="p-1.5 rounded-lg text-rose-muted hover:text-rose-deep hover:bg-white transition">
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
                        <button onClick={() => setDeleteConfirm(proj.id)} className="p-1.5 rounded-lg text-rose-muted hover:text-red-500 hover:bg-red-50 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
