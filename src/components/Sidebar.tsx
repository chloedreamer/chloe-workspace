"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  KanbanSquare,
  StickyNote,
  Calendar,
  CalendarDays,
  CalendarHeart,
  Settings,
  Sparkles,
  FolderOpen,
  Plus,
  ExternalLink,
  Globe,
  Shield,
  ShoppingBag,
} from "lucide-react";
import { useProjects } from "@/components/ProjectsProvider";
import { useState } from "react";
import GlobalSearch from "@/components/GlobalSearch";

const navItems = [
  { href: "/", label: "Today", icon: CalendarDays },
  { href: "/tasks", label: "Tasks", icon: KanbanSquare },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/events", label: "Schedule", icon: CalendarHeart },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { projects, refresh } = useProjects();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newName, setNewName] = useState("");

  const quickAddProject = async () => {
    if (!newName.trim()) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setNewName("");
    setShowQuickAdd(false);
    refresh();
  };

  return (
    <aside className="w-64 bg-white flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose" />
          <h1 className="text-base font-semibold text-rose-deep tracking-tight">
            Chloe Workspace
          </h1>
        </div>
      </div>

      <div className="px-3 mb-3">
        <GlobalSearch />
      </div>

      <nav className="flex-1 px-3 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  isActive ? "active" : "text-rose-muted hover:text-rose-deep"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 mb-2 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-rose-muted">
            <FolderOpen className="w-3.5 h-3.5" />
            Projects
          </div>
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="p-1 rounded hover:bg-rose-light text-rose-muted hover:text-rose-deep transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {showQuickAdd && (
          <div className="px-3 mb-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") quickAddProject(); if (e.key === "Escape") setShowQuickAdd(false); }}
              placeholder="Project name..."
              className="w-full text-sm bg-rose-light rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose border-0"
              autoFocus
            />
          </div>
        )}

        <div className="space-y-0.5">
          {projects.map((proj) => {
            const isActive = pathname === `/projects/${proj.key}`;
            return (
              <Link
                key={proj.key}
                href={`/projects/${proj.key}`}
                className={`sidebar-link flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm ${
                  isActive ? "active" : "text-rose-muted hover:text-rose-deep"
                }`}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: proj.color }} />
                {proj.name}
              </Link>
            );
          })}
        </div>

        {/* Shortcuts */}
        <div className="mt-8 mb-2 px-3 flex items-center gap-2 text-xs font-medium text-rose-muted">
          <ExternalLink className="w-3.5 h-3.5" />
          Shortcuts
        </div>
        <div className="space-y-0.5">
          <a
            href="https://timeless-vn.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-link flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-rose-muted hover:text-rose-deep group"
          >
            <Globe className="w-4 h-4" />
            <span className="flex-1">Timeless</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
          </a>
          <a
            href="https://timeless-admin.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-link flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-rose-muted hover:text-rose-deep group"
          >
            <Shield className="w-4 h-4" />
            <span className="flex-1">Admin</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
          </a>
          <a
            href="https://timeless-shopee.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-link flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-rose-muted hover:text-rose-deep group"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="flex-1">Link Shopee</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
          </a>
        </div>
      </nav>

      <div className="p-3">
        <Link
          href="/settings"
          className={`sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
            pathname === "/settings" ? "active" : "text-rose-muted hover:text-rose-deep"
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
