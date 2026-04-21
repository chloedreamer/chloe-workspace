"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Brain, Flame, Clock, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
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
  const todayStr = getDateStr(today);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  while (days.length < 42) days.push(null);

  const getCellDate = (day: number) => getDateStr(new Date(year, month, day));

  let monthMinutes = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    monthMinutes += focusMap[getCellDate(d)]?.minutes || 0;
  }

  let currentStreak = 0;
  const cur = new Date(today);
  while ((focusMap[getDateStr(cur)]?.minutes || 0) > 0) {
    currentStreak++;
    cur.setDate(cur.getDate() - 1);
  }

  const totalMinutes = Object.values(focusMap).reduce((a, b) => a + b.minutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-medium text-rose-deep">Focus</h2>
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
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-blue-500" />
            <span className="text-[10px] text-rose-muted uppercase tracking-wider">This Month</span>
          </div>
          <p className="text-lg font-semibold text-rose-dark">{formatMinutes(monthMinutes)}</p>
        </div>
        <div>
          <span className="text-[10px] text-rose-muted uppercase tracking-wider block mb-1">Total</span>
          <p className="text-lg font-semibold text-rose-dark">{totalHours}h</p>
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
          const entry = focusMap[dateStr];
          const minutes = entry?.minutes || 0;
          const count = entry?.count || 0;
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;

          return (
            <div
              key={day}
              onMouseEnter={() => setHoveredDay({ date: dateStr, minutes, count })}
              onMouseLeave={() => setHoveredDay(null)}
              className={`aspect-square rounded transition relative flex items-center justify-center ${
                isFuture ? "bg-rose-light/20" : getIntensity(minutes)
              } ${isToday ? "ring-2 ring-rose-deep ring-offset-1" : ""}`}
            >
              <span className={`text-[10px] font-medium ${minutes > 125 || isToday ? "text-white" : "text-rose-muted"}`}>
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
            <span className="font-medium text-rose-dark">{formatMinutes(hoveredDay.minutes)}</span>
            {hoveredDay.count > 0 && <span> · {hoveredDay.count} session{hoveredDay.count !== 1 ? "s" : ""}</span>}
            <span> · {new Date(hoveredDay.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-light/40" />
            <div className="w-3 h-3 rounded bg-blue-200" />
            <div className="w-3 h-3 rounded bg-blue-300" />
            <div className="w-3 h-3 rounded bg-blue-400" />
            <div className="w-3 h-3 rounded bg-blue-500" />
            <div className="w-3 h-3 rounded bg-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
}
