import { prisma } from "@/lib/prisma";
import {
  CheckCircle2,
  Clock,
  ListTodo,
  StickyNote,
  Target,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getDaysUntil(target: Date) {
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [tasks, todayNotes, recentTasks, projects] = await Promise.all([
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
    prisma.project.findMany({
      where: { archived: false },
      orderBy: { order: "asc" },
    }),
  ]);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;

  const sp2Deadline = new Date("2026-04-16");
  const daysLeft = getDaysUntil(sp2Deadline);

  const statCards = [
    { label: "Total Tasks", value: totalTasks, icon: ListTodo, color: "text-rose", bg: "bg-rose-light" },
    { label: "Completed", value: doneTasks, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
    { label: "In Progress", value: inProgress, icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "To Do", value: todoTasks, icon: Target, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  const projectBreakdown = projects.map((proj) => {
    const projTasks = tasks.filter((t) => t.category === proj.key);
    const done = projTasks.filter((t) => t.status === "done").length;
    return {
      ...proj,
      total: projTasks.length,
      done,
      pct: projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0,
    };
  });

  const getProjectForTask = (key: string) => projects.find((p) => p.key === key);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-rose-dark">{getGreeting()}, Chloe!</h1>
        <p className="text-rose-muted text-sm mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {daysLeft > 0 && (
        <div className="mb-6 bg-rose-deep rounded-xl p-5 text-white">
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
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-rose-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-rose-muted">{stat.label}</span>
              <div className={`${stat.bg} p-2 rounded-lg`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-dark">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-rose-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-rose-dark">Recent Tasks</h2>
            <Link href="/tasks" className="text-sm text-rose-deep hover:underline">View all</Link>
          </div>
          {recentTasks.length === 0 ? (
            <p className="text-rose-muted text-sm">No tasks yet. Create one!</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => {
                const proj = getProjectForTask(task.category);
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-rose-light transition">
                    <div className={`w-2 h-2 rounded-full ${task.status === "in_progress" ? "bg-blue-400" : task.status === "done" ? "bg-green-400" : "bg-gray-300"}`} />
                    <p className="text-sm font-medium text-rose-dark truncate flex-1">{task.title}</p>
                    {proj && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${proj.color}18`, color: proj.color }}>
                        {proj.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-rose-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-rose-dark">Projects</h2>
            <Link href="/settings" className="text-sm text-rose-deep hover:underline">Manage</Link>
          </div>
          <div className="space-y-4">
            {projectBreakdown.map((proj) => (
              <Link key={proj.key} href={`/projects/${proj.key}`} className="block group">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${proj.color}18`, color: proj.color }}>
                    {proj.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-muted">{proj.done}/{proj.total} done</span>
                    <ArrowRight className="w-3.5 h-3.5 text-rose-muted opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
                <div className="w-full bg-rose-light rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${proj.pct}%`, backgroundColor: proj.color }} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-rose-border shadow-sm col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-rose-dark">
              <StickyNote className="w-5 h-5 inline mr-2 text-rose" />
              Today&apos;s Notes
            </h2>
            <Link href="/notes" className="text-sm text-rose-deep hover:underline">All notes</Link>
          </div>
          {todayNotes.length === 0 ? (
            <p className="text-rose-muted text-sm">
              No notes for today.{" "}
              <Link href="/notes" className="text-rose-deep hover:underline">Write something!</Link>
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {todayNotes.map((note) => (
                <div key={note.id} className="p-3 rounded-lg bg-rose-light border border-rose-border">
                  <p className="text-sm font-medium text-rose-dark">{note.title || "Untitled"}</p>
                  <p className="text-xs text-rose-muted mt-1 line-clamp-2">{note.content.replace(/<[^>]*>/g, " ").trim() || "Empty note"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
