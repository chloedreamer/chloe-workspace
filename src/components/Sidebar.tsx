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
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: KanbanSquare },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-pink-100 flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-6 border-b border-pink-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-pink-500" />
          <h1 className="text-xl font-bold text-pink-600">Chloe Workspace</h1>
        </div>
        <p className="text-xs text-gray-400 mt-1">Organize your life</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${
                isActive
                  ? "active"
                  : "text-gray-600 hover:text-pink-600"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-pink-100">
        <Link
          href="/settings"
          className="sidebar-link flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:text-pink-600"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
