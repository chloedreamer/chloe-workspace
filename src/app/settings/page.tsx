"use client";

import { Sparkles } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      <div className="bg-white rounded-xl border border-pink-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-pink-100">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Chloe Workspace
            </h2>
            <p className="text-sm text-gray-500">v1.0.0</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Categories
          </h3>
          <div className="space-y-2">
            {[
              { label: "Actuarial", color: "bg-blue-100 text-blue-700" },
              { label: "WQ Brain", color: "bg-purple-100 text-purple-700" },
              { label: "SP2 Study", color: "bg-green-100 text-green-700" },
              { label: "TIMELESS", color: "bg-orange-100 text-orange-700" },
              { label: "General", color: "bg-gray-100 text-gray-700" },
            ].map((cat) => (
              <div
                key={cat.label}
                className="flex items-center gap-3 p-3 rounded-lg bg-pink-50"
              >
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${cat.color}`}
                >
                  {cat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">About</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            A personal workspace built for managing daily tasks, notes, and
            schedules. Designed with love for Chloe.
          </p>
        </div>
      </div>
    </div>
  );
}
