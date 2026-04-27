"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useProjects } from "@/components/ProjectsProvider";
import { fetcher } from "@/lib/fetcher";
import { COLUMNS } from "@/lib/constants";
import { TodaySkeleton } from "@/components/Skeleton";
import {
  CheckCircle2, Circle, Clock, StickyNote, CalendarHeart,
  ArrowRight, ChevronDown, ChevronUp,
  Cake, Users, PartyPopper,
} from "lucide-react";
import Link from "next/link";
import QuoteCard from "@/components/QuoteCard";
import DailyIntention from "@/components/DailyIntention";
import ProductivityHeatmap from "@/components/ProductivityHeatmap";
import FocusHeatmap from "@/components/FocusHeatmap";
import TaskDetailPanel from "@/components/TaskDetailPanel";

interface Subtask { id: string; title: string; done: boolean; }
interface Task {
  id: string; title: string; description: string | null; status: string;
  priority: string; category: string; dueDate: string | null;
  subtasks: Subtask[]; _count: { comments: number };
}
interface Note { id: string; title: string; content: string; date: string; category: string; }

const PRI_LABEL: Record<string, string> = { high: "High", medium: "Medium", low: "Low" };
const PRI_COLOR: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#9b6b6b" };

export default function HomePage() {
  const today = new Date().toISOString().split("T")[0];
  const { projects } = useProjects();
  const { data: tasks, mutate: mutateTasks } = useSWR<Task[]>("/api/tasks", fetcher);
  const { data: notes } = useSWR<Note[]>(`/api/notes?date=${today}`, fetcher);
  const { data: events, mutate: mutateEvents } = useSWR<{ id: string; title: string; date: string; time: string | null; type: string; color: string; recurring: string | null; completedDates: string }[]>("/api/events", fetcher);

  const isEventDoneOnDate = (e: { completedDates?: string }, dateStr: string) => {
    try {
      const arr = JSON.parse(e.completedDates || "[]");
      return Array.isArray(arr) && arr.includes(dateStr);
    } catch { return false; }
  };

  const toggleEventDone = async (eventId: string, dateStr: string) => {
    await fetch(`/api/events/${eventId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr }),
    });
    mutateEvents();
  };

  const eventOccursToday = (e: { date: string; recurring: string | null }) => {
    const eDate = e.date.split("T")[0];
    if (eDate === today) return true;
    if (!e.recurring || today < eDate) return false;
    const ed = new Date(eDate + "T00:00:00");
    const cd = new Date(today + "T00:00:00");
    switch (e.recurring) {
      case "daily": return true;
      case "weekly": return ed.getDay() === cd.getDay();
      case "monthly": return ed.getDate() === cd.getDate();
      case "yearly": return ed.getMonth() === cd.getMonth() && ed.getDate() === cd.getDate();
      default: return false;
    }
  };
  const [sections, setSections] = useState<Record<string, boolean>>({
    overdue: true, dueToday: true, inProgress: true, highPriority: true, todayEvents: true, events: true, notes: true,
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const toggle = (k: string) => setSections((p) => ({ ...p, [k]: !p[k] }));

  const markDone = useCallback(async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "done" }) });
    mutateTasks();
  }, [mutateTasks]);

  const markInProgress = useCallback(async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "in_progress" }) });
    mutateTasks();
  }, [mutateTasks]);

  const toggleSub = useCallback(async (subtaskId: string, done: boolean) => {
    await fetch(`/api/subtasks/${subtaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !done }),
    });
    mutateTasks();
  }, [mutateTasks]);

  if (!tasks) return <TodaySkeleton />;

  const active = tasks.filter((t) => t.status !== "done");
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const pct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const overdue = active.filter((t) => t.dueDate && t.dueDate.split("T")[0] < today);
  const dueToday = active.filter((t) => t.dueDate && t.dueDate.startsWith(today));
  const inProg = active.filter((t) => t.status === "in_progress" && !overdue.includes(t) && !dueToday.includes(t));
  const highP = active.filter((t) => t.priority === "high" && !overdue.includes(t) && !dueToday.includes(t) && !inProg.includes(t));

  const sp2Days = Math.ceil((new Date("2026-04-16").getTime() - Date.now()) / 86400000);
  const getProj = (k: string) => projects.find((p) => p.key === k);

  function TaskRow({ task }: { task: Task }) {
    const proj = getProj(task.category);
    const [showSubs, setShowSubs] = useState(false);
    const doneS = task.subtasks.filter((s) => s.done).length;
    const totalS = task.subtasks.length;
    return (
      <div>
        <div className="flex items-start gap-3 py-3 px-4 hover:bg-rose-light transition rounded-lg">
          <button onClick={() => markDone(task.id)} className="mt-0.5 flex-shrink-0 group" title="Mark done">
            {task.status === "in_progress" ? <Clock className="w-[18px] h-[18px] text-blue-500 group-hover:text-green-500 transition" /> : <Circle className="w-[18px] h-[18px] text-rose-border group-hover:text-green-500 transition" />}
          </button>
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setSelectedTaskId(task.id)}
              className="text-sm font-medium text-rose-dark text-left hover:text-rose-deep transition"
            >
              {task.title}
            </button>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {proj && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${proj.color}18`, color: proj.color }}>{proj.name}</span>}
              <span className="text-xs" style={{ color: PRI_COLOR[task.priority] }}>{PRI_LABEL[task.priority]}</span>
              {totalS > 0 && <button onClick={() => setShowSubs(!showSubs)} className="text-xs text-rose-muted flex items-center gap-1 hover:text-rose-deep"><CheckCircle2 className="w-3 h-3" /> {doneS}/{totalS}</button>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {task.status !== "in_progress" && <button onClick={() => markInProgress(task.id)} className="text-xs text-rose-muted hover:text-blue-500 transition px-2 py-1 rounded hover:bg-blue-50">Start</button>}
            {task.dueDate && <span className="text-xs text-rose-muted">{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
          </div>
        </div>
        {showSubs && totalS > 0 && (
          <div className="ml-10 mb-2 space-y-1">
            {task.subtasks.map((s) => (
              <button key={s.id} onClick={() => toggleSub(s.id, s.done)} className="flex items-center gap-2 w-full text-left py-1 px-2 rounded hover:bg-rose-light transition">
                {s.done ? <CheckCircle2 className="w-3.5 h-3.5 text-rose-deep" /> : <Circle className="w-3.5 h-3.5 text-rose-border" />}
                <span className={`text-xs ${s.done ? "line-through text-rose-muted" : "text-rose-dark"}`}>{s.title}</span>
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
          <h2 className="text-sm font-medium" style={{ color }}>{title} ({count})</h2>
          {sections[id] ? <ChevronUp className="w-3.5 h-3.5 text-rose-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-rose-muted" />}
        </button>
        {sections[id] && <div className={`bg-white rounded-xl border shadow-sm divide-y divide-rose-border ${border || "border-rose-border"}`}>{items.map((t) => <TaskRow key={t.id} task={t} />)}</div>}
      </section>
    );
  }

  const todayNotes = notes || [];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-rose-dark tracking-tight">
          {(() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; })()}, Chloe
        </h1>
        <p className="text-rose-muted text-sm mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Overview: Productivity + Focus */}
      <div className="mb-2">
        <p className="text-xs text-rose-muted uppercase tracking-wider">Overview</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <ProductivityHeatmap />
        <FocusHeatmap />
      </div>

      {/* Daily Quote */}
      <QuoteCard />

      {/* Daily Intention */}
      <DailyIntention />

      {/* SP2 Countdown */}
      {sp2Days > 0 && (
        <div className="bg-rose-deep rounded-xl p-5 text-white mb-8">
          <p className="text-xs font-medium opacity-80">SP2 Exam</p>
          <p className="text-2xl font-semibold mt-1">{sp2Days} days</p>
        </div>
      )}

      {/* Task Sections */}
      <Section id="overdue" title="Overdue" count={overdue.length} color="#ef4444" items={overdue} border="border-red-200" />
      <Section id="dueToday" title="Due Today" count={dueToday.length} color="#9b6b6b" items={dueToday} />
      {dueToday.length === 0 && overdue.length === 0 && <div className="card p-5 text-center text-sm text-rose-muted mb-6">No tasks due today</div>}
      <Section id="inProgress" title="In Progress" count={inProg.length} color="#3b82f6" items={inProg} />
      <Section id="highPriority" title="High Priority" count={highP.length} color="#ef4444" items={highP} />

      {/* Today Event */}
      {(() => {
        const todayEvents = (events || []).filter(eventOccursToday);
        const typeIcons: Record<string, typeof Cake> = { birthday: Cake, meeting: Users, event: PartyPopper };
        return (
          <section className="mb-6">
            <button onClick={() => toggle("todayEvents")} className="flex items-center gap-2 mb-3 w-full text-left">
              <div className="w-2 h-2 rounded-full bg-[#9b6b6b]" />
              <h2 className="text-sm font-medium text-[#9b6b6b]">Today Event ({todayEvents.length})</h2>
              {sections.todayEvents ? <ChevronUp className="w-3.5 h-3.5 text-rose-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-rose-muted" />}
            </button>
            {sections.todayEvents && (todayEvents.length === 0
              ? <div className="card p-5 text-center text-sm text-rose-muted">No events today</div>
              : <div className="card divide-y divide-rose-border">
                  {todayEvents.map((e) => {
                    const Icon = typeIcons[e.type] || CalendarHeart;
                    const done = isEventDoneOnDate(e, today);
                    return (
                      <div key={e.id} className="flex items-center gap-3 py-3 px-4">
                        <button onClick={() => toggleEventDone(e.id, today)} className="flex-shrink-0" title={done ? "Mark incomplete" : "Mark done"}>
                          {done ? (
                            <CheckCircle2 className="w-[18px] h-[18px]" style={{ color: e.color }} />
                          ) : (
                            <Circle className="w-[18px] h-[18px] text-rose-border hover:opacity-70 transition" style={{}} />
                          )}
                        </button>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${e.color}18` }}>
                          <Icon className="w-4 h-4" style={{ color: e.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${done ? "line-through text-rose-muted" : "text-rose-dark"}`}>{e.title}</p>
                          {e.time && <p className="text-xs text-rose-muted">{e.time}</p>}
                        </div>
                        {e.recurring && <span className="text-xs text-rose-muted flex-shrink-0 capitalize">{e.recurring}</span>}
                      </div>
                    );
                  })}
                </div>
            )}
          </section>
        );
      })()}

      {/* Upcoming Events */}
      {(() => {
        const upcoming = (events || []).filter((e) => e.date.split("T")[0] > today).slice(0, 5);
        if (upcoming.length === 0) return null;
        const typeIcons: Record<string, typeof Cake> = { birthday: Cake, meeting: Users, event: PartyPopper };
        return (
          <section className="mb-6">
            <button onClick={() => toggle("events")} className="flex items-center gap-2 mb-3 w-full text-left">
              <h2 className="text-sm font-medium text-rose-deep">Upcoming Events ({upcoming.length})</h2>
              {sections.events ? <ChevronUp className="w-3.5 h-3.5 text-rose-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-rose-muted" />}
              <Link href="/events" className="text-xs text-rose-deep hover:underline ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>All <ArrowRight className="w-3 h-3" /></Link>
            </button>
            {sections.events && (
              <div className="card divide-y divide-rose-border">
                {upcoming.map((e) => {
                  const Icon = typeIcons[e.type] || CalendarHeart;
                  const d = new Date(e.date);
                  return (
                    <div key={e.id} className="flex items-center gap-3 py-3 px-4">
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: e.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-rose-dark">{e.title}</p>
                        {e.time && <p className="text-xs text-rose-muted">{e.time}</p>}
                      </div>
                      <span className="text-xs text-rose-muted flex-shrink-0">
                        {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })()}

      {/* Today Note */}
      <section className="mb-6">
        <button onClick={() => toggle("notes")} className="flex items-center gap-2 mb-3 w-full text-left">
          <div className="w-2 h-2 rounded-full bg-[#9b6b6b]" />
          <h2 className="text-sm font-medium text-[#9b6b6b]">Today Note ({todayNotes.length})</h2>
          {sections.notes ? <ChevronUp className="w-3.5 h-3.5 text-rose-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-rose-muted" />}
          <Link href="/notes" className="text-xs text-rose-deep hover:underline ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>All <ArrowRight className="w-3 h-3" /></Link>
        </button>
        {sections.notes && (todayNotes.length === 0
          ? <div className="card p-5 text-center text-sm text-rose-muted">No notes for today. <Link href="/notes" className="text-rose-deep hover:underline">Write one</Link></div>
          : <div className="space-y-3">{todayNotes.map((n) => { const p = getProj(n.category); const plain = n.content.replace(/<[^>]*>/g, " ").trim(); return (
            <div key={n.id} className="card p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-rose-dark">{n.title || "Untitled"}</h3>
                {p && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${p.color}18`, color: p.color }}>{p.name}</span>}
              </div>
              {plain && <p className="text-xs text-rose-muted line-clamp-2">{plain}</p>}
            </div>); })}</div>
        )}
      </section>

      <TaskDetailPanel
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={() => mutateTasks()}
      />
    </div>
  );
}
