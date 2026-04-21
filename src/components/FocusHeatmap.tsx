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

function formatMinutes(m: number) {
  if (m === 0) return "0m";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h${rm}m` : `${h}h`;
}

export default function FocusHeatmap() {
  const { data: sessions } = useSWR<FocusSession[]>("/api/focus", fetcher, { refreshInterval: 30000 });
  const [hoveredDay, setHoveredDay] = useState<{ date: string; minutes: number; count: number } | null>(null);

  if (!sessions) return <div className="card p-5 h-64" />;

  const focusMap: Record<string, { minutes: number; count: number }> = {};
  sessions.forEach((s) => {
    if (!focusMap[s.date]) focusMap[s.date] = { minutes: 0, count: 0 };
    focusMap[s.date].minutes += s.duration;
    focusMap[s.date].count += 1;
  });

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

  let currentStreak = 0;
  const cur = new Date(today);
  while ((focusMap[getDateStr(cur)]?.minutes || 0) > 0) {
    currentStreak++;
    cur.setDate(cur.getDate() - 1);
  }

  const totalMinutes = Object.values(focusMap).reduce((a, b) => a + b.minutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - today.getDay());
  let thisWeekMin = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    thisWeekMin += focusMap[getDateStr(d)]?.minutes || 0;
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-medium text-rose-deep">Focus</h2>
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
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-blue-500" />
            <span className="text-[10px] text-rose-muted uppercase tracking-wider">This Week</span>
          </div>
          <p className="text-lg font-semibold text-rose-dark">{formatMinutes(thisWeekMin)}</p>
        </div>
        <div>
          <span className="text-[10px] text-rose-muted uppercase tracking-wider block mb-1">Total</span>
          <p className="text-lg font-semibold text-rose-dark">{totalHours}h</p>
        </div>
      </div>

      {/* Grid */}
      <div className="flex gap-1 justify-between">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1 flex-1">
            {week.map((day) => {
              const isFuture = day.date > getDateStr(today);
              return (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`aspect-square rounded transition ${
                    isFuture ? "bg-transparent" : getIntensity(day.minutes)
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Tooltip / Legend */}
      <div className="mt-4 text-xs text-rose-muted h-4">
        {hoveredDay ? (
          <span>
            <span className="font-medium text-rose-dark">{formatMinutes(hoveredDay.minutes)}</span>
            {hoveredDay.count > 0 && <span> · {hoveredDay.count} session{hoveredDay.count !== 1 ? "s" : ""}</span>}
            <span> · {new Date(hoveredDay.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            <div className="w-3 h-3 rounded bg-rose-light/40" />
            <div className="w-3 h-3 rounded bg-blue-200" />
            <div className="w-3 h-3 rounded bg-blue-300" />
            <div className="w-3 h-3 rounded bg-blue-400" />
            <div className="w-3 h-3 rounded bg-blue-500" />
            <div className="w-3 h-3 rounded bg-blue-600" />
            <span>More</span>
          </div>
        )}
      </div>
    </div>
  );
}
