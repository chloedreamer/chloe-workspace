"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useProjects } from "@/components/ProjectsProvider";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  category: string;
  dueDate: string | null;
}

interface Note {
  id: string;
  date: string;
  title: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  endDate: string | null;
  time: string | null;
  type: string;
  color: string;
  recurring: string | null;
  completedDates: string;
}

function isEventCompleted(event: Event, dateStr: string): boolean {
  try {
    const arr = JSON.parse(event.completedDates || "[]");
    return Array.isArray(arr) && arr.includes(dateStr);
  } catch {
    return false;
  }
}

function getLocalDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function eventOccursOnDate(event: Event, dateStr: string): boolean {
  const eventDate = event.date.split("T")[0];
  if (eventDate === dateStr) return true;
  if (!event.recurring || dateStr < eventDate) return false;
  if (event.endDate && dateStr > event.endDate.split("T")[0]) return false;

  const ed = new Date(eventDate + "T00:00:00");
  const cd = new Date(dateStr + "T00:00:00");

  switch (event.recurring) {
    case "daily":
      return true;
    case "weekly":
      return ed.getDay() === cd.getDay();
    case "monthly":
      return ed.getDate() === cd.getDate();
    case "yearly":
      return ed.getMonth() === cd.getMonth() && ed.getDate() === cd.getDate();
    default:
      return false;
  }
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { projects } = useProjects();

  const { data: tasks } = useSWR<Task[]>("/api/tasks", fetcher);
  const { data: notes } = useSWR<Note[]>("/api/notes", fetcher);
  const { data: events, mutate: mutateEvents } = useSWR<Event[]>("/api/events", fetcher);

  const toggleEventComplete = async (eventId: string, dateStr: string) => {
    await fetch(`/api/events/${eventId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr }),
    });
    mutateEvents();
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = getLocalDateStr(new Date());

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getItemsForDate = (dateStr: string) => ({
    dayTasks: (tasks || []).filter((t) => t.dueDate && t.dueDate.startsWith(dateStr)),
    dayNotes: (notes || []).filter((n) => n.date === dateStr),
    dayEvents: (events || []).filter((e) => eventOccursOnDate(e, dateStr)),
  });

  const selectedItems = selectedDate ? getItemsForDate(selectedDate) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-rose-dark tracking-tight">Calendar</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-rose-light text-rose-muted transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold text-rose-dark min-w-[180px] text-center">
            {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-rose-light text-rose-muted transition">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-rose-muted bg-rose-light border-b border-rose-border">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} className="min-h-[110px] border-b border-r border-rose-border/50" />;
            const dateStr = getDateStr(day);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const { dayTasks, dayNotes, dayEvents } = getItemsForDate(dateStr);
            const items = [
              ...dayEvents.map((e) => ({ key: `e-${e.id}`, title: e.time ? `${e.time} ${e.title}` : e.title, color: e.color, isEvent: true })),
              ...dayTasks.map((t) => {
                const proj = projects.find((p) => p.key === t.category);
                return { key: `t-${t.id}`, title: t.title, color: proj?.color || "#9ca3af", isEvent: false };
              }),
            ];
            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`min-h-[110px] border-b border-r border-rose-border/50 p-2 cursor-pointer transition hover:bg-rose-light ${isSelected ? "bg-rose-light ring-2 ring-rose ring-inset" : ""}`}
              >
                <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-rose-deep text-white" : "text-rose-dark"}`}>{day}</div>
                <div className="space-y-1">
                  {items.slice(0, 3).map((it) => (
                    <div key={it.key} className="text-xs px-1.5 py-0.5 rounded truncate" style={{ backgroundColor: `${it.color}18`, color: it.color }}>
                      {it.title}
                    </div>
                  ))}
                  {dayNotes.length > 0 && <div className="text-xs px-1.5 py-0.5 rounded bg-rose-light text-rose-deep truncate">{dayNotes.length} note{dayNotes.length > 1 ? "s" : ""}</div>}
                  {items.length > 3 && <div className="text-xs text-rose-muted">+{items.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedItems && selectedDate && (
        <div className="mt-6 card p-6">
          <h2 className="text-lg font-semibold text-rose-dark mb-4">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-rose-muted mb-2">Events ({selectedItems.dayEvents.length})</h3>
              {selectedItems.dayEvents.length === 0 ? <p className="text-sm text-rose-muted">No events</p> : (
                <div className="space-y-2">
                  {selectedItems.dayEvents.map((e) => {
                    const done = isEventCompleted(e, selectedDate);
                    return (
                      <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: `${e.color}18` }}>
                        <button onClick={() => toggleEventComplete(e.id, selectedDate)} className="flex-shrink-0">
                          {done ? <CheckCircle2 className="w-4 h-4" style={{ color: e.color }} /> : <Circle className="w-4 h-4 text-rose-border" />}
                        </button>
                        <span className={`text-sm flex-1 ${done ? "line-through text-rose-muted" : "text-rose-dark"}`}>{e.title}</span>
                        {e.time && <span className="text-xs text-rose-muted">{e.time}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-muted mb-2">Tasks ({selectedItems.dayTasks.length})</h3>
              {selectedItems.dayTasks.length === 0 ? <p className="text-sm text-rose-muted">No tasks due</p> : (
                <div className="space-y-2">
                  {selectedItems.dayTasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-rose-light">
                      <div className={`w-2 h-2 rounded-full ${t.status === "done" ? "bg-green-400" : t.status === "in_progress" ? "bg-blue-400" : "bg-gray-400"}`} />
                      <span className="text-sm text-rose-dark">{t.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-muted mb-2">Notes ({selectedItems.dayNotes.length})</h3>
              {selectedItems.dayNotes.length === 0 ? <p className="text-sm text-rose-muted">No notes</p> : (
                <div className="space-y-2">
                  {selectedItems.dayNotes.map((n) => <div key={n.id} className="p-2 rounded-lg bg-rose-light text-sm text-rose-dark">{n.title || "Untitled"}</div>)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
