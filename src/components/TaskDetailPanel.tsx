"use client";

import { useEffect, useState, useCallback } from "react";
import { PROJECTS, COLUMNS, PRIORITIES } from "@/lib/constants";
import {
  X,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  MessageSquare,
  Send,
  Calendar,
  Tag,
  Flag,
  Layers,
} from "lucide-react";

interface Subtask {
  id: string;
  title: string;
  done: boolean;
  order: number;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
}

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  subtasks: Subtask[];
  comments: Comment[];
}

interface Props {
  taskId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskDetailPanel({ taskId, onClose, onUpdate }: Props) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    const res = await fetch(`/api/tasks/${taskId}`);
    setTask(await res.json());
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  if (!taskId || !task) return null;

  const updateField = async (data: Record<string, unknown>) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchTask();
    onUpdate();
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    await fetch(`/api/tasks/${task.id}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newSubtask, order: task.subtasks.length }),
    });
    setNewSubtask("");
    fetchTask();
    onUpdate();
  };

  const toggleSubtask = async (sub: Subtask) => {
    await fetch(`/api/subtasks/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !sub.done }),
    });
    fetchTask();
    onUpdate();
  };

  const deleteSubtask = async (id: string) => {
    await fetch(`/api/subtasks/${id}`, { method: "DELETE" });
    fetchTask();
    onUpdate();
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });
    setNewComment("");
    fetchTask();
  };

  const deleteComment = async (id: string) => {
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
    fetchTask();
  };

  const deleteTask = async () => {
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    onClose();
    onUpdate();
  };

  const doneCount = task.subtasks.filter((s) => s.done).length;
  const subtaskPct = task.subtasks.length > 0 ? Math.round((doneCount / task.subtasks.length) * 100) : 0;
  const proj = PROJECTS.find((p) => p.key === task.category) || PROJECTS[4];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl flex flex-col h-full animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-rose-border">
          <span className={`text-xs px-2 py-0.5 rounded-full ${proj.color}`}>{proj.label}</span>
          <div className="flex items-center gap-2">
            <button onClick={deleteTask} className="p-1.5 rounded-lg text-rose-muted hover:text-red-500 hover:bg-red-50 transition">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-rose-muted hover:text-rose-deep hover:bg-rose-light transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          {editingTitle ? (
            <input
              autoFocus
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              onBlur={() => { updateField({ title: task.title }); setEditingTitle(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") { updateField({ title: task.title }); setEditingTitle(false); } }}
              className="text-xl font-bold text-rose-dark w-full outline-none border-b-2 border-rose pb-1"
            />
          ) : (
            <h2 className="text-xl font-bold text-rose-dark cursor-pointer hover:text-rose-deep" onClick={() => setEditingTitle(true)}>
              {task.title}
            </h2>
          )}

          {/* Description */}
          {editingDesc ? (
            <textarea
              autoFocus
              value={task.description || ""}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              onBlur={() => { updateField({ description: task.description }); setEditingDesc(false); }}
              placeholder="Add a description..."
              className="w-full text-sm text-rose-dark border border-rose-border rounded-lg p-3 outline-none focus:ring-2 focus:ring-rose resize-none h-24"
            />
          ) : (
            <p className="text-sm text-rose-muted cursor-pointer hover:text-rose-dark transition" onClick={() => setEditingDesc(true)}>
              {task.description || "Click to add description..."}
            </p>
          )}

          {/* Properties */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-muted" />
              <select value={task.status} onChange={(e) => { setTask({ ...task, status: e.target.value }); updateField({ status: e.target.value }); }} className="text-sm border border-rose-border rounded-lg px-2 py-1.5 flex-1 focus:outline-none focus:ring-2 focus:ring-rose">
                {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-rose-muted" />
              <select value={task.priority} onChange={(e) => { setTask({ ...task, priority: e.target.value }); updateField({ priority: e.target.value }); }} className="text-sm border border-rose-border rounded-lg px-2 py-1.5 flex-1 focus:outline-none focus:ring-2 focus:ring-rose">
                {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-rose-muted" />
              <select value={task.category} onChange={(e) => { setTask({ ...task, category: e.target.value }); updateField({ category: e.target.value }); }} className="text-sm border border-rose-border rounded-lg px-2 py-1.5 flex-1 focus:outline-none focus:ring-2 focus:ring-rose">
                {PROJECTS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-muted" />
              <input type="date" value={task.dueDate?.split("T")[0] || ""} onChange={(e) => { setTask({ ...task, dueDate: e.target.value }); updateField({ dueDate: e.target.value || null }); }} className="text-sm border border-rose-border rounded-lg px-2 py-1.5 flex-1 focus:outline-none focus:ring-2 focus:ring-rose" />
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-rose-dark flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Subtasks
                {task.subtasks.length > 0 && <span className="text-xs text-rose-muted font-normal">({doneCount}/{task.subtasks.length})</span>}
              </h3>
            </div>
            {task.subtasks.length > 0 && (
              <div className="w-full bg-rose-light rounded-full h-1.5 mb-3">
                <div className="bg-rose h-1.5 rounded-full transition-all" style={{ width: `${subtaskPct}%` }} />
              </div>
            )}
            <div className="space-y-1.5">
              {task.subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 group p-1.5 rounded-lg hover:bg-rose-light transition">
                  <button onClick={() => toggleSubtask(sub)} className="flex-shrink-0">
                    {sub.done ? <CheckSquare className="w-4 h-4 text-rose-deep" /> : <Square className="w-4 h-4 text-rose-muted" />}
                  </button>
                  <span className={`text-sm flex-1 ${sub.done ? "line-through text-rose-muted" : "text-rose-dark"}`}>{sub.title}</span>
                  <button onClick={() => deleteSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 text-rose-muted hover:text-red-400 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addSubtask(); }}
                placeholder="Add subtask..."
                className="flex-1 text-sm border border-rose-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose"
              />
              <button onClick={addSubtask} className="p-1.5 rounded-lg bg-rose-light text-rose-deep hover:bg-rose transition">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-sm font-semibold text-rose-dark flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4" />
              Comments
              {task.comments.length > 0 && <span className="text-xs text-rose-muted font-normal">({task.comments.length})</span>}
            </h3>
            <div className="space-y-3">
              {task.comments.map((c) => (
                <div key={c.id} className="bg-rose-light rounded-lg p-3 group">
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-rose-dark whitespace-pre-wrap">{c.content}</p>
                    <button onClick={() => deleteComment(c.id)} className="opacity-0 group-hover:opacity-100 text-rose-muted hover:text-red-400 transition flex-shrink-0 ml-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-rose-muted mt-1">
                    {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addComment(); }}
                placeholder="Add a comment..."
                className="flex-1 text-sm border border-rose-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose"
              />
              <button onClick={addComment} className="p-1.5 rounded-lg bg-rose-deep text-white hover:opacity-90 transition">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-rose-border text-xs text-rose-muted">
          Created {new Date(task.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
