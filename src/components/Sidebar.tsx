"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, ExternalLink } from "lucide-react";
import { useProjects } from "@/components/ProjectsProvider";
import { useState } from "react";
import GlobalSearch from "@/components/GlobalSearch";

const navItems = [
  { href: "/", label: "Today" },
  { href: "/tasks", label: "Tasks" },
  { href: "/events", label: "Schedule" },
  { href: "/calendar", label: "Calendar" },
];

const shortcuts = [
  { href: "https://timeless-vn.vercel.app", label: "Timeless" },
  { href: "https://timeless-admin.vercel.app", label: "Admin" },
  { href: "https://timeless-shopee.vercel.app", label: "Link Shopee" },
  { href: "https://docs.google.com/spreadsheets/d/1asQMcrEzuvYNDmid1-wBlVU_JtZgauLs/edit?gid=1786497094#gid=1786497094", label: "S1A" },
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
        <h1 className="text-base font-semibold text-rose-deep tracking-tight">
          Chloe Workspace
        </h1>
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
                className={`sidebar-link flex items-center px-3 py-2 rounded-lg text-sm ${
                  isActive ? "active" : "text-rose-muted hover:text-rose-deep"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 mb-2 px-3 flex items-center justify-between">
          <Link
            href="/projects"
            className={`text-xs font-medium uppercase tracking-wider transition ${
              pathname === "/projects" ? "text-rose-deep" : "text-rose-muted hover:text-rose-deep"
            }`}
          >
            Projects
          </Link>
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="p-1 rounded hover:bg-rose-light text-rose-muted hover:text-rose-deep transition"
            title="Quick add"
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

        <div className="mt-8 mb-2 px-3">
          <span className="text-xs font-medium text-rose-muted uppercase tracking-wider">
            Shortcuts
          </span>
        </div>
        <div className="space-y-0.5">
          {shortcuts.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-link flex items-center px-3 py-1.5 rounded-lg text-sm text-rose-muted hover:text-rose-deep group"
            >
              <span className="flex-1">{s.label}</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition" />
            </a>
          ))}
        </div>
      </nav>
    </aside>
  );
}
