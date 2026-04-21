"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Play, Pause, RotateCcw, Coffee, Brain, X } from "lucide-react";

type Mode = "focus" | "break";

const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

export default function FocusTimer() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play bell sound using Web Audio API
  const playBell = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      osc.start();
      osc.stop(ctx.currentTime + 1);
    } catch {}
  }, []);

  const notify = useCallback((msg: string) => {
    playBell();
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Chloe Workspace", { body: msg });
    }
  }, [playBell]);

  const logFocusSession = useCallback(async () => {
    try {
      await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: 25 }),
      });
    } catch {}
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setRunning(false);
            if (mode === "focus") {
              setCycles((c) => c + 1);
              setMode("break");
              notify("Focus session complete! Time for a break.");
              logFocusSession();
              return BREAK_DURATION;
            } else {
              setMode("focus");
              notify("Break over! Ready to focus again?");
              return FOCUS_DURATION;
            }
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode, notify, logFocusSession]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Update tab title
    if (running) {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      document.title = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} - ${mode === "focus" ? "Focus" : "Break"}`;
    } else {
      document.title = "Chloe Workspace";
    }
    return () => { document.title = "Chloe Workspace"; };
  }, [timeLeft, running, mode]);

  const toggle = () => setRunning((r) => !r);
  const reset = () => {
    setRunning(false);
    setTimeLeft(mode === "focus" ? FOCUS_DURATION : BREAK_DURATION);
  };
  const switchMode = (m: Mode) => {
    setMode(m);
    setRunning(false);
    setTimeLeft(m === "focus" ? FOCUS_DURATION : BREAK_DURATION);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const total = mode === "focus" ? FOCUS_DURATION : BREAK_DURATION;
  const progress = ((total - timeLeft) / total) * 100;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-rose-deep text-white rounded-full shadow-xl px-4 py-3 hover:opacity-90 transition flex items-center gap-2 z-40"
      >
        <Timer className="w-4 h-4" />
        {running ? (
          <span className="text-sm font-medium tabular-nums">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
        ) : (
          <span className="text-sm font-medium">Focus</span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl w-72 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-rose-border">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-rose-deep" />
          <span className="text-sm font-medium text-rose-dark">Focus Timer</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-rose-muted hover:text-rose-deep">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5">
        {/* Mode tabs */}
        <div className="flex items-center bg-rose-light rounded-lg p-1 mb-4">
          <button
            onClick={() => switchMode("focus")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition ${
              mode === "focus" ? "bg-white text-rose-deep shadow-sm" : "text-rose-muted"
            }`}
          >
            <Brain className="w-3.5 h-3.5" /> Focus
          </button>
          <button
            onClick={() => switchMode("break")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition ${
              mode === "break" ? "bg-white text-rose-deep shadow-sm" : "text-rose-muted"
            }`}
          >
            <Coffee className="w-3.5 h-3.5" /> Break
          </button>
        </div>

        {/* Timer display */}
        <div className="relative w-40 h-40 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#f5eded" strokeWidth="4" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#9b6b6b"
              strokeWidth="4"
              strokeDasharray={`${(progress / 100) * 2 * Math.PI * 45} ${2 * Math.PI * 45}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold text-rose-dark tabular-nums">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
            <span className="text-xs text-rose-muted mt-1">
              {mode === "focus" ? "Focus time" : "Break time"}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={reset}
            className="p-2 rounded-lg text-rose-muted hover:text-rose-deep hover:bg-rose-light transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggle}
            className="flex items-center gap-2 bg-rose-deep text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition"
          >
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {running ? "Pause" : "Start"}
          </button>
        </div>

        {/* Cycles */}
        {cycles > 0 && (
          <p className="text-center text-xs text-rose-muted mt-3">
            {cycles} focus session{cycles > 1 ? "s" : ""} today
          </p>
        )}
      </div>
    </div>
  );
}
