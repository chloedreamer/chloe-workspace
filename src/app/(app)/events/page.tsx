"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { COLOR_OPTIONS } from "@/lib/constants";
import { useProjects } from "@/components/ProjectsProvider";
import Link from "next/link";
import {
  Plus, Trash2, X, Pencil, ArrowRight,
  Cake, Users, Clock, PartyPopper, CalendarHeart, Calendar,
} from "lucide-react";

interface Note {
  id: string;
  date: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  updatedAt: string;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

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
  { key: "daily", label: "Every day" },
  { key: "weekly", label: "Every week" },
  { key: "monthly", label: "Every month" },
  { key: "yearly", label: "Every year" },
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
  const [tab, setTab] = useState<"events" | "notes">("events");
  const { data: events, mutate } = useSWR<Event[]>("/api/events", fetcher);
  const { data: notes } = useSWR<Note[]>("/api/notes", fetcher);
  const { projects } = useProjects();

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
    return (
      <div className="flex items-start gap-3 py-3 px-4 hover:bg-rose-light/40 transition group">
        <div className="w-1 h-10 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: event.color }} />
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-rose-dark tracking-tight">Schedule</h1>
        {tab === "events" ? (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-rose-deep text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> New Event
          </button>
        ) : (
          <Link
            href="/notes"
            className="flex items-center gap-2 bg-rose-deep text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            Open Notes editor <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8 border-b border-rose-border">
        <button
          onClick={() => setTab("events")}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
            tab === "events" ? "border-rose-deep text-rose-deep" : "border-transparent text-rose-muted hover:text-rose-deep"
          }`}
        >
          Events ({(events || []).length})
        </button>
        <button
          onClick={() => setTab("notes")}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
            tab === "notes" ? "border-rose-deep text-rose-deep" : "border-transparent text-rose-muted hover:text-rose-deep"
          }`}
        >
          Notes ({(notes || []).length})
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

      {tab === "events" && (
        <>
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
        </>
      )}

      {tab === "notes" && (
        <section>
          {(notes || []).length === 0 ? (
            <div className="card p-6 text-center text-sm text-rose-muted">
              No notes yet.{" "}
              <Link href="/notes" className="text-rose-deep hover:underline">Write your first note</Link>
            </div>
          ) : (
            <div className="card divide-y divide-rose-border">
              {(notes || []).slice(0, 30).map((n) => {
                const proj = projects.find((p) => p.key === n.category);
                const plain = stripHtml(n.content);
                return (
                  <Link
                    key={n.id}
                    href="/notes"
                    className="flex items-start gap-3 py-3 px-4 hover:bg-rose-light/40 transition group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {n.pinned && <span className="text-xs text-rose-deep">📌</span>}
                        <p className="text-sm font-medium text-rose-dark">{n.title || "Untitled"}</p>
                        {proj && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${proj.color}18`, color: proj.color }}>
                            {proj.name}
                          </span>
                        )}
                      </div>
                      {plain && <p className="text-xs text-rose-muted line-clamp-1">{plain}</p>}
                    </div>
                    <span className="text-xs text-rose-muted flex-shrink-0">{n.date}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
