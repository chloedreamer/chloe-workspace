"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, KanbanSquare, StickyNote } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProjects } from "@/components/ProjectsProvider";

interface SearchTask {
  id: string;
  title: string;
  status: string;
  category: string;
}

interface SearchNote {
  id: string;
  title: string;
  date: string;
  category: string;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<SearchTask[]>([]);
  const [notes, setNotes] = useState<SearchNote[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { projects } = useProjects();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setTasks([]); setNotes([]); return; }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setTasks(data.tasks);
      setNotes(data.notes);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const close = () => { setOpen(false); setQuery(""); setTasks([]); setNotes([]); };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-white border border-rose-border rounded-lg px-3 py-2 text-sm text-rose-muted hover:border-rose transition w-64">
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-xs bg-rose-light px-1.5 py-0.5 rounded">Cmd+K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/20" onClick={close} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-rose-border overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-rose-border">
          <Search className="w-5 h-5 text-rose-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks and notes..."
            className="flex-1 text-sm text-rose-dark outline-none"
          />
          <button onClick={close} className="text-rose-muted hover:text-rose-deep">
            <X className="w-4 h-4" />
          </button>
        </div>

        {(tasks.length > 0 || notes.length > 0) && (
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {tasks.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-rose-muted px-2 py-1 uppercase tracking-wider">Tasks</p>
                {tasks.map((t) => {
                  const proj = projects.find((p) => p.key === t.category);
                  return (
                    <button key={t.id} onClick={() => { router.push(`/tasks?open=${t.id}`); close(); }} className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg hover:bg-rose-light transition">
                      <KanbanSquare className="w-4 h-4 text-rose-muted flex-shrink-0" />
                      <span className="text-sm text-rose-dark flex-1 truncate">{t.title}</span>
                      {proj && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${proj.color}18`, color: proj.color }}>{proj.name}</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {notes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-rose-muted px-2 py-1 uppercase tracking-wider">Notes</p>
                {notes.map((n) => (
                  <button key={n.id} onClick={() => { router.push("/notes"); close(); }} className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg hover:bg-rose-light transition">
                    <StickyNote className="w-4 h-4 text-rose-muted flex-shrink-0" />
                    <span className="text-sm text-rose-dark flex-1 truncate">{n.title || "Untitled"}</span>
                    <span className="text-xs text-rose-muted">{n.date}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {query.trim() && tasks.length === 0 && notes.length === 0 && (
          <div className="p-6 text-center text-sm text-rose-muted">No results found</div>
        )}
      </div>
    </div>
  );
}
