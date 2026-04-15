"use client";

import { useEffect, useState, useCallback } from "react";
import { PROJECTS } from "@/lib/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [t, n] = await Promise.all([fetch("/api/tasks"), fetch("/api/notes")]);
    setTasks(await t.json());
    setNotes(await n.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getItemsForDate = (dateStr: string) => ({
    dayTasks: tasks.filter((t) => t.dueDate && t.dueDate.startsWith(dateStr)),
    dayNotes: notes.filter((n) => n.date === dateStr),
  });

  const selectedItems = selectedDate ? getItemsForDate(selectedDate) : null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-rose-dark">Calendar</h1>
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

      <div className="bg-white rounded-xl border border-rose-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-7">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-rose-muted bg-rose-light border-b border-rose-border">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} className="min-h-[100px] border-b border-r border-rose-border/50" />;
            const dateStr = getDateStr(day);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const { dayTasks, dayNotes } = getItemsForDate(dateStr);
            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`min-h-[100px] border-b border-r border-rose-border/50 p-2 cursor-pointer transition hover:bg-rose-light ${isSelected ? "bg-rose-light ring-2 ring-rose ring-inset" : ""}`}
              >
                <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-rose-deep text-white" : "text-rose-dark"}`}>{day}</div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 2).map((t) => {
                    const proj = PROJECTS.find((p) => p.key === t.category);
                    return <div key={t.id} className={`text-xs px-1.5 py-0.5 rounded truncate ${proj?.color || "bg-gray-100 text-gray-700"}`}>{t.title}</div>;
                  })}
                  {dayNotes.length > 0 && <div className="text-xs px-1.5 py-0.5 rounded bg-rose-light text-rose-deep truncate">{dayNotes.length} note{dayNotes.length > 1 ? "s" : ""}</div>}
                  {dayTasks.length > 2 && <div className="text-xs text-rose-muted">+{dayTasks.length - 2} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedItems && selectedDate && (
        <div className="mt-6 bg-white rounded-xl border border-rose-border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-rose-dark mb-4">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </h2>
          <div className="grid grid-cols-2 gap-6">
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
