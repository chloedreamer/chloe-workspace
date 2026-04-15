"use client";

import { PROJECTS } from "@/lib/constants";
import { Sparkles } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-rose-dark mb-6">Settings</h1>

      <div className="bg-white rounded-xl border border-rose-border shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-rose-border">
          <div className="w-16 h-16 bg-rose-deep rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-rose-dark">Chloe Workspace</h2>
            <p className="text-sm text-rose-muted">v1.0.0</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-rose-dark mb-3">Projects</h3>
          <div className="space-y-2">
            {PROJECTS.map((proj) => (
              <div key={proj.key} className="flex items-center gap-3 p-3 rounded-lg bg-rose-light">
                <div className={`w-3 h-3 rounded-full ${proj.dot}`} />
                <span className={`text-xs px-2 py-0.5 rounded-full ${proj.color}`}>{proj.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-rose-dark mb-3">About</h3>
          <p className="text-sm text-rose-muted leading-relaxed">
            A personal workspace built for managing daily tasks, notes, and schedules. Designed with love for Chloe.
          </p>
        </div>
      </div>
    </div>
  );
}
