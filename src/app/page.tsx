import { prisma } from "@/lib/prisma";
import {
  CheckCircle2,
  Clock,
  ListTodo,
  StickyNote,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { key: "actuarial", label: "Actuarial", color: "bg-blue-100 text-blue-700" },
  { key: "wq", label: "WQ Brain", color: "bg-purple-100 text-purple-700" },
  { key: "sp2", label: "SP2 Study", color: "bg-green-100 text-green-700" },
  { key: "timeless", label: "TIMELESS", color: "bg-orange-100 text-orange-700" },
  { key: "general", label: "General", color: "bg-gray-100 text-gray-700" },
];

function getCategoryStyle(cat: string) {
  return CATEGORIES.find((c) => c.key === cat) || CATEGORIES[4];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getDaysUntil(target: Date) {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [tasks, todayNotes, recentTasks] = await Promise.all([
    prisma.task.findMany(),
    prisma.note.findMany({
      where: { date: new Date().toISOString().split("T")[0] },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.task.findMany({
      where: { status: { not: "done" } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;

  const sp2Deadline = new Date("2026-04-16");
  const daysLeft = getDaysUntil(sp2Deadline);

  const statCards = [
    {
      label: "Total Tasks",
      value: totalTasks,
      icon: ListTodo,
      color: "text-pink-500",
      bg: "bg-pink-50",
    },
    {
      label: "Completed",
      value: doneTasks,
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "To Do",
      value: todoTasks,
      icon: Target,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  const categoryBreakdown = CATEGORIES.filter((c) => c.key !== "general").map(
    (cat) => {
      const catTasks = tasks.filter((t) => t.category === cat.key);
      const done = catTasks.filter((t) => t.status === "done").length;
      return {
        ...cat,
        total: catTasks.length,
        done,
        pct: catTasks.length > 0 ? Math.round((done / catTasks.length) * 100) : 0,
      };
    }
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          {getGreeting()}, Chloe!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {daysLeft > 0 && (
        <div className="mb-6 bg-gradient-to-r from-pink-500 to-pink-400 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">SP2 Exam Countdown</p>
              <p className="text-3xl font-bold mt-1">{daysLeft} days left</p>
            </div>
            <TrendingUp className="w-10 h-10 opacity-70" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-5 border border-pink-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <div className={`${stat.bg} p-2 rounded-lg`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-pink-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Tasks</h2>
            <Link href="/tasks" className="text-sm text-pink-500 hover:text-pink-600">
              View all
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <p className="text-gray-400 text-sm">No tasks yet. Create one!</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => {
                const cat = getCategoryStyle(task.category);
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-pink-50 transition"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        task.status === "in_progress"
                          ? "bg-blue-400"
                          : task.status === "done"
                          ? "bg-green-400"
                          : "bg-gray-300"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {task.title}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${cat.color}`}
                    >
                      {cat.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-pink-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Category Progress
          </h2>
          <div className="space-y-4">
            {categoryBreakdown.map((cat) => (
              <div key={cat.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${cat.color}`}>
                    {cat.label}
                  </span>
                  <span className="text-gray-500">
                    {cat.done}/{cat.total} done
                  </span>
                </div>
                <div className="w-full bg-pink-100 rounded-full h-2">
                  <div
                    className="bg-pink-400 h-2 rounded-full transition-all"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-pink-100 shadow-sm col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              <StickyNote className="w-5 h-5 inline mr-2 text-pink-400" />
              Today&apos;s Notes
            </h2>
            <Link href="/notes" className="text-sm text-pink-500 hover:text-pink-600">
              All notes
            </Link>
          </div>
          {todayNotes.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No notes for today.{" "}
              <Link href="/notes" className="text-pink-500 hover:underline">
                Write something!
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {todayNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-lg bg-pink-50 border border-pink-100"
                >
                  <p className="text-sm font-medium text-gray-700">
                    {note.title || "Untitled"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {note.content || "Empty note"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
