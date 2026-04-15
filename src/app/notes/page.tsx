"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Pin,
  PinOff,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";

interface Note {
  id: string;
  date: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { key: "actuarial", label: "Actuarial", color: "bg-blue-100 text-blue-700" },
  { key: "wq", label: "WQ Brain", color: "bg-purple-100 text-purple-700" },
  { key: "sp2", label: "SP2 Study", color: "bg-green-100 text-green-700" },
  { key: "timeless", label: "TIMELESS", color: "bg-orange-100 text-orange-700" },
  { key: "general", label: "General", color: "bg-gray-100 text-gray-700" },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllDates, setShowAllDates] = useState(false);

  const fetchNotes = useCallback(async () => {
    const url = showAllDates
      ? "/api/notes"
      : `/api/notes?date=${selectedDate}`;
    const res = await fetch(url);
    const data = await res.json();
    setNotes(data);
  }, [selectedDate, showAllDates]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = async () => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedDate,
        title: "Untitled",
        content: "",
        category: "general",
      }),
    });
    const newNote = await res.json();
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNote(newNote);
  };

  const updateNote = async (id: string, data: Partial<Note>) => {
    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchNotes();
  };

  const deleteNote = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (selectedNote?.id === id) setSelectedNote(null);
    fetchNotes();
  };

  const togglePin = async (note: Note) => {
    await updateNote(note.id, { pinned: !note.pinned });
  };

  const navigateDate = (direction: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + direction);
    setSelectedDate(d.toISOString().split("T")[0]);
    setSelectedNote(null);
  };

  const filteredNotes = searchQuery
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes;

  return (
    <div className="max-w-7xl mx-auto flex gap-6 h-[calc(100vh-4rem)]">
      {/* Notes List Panel */}
      <div className="w-80 flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Notes</h1>
          <button
            onClick={createNote}
            className="flex items-center gap-1 bg-pink-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-pink-600 transition"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigateDate(-1)}
            className="p-1 rounded hover:bg-pink-100 text-gray-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAllDates(!showAllDates)}
            className={`flex-1 text-center text-sm py-1.5 rounded-lg border transition ${
              showAllDates
                ? "bg-pink-100 border-pink-300 text-pink-700"
                : "border-pink-200 text-gray-700 hover:bg-pink-50"
            }`}
          >
            {showAllDates ? "All dates" : formatDate(selectedDate).split(",")[0] + ", " + selectedDate.split("-").slice(1).join("/")}
          </button>
          <button
            onClick={() => navigateDate(1)}
            className="p-1 rounded hover:bg-pink-100 text-gray-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-pink-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No notes for this date.
              <br />
              <button
                onClick={createNote}
                className="text-pink-500 hover:underline mt-2 inline-block"
              >
                Create one
              </button>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const cat = CATEGORIES.find((c) => c.key === note.category) || CATEGORIES[4];
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    selectedNote?.id === note.id
                      ? "border-pink-400 bg-pink-50"
                      : "border-pink-100 bg-white hover:border-pink-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {note.pinned && <Pin className="w-3 h-3 text-pink-500" />}
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {note.title || "Untitled"}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {note.content || "Empty note"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cat.color}`}>
                      {cat.label}
                    </span>
                    {showAllDates && (
                      <span className="text-xs text-gray-400">{note.date}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Note Editor Panel */}
      <div className="flex-1 bg-white rounded-xl border border-pink-100 shadow-sm flex flex-col">
        {selectedNote ? (
          <>
            <div className="flex items-center justify-between p-4 border-b border-pink-100">
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => {
                    setSelectedNote({ ...selectedNote, title: e.target.value });
                  }}
                  onBlur={() => updateNote(selectedNote.id, { title: selectedNote.title })}
                  placeholder="Note title..."
                  className="text-lg font-semibold text-gray-800 bg-transparent outline-none flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedNote.category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setSelectedNote({ ...selectedNote, category: newCat });
                    updateNote(selectedNote.id, { category: newCat });
                  }}
                  className="text-xs border border-pink-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-pink-300"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => togglePin(selectedNote)}
                  className={`p-1.5 rounded-lg transition ${
                    selectedNote.pinned
                      ? "text-pink-500 bg-pink-50"
                      : "text-gray-400 hover:text-pink-500 hover:bg-pink-50"
                  }`}
                >
                  {selectedNote.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteNote(selectedNote.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <textarea
                value={selectedNote.content}
                onChange={(e) => {
                  setSelectedNote({ ...selectedNote, content: e.target.value });
                }}
                onBlur={() => updateNote(selectedNote.id, { content: selectedNote.content })}
                placeholder="Start writing..."
                className="note-editor w-full h-full border-0 resize-none text-sm text-gray-700 leading-relaxed focus:outline-none"
              />
            </div>
            <div className="px-4 py-2 border-t border-pink-100 text-xs text-gray-400">
              Last updated: {new Date(selectedNote.updatedAt).toLocaleString()}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">Select a note or create a new one</p>
              <button
                onClick={createNote}
                className="text-pink-500 hover:text-pink-600 text-sm"
              >
                + New Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
