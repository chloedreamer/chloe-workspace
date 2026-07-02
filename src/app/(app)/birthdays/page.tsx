"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { COLOR_OPTIONS } from "@/lib/constants";
import { Plus, Trash2, X, Pencil } from "lucide-react";

interface Birthday {
  id: string;
  name: string;
  date: string;
  notes: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

function formatDateVN(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function getNextBirthday(birthDate: string): { nextDate: Date; daysUntil: number; age: number } {
  const [year, month, day] = birthDate.split("-").map(Number);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisYear = today.getFullYear();
  let next = new Date(thisYear, month - 1, day);
  if (next < today) next = new Date(thisYear + 1, month - 1, day);
  const daysUntil = Math.round((next.getTime() - today.getTime()) / 86400000);
  const age = next.getFullYear() - year;
  return { nextDate: next, daysUntil, age };
}

export default function BirthdaysPage() {
  const { data: birthdays, mutate } = useSWR<Birthday[]>("/api/birthdays", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Birthday | null>(null);
  const [form, setForm] = useState({
    name: "",
    date: "",
    notes: "",
    color: "#c8a0a0",
  });

  const resetForm = () => {
    setForm({ name: "", date: "", notes: "", color: "#c8a0a0" });
    setEditing(null);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (b: Birthday) => {
    setEditing(b);
    setForm({
      name: b.name,
      date: b.date,
      notes: b.notes || "",
      color: b.color,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.date) return;
    if (editing) {
      await fetch(`/api/birthdays/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/birthdays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    resetForm();
    mutate();
  };

  const remove = async (id: string) => {
    await fetch(`/api/birthdays/${id}`, { method: "DELETE" });
    mutate();
  };

  const enriched = useMemo(() => {
    return (birthdays || [])
      .map((b) => ({ ...b, ...getNextBirthday(b.date) }))
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [birthdays]);

  const todayBirthdays = enriched.filter((b) => b.daysUntil === 0);
  const upcomingThisMonth = enriched.filter((b) => b.daysUntil > 0 && b.daysUntil <= 31);
  const later = enriched.filter((b) => b.daysUntil > 31);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-rose-dark tracking-tight">Sinh nhật</h1>
          <p className="text-sm text-rose-muted mt-1">
            Nhắc nhở sinh nhật hàng năm ({enriched.length})
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-rose-deep text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Thêm sinh nhật
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-40 p-4"
          onClick={() => { setShowForm(false); resetForm(); }}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-rose-dark">
                {editing ? "Sửa sinh nhật" : "Thêm sinh nhật"}
              </h2>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="text-rose-muted hover:text-rose-deep"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-rose-muted mb-1 block">Tên</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mẹ, chị Linh..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-rose-muted mb-1 block">Ngày sinh</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                />
                <p className="text-xs text-rose-muted mt-1">Tự động lặp lại hàng năm</p>
              </div>
              <div>
                <label className="text-xs text-rose-muted mb-1 block">Ghi chú (không bắt buộc)</label>
                <textarea
                  placeholder="Sở thích, quà đã tặng..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-rose-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose h-16 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-rose-muted mb-1 block">Màu</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        form.color === c ? "border-rose-dark scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={save}
                className="w-full bg-rose-deep text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
              >
                {editing ? "Lưu thay đổi" : "Thêm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {enriched.length === 0 ? (
        <div className="card p-8 text-center text-sm text-rose-muted">
          Chưa có sinh nhật nào.{" "}
          <button onClick={openNew} className="text-rose-deep hover:underline">
            Thêm ngay
          </button>
        </div>
      ) : (
        <>
          {/* Hôm nay */}
          {todayBirthdays.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-medium text-rose-deep mb-3">🎂 Hôm nay ({todayBirthdays.length})</h2>
              <div className="card divide-y divide-rose-border">
                {todayBirthdays.map((b) => (
                  <BirthdayRow key={b.id} b={b} onEdit={openEdit} onRemove={remove} isToday />
                ))}
              </div>
            </section>
          )}

          {/* Sắp tới trong tháng */}
          {upcomingThisMonth.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-medium text-rose-deep mb-3">
                Sắp tới ({upcomingThisMonth.length})
              </h2>
              <div className="card divide-y divide-rose-border">
                {upcomingThisMonth.map((b) => (
                  <BirthdayRow key={b.id} b={b} onEdit={openEdit} onRemove={remove} />
                ))}
              </div>
            </section>
          )}

          {/* Còn lại */}
          {later.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-rose-muted mb-3">
                Các tháng sau ({later.length})
              </h2>
              <div className="card divide-y divide-rose-border">
                {later.map((b) => (
                  <BirthdayRow key={b.id} b={b} onEdit={openEdit} onRemove={remove} dimmed />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function BirthdayRow({
  b,
  onEdit,
  onRemove,
  isToday,
  dimmed,
}: {
  b: Birthday & { daysUntil: number; age: number; nextDate: Date };
  onEdit: (b: Birthday) => void;
  onRemove: (id: string) => void;
  isToday?: boolean;
  dimmed?: boolean;
}) {
  const nextDateStr = new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(new Date().getFullYear(), Number(b.date.split("-")[1]) - 1, Number(b.date.split("-")[2])));

  return (
    <div
      className={`flex items-start gap-3 py-3 px-4 hover:bg-rose-light/40 transition group ${
        dimmed ? "opacity-70" : ""
      }`}
    >
      <div className="w-1 h-10 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: b.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-rose-dark">{b.name}</p>
          {isToday && <span className="text-xs text-rose-deep font-semibold">HÔM NAY</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-rose-muted">🎂 {formatDateVN(b.date)}</span>
          <span className="text-xs text-rose-deep">
            · Tròn {b.age} tuổi
          </span>
          {!isToday && (
            <span className="text-xs text-rose-muted">
              · Còn {b.daysUntil} ngày ({nextDateStr})
            </span>
          )}
        </div>
        {b.notes && <p className="text-xs text-rose-muted mt-1">{b.notes}</p>}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => onEdit(b)}
          className="p-1.5 text-rose-muted hover:text-rose-deep rounded"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onRemove(b.id)}
          className="p-1.5 text-rose-muted hover:text-red-400 rounded"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
