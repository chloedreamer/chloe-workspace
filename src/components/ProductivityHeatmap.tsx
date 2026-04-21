"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Flame, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Task {
  id: string;
  status: string;
  updatedAt: string;
}

function getDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function getIntensity(count: number) {
  if (count === 0) return "bg-rose-light/40";
  if (count === 1) return "bg-rose-light";
  if (count === 2) return "bg-rose/40";
  if (count <= 4) return "bg-rose/60";
  if (count <= 6) return "bg-rose";
  return "bg-rose-deep";
}

export default function ProductivityHeatmap() {
  const { data: tasks } = useSWR<Task[]>("/api/tasks", fetcher);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null);

  if (!tasks) return <div className="card p-5 h-64" />;

  const completionMap: Record<string, number> = {};
  tasks.forEach((t) => {
    if (t.status === "done") {
      const date = getDateStr(new Date(t.updatedAt));
      completionMap[date] = (completionMap[date] || 0) + 1;
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = getDateStr(today);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  while (days.length < 42) days.push(null);

  const getCellDate = (day: number) => {
    const d = new Date(year, month, day);
    return getDateStr(d);
  };

  // Stats for this month
  let monthCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    monthCount += completionMap[getCellDate(d)] || 0;
  }

  // Overall streak
  let currentStreak = 0;
  const cur = new Date(today);
  while (completionMap[getDateStr(cur)] > 0) {
    currentStreak++;
    cur.setDate(cur.getDate() - 1);
  }

  const totalDone = Object.values(completionMap).reduce((a, b) => a + b, 0);

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-rose" />
          <h2 className="text-sm font-medium text-rose-deep">Productivity</h2>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1 rounded hover:bg-rose-light text-rose-muted">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-medium text-rose-dark min-w-[80px] text-center">
            {currentMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            disabled={isCurrentMonth}
            className="p-1 rounded hover:bg-rose-light text-rose-muted disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] text-rose-muted uppercase tracking-wider">Streak</span>
          </div>
          <p className="text-lg font-semibold text-rose-dark">{currentStreak}</p>
        </div>
        <div>
          <span className="text-[10px] text-rose-muted uppercase tracking-wider block mb-1">This Month</span>
          <p className="text-lg font-semibold text-rose-dark">{monthCount}</p>
        </div>
        <div>
          <span className="text-[10px] text-rose-muted uppercase tracking-wider block mb-1">Total</span>
          <p className="text-lg font-semibold text-rose-dark">{totalDone}</p>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[10px] text-rose-muted text-center font-medium">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className="aspect-square" />;
          const dateStr = getCellDate(day);
          const count = completionMap[dateStr] || 0;
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;

          return (
            <div
              key={day}
              onMouseEnter={() => setHoveredDay({ date: dateStr, count })}
              onMouseLeave={() => setHoveredDay(null)}
              className={`aspect-square rounded transition relative flex items-center justify-center ${
                isFuture ? "bg-rose-light/20" : getIntensity(count)
              } ${isToday ? "ring-2 ring-rose-deep ring-offset-1" : ""}`}
            >
              <span className={`text-[10px] font-medium ${count > 4 || isToday ? "text-white" : "text-rose-muted"}`}>
                {day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tooltip / Legend */}
      <div className="mt-4 text-xs text-rose-muted h-4">
        {hoveredDay ? (
          <span>
            <span className="font-medium text-rose-dark">{hoveredDay.count}</span> task{hoveredDay.count !== 1 ? "s" : ""} ·{" "}
            {new Date(hoveredDay.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            <div className="w-3 h-3 rounded bg-rose-light/40" />
            <div className="w-3 h-3 rounded bg-rose-light" />
            <div className="w-3 h-3 rounded bg-rose/40" />
            <div className="w-3 h-3 rounded bg-rose/60" />
            <div className="w-3 h-3 rounded bg-rose" />
            <div className="w-3 h-3 rounded bg-rose-deep" />
            <span>More</span>
          </div>
        )}
      </div>
    </div>
  );
}
