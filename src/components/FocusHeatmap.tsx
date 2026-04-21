"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Brain, Flame, Clock } from "lucide-react";
import { useState } from "react";

interface FocusSession {
  id: string;
  date: string;
  duration: number;
  completedAt: string;
}

function getDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function getIntensity(minutes: number) {
  if (minutes === 0) return "bg-rose-light/40";
  if (minutes <= 25) return "bg-blue-200";
  if (minutes <= 75) return "bg-blue-300";
  if (minutes <= 125) return "bg-blue-400";
  if (minutes <= 200) return "bg-blue-500";
  return "bg-blue-600";
}

export default function FocusHeatmap() {
  const { data: sessions } = useSWR<FocusSession[]>("/api/focus", fetcher, { refreshInterval: 30000 });
  const [hoveredDay, setHoveredDay] = useState<{ date: string; minutes: number; count: number } | null>(null);

  if (!sessions) return null;

  // Aggregate by date
  const focusMap: Record<string, { minutes: number; count: number }> = {};
  sessions.forEach((s) => {
    if (!focusMap[s.date]) focusMap[s.date] = { minutes: 0, count: 0 };
    focusMap[s.date].minutes += s.duration;
    focusMap[s.date].count += 1;
  });

  // Build last 13 weeks grid
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weeks: { date: string; minutes: number; count: number }[][] = [];

  const start = new Date(today);
  start.setDate(start.getDate() - 90);
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - dayOfWeek);

  const cursor = new Date(start);
  for (let w = 0; w < 14; w++) {
    const week: { date: string; minutes: number; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = getDateStr(cursor);
      const entry = focusMap[date] || { minutes: 0, count: 0 };
      week.push({ date, ...entry });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  // Current streak
  let currentStreak = 0;
  const cur = new Date(today);
  while ((focusMap[getDateStr(cur)]?.minutes || 0) > 0) {
    currentStreak++;
    cur.setDate(cur.getDate() - 1);
  }

  // Longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = Object.keys(focusMap).sort();
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

  // Stats
  const totalMinutes = Object.values(focusMap).reduce((a, b) => a + b.minutes, 0);
  const totalSessions = Object.values(focusMap).reduce((a, b) => a + b.count, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  // This week
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - today.getDay());
  let thisWeekMin = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    thisWeekMin += focusMap[getDateStr(d)]?.minutes || 0;
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

  function formatMinutes(m: number) {
    if (m === 0) return "0 min";
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
  }

  return (
    <div className="card p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-medium text-rose-deep">Focus</h2>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-rose-dark font-medium">{currentStreak}</span>
            <span className="text-rose-muted">day streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-rose-dark font-medium">{formatMinutes(thisWeekMin)}</span>
            <span className="text-rose-muted">this week</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-rose-dark font-medium">{totalSessions}</span>
            <span className="text-rose-muted">sessions · {totalHours}h</span>
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
                      isFuture ? "bg-transparent" : getIntensity(day.minutes)
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
            <span className="font-medium text-rose-dark">{formatMinutes(hoveredDay.minutes)}</span>
            {hoveredDay.count > 0 && <span> · {hoveredDay.count} session{hoveredDay.count !== 1 ? "s" : ""}</span>}
            <span> on {new Date(hoveredDay.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 text-xs text-rose-muted">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-rose-light/40" />
          <div className="w-3 h-3 rounded-sm bg-blue-200" />
          <div className="w-3 h-3 rounded-sm bg-blue-300" />
          <div className="w-3 h-3 rounded-sm bg-blue-400" />
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <div className="w-3 h-3 rounded-sm bg-blue-600" />
          <span>More</span>
          {longestStreak > 0 && (
            <span className="ml-auto">Longest streak: <span className="text-rose-dark font-medium">{longestStreak} days</span></span>
          )}
        </div>
      </div>
    </div>
  );
}
