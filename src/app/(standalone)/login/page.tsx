"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const press = (n: string) => {
    if (pin.length >= 6) return;
    setPin((p) => p + n);
    setError("");
  };

  const clear = () => {
    if (pin.length === 0) return;
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const submit = async () => {
    if (pin.length !== 6) {
      setError("Vui lòng nhập đủ 6 số");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      router.replace("/");
      router.refresh();
    } else {
      setError("Mật khẩu không đúng, thử lại nhé!");
      setPin("");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pin.length === 6) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") clear();
      else if (e.key === "Enter" && pin.length === 6) submit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-start pt-[15vh]" style={{ background: "linear-gradient(135deg, #f5eded 0%, #fdf8f8 50%, #f5eded 100%)" }}>
      <h2
        className="font-extralight"
        style={{
          fontSize: "clamp(1.6rem, 4.5vw, 2.4rem)",
          color: "#9b6b6b",
          letterSpacing: "0.35em",
          marginBottom: "3rem",
        }}
      >
        CHLOE WORKSPACE
      </h2>

      <div
        className="text-center mb-6"
        style={{
          fontSize: "1.8rem",
          letterSpacing: "0.2em",
          color: "#9b6b6b",
          minWidth: "120px",
          minHeight: "2rem",
          lineHeight: 1,
        }}
      >
        {"🌸".repeat(pin.length)}
        <span className="animate-pulse" style={{ color: "#c8a0a0", fontWeight: 200 }}>|</span>
      </div>

      <div className="grid grid-cols-3 gap-3 w-[min(320px,80vw)] mb-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
          <button
            key={n}
            onClick={() => press(n)}
            className="h-[60px] rounded-[14px] bg-white text-[#9b6b6b] active:bg-[#9b6b6b] active:text-white transition border border-[#e8dede]"
            style={{ fontSize: "1.5rem", fontWeight: 300 }}
          >
            {n}
          </button>
        ))}
        <button
          onClick={clear}
          className="h-[60px] rounded-[14px] bg-[#f5eded] text-[#9b6b6b] active:bg-[#9b6b6b] active:text-white transition border border-[#e8dede]"
          style={{ fontSize: "1.3rem", fontWeight: 300 }}
        >
          ←
        </button>
        <button
          onClick={() => press("0")}
          className="h-[60px] rounded-[14px] bg-white text-[#9b6b6b] active:bg-[#9b6b6b] active:text-white transition border border-[#e8dede]"
          style={{ fontSize: "1.5rem", fontWeight: 300 }}
        >
          0
        </button>
        <button
          onClick={submit}
          disabled={pin.length !== 6 || loading}
          className="h-[60px] rounded-[14px] bg-[#f5eded] text-[#9b6b6b] active:bg-[#9b6b6b] active:text-white transition border border-[#e8dede] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontSize: "1rem", fontWeight: 300 }}
        >
          OK
        </button>
      </div>

      <div className="text-sm" style={{ color: "#c87a7a", minHeight: "1.2rem" }}>
        {error}
      </div>
    </div>
  );
}
