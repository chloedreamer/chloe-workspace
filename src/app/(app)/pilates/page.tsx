"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Plus, Trash2, X, Pencil, ChevronLeft, ChevronRight, Activity } from "lucide-react";

interface PilatesSession {
  id: string;
  date: string;
  time: string | null;
  type: string;
  duration: number;
  intensity: string;
  focus: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/* Lich lop nhom: 0=Sun, 1=Mon, ..., 6=Sat. Moi ngay chi co 2 ca: 17h va 19h */
const CLASS_SCHEDULE: Record<number, number[]> = {
  0: [17, 19],
  1: [17, 19],
  2: [17, 19],
  3: [17, 19],
  4: [17, 19],
  5: [17, 19],
  6: [17, 19],
};

const INTENSITY_OPTIONS = [
  { key: "low", label: "Nhẹ", color: "#86b386" },
  { key: "medium", label: "Trung bình", color: "#c8a06a" },
  { key: "high", label: "Cao", color: "#c87a7a" },
];

function intensityColor(intensity: string) {
  return INTENSITY_OPTIONS.find((i) => i.key === intensity)?.color || "#9b6b6b";
}

function intensityLabel(intensity: string) {
  return INTENSITY_OPTIONS.find((i) => i.key === intensity)?.label || intensity;
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateVN(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function weekdayShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function hourToTimeStr(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

export default function PilatesPage() {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;

  const { data: monthSessions, mutate } = useSWR<PilatesSession[]>(
    `/api/pilates?month=${month}&year=${year}`,
    fetcher
  );
  const { data: allSessions, mutate: mutateAll } = useSWR<PilatesSession[]>("/api/pilates", fetcher);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PilatesSession | null>(null);
  const [form, setForm] = useState({
    date: todayISO(),
    time: "",
    type: "Lớp nhóm",
    duration: 60,
    intensity: "medium",
    focus: "",
    notes: "",
  });

  const refresh = () => {
    mutate();
    mutateAll();
  };

  const resetForm = () => {
    setForm({
      date: todayISO(),
      time: "",
      type: "Lớp nhóm",
      duration: 60,
      intensity: "medium",
      focus: "",
      notes: "",
    });
    setEditing(null);
  };

  const submit = async () => {
    if (!form.date) return;
    if (editing) {
      await fetch(`/api/pilates/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/pilates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    resetForm();
    refresh();
  };

  const remove = async (id: string) => {
    await fetch(`/api/pilates/${id}`, { method: "DELETE" });
    refresh();
  };

  const startEdit = (s: PilatesSession) => {
    setEditing(s);
    setForm({
      date: s.date,
      time: s.time || "",
      type: s.type,
      duration: s.duration,
      intensity: s.intensity,
      focus: s.focus || "",
      notes: s.notes || "",
    });
    setShowForm(true);
  };

  /* Click khung gio: toggle (chua chon -> chon, da chon -> bo chon) */
  const toggleSlot = async (date: string, hour: number) => {
    const timeStr = hourToTimeStr(hour);
    const existing = (monthSessions || []).find((s) => s.date === date && s.time === timeStr);
    if (existing) {
      await remove(existing.id);
      return;
    }
    await fetch("/api/pilates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        time: timeStr,
        type: "Lớp nhóm",
        duration: 60,
        intensity: "medium",
      }),
    });
    refresh();
  };

  /* Calendar grid */
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const m = String(month).padStart(2, "0");
      const day = String(d).padStart(2, "0");
      cells.push(`${year}-${m}-${day}`);
    }
    return cells;
  }, [year, month]);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, PilatesSession[]> = {};
    (monthSessions || []).forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [monthSessions]);

  /* Stats */
  const stats = useMemo(() => {
    const totalMonth = (monthSessions || []).length;
    const totalAll = (allSessions || []).length;
    return { totalMonth, totalAll };
  }, [monthSessions, allSessions]);

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-rose-dark tracking-tight">Pilates</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-rose-deep text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Buổi tập tự do
        </button>
      </div>

      {/* Calendar — match Calendar page sizing */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewDate(new Date(year, month - 2, 1))}
            className="p-2 rounded-lg hover:bg-rose-light text-rose-muted transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold text-rose-dark min-w-[180px] text-center">{monthLabel}</span>
          <button
            onClick={() => setViewDate(new Date(year, month, 1))}
            className="p-2 rounded-lg hover:bg-rose-light text-rose-muted transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-rose-muted">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-rose bg-white" />
            <span>Khung lớp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-rose-deep" />
            <span>Đã tập</span>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden mb-6">
        <div className="grid grid-cols-7">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="px-2 py-3 text-center text-xs font-semibold text-rose-muted bg-rose-light border-b border-rose-border"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            if (!day)
              return (
                <div
                  key={`e-${i}`}
                  className="min-h-[110px] border-b border-r border-rose-border/50"
                />
              );
            const sessions = sessionsByDate[day] || [];
            const weekday = new Date(day + "T00:00:00").getDay();
            const slots = CLASS_SCHEDULE[weekday] || [];
            const attendedHours = new Set(
              sessions
                .filter((s) => s.time)
                .map((s) => parseInt((s.time as string).split(":")[0]))
            );
            const hasAny = sessions.length > 0;
            const isToday = day === todayISO();

            return (
              <div
                key={day}
                className={`min-h-[110px] border-b border-r border-rose-border/50 p-2 transition ${
                  hasAny ? "bg-rose-deep/5" : ""
                }`}
              >
                <div
                  className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday ? "bg-rose-deep text-white" : "text-rose-dark"
                  }`}
                >
                  {parseInt(day.split("-")[2])}
                </div>
                <div className="flex flex-col gap-1">
                  {slots.map((h) => {
                    const attended = attendedHours.has(h);
                    return (
                      <button
                        key={h}
                        onClick={() => toggleSlot(day, h)}
                        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs leading-tight transition group/slot ${
                          attended
                            ? "bg-rose-deep text-white font-medium"
                            : "text-rose-muted hover:bg-rose-light hover:text-rose-deep"
                        }`}
                        title={`${h}h ${attended ? "· đã tập (click để bỏ)" : "· click để đánh dấu"}`}
                      >
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 transition ${
                            attended
                              ? "bg-white"
                              : "bg-transparent border-2 border-rose group-hover/slot:bg-rose/40"
                          }`}
                        />
                        <span>{h}h</span>
                      </button>
                    );
                  })}
                  {/* Buoi tap tu do */}
                  {sessions
                    .filter((s) => !s.time || !slots.includes(parseInt((s.time || "").split(":")[0])))
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => startEdit(s)}
                        className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs leading-tight transition font-medium text-white"
                        style={{ backgroundColor: intensityColor(s.intensity) }}
                        title={`${s.type}${s.time ? ` · ${s.time}` : ""}`}
                      >
                        <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 bg-white" />
                        <span>{s.time ? s.time.slice(0, 5) : s.type}</span>
                      </button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tổng quan tháng + Stats — 2 cột */}
      <section>
        <h2 className="text-sm font-medium text-rose-deep mb-3">Tháng {month}/{year}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lich nho */}
          <div className="card p-3">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                <div key={idx} className="text-[10px] text-center text-rose-muted py-1 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={i} />;
                const sessions = sessionsByDate[day] || [];
                const hasAny = sessions.length > 0;
                const isToday = day === todayISO();
                const slotTimes = sessions
                  .filter((s) => s.time)
                  .map((s) => parseInt((s.time as string).split(":")[0]))
                  .sort((a, b) => a - b)
                  .map((h) => `${h}h`)
                  .join(", ");
                return (
                  <div
                    key={i}
                    className={`rounded p-1 text-center min-h-[50px] flex flex-col items-center justify-start border transition ${
                      isToday ? "border-rose-deep border-2" : "border-rose-border/30"
                    } ${hasAny ? "bg-rose-deep text-white" : "bg-white"}`}
                  >
                    <div
                      className={`text-[11px] font-medium ${
                        hasAny ? "text-white" : isToday ? "text-rose-deep" : "text-rose-dark"
                      }`}
                    >
                      {parseInt(day.split("-")[2])}
                    </div>
                    {hasAny && (
                      <div className="text-[9px] mt-0.5 leading-tight text-white/90 break-words">
                        {slotTimes || sessions.length + " buổi"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-rows-2 gap-4">
            <div className="card p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-xs text-rose-muted mb-2">
                <Activity className="w-3.5 h-3.5" /> Buổi tập tháng này
              </div>
              <div className="text-4xl font-semibold text-rose-deep">{stats.totalMonth}</div>
              <div className="text-xs text-rose-muted mt-1">buổi tập trong tháng {month}/{year}</div>
            </div>
            <div className="card p-6 flex flex-col justify-center">
              <div className="text-xs text-rose-muted mb-2">Tổng tất cả</div>
              <div className="text-4xl font-semibold text-rose-dark">{stats.totalAll}</div>
              <div className="text-xs text-rose-muted mt-1">buổi tập đã hoàn thành</div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-40"
          onClick={() => {
            setShowForm(false);
            resetForm();
          }}
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-rose-dark">{editing ? "Sửa buổi tập" : "Buổi tập tự do"}</h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-rose-muted hover:text-rose-deep"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-rose-muted mb-1 block">Ngày</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                  />
                </div>
                <div>
                  <label className="text-xs text-rose-muted mb-1 block">Giờ</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-rose-muted mb-1 block">Loại</label>
                  <input
                    type="text"
                    placeholder="Lớp nhóm, Private, Tự tập..."
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                  />
                </div>
                <div>
                  <label className="text-xs text-rose-muted mb-1 block">Thời lượng (phút)</label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                    className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-rose-muted mb-1 block">Cường độ</label>
                <div className="flex items-center gap-2">
                  {INTENSITY_OPTIONS.map((i) => (
                    <button
                      key={i.key}
                      onClick={() => setForm({ ...form, intensity: i.key })}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm border transition ${
                        form.intensity === i.key ? "border-2 font-medium" : "border-rose-border text-rose-muted"
                      }`}
                      style={form.intensity === i.key ? { borderColor: i.color, color: i.color } : {}}
                    >
                      {i.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-rose-muted mb-1 block">Focus (vùng tập / bài chính)</label>
                <input
                  type="text"
                  placeholder="Core, hip, back..."
                  value={form.focus}
                  onChange={(e) => setForm({ ...form, focus: e.target.value })}
                  className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                />
              </div>
              <div>
                <label className="text-xs text-rose-muted mb-1 block">Ghi chú</label>
                <textarea
                  placeholder="Cảm nhận, tiến bộ, HLV note..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose h-20 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={submit}
                  className="flex-1 bg-rose-deep text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
                >
                  {editing ? "Lưu thay đổi" : "Tạo buổi tập"}
                </button>
                {editing && (
                  <button
                    onClick={() => {
                      if (confirm("Xoá buổi tập này?")) {
                        remove(editing.id);
                        setShowForm(false);
                        resetForm();
                      }
                    }}
                    className="px-4 bg-red-50 text-red-500 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
