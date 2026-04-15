"use client";

import { useEffect, useState, useCallback } from "react";
import { PROJECTS } from "@/lib/constants";
import { Plus, Trash2, Pin, PinOff, ChevronLeft, ChevronRight, Search } from "lucide-react";

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

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllDates, setShowAllDates] = useState(false);

  const fetchNotes = useCallback(async () => {
    const url = showAllDates ? "/api/notes" : `/api/notes?date=${selectedDate}`;
    const res = await fetch(url);
    setNotes(await res.json());
  }, [selectedDate, showAllDates]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const createNote = async () => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, title: "Untitled", content: "", category: "general" }),
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
    ? notes.filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : notes;

  return (
    <div className="max-w-7xl mx-auto flex gap-6 h-[calc(100vh-4rem)]">
      {/* Notes List */}
      <div className="w-80 flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-rose-dark">Notes</h1>
          <button onClick={createNote} className="flex items-center gap-1 bg-rose-deep text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 transition">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => navigateDate(-1)} className="p-1 rounded hover:bg-rose-light text-rose-muted">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAllDates(!showAllDates)}
            className={`flex-1 text-center text-sm py-1.5 rounded-lg border transition ${showAllDates ? "bg-rose-light border-rose text-rose-deep" : "border-rose-border text-rose-dark hover:bg-rose-light"}`}
          >
            {showAllDates ? "All dates" : formatDate(selectedDate)}
          </button>
          <button onClick={() => navigateDate(1)} className="p-1 rounded hover:bg-rose-light text-rose-muted">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rose-muted" />
          <input type="text" placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full border border-rose-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-rose-muted text-sm">
              No notes for this date.
              <br />
              <button onClick={createNote} className="text-rose-deep hover:underline mt-2 inline-block">Create one</button>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const proj = PROJECTS.find((p) => p.key === note.category) || PROJECTS[4];
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${selectedNote?.id === note.id ? "border-rose bg-rose-light" : "border-rose-border bg-white hover:border-rose"}`}
                >
                  <div className="flex items-center gap-2">
                    {note.pinned && <Pin className="w-3 h-3 text-rose-deep" />}
                    <p className="text-sm font-medium text-rose-dark truncate">{note.title || "Untitled"}</p>
                  </div>
                  <p className="text-xs text-rose-muted mt-1 line-clamp-2">{note.content || "Empty note"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${proj.color}`}>{proj.label}</span>
                    {showAllDates && <span className="text-xs text-rose-muted">{note.date}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 bg-white rounded-xl border border-rose-border shadow-sm flex flex-col">
        {selectedNote ? (
          <>
            <div className="flex items-center justify-between p-4 border-b border-rose-border">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                onBlur={() => updateNote(selectedNote.id, { title: selectedNote.title })}
                placeholder="Note title..."
                className="text-lg font-semibold text-rose-dark bg-transparent outline-none flex-1"
              />
              <div className="flex items-center gap-2">
                <select
                  value={selectedNote.category}
                  onChange={(e) => { const c = e.target.value; setSelectedNote({ ...selectedNote, category: c }); updateNote(selectedNote.id, { category: c }); }}
                  className="text-xs border border-rose-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-rose"
                >
                  {PROJECTS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
                <button onClick={() => togglePin(selectedNote)} className={`p-1.5 rounded-lg transition ${selectedNote.pinned ? "text-rose-deep bg-rose-light" : "text-rose-muted hover:text-rose-deep hover:bg-rose-light"}`}>
                  {selectedNote.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </button>
                <button onClick={() => deleteNote(selectedNote.id)} className="p-1.5 rounded-lg text-rose-muted hover:text-red-500 hover:bg-red-50 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <textarea
                value={selectedNote.content}
                onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                onBlur={() => updateNote(selectedNote.id, { content: selectedNote.content })}
                placeholder="Start writing..."
                className="note-editor w-full h-full border-0 resize-none text-sm text-rose-dark leading-relaxed focus:outline-none"
              />
            </div>
            <div className="px-4 py-2 border-t border-rose-border text-xs text-rose-muted">
              Last updated: {new Date(selectedNote.updatedAt).toLocaleString()}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-rose-muted">
            <div className="text-center">
              <p className="text-lg mb-2">Select a note or create a new one</p>
              <button onClick={createNote} className="text-rose-deep hover:underline text-sm">+ New Note</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
