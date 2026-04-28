"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const PIN_LENGTH = 6;

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = useCallback(async (value: string) => {
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: value }),
    });
    if (res.ok) {
      router.replace("/");
      router.refresh();
    } else {
      setError(true);
      setLoading(false);
      setTimeout(() => {
        setPin("");
        setError(false);
      }, 600);
    }
  }, [router]);

  const press = useCallback((n: string) => {
    if (loading) return;
    setPin((p) => {
      if (p.length >= PIN_LENGTH) return p;
      const next = p + n;
      if (next.length === PIN_LENGTH) submit(next);
      return next;
    });
  }, [loading, submit]);

  const back = useCallback(() => {
    if (loading) return;
    setPin((p) => p.slice(0, -1));
    setError(false);
  }, [loading]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") back();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [press, back]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: "linear-gradient(135deg, #f5eded 0%, #fdf8f8 50%, #f5eded 100%)",
      }}
    >
      <div className="w-full max-w-xs">
        <div className="text-center mb-10">
          <h1
            className="font-extralight text-rose-deep"
            style={{ fontSize: "1.4rem", letterSpacing: "0.4em" }}
          >
            CHLOE
          </h1>
          <p className="text-xs text-rose-muted mt-2 tracking-widest uppercase">
            Workspace
          </p>
          <p className="text-sm text-rose-muted mt-6">Enter your 6-digit PIN</p>
        </div>

        {/* PIN dots */}
        <div className={`flex items-center justify-center gap-3 mb-10 ${error ? "animate-shake" : ""}`}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-all"
              style={{
                backgroundColor: i < pin.length
                  ? error ? "#ef4444" : "#9b6b6b"
                  : "transparent",
                border: i < pin.length ? "none" : "1.5px solid #c8a0a0",
              }}
            />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
            <button
              key={n}
              onClick={() => press(n)}
              disabled={loading}
              className="h-14 rounded-2xl bg-white text-rose-deep font-light text-xl active:scale-95 transition-all disabled:opacity-50"
              style={{ boxShadow: "0 1px 3px rgba(155,107,107,0.08)" }}
            >
              {n}
            </button>
          ))}
          <div />
          <button
            onClick={() => press("0")}
            disabled={loading}
            className="h-14 rounded-2xl bg-white text-rose-deep font-light text-xl active:scale-95 transition-all disabled:opacity-50"
            style={{ boxShadow: "0 1px 3px rgba(155,107,107,0.08)" }}
          >
            0
          </button>
          <button
            onClick={back}
            disabled={loading || pin.length === 0}
            className="h-14 rounded-2xl bg-transparent text-rose-muted font-light active:scale-95 transition-all disabled:opacity-30"
          >
            ←
          </button>
        </div>

        {/* Loading indicator */}
        <div className="h-6 mt-6 flex items-center justify-center">
          {loading && (
            <div className="w-4 h-4 border-2 border-rose-deep border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
