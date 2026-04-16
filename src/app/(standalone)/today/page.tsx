"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2, Circle, Clock, StickyNote, Sparkles,
  CalendarDays, ArrowRight, ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";
import Link from "next/link";

interface Subtask { id: string; title: string; done: boolean; }
interface Task {
  id: string; title: string; description: string | null; status: string;
  priority: string; category: string; dueDate: string | null;
  subtasks: Subtask[]; _count: { comments: number };
}
interface Note { id: string; title: string; content: string; date: string; category: string; pinned: boolean; }
interface Project { id: string; name: string; key: string; color: string; }

const PRI_LABEL: Record<string, string> = { high: "High", medium: "Medium", low: "Low" };
const PRI_COLOR: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#9b6b6b" };

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sections, setSections] = useState<Record<string, boolean>>({ overdue: true, dueToday: true, inProgress: true, highPriority: true, notes: true });
  const today = new Date().toISOString().split("T")[0];

  const fetchAll = useCallback(async () => {
    const [t, n, p] = await Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch(`/api/notes?date=${today}`).then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]);
    setTasks(t); setNotes(n); setProjects(p);
  }, [today]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const markDone = async (id: string) => { await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "done" }) }); fetchAll(); };
  const markInProgress = async (id: string) => { await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "in_progress" }) }); fetchAll(); };
  const toggleSub = async (id: string, done: boolean) => { await fetch(`/api/subtasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: !done }) }); fetchAll(); };
  const toggle = (k: string) => setSections((p) => ({ ...p, [k]: !p[k] }));
  const getProj = (k: string) => projects.find((p) => p.key === k);

  const active = tasks.filter((t) => t.status !== "done");
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const pct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const overdue = active.filter((t) => t.dueDate && t.dueDate.split("T")[0] < today);
  const dueToday = active.filter((t) => t.dueDate && t.dueDate.startsWith(today));
  const inProg = active.filter((t) => t.status === "in_progress" && !overdue.includes(t) && !dueToday.includes(t));
  const highP = active.filter((t) => t.priority === "high" && !overdue.includes(t) && !dueToday.includes(t) && !inProg.includes(t));

  function TaskRow({ task }: { task: Task }) {
    const proj = getProj(task.category);
    const [showSubs, setShowSubs] = useState(false);
    const doneS = task.subtasks.filter((s) => s.done).length;
    const totalS = task.subtasks.length;
    return (
      <div>
        <div className="flex items-start gap-3 py-3 px-4 hover:bg-[#faf5f5] transition rounded-lg">
          <button onClick={() => markDone(task.id)} className="mt-0.5 flex-shrink-0 group" title="Mark done">
            {task.status === "in_progress" ? <Clock className="w-[18px] h-[18px] text-blue-500 group-hover:text-green-500 transition" /> : <Circle className="w-[18px] h-[18px] text-[#e8dede] group-hover:text-green-500 transition" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#2a1f1f]">{task.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {proj && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${proj.color}18`, color: proj.color }}>{proj.name}</span>}
              <span className="text-xs" style={{ color: PRI_COLOR[task.priority] }}>{PRI_LABEL[task.priority]}</span>
              {totalS > 0 && <button onClick={() => setShowSubs(!showSubs)} className="text-xs text-[#7a6a6a] flex items-center gap-1 hover:text-[#9b6b6b]"><CheckCircle2 className="w-3 h-3" /> {doneS}/{totalS}</button>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {task.status !== "in_progress" && <button onClick={() => markInProgress(task.id)} className="text-xs text-[#7a6a6a] hover:text-blue-500 transition px-2 py-1 rounded hover:bg-blue-50">Start</button>}
            {task.dueDate && <span className="text-xs text-[#7a6a6a]">{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
          </div>
        </div>
        {showSubs && totalS > 0 && (
          <div className="ml-10 mb-2 space-y-1">
            {task.subtasks.map((s) => (
              <button key={s.id} onClick={() => toggleSub(s.id, s.done)} className="flex items-center gap-2 w-full text-left py-1 px-2 rounded hover:bg-[#f5eded] transition">
                {s.done ? <CheckCircle2 className="w-3.5 h-3.5 text-[#9b6b6b]" /> : <Circle className="w-3.5 h-3.5 text-[#e8dede]" />}
                <span className={`text-xs ${s.done ? "line-through text-[#7a6a6a]" : "text-[#2a1f1f]"}`}>{s.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  function Section({ id, title, count, color, items, border }: { id: string; title: string; count: number; color: string; items: Task[]; border?: string }) {
    if (items.length === 0) return null;
    return (
      <section className="mb-6">
        <button onClick={() => toggle(id)} className="flex items-center gap-2 mb-3 w-full text-left">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color }}>{title} ({count})</h2>
          {sections[id] ? <ChevronUp className="w-3.5 h-3.5 text-[#7a6a6a]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#7a6a6a]" />}
        </button>
        {sections[id] && <div className={`bg-white rounded-xl border shadow-sm divide-y divide-[#e8dede] ${border || "border-[#e8dede]"}`}>{items.map((t) => <TaskRow key={t.id} task={t} />)}</div>}
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf5f5]">
      <header className="bg-white border-b border-[#e8dede] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#c8a0a0]" /><span className="font-bold text-[#9b6b6b]">Chloe Workspace</span></div>
          <Link href="/" className="flex items-center gap-1 text-sm text-[#9b6b6b] hover:underline">Open full app <ExternalLink className="w-3.5 h-3.5" /></Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2a1f1f]">{(() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; })()}, Chloe</h1>
          <p className="text-[#7a6a6a] text-sm mt-1 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl border border-[#e8dede] shadow-sm p-5 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#2a1f1f]">Overall Progress</span>
            <span className="text-sm text-[#7a6a6a]">{doneCount}/{tasks.length} tasks done</span>
          </div>
          <div className="w-full bg-[#f5eded] rounded-full h-3">
            <div className="bg-[#9b6b6b] h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-[#7a6a6a]">
            <span>{active.length} active</span>
            <span>{doneCount} completed</span>
            <span>{overdue.length} overdue</span>
          </div>
        </div>

        <Section id="overdue" title="Overdue" count={overdue.length} color="#ef4444" items={overdue} border="border-red-200" />
        <Section id="dueToday" title="Due Today" count={dueToday.length} color="#9b6b6b" items={dueToday} />
        {dueToday.length === 0 && overdue.length === 0 && <div className="bg-white rounded-xl border border-[#e8dede] shadow-sm p-6 text-center text-sm text-[#7a6a6a] mb-6">No tasks due today</div>}
        <Section id="inProgress" title="In Progress" count={inProg.length} color="#3b82f6" items={inProg} />
        <Section id="highPriority" title="High Priority" count={highP.length} color="#ef4444" items={highP} />

        {/* Notes */}
        <section className="mb-6">
          <button onClick={() => toggle("notes")} className="flex items-center gap-2 mb-3 w-full text-left">
            <StickyNote className="w-4 h-4 text-[#c8a0a0]" />
            <h2 className="text-sm font-semibold text-[#9b6b6b] uppercase tracking-wider">Today&apos;s Notes ({notes.length})</h2>
            {sections.notes ? <ChevronUp className="w-3.5 h-3.5 text-[#7a6a6a]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#7a6a6a]" />}
            <Link href="/notes" className="text-xs text-[#9b6b6b] hover:underline ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>All notes <ArrowRight className="w-3 h-3" /></Link>
          </button>
          {sections.notes && (notes.length === 0
            ? <div className="bg-white rounded-xl border border-[#e8dede] shadow-sm p-6 text-center text-sm text-[#7a6a6a]">No notes for today</div>
            : <div className="space-y-3">{notes.map((n) => { const p = getProj(n.category); const plain = n.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); return (
              <div key={n.id} className="bg-white rounded-xl border border-[#e8dede] shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[#2a1f1f]">{n.title || "Untitled"}</h3>
                  {p && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${p.color}18`, color: p.color }}>{p.name}</span>}
                </div>
                {plain && <p className="text-sm text-[#7a6a6a] line-clamp-3">{plain}</p>}
              </div>); })}</div>
          )}
        </section>

        {/* Projects */}
        <section>
          <div className="grid grid-cols-3 gap-4">
            {projects.map((p) => { const total = active.filter((t) => t.category === p.key).length; return (
              <Link key={p.key} href={`/projects/${p.key}`} className="bg-white rounded-xl border border-[#e8dede] shadow-sm p-4 hover:border-[#c8a0a0] transition">
                <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} /><span className="text-sm font-medium text-[#2a1f1f]">{p.name}</span></div>
                <p className="text-xs text-[#7a6a6a]">{total} active task{total !== 1 ? "s" : ""}</p>
              </Link>); })}
          </div>
        </section>
      </main>

      <footer className="max-w-3xl mx-auto px-6 py-6 text-center text-xs text-[#7a6a6a]">Chloe Workspace</footer>
    </div>
  );
}
