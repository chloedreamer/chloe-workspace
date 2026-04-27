"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Brain, Flame, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

interface FocusSession {
  id: string;
  date: string;
  duration: number;
  completedAt: string;
}

function getDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  const { data: sessions } = useSWR<FocusSession[]>("/api/focus", fetcher, { refreshInterval: 0, dedupingInterval: 60000 });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [hoveredDay, setHoveredDay] = useState<{ date: string; minutes: number; count: number } | null>(null);

  const { focusMap, totalHours } = useMemo(() => {
    const map: Record<string, { minutes: number; count: number }> = {};
    let totalMin = 0;
    (sessions || []).forEach((s) => {
      if (!map[s.date]) map[s.date] = { minutes: 0, count: 0 };
      map[s.date].minutes += s.duration;
      map[s.date].count += 1;
      totalMin += s.duration;
    });
    return { focusMap: map, totalHours: Math.round((totalMin / 60) * 10) / 10 };
  }, [sessions]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayStr = useMemo(() => getDateStr(today), [today]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const { days, monthMinutes, currentStreak, isCurrentMonth } = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const ds: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) ds.push(null);
    for (let i = 1; i <= daysInMonth; i++) ds.push(i);
    while (ds.length < 42) ds.push(null);

    const getCellDate = (day: number) => getDateStr(new Date(year, month, day));
    let mm = 0;
    for (let d = 1; d <= daysInMonth; d++) mm += focusMap[getCellDate(d)]?.minutes || 0;

    let streak = 0;
    const cur = new Date(today);
    while ((focusMap[getDateStr(cur)]?.minutes || 0) > 0) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }

    return {
      days: ds,
      monthMinutes: mm,
      currentStreak: streak,
      isCurrentMonth: year === today.getFullYear() && month === today.getMonth(),
    };
  }, [year, month, focusMap, today]);

  if (!sessions) return <div className="card p-5 h-64" />;

  const getCellDate = (day: number) => getDateStr(new Date(year, month, day));

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
