"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Flame, TrendingUp, Target } from "lucide-react";
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

  if (!tasks) return null;

  // Count done tasks per day (using updatedAt as completion date)
  const completionMap: Record<string, number> = {};
  tasks.forEach((t) => {
    if (t.status === "done") {
      const date = getDateStr(new Date(t.updatedAt));
      completionMap[date] = (completionMap[date] || 0) + 1;
    }
  });

  // Build last 13 weeks (91 days) grid
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weeks: { date: string; count: number }[][] = [];

  // Start from 13 weeks ago on a Sunday
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

  // Calculate streak
  let currentStreak = 0;
  const cur = new Date(today);
  while (completionMap[getDateStr(cur)] > 0) {
    currentStreak++;
    cur.setDate(cur.getDate() - 1);
  }

  // Longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = Object.keys(completionMap).sort();
  let prevDate: Date | null = null;
  sortedDates.forEach((d) => {
    const cd = new Date(d);
    if (prevDate) {
      const diff = (cd.getTime() - prevDate.getTime()) / 86400000;
      if (diff === 1) tempStreak++;
      else tempStreak = 1;
    } else tempStreak = 1;
    if (tempStreak > longestStreak) longestStreak = tempStreak;
    prevDate = cd;
  });

  // Total done
  const totalDone = Object.values(completionMap).reduce((a, b) => a + b, 0);

  // This week
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - today.getDay());
  let thisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    thisWeek += completionMap[getDateStr(d)] || 0;
  }

  const monthLabels: { idx: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const m = new Date(week[0].date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ idx: i, label: new Date(week[0].date).toLocaleDateString("en-US", { month: "short" }) });
      lastMonth = m;
    }
  });

  return (
    <div className="card p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-rose-deep">Productivity</h2>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-rose-dark font-medium">{currentStreak}</span>
            <span className="text-rose-muted">day streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <span className="text-rose-dark font-medium">{thisWeek}</span>
            <span className="text-rose-muted">this week</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-rose" />
            <span className="text-rose-dark font-medium">{totalDone}</span>
            <span className="text-rose-muted">total</span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="relative">
        {/* Month labels */}
        <div className="flex gap-[3px] mb-1 ml-8 text-[10px] text-rose-muted h-3">
          {weeks.map((_, i) => {
            const label = monthLabels.find((m) => m.idx === i);
            return (
              <div key={i} className="w-3 flex-shrink-0">
                {label && <span>{label.label}</span>}
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div className="flex gap-[3px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-2 text-[10px] text-rose-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
              <div key={d} className="w-5 h-3 flex items-center" style={{ opacity: i % 2 === 1 ? 1 : 0 }}>
                {d}
              </div>
            ))}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => {
                const isFuture = day.date > getDateStr(today);
                return (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`w-3 h-3 rounded-sm transition ${
                      isFuture ? "bg-transparent" : getIntensity(day.count)
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {hoveredDay && (
          <div className="mt-2 text-xs text-rose-muted">
            <span className="font-medium text-rose-dark">{hoveredDay.count}</span> task{hoveredDay.count !== 1 ? "s" : ""} on{" "}
            {new Date(hoveredDay.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 text-xs text-rose-muted">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-rose-light/40" />
          <div className="w-3 h-3 rounded-sm bg-rose-light" />
          <div className="w-3 h-3 rounded-sm bg-rose/40" />
          <div className="w-3 h-3 rounded-sm bg-rose/60" />
          <div className="w-3 h-3 rounded-sm bg-rose" />
          <div className="w-3 h-3 rounded-sm bg-rose-deep" />
          <span>More</span>
          {longestStreak > 0 && (
            <span className="ml-auto">Longest streak: <span className="text-rose-dark font-medium">{longestStreak} days</span></span>
          )}
        </div>
      </div>
    </div>
  );
}
