"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { COLOR_OPTIONS } from "@/lib/constants";
import {
  Plus, Trash2, X, Pencil, CalendarHeart, Users, Clock,
  Cake, PartyPopper, Calendar,
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

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function EventsPage() {
  const { data: events, mutate } = useSWR<Event[]>("/api/events", fetcher);

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", date: "", time: "", type: "event",
    color: "#9b6b6b", recurring: "", reminder: false,
  });

  const resetForm = () => {
    setForm({ title: "", description: "", date: "", time: "", type: "event", color: "#9b6b6b", recurring: "", reminder: false });
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
    mutate();
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
    mutate();
  };

  const deleteEvent = async (id: string) => {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    mutate();
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

  const today = new Date().toISOString().split("T")[0];
  const allEvents = events || [];
  const upcoming = allEvents.filter((e) => e.date.split("T")[0] >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = allEvents.filter((e) => e.date.split("T")[0] < today).sort((a, b) => b.date.localeCompare(a.date));

  function EventRow({ event }: { event: Event }) {
    const Icon = getTypeIcon(event.type);
    return (
      <div className="flex items-start gap-3 py-3 px-4 hover:bg-rose-light/40 transition group">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${event.color}18` }}>
          <Icon className="w-4 h-4" style={{ color: event.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-rose-dark">{event.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-rose-muted">{formatEventDate(event.date)}</span>
            {event.time && <span className="text-xs text-rose-muted">· {event.time}</span>}
            {event.recurring && <span className="text-xs text-rose-deep">· {RECURRING_OPTIONS.find((r) => r.key === event.recurring)?.label}</span>}
          </div>
          {event.description && <p className="text-xs text-rose-muted mt-1">{event.description}</p>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => startEdit(event)} className="p-1.5 text-rose-muted hover:text-rose-deep rounded"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => deleteEvent(event.id)} className="p-1.5 text-rose-muted hover:text-red-400 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-rose-dark tracking-tight">Events</h1>
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

      {/* Upcoming Events */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-rose-deep mb-3">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="card p-6 text-center text-sm text-rose-muted">No upcoming events</div>
        ) : (
          <div className="card divide-y divide-rose-border">
            {upcoming.map((e) => <EventRow key={e.id} event={e} />)}
          </div>
        )}
      </section>

      {/* Past Events */}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-rose-muted mb-3">Past ({past.length})</h2>
          <div className="card divide-y divide-rose-border opacity-60">
            {past.slice(0, 20).map((e) => <EventRow key={e.id} event={e} />)}
          </div>
        </section>
      )}
    </div>
  );
}
