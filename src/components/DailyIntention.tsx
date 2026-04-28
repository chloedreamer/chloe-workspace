"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { CheckCircle2, Circle, X, Plus } from "lucide-react";

interface IntentionItem {
  text: string;
  done: boolean;
}

interface IntentionData {
  date: string;
  items: string;
  reflection: string | null;
}

export default function DailyIntention() {
  const today = new Date().toISOString().split("T")[0];
  const { data, mutate } = useSWR<IntentionData>(`/api/intentions/${today}`, fetcher);
  const [items, setItems] = useState<IntentionItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [reflection, setReflection] = useState("");
  const [showReflection, setShowReflection] = useState(false);

  useEffect(() => {
    if (data) {
      try {
        const parsed = JSON.parse(data.items);
        setItems(Array.isArray(parsed) ? parsed : []);
      } catch {
        setItems([]);
      }
      setReflection(data.reflection || "");
    }
  }, [data]);

  const save = useCallback(async (newItems: IntentionItem[], newReflection?: string) => {
    await fetch(`/api/intentions/${today}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: JSON.stringify(newItems),
        reflection: newReflection !== undefined ? newReflection : reflection,
      }),
    });
    mutate();
  }, [today, mutate, reflection]);

  const addItem = () => {
    if (!newItem.trim() || items.length >= 5) return;
    const next = [...items, { text: newItem.trim(), done: false }];
    setItems(next);
    setNewItem("");
    save(next);
  };

  const toggleItem = (idx: number) => {
    const next = items.map((it, i) => i === idx ? { ...it, done: !it.done } : it);
    setItems(next);
    save(next);
  };

  const removeItem = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    save(next);
  };

  const saveReflection = () => {
    save(items, reflection);
    setShowReflection(false);
  };

  const doneCount = items.filter((i) => i.done).length;
  const hour = new Date().getHours();
  const isEvening = hour >= 18;

  return (
    <div className="card p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-rose-deep">Daily Intention</h2>
          {items.length > 0 && (
            <span className="text-xs text-rose-muted">{doneCount}/{items.length}</span>
          )}
        </div>
        {isEvening && items.length > 0 && (
          <button
            onClick={() => setShowReflection(!showReflection)}
            className="text-xs text-rose-deep hover:underline"
          >
            Reflect
          </button>
        )}
      </div>

      {items.length === 0 && (
        <p className="text-xs text-rose-muted mb-3">What are your top 3 priorities today?</p>
      )}

      <div className="space-y-1.5 mb-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 group">
            <button onClick={() => toggleItem(idx)} className="flex-shrink-0">
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-rose-deep" />
              ) : (
                <Circle className="w-4 h-4 text-rose-border hover:text-rose-deep transition" />
              )}
            </button>
            <span className={`text-sm flex-1 ${item.done ? "line-through text-rose-muted" : "text-rose-dark"}`}>
              {item.text}
            </span>
            <button
              onClick={() => removeItem(idx)}
              className="opacity-0 group-hover:opacity-100 text-rose-muted hover:text-red-400 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {items.length < 5 && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
            placeholder={items.length === 0 ? "Priority #1..." : `Priority #${items.length + 1}...`}
            className="flex-1 text-sm border border-rose-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose"
          />
          <button
            onClick={addItem}
            className="p-1.5 rounded-lg bg-rose-light text-rose-deep hover:bg-rose transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {showReflection && (
        <div className="mt-3 pt-3 border-t border-rose-border">
          <label className="text-xs text-rose-muted mb-1 block">What did you accomplish today?</label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Reflection for today..."
            className="w-full text-sm border border-rose-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose h-20 resize-none"
          />
          <button
            onClick={saveReflection}
            className="mt-2 text-xs bg-rose-deep text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
          >
            Save Reflection
          </button>
        </div>
      )}
    </div>
  );
}
