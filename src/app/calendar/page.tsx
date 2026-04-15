"use client";

import { useEffect, useState, useCallback } from "react";
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

const CATEGORIES: Record<string, string> = {
  actuarial: "bg-blue-200",
  wq: "bg-purple-200",
  sp2: "bg-green-200",
  timeless: "bg-orange-200",
  general: "bg-gray-200",
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [tasksRes, notesRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/notes"),
    ]);
    setTasks(await tasksRes.json());
    setNotes(await notesRes.json());
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const navigate = (direction: number) => {
    const d = new Date(year, month + direction, 1);
    setCurrentMonth(d);
  };

  const getDateStr = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const getItemsForDate = (dateStr: string) => {
    const dayTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate.startsWith(dateStr)
    );
    const dayNotes = notes.filter((n) => n.date === dateStr);
    return { dayTasks, dayNotes };
  };

  const selectedItems = selectedDate ? getItemsForDate(selectedDate) : null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-pink-100 text-gray-600 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold text-gray-800 min-w-[180px] text-center">
            {currentMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-lg hover:bg-pink-100 text-gray-600 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-pink-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="px-2 py-3 text-center text-xs font-semibold text-gray-500 bg-pink-50 border-b border-pink-100"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (day === null)
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[100px] border-b border-r border-pink-50"
                />
              );

            const dateStr = getDateStr(day);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const { dayTasks, dayNotes } = getItemsForDate(dateStr);

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`min-h-[100px] border-b border-r border-pink-50 p-2 cursor-pointer transition hover:bg-pink-50 ${
                  isSelected ? "bg-pink-50 ring-2 ring-pink-300 ring-inset" : ""
                }`}
              >
                <div
                  className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday
                      ? "bg-pink-500 text-white"
                      : "text-gray-700"
                  }`}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      className={`text-xs px-1.5 py-0.5 rounded truncate ${
                        CATEGORIES[t.category] || "bg-gray-200"
                      }`}
                    >
                      {t.title}
                    </div>
                  ))}
                  {dayNotes.length > 0 && (
                    <div className="text-xs px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 truncate">
                      {dayNotes.length} note{dayNotes.length > 1 ? "s" : ""}
                    </div>
                  )}
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-gray-400">
                      +{dayTasks.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Detail */}
      {selectedItems && selectedDate && (
        <div className="mt-6 bg-white rounded-xl border border-pink-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                Tasks ({selectedItems.dayTasks.length})
              </h3>
              {selectedItems.dayTasks.length === 0 ? (
                <p className="text-sm text-gray-400">No tasks due</p>
              ) : (
                <div className="space-y-2">
                  {selectedItems.dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-pink-50"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          t.status === "done"
                            ? "bg-green-400"
                            : t.status === "in_progress"
                            ? "bg-blue-400"
                            : "bg-gray-400"
                        }`}
                      />
                      <span className="text-sm text-gray-700">{t.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                Notes ({selectedItems.dayNotes.length})
              </h3>
              {selectedItems.dayNotes.length === 0 ? (
                <p className="text-sm text-gray-400">No notes</p>
              ) : (
                <div className="space-y-2">
                  {selectedItems.dayNotes.map((n) => (
                    <div
                      key={n.id}
                      className="p-2 rounded-lg bg-pink-50 text-sm text-gray-700"
                    >
                      {n.title || "Untitled"}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
