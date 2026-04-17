"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { COLOR_OPTIONS } from "@/lib/constants";
import {
  Plus, Trash2, X, Pencil, CalendarHeart, Gift, Users, Clock,
  ChevronLeft, ChevronRight, Cake, PartyPopper, Calendar,
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  time: string | null;
  type: string;
  color: string;
  recurring: string | null;
  reminder: boolean;
}

const EVENT_TYPES = [
  { key: "birthday", label: "Birthday", icon: Cake },
  { key: "meeting", label: "Meeting", icon: Users },
  { key: "appointment", label: "Appointment", icon: Clock },
  { key: "event", label: "Event", icon: PartyPopper },
  { key: "holiday", label: "Holiday", icon: CalendarHeart },
];

const RECURRING_OPTIONS = [
  { key: "", label: "No repeat" },
  { key: "yearly", label: "Every year" },
  { key: "monthly", label: "Every month" },
  { key: "weekly", label: "Every week" },
];

function getTypeIcon(type: string) {
  const t = EVENT_TYPES.find((e) => e.key === type);
  return t ? t.icon : Calendar;
}

export default function EventsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  const { data: events, mutate } = useSWR<Event[]>(`/api/events?month=${month}&year=${year}`, fetcher);
  const { data: allEvents, mutate: mutateAll } = useSWR<Event[]>("/api/events", fetcher);

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", date: "", time: "", type: "event",
    color: "#9b6b6b", recurring: "", reminder: false,
  });

  const resetForm = () => {
    setForm({ title: "", description: "", date: selectedDate || "", time: "", type: "event", color: "#9b6b6b", recurring: "", reminder: false });
    setEditingEvent(null);
  };

  const createEvent = async () => {
    if (!form.title.trim() || !form.date) return;
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    resetForm();
    mutate(); mutateAll();
  };

  const updateEvent = async () => {
    if (!editingEvent) return;
    await fetch(`/api/events/${editingEvent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setEditingEvent(null);
    mutate(); mutateAll();
  };

  const deleteEvent = async (id: string) => {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    mutate(); mutateAll();
  };

  const startEdit = (e: Event) => {
    setEditingEvent(e);
    setForm({
      title: e.title,
      description: e.description || "",
      date: e.date.split("T")[0],
      time: e.time || "",
      type: e.type,
      color: e.color,
      recurring: e.recurring || "",
      reminder: e.reminder,
    });
    setShowForm(true);
  };

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getDateStr = (day: number) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getEventsForDate = (dateStr: string) =>
    (events || []).filter((e) => e.date.startsWith(dateStr));

  const upcomingEvents = (allEvents || [])
    .filter((e) => e.date >= today)
    .slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-rose-dark">Events</h1>
          <p className="text-sm text-rose-muted mt-1">Birthdays, meetings, appointments</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-rose-deep text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> New Event
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40" onClick={() => { setShowForm(false); setEditingEvent(null); }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-rose-dark">{editingEvent ? "Edit Event" : "New Event"}</h2>
              <button onClick={() => { setShowForm(false); setEditingEvent(null); }} className="text-rose-muted hover:text-rose-deep"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Event title..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose" autoFocus />
              <textarea placeholder="Description (optional)..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose h-16 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-rose-muted mb-1 block">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
                </div>
                <div>
                  <label className="text-xs text-rose-muted mb-1 block">Time</label>
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-rose-muted mb-1 block">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose">
                    {EVENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-rose-muted mb-1 block">Repeat</label>
                  <select value={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.value })} className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose">
                    {RECURRING_OPTIONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-rose-muted mb-1 block">Color</label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-6 h-6 rounded-full border-2 transition ${form.color === c ? "border-rose-dark scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <button onClick={editingEvent ? updateEvent : createEvent} className="w-full bg-rose-deep text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
                {editingEvent ? "Save Changes" : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl border border-rose-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-rose-light border-b border-rose-border">
              <button onClick={() => setCurrentMonth(new Date(year, month - 2, 1))} className="p-1 rounded hover:bg-white text-rose-muted"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-semibold text-rose-dark">
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <button onClick={() => setCurrentMonth(new Date(year, month, 1))} className="p-1 rounded hover:bg-white text-rose-muted"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="px-1 py-2 text-center text-xs font-semibold text-rose-muted border-b border-rose-border">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                if (day === null) return <div key={`e-${idx}`} className="h-20 border-b border-r border-rose-border/30" />;
                const dateStr = getDateStr(day);
                const isToday = dateStr === today;
                const isSelected = dateStr === selectedDate;
                const dayEvents = getEventsForDate(dateStr);
                return (
                  <div
                    key={day}
                    onClick={() => { setSelectedDate(dateStr); setForm((f) => ({ ...f, date: dateStr })); }}
                    className={`h-20 border-b border-r border-rose-border/30 p-1 cursor-pointer transition hover:bg-rose-light ${isSelected ? "bg-rose-light ring-1 ring-rose ring-inset" : ""}`}
                  >
                    <div className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full mb-0.5 ${isToday ? "bg-rose-deep text-white" : "text-rose-dark"}`}>{day}</div>
                    {dayEvents.slice(0, 2).map((e) => {
                      const Icon = getTypeIcon(e.type);
                      return (
                        <div key={e.id} className="flex items-center gap-1 text-xs px-1 py-0.5 rounded truncate mb-0.5" style={{ backgroundColor: `${e.color}18`, color: e.color }}>
                          <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{e.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && <div className="text-xs text-rose-muted px-1">+{dayEvents.length - 2}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: Upcoming + Selected Date */}
        <div className="space-y-6">
          {/* Selected Date Events */}
          {selectedDate && (
            <div className="bg-white rounded-xl border border-rose-border shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-rose-dark">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </h3>
                <button onClick={() => { resetForm(); setForm((f) => ({ ...f, date: selectedDate })); setShowForm(true); }} className="text-xs text-rose-deep hover:underline">+ Add</button>
              </div>
              {getEventsForDate(selectedDate).length === 0 ? (
                <p className="text-xs text-rose-muted">No events</p>
              ) : (
                <div className="space-y-2">
                  {getEventsForDate(selectedDate).map((e) => {
                    const Icon = getTypeIcon(e.type);
                    return (
                      <div key={e.id} className="p-2 rounded-lg border border-rose-border group">
                        <div className="flex items-start gap-2">
                          <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: e.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-rose-dark">{e.title}</p>
                            {e.time && <p className="text-xs text-rose-muted">{e.time}</p>}
                            {e.description && <p className="text-xs text-rose-muted mt-0.5">{e.description}</p>}
                            {e.recurring && <p className="text-xs text-rose-deep">{RECURRING_OPTIONS.find((r) => r.key === e.recurring)?.label}</p>}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => startEdit(e)} className="p-1 text-rose-muted hover:text-rose-deep"><Pencil className="w-3 h-3" /></button>
                            <button onClick={() => deleteEvent(e.id)} className="p-1 text-rose-muted hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl border border-rose-border shadow-sm p-4">
            <h3 className="text-sm font-semibold text-rose-dark mb-3 flex items-center gap-2">
              <CalendarHeart className="w-4 h-4 text-rose" /> Upcoming
            </h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-rose-muted">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((e) => {
                  const Icon = getTypeIcon(e.type);
                  const d = new Date(e.date);
                  return (
                    <div key={e.id} className="flex items-center gap-2 py-1.5">
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: e.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-rose-dark truncate">{e.title}</p>
                      </div>
                      <span className="text-xs text-rose-muted flex-shrink-0">
                        {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
