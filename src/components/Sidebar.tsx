"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  KanbanSquare,
  StickyNote,
  Calendar,
  Settings,
  Sparkles,
  FolderOpen,
} from "lucide-react";
import { PROJECTS } from "@/lib/constants";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "All Tasks", icon: KanbanSquare },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-rose-border flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-6 border-b border-rose-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-rose" />
          <h1 className="text-xl font-bold text-rose-deep">Chloe Workspace</h1>
        </div>
        <p className="text-xs text-rose-muted mt-1">Organize your life</p>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${
                  isActive ? "active" : "text-rose-muted hover:text-rose-deep"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 mb-2 px-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-muted uppercase tracking-wider">
            <FolderOpen className="w-3.5 h-3.5" />
            Projects
          </div>
        </div>
        <div className="space-y-0.5">
          {PROJECTS.filter((p) => p.key !== "general").map((proj) => {
            const isActive = pathname === `/projects/${proj.key}`;
            return (
              <Link
                key={proj.key}
                href={`/projects/${proj.key}`}
                className={`sidebar-link flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
                  isActive ? "active" : "text-rose-muted hover:text-rose-deep"
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${proj.dot}`} />
                {proj.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-rose-border">
        <Link
          href="/settings"
          className="sidebar-link flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-rose-muted hover:text-rose-deep"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
