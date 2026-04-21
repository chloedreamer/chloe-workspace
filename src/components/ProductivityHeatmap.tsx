"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Flame, Target } from "lucide-react";
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
  const weeks: { date: string; count: number }[][] = [];

  const start = new Date(today);
  start.setDate(start.getDate() - 90);
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - dayOfWeek);

  const cursor = new Date(start);
  for (let w = 0; w < 14; w++) {
    const week: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = getDateStr(cursor);
      week.push({ date, count: completionMap[date] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  let currentStreak = 0;
  const cur = new Date(today);
  while (completionMap[getDateStr(cur)] > 0) {
    currentStreak++;
    cur.setDate(cur.getDate() - 1);
  }

  const totalDone = Object.values(completionMap).reduce((a, b) => a + b, 0);

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - today.getDay());
  let thisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    thisWeek += completionMap[getDateStr(d)] || 0;
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-rose" />
          <h2 className="text-sm font-medium text-rose-deep">Productivity</h2>
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
          <span className="text-[10px] text-rose-muted uppercase tracking-wider block mb-1">This Week</span>
          <p className="text-lg font-semibold text-rose-dark">{thisWeek}</p>
        </div>
        <div>
          <span className="text-[10px] text-rose-muted uppercase tracking-wider block mb-1">Total</span>
          <p className="text-lg font-semibold text-rose-dark">{totalDone}</p>
        </div>
      </div>

      {/* Grid */}
      <div className="flex gap-[2px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map((day) => {
              const isFuture = day.date > getDateStr(today);
              return (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-[11px] h-[11px] rounded-sm transition ${
                    isFuture ? "bg-transparent" : getIntensity(day.count)
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Tooltip / Legend */}
      <div className="mt-3 text-xs text-rose-muted h-4">
        {hoveredDay ? (
          <span>
            <span className="font-medium text-rose-dark">{hoveredDay.count}</span> task{hoveredDay.count !== 1 ? "s" : ""} ·{" "}
            {new Date(hoveredDay.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-rose-light/40" />
            <div className="w-2.5 h-2.5 rounded-sm bg-rose-light" />
            <div className="w-2.5 h-2.5 rounded-sm bg-rose/40" />
            <div className="w-2.5 h-2.5 rounded-sm bg-rose/60" />
            <div className="w-2.5 h-2.5 rounded-sm bg-rose" />
            <div className="w-2.5 h-2.5 rounded-sm bg-rose-deep" />
            <span>More</span>
          </div>
        )}
      </div>
    </div>
  );
}
