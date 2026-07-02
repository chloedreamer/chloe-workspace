"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { useProjects } from "@/components/ProjectsProvider";
import { fetcher } from "@/lib/fetcher";
import { TodaySkeleton } from "@/components/Skeleton";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import QuoteCard from "@/components/QuoteCard";
import DailyIntention from "@/components/DailyIntention";
import ProductivityHeatmap from "@/components/ProductivityHeatmap";
import FocusHeatmap from "@/components/FocusHeatmap";
import TaskDetailPanel from "@/components/TaskDetailPanel";
import TaskRow, { type Task } from "@/components/TaskRow";

interface Note { id: string; title: string; content: string; date: string; category: string; }
interface Event {
  id: string; title: string; date: string; endDate: string | null; time: string | null;
  type: string; color: string; recurring: string | null; completedDates: string;
}
interface PilatesSession {
  id: string; date: string; time: string | null; type: string;
  duration: number; intensity: string; focus: string | null; notes: string | null;
}
interface Birthday {
  id: string; name: string; date: string; notes: string | null; color: string;
}

const PILATES_CLASS_SCHEDULE: Record<number, number[]> = {
  0: [17, 19],
  1: [17, 19],
  2: [17, 19],
  3: [17, 19],
  4: [17, 19],
  5: [17, 19],
  6: [17, 19],
};

function getLocalDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function eventOccursOn(e: Event, dateStr: string): boolean {
  const eDate = e.date.split("T")[0];
  if (eDate === dateStr) return true;
  if (!e.recurring || dateStr < eDate) return false;
  // Respect end date
  if (e.endDate && dateStr > e.endDate.split("T")[0]) return false;
  const ed = new Date(eDate + "T00:00:00");
  const cd = new Date(dateStr + "T00:00:00");
  switch (e.recurring) {
    case "daily": return true;
    case "weekly": return ed.getDay() === cd.getDay();
    case "monthly": return ed.getDate() === cd.getDate();
    case "yearly": return ed.getMonth() === cd.getMonth() && ed.getDate() === cd.getDate();
    default: return false;
  }
}

function isEventDoneOn(e: { completedDates?: string }, dateStr: string): boolean {
  try {
    const arr = JSON.parse(e.completedDates || "[]");
    return Array.isArray(arr) && arr.includes(dateStr);
  } catch { return false; }
}

export default function HomePage() {
  const today = useMemo(() => getLocalDate(), []);
  const { projects } = useProjects();
  const { data: tasks, mutate: mutateTasks } = useSWR<Task[]>("/api/tasks", fetcher);
  const { data: notes } = useSWR<Note[]>(`/api/notes?date=${today}`, fetcher);
  const { data: events, mutate: mutateEvents } = useSWR<Event[]>("/api/events", fetcher);
  const { data: pilatesToday, mutate: mutatePilates } = useSWR<PilatesSession[]>(`/api/pilates?date=${today}`, fetcher);
  const { data: birthdays } = useSWR<Birthday[]>("/api/birthdays", fetcher);

  const [sections, setSections] = useState<Record<string, boolean>>({
    overdue: true, dueToday: true, inProgress: true, highPriority: true,
    todayEvents: true, events: true, notes: true, pilates: true, birthdays: true,
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const toggle = useCallback((k: string) => setSections((p) => ({ ...p, [k]: !p[k] })), []);

  // Optimistic markDone — instant UI
  const markDone = useCallback(async (id: string) => {
    mutateTasks((cur) => cur?.map((t) => t.id === id ? { ...t, status: "done" } : t), false);
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    mutateTasks();
  }, [mutateTasks]);

  const markInProgress = useCallback(async (id: string) => {
    mutateTasks((cur) => cur?.map((t) => t.id === id ? { ...t, status: "in_progress" } : t), false);
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });
    mutateTasks();
  }, [mutateTasks]);

  const toggleSub = useCallback(async (subId: string, done: boolean) => {
    mutateTasks((cur) =>
      cur?.map((t) => ({
        ...t,
        subtasks: t.subtasks.map((s) => s.id === subId ? { ...s, done: !done } : s),
      })),
      false
    );
    await fetch(`/api/subtasks/${subId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !done }),
    });
    mutateTasks();
  }, [mutateTasks]);

  const toggleEventDone = useCallback(async (eventId: string, dateStr: string) => {
    mutateEvents((cur) =>
      cur?.map((e) => {
        if (e.id !== eventId) return e;
        let arr: string[] = [];
        try { arr = JSON.parse(e.completedDates || "[]"); } catch {}
        const next = arr.includes(dateStr) ? arr.filter((d) => d !== dateStr) : [...arr, dateStr];
        return { ...e, completedDates: JSON.stringify(next) };
      }),
      false
    );
    await fetch(`/api/events/${eventId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr }),
    });
    mutateEvents();
  }, [mutateEvents]);

  const projectMap = useMemo(() => {
    const map = new Map<string, typeof projects[0]>();
    projects.forEach((p) => map.set(p.key, p));
    return map;
  }, [projects]);

  const groups = useMemo(() => {
    if (!tasks) return null;
    const active = tasks.filter((t) => t.status !== "done");
    const overdue = active.filter((t) => t.dueDate && t.dueDate.split("T")[0] < today);
    const dueToday = active.filter((t) => t.dueDate && t.dueDate.startsWith(today));
    const inProg = active.filter((t) =>
      t.status === "in_progress" && !overdue.includes(t) && !dueToday.includes(t)
    );
    const highP = active.filter((t) =>
      t.priority === "high" && !overdue.includes(t) && !dueToday.includes(t) && !inProg.includes(t)
    );
    return { overdue, dueToday, inProg, highP };
  }, [tasks, today]);

  const todayEvents = useMemo(
    () => (events || []).filter((e) => eventOccursOn(e, today)),
    [events, today]
  );

  const upcomingEvents = useMemo(
    () => (events || []).filter((e) => e.date.split("T")[0] > today).slice(0, 5),
    [events, today]
  );

  const upcomingBirthdays = useMemo(() => {
    const list = birthdays || [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return list
      .map((b) => {
        const [year, month, day] = b.date.split("-").map(Number);
        let next = new Date(now.getFullYear(), month - 1, day);
        if (next < now) next = new Date(now.getFullYear() + 1, month - 1, day);
        const daysUntil = Math.round((next.getTime() - now.getTime()) / 86400000);
        const age = next.getFullYear() - year;
        return { ...b, daysUntil, age, nextDate: next };
      })
      .filter((b) => b.daysUntil <= 31)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [birthdays]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }, []);

  const dateLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    []
  );

  const sp2Days = useMemo(
    () => Math.ceil((new Date("2026-04-16").getTime() - Date.now()) / 86400000),
    []
  );

  const todayNotes = notes || [];

  if (!tasks || !groups) return <TodaySkeleton />;

  const renderTaskGroup = (id: string, title: string, color: string, items: Task[]) => {
    if (items.length === 0) return null;
    return (
      <section className="mb-6" key={id}>
        <button onClick={() => toggle(id)} className="flex items-center gap-2 mb-3 w-full text-left">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <h2 className="text-sm font-medium" style={{ color }}>{title} ({items.length})</h2>
          {sections[id] ? <ChevronUp className="w-3.5 h-3.5 text-rose-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-rose-muted" />}
        </button>
        {sections[id] && (
          <div className="card divide-y divide-rose-border">
            {items.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                project={projectMap.get(t.category)}
                onMarkDone={markDone}
                onMarkInProgress={markInProgress}
                onSelect={setSelectedTaskId}
                onToggleSub={toggleSub}
              />
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-rose-dark tracking-tight">
          {greeting}, Chloe
        </h1>
        <p className="text-rose-muted text-sm mt-1">{dateLabel}</p>
      </div>

      <DailyIntention />

      {/* SP2 Countdown */}
      {sp2Days > 0 && (
        <div className="bg-rose-deep rounded-xl p-5 text-white mb-8">
          <p className="text-xs font-medium opacity-80">SP2 Exam</p>
          <p className="text-2xl font-semibold mt-1">{sp2Days} days</p>
        </div>
      )}

      {/* Task Groups */}
      {renderTaskGroup("overdue", "Overdue", "#ef4444", groups.overdue)}
      {renderTaskGroup("dueToday", "Due Today", "#9b6b6b", groups.dueToday)}
      {groups.dueToday.length === 0 && groups.overdue.length === 0 && (
        <div className="card p-5 text-center text-sm text-rose-muted mb-6">No tasks due today</div>
      )}
      {renderTaskGroup("inProgress", "In Progress", "#3b82f6", groups.inProg)}
      {renderTaskGroup("highPriority", "High Priority", "#ef4444", groups.highP)}

      {/* Today Event */}
      <section className="mb-6">
        <button onClick={() => toggle("todayEvents")} className="flex items-center gap-2 mb-3 w-full text-left">
          <div className="w-2 h-2 rounded-full bg-[#9b6b6b]" />
          <h2 className="text-sm font-medium text-[#9b6b6b]">Today Event ({todayEvents.length})</h2>
          {sections.todayEvents ? <ChevronUp className="w-3.5 h-3.5 text-rose-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-rose-muted" />}
        </button>
        {sections.todayEvents && (todayEvents.length === 0 ? (
          <div className="card p-5 text-center text-sm text-rose-muted">No events today</div>
        ) : (
          <div className="card divide-y divide-rose-border">
            {todayEvents.map((e) => {
              const done = isEventDoneOn(e, today);
              return (
                <div key={e.id} className="flex items-center gap-3 py-3 px-4">
                  <button onClick={() => toggleEventDone(e.id, today)} className="flex-shrink-0">
                    {done ? (
                      <CheckCircle2 className="w-[18px] h-[18px]" style={{ color: e.color }} />
                    ) : (
                      <Circle className="w-[18px] h-[18px] text-rose-border hover:opacity-70 transition" />
                    )}
                  </button>
                  <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? "line-through text-rose-muted" : "text-rose-dark"}`}>
                      {e.title}
                    </p>
                    {e.time && <p className="text-xs text-rose-muted mt-0.5">{e.time}</p>}
                  </div>
                  {e.recurring && <span className="text-xs text-rose-muted flex-shrink-0 capitalize">{e.recurring}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </section>

      {/* Today Pilates */}
      <section className="mb-6">
        <button onClick={() => toggle("pilates")} className="flex items-center gap-2 mb-3 w-full text-left">
          <div className="w-2 h-2 rounded-full bg-rose-deep" />
          <h2 className="text-sm font-medium text-rose-deep">Pilates hôm nay ({(pilatesToday || []).length})</h2>
          {sections.pilates ? <ChevronUp className="w-3.5 h-3.5 text-rose-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-rose-muted" />}
          <Link href="/pilates" className="text-xs text-rose-deep hover:underline ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            All <ArrowRight className="w-3 h-3" />
          </Link>
        </button>
        {sections.pilates && (() => {
          const attended = (pilatesToday || []).filter((s) => s.time);
          if (attended.length === 0) {
            return <div className="card p-5 text-center text-sm text-rose-muted">Hôm nay chưa có ca tập</div>;
          }
          attended.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
          return (
            <div className="card p-4">
              <div className="flex flex-wrap gap-2">
                {attended.map((s) => {
                  const h = parseInt((s.time as string).split(":")[0]);
                  return (
                    <button
                      key={s.id}
                      onClick={async () => {
                        await fetch(`/api/pilates/${s.id}`, { method: "DELETE" });
                        mutatePilates();
                      }}
                      title="Click để bỏ chọn"
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition border bg-rose-deep text-white border-rose-deep font-medium hover:opacity-90"
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-white" />
                      <span>{h}h</span>
                    </button>
                  );
                })}
              </div>
              {attended.filter((s) => s.notes).length > 0 && (
                <div className="text-xs text-rose-muted space-y-1 mt-2 pt-2 border-t border-rose-border">
                  {attended
                    .filter((s) => s.notes)
                    .map((s) => (
                      <div key={s.id}>
                        <span className="text-rose-deep">{s.time}</span> · {s.notes}
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })()}
      </section>

      {/* Upcoming Birthdays */}
      {upcomingBirthdays.length > 0 && (
        <section className="mb-6">
          <button onClick={() => toggle("birthdays")} className="flex items-center gap-2 mb-3 w-full text-left">
            <div className="w-2 h-2 rounded-full bg-rose-deep" />
            <h2 className="text-sm font-medium text-rose-deep">
              Sinh nhật sắp tới ({upcomingBirthdays.length})
            </h2>
            {sections.birthdays ? <ChevronUp className="w-3.5 h-3.5 text-rose-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-rose-muted" />}
            <Link href="/birthdays" className="text-xs text-rose-deep hover:underline ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </button>
          {sections.birthdays && (
            <div className="card divide-y divide-rose-border">
              {upcomingBirthdays.map((b) => (
                <div key={b.id} className="flex items-center gap-3 py-3 px-4">
                  <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-rose-dark">
                      {b.name}
                      {b.daysUntil === 0 && <span className="ml-2 text-rose-deep">🎂 Hôm nay!</span>}
                    </p>
                    <p className="text-xs text-rose-muted mt-0.5">
                      Tròn {b.age} tuổi
                    </p>
                  </div>
                  <span className="text-xs text-rose-muted flex-shrink-0">
                    {b.daysUntil === 0
                      ? "Today"
                      : b.daysUntil === 1
                      ? "Tomorrow"
                      : `${b.daysUntil} ngày`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="mb-6">
          <button onClick={() => toggle("events")} className="flex items-center gap-2 mb-3 w-full text-left">
            <h2 className="text-sm font-medium text-rose-deep">Upcoming Events ({upcomingEvents.length})</h2>
            {sections.events ? <ChevronUp className="w-3.5 h-3.5 text-rose-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-rose-muted" />}
            <Link href="/events" className="text-xs text-rose-deep hover:underline ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </button>
          {sections.events && (
            <div className="card divide-y divide-rose-border">
              {upcomingEvents.map((e) => {
                const d = new Date(e.date);
                return (
                  <div key={e.id} className="flex items-center gap-3 py-3 px-4">
                    <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-rose-dark">{e.title}</p>
                      {e.time && <p className="text-xs text-rose-muted mt-0.5">{e.time}</p>}
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
      )}

      {/* Today Note */}
      <section className="mb-6">
        <button onClick={() => toggle("notes")} className="flex items-center gap-2 mb-3 w-full text-left">
          <div className="w-2 h-2 rounded-full bg-[#9b6b6b]" />
          <h2 className="text-sm font-medium text-[#9b6b6b]">Today Note ({todayNotes.length})</h2>
          {sections.notes ? <ChevronUp className="w-3.5 h-3.5 text-rose-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-rose-muted" />}
          <Link href="/notes" className="text-xs text-rose-deep hover:underline ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            All <ArrowRight className="w-3 h-3" />
          </Link>
        </button>
        {sections.notes && (todayNotes.length === 0 ? (
          <div className="card p-5 text-center text-sm text-rose-muted">
            No notes for today.{" "}
            <Link href="/notes" className="text-rose-deep hover:underline">Write one</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {todayNotes.map((n) => {
              const p = projectMap.get(n.category);
              const plain = n.content.replace(/<[^>]*>/g, " ").trim();
              return (
                <div key={n.id} className="card p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-rose-dark">{n.title || "Untitled"}</h3>
                    {p && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${p.color}18`, color: p.color }}>
                        {p.name}
                      </span>
                    )}
                  </div>
                  {plain && <p className="text-xs text-rose-muted line-clamp-2">{plain}</p>}
                </div>
              );
            })}
          </div>
        ))}
      </section>

      {/* Overview — chuyen xuong cuoi trang */}
      <p className="text-xs text-rose-muted uppercase tracking-wider mb-2 mt-8">Overview</p>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <ProductivityHeatmap />
        <FocusHeatmap />
      </div>

      <QuoteCard />

      <TaskDetailPanel
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={() => mutateTasks()}
      />
    </div>
  );
}
